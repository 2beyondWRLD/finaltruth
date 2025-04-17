class DungeonScene extends Phaser.Scene {
    constructor() {
        super('DungeonScene');
        this.player = null;
        this.cursors = null;
        this.monsters = null;
        this.colliders = null;
        this.playerHealth = 100;
        this.playerMaxHealth = 100;
        this.healthBar = null;
        this.uiContainer = null;
        this.lootBox = null;
        this.hasLootedDungeon = false;
    }

    preload() {
        this.load.tilemapTiledJSON('dungeon', 'assets/maps/dungeon.json');
        this.load.image('dungeonBackground', 'assets/maps/fullgamefiles/dungeonBackground.png');
        this.load.image('dungeonForeground', 'assets/maps/fullgamefiles/dungeonForeground.png');
        this.load.spritesheet('player', 'assets/characters/player.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('slime', 'assets/monsters/slime.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('bat', 'assets/monsters/bat.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('ghost', 'assets/monsters/ghost.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('loot', 'assets/items/loot.png', { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        // Initialize the dungeon map
        const map = this.make.tilemap({ key: 'dungeon' });
        
        // Add background and foreground images
        this.add.image(0, 0, 'dungeonBackground').setOrigin(0, 0);
        
        // Set up collision objects from Object Layer 1
        this.colliders = this.physics.add.staticGroup();
        const objectLayer = map.getObjectLayer('Object Layer 1');
        
        if (objectLayer && objectLayer.objects) {
            objectLayer.objects.forEach(object => {
                const collider = this.colliders.create(object.x + (object.width / 2), object.y + (object.height / 2), null)
                    .setVisible(false)
                    .setSize(object.width, object.height)
                    .setOrigin(0.5, 0.5);
            });
        }
        
        // Create player at the dungeon entrance
        this.player = this.physics.add.sprite(100, 900, 'player');
        this.player.setCollideWorldBounds(true);
        
        // Set up player animations
        this.anims.create({
            key: 'player_left',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'player_right',
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'player_up',
            frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'player_down',
            frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'player_idle',
            frames: [{ key: 'player', frame: 12 }],
            frameRate: 20
        });
        
        // Set up camera to follow player
        this.cameras.main.setBounds(0, 0, 1024, 1024);
        this.cameras.main.startFollow(this.player);
        
        // Add foreground image to be displayed on top of player
        this.add.image(0, 0, 'dungeonForeground').setOrigin(0, 0).setDepth(10);
        
        // Set up collisions between player and walls
        this.physics.add.collider(this.player, this.colliders);
        
        // Set up keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Create loot box from the loot layer
        const lootLayer = map.getObjectLayer('loot');
        if (lootLayer && lootLayer.objects && lootLayer.objects.length > 0) {
            const lootObj = lootLayer.objects[0];
            this.lootBox = this.physics.add.sprite(lootObj.x + (lootObj.width / 2), lootObj.y + (lootObj.height / 2), 'loot');
            this.lootBox.setSize(lootObj.width, lootObj.height);
            
            // Make loot box clickable
            this.lootBox.setInteractive();
            this.lootBox.on('pointerdown', this.collectLoot, this);
        }
        
        // Create monsters
        this.monsters = this.physics.add.group();
        this.createMonsters();
        
        // Set up monster collisions
        this.physics.add.collider(this.monsters, this.colliders);
        this.physics.add.collider(this.monsters, this.monsters);
        this.physics.add.overlap(this.player, this.monsters, this.monsterAttack, null, this);
        
        // Create UI elements
        this.createUI();
        
        // Add exit button
        const exitButton = this.add.text(10, 10, 'Exit Dungeon', {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100).setInteractive();
        
        exitButton.on('pointerdown', () => {
            this.scene.start('OuterGrasslandsScene');
        });
    }
    
    update() {
        // Reset player velocity
        this.player.setVelocity(0);
        
        // Handle player movement
        const speed = 160;
        
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.anims.play('player_left', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.anims.play('player_right', true);
        }
        
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
            if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
                this.player.anims.play('player_up', true);
            }
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
            if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
                this.player.anims.play('player_down', true);
            }
        }
        
        if (!this.cursors.left.isDown && !this.cursors.right.isDown && !this.cursors.up.isDown && !this.cursors.down.isDown) {
            this.player.anims.play('player_idle', true);
        }
        
        // Update monsters
        this.updateMonsters();
    }
    
    createMonsters() {
        // Generate monsters in the dungeon
        // Create tougher versions of the regular monsters (20% stronger)
        
        // Create 5 slimes
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(200, 800);
            const y = Phaser.Math.Between(200, 800);
            const slime = this.monsters.create(x, y, 'slime');
            slime.type = 'slime';
            slime.health = 36; // 20% stronger than regular slimes (30 health)
            slime.damage = 12; // 20% stronger than regular slimes (10 damage)
            slime.speed = 60;
            
            this.anims.create({
                key: 'slime_move',
                frames: this.anims.generateFrameNumbers('slime', { start: 0, end: 3 }),
                frameRate: 5,
                repeat: -1
            });
            
            slime.anims.play('slime_move', true);
            slime.setBounce(1);
            slime.setCollideWorldBounds(true);
            slime.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
        }
        
        // Create 3 bats
        for (let i = 0; i < 3; i++) {
            const x = Phaser.Math.Between(200, 800);
            const y = Phaser.Math.Between(200, 800);
            const bat = this.monsters.create(x, y, 'bat');
            bat.type = 'bat';
            bat.health = 24; // 20% stronger than regular bats (20 health)
            bat.damage = 10; // 20% stronger than regular bats (8 damage)
            bat.speed = 120;
            
            this.anims.create({
                key: 'bat_move',
                frames: this.anims.generateFrameNumbers('bat', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
            
            bat.anims.play('bat_move', true);
            bat.setBounce(1);
            bat.setCollideWorldBounds(true);
            bat.setVelocity(Phaser.Math.Between(-80, 80), Phaser.Math.Between(-80, 80));
        }
        
        // Create 2 ghosts
        for (let i = 0; i < 2; i++) {
            const x = Phaser.Math.Between(200, 800);
            const y = Phaser.Math.Between(200, 800);
            const ghost = this.monsters.create(x, y, 'ghost');
            ghost.type = 'ghost';
            ghost.health = 48; // 20% stronger than regular ghosts (40 health)
            ghost.damage = 18; // 20% stronger than regular ghosts (15 damage)
            ghost.speed = 90;
            
            this.anims.create({
                key: 'ghost_move',
                frames: this.anims.generateFrameNumbers('ghost', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
            
            ghost.anims.play('ghost_move', true);
            ghost.setBounce(1);
            ghost.setCollideWorldBounds(true);
            ghost.setVelocity(Phaser.Math.Between(-70, 70), Phaser.Math.Between(-70, 70));
        }
    }
    
    updateMonsters() {
        this.monsters.getChildren().forEach(monster => {
            // Basic AI: If player is close, chase them
            const distToPlayer = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, monster.x, monster.y
            );
            
            if (distToPlayer < 200) {
                // Chase player
                const angle = Phaser.Math.Angle.Between(
                    monster.x, monster.y, this.player.x, this.player.y
                );
                
                const velocityX = Math.cos(angle) * monster.speed;
                const velocityY = Math.sin(angle) * monster.speed;
                
                monster.setVelocity(velocityX, velocityY);
            }
        });
    }
    
    monsterAttack(player, monster) {
        // Only take damage every second to prevent rapid damage
        if (this.time.now > (monster.lastAttackTime || 0) + 1000) {
            this.playerHealth -= monster.damage;
            
            // Update health bar
            this.updateHealthBar();
            
            // Flash player red
            this.player.setTint(0xff0000);
            this.time.delayedCall(200, () => {
                this.player.clearTint();
            });
            
            // Set last attack time
            monster.lastAttackTime = this.time.now;
            
            // Check if player is dead
            if (this.playerHealth <= 0) {
                this.playerDied();
            }
        }
    }
    
    playerDied() {
        // Player death logic
        this.playerHealth = 0;
        this.updateHealthBar();
        
        // Disable player movement
        this.player.setVelocity(0);
        this.player.setTint(0xff0000);
        
        // Show game over message
        const gameOverText = this.add.text(
            this.cameras.main.worldView.centerX,
            this.cameras.main.worldView.centerY,
            'GAME OVER',
            { font: '32px Arial', fill: '#ff0000' }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        
        // Add retry button
        const retryButton = this.add.text(
            this.cameras.main.worldView.centerX,
            this.cameras.main.worldView.centerY + 50,
            'Return to Outer Grasslands',
            { font: '18px Arial', fill: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive();
        
        retryButton.on('pointerdown', () => {
            // Reset player health and return to outer grasslands
            this.playerHealth = this.playerMaxHealth;
            this.scene.start('OuterGrasslandsScene');
        });
    }
    
    createUI() {
        // Create UI container (fixed to camera)
        this.uiContainer = this.add.container(10, 40).setScrollFactor(0).setDepth(100);
        
        // Add health label
        const healthLabel = this.add.text(0, 0, 'Health:', { font: '16px Arial', fill: '#ffffff' });
        this.uiContainer.add(healthLabel);
        
        // Add health bar background
        const healthBarBg = this.add.rectangle(70, 8, 100, 16, 0x000000);
        this.uiContainer.add(healthBarBg);
        
        // Add health bar
        this.healthBar = this.add.rectangle(70, 8, 100, 16, 0xff0000);
        this.healthBar.setOrigin(0, 0.5);
        this.uiContainer.add(this.healthBar);
        
        // Update health bar
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        // Update health bar width
        const healthPercent = Phaser.Math.Clamp(this.playerHealth / this.playerMaxHealth, 0, 1);
        this.healthBar.width = 100 * healthPercent;
    }
    
    collectLoot() {
        if (!this.hasLootedDungeon) {
            this.hasLootedDungeon = true;
            
            // Create reward message
            const rewardText = this.add.text(
                this.cameras.main.worldView.centerX,
                this.cameras.main.worldView.centerY - 50,
                'You found dungeon loot!',
                { font: '24px Arial', fill: '#ffff00' }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
            
            // Generate random reward
            const gold = Phaser.Math.Between(50, 100);
            const items = ['Health Potion', 'Mana Potion', 'Dragon Scale', 'Ancient Relic', 'Magic Sword'];
            const randomItem = items[Phaser.Math.Between(0, items.length - 1)];
            
            // Display rewards
            const goldText = this.add.text(
                this.cameras.main.worldView.centerX,
                this.cameras.main.worldView.centerY,
                `+ ${gold} Gold`,
                { font: '18px Arial', fill: '#ffff00' }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
            
            const itemText = this.add.text(
                this.cameras.main.worldView.centerX,
                this.cameras.main.worldView.centerY + 30,
                `+ 1 ${randomItem}`,
                { font: '18px Arial', fill: '#ffff00' }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
            
            // Add rewards to inventory
            this.game.playerData.gold += gold;
            
            if (!this.game.playerData.inventory) {
                this.game.playerData.inventory = {};
            }
            
            if (!this.game.playerData.inventory[randomItem]) {
                this.game.playerData.inventory[randomItem] = 0;
            }
            
            this.game.playerData.inventory[randomItem] += 1;
            
            // Save player data
            this.game.savePlayerData();
            
            // Animate and fade out text
            this.tweens.add({
                targets: [rewardText, goldText, itemText],
                alpha: 0,
                duration: 2000,
                delay: 3000,
                onComplete: () => {
                    rewardText.destroy();
                    goldText.destroy();
                    itemText.destroy();
                }
            });
            
            // Hide loot box
            this.lootBox.setAlpha(0.5);
            this.lootBox.disableInteractive();
        }
    }
}

// Code to add to your main game file to check for Dungeon Key
// This would go in your OuterGrasslandsScene.js file:

/*
// Add a dungeon entrance in the outer grasslands
const dungeonEntrance = this.add.sprite(500, 300, 'dungeonEntrance');
dungeonEntrance.setInteractive();
dungeonEntrance.on('pointerdown', () => {
    if (this.game.playerData.inventory && this.game.playerData.inventory['Dungeon Key'] > 0) {
        this.scene.start('DungeonScene');
    } else {
        // Display message that player needs a key
        const keyMessage = this.add.text(
            this.cameras.main.worldView.centerX,
            this.cameras.main.worldView.centerY,
            'You need a Dungeon Key to enter!',
            { font: '18px Arial', fill: '#ffffff', backgroundColor: '#000000', padding: { x: 10, y: 5 } }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        
        // Fade out message after 3 seconds
        this.tweens.add({
            targets: keyMessage,
            alpha: 0,
            duration: 1000,
            delay: 2000,
            onComplete: () => {
                keyMessage.destroy();
            }
        });
    }
});
*/