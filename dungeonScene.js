// We'll use the global zoneList from main.js
// No need to declare it locally

/*
 * DungeonScene for Truth Game
 * 
 * Fixed Issues:
 * - Replaced missing monster sprites with Hickory sprites that are available
 * - Set proper sprite scales (2.5) to match main game
 * - Added WASD controls for player movement alongside arrow keys
 * - Adjusted collision boxes for better movement
 * - Fixed player animations to match main game
 */

// Define the DungeonScene class for direct loading in HTML
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
        this.lootGlow = null;
        this.hasLootedDungeon = false;
        this.lastDirection = 'down'; // Default direction
        
        // Store player data from main game
        this.inventory = [];
        this.playerStats = null;
        this.returnScene = null;
    }

    preload() {
        this.load.tilemapTiledJSON('dungeon', 'assets/maps/dungeon.json');
        this.load.image('dungeonBackground', 'assets/backgrounds/dungeonBackground.png');
        this.load.image('dungeonForeground', 'assets/foregrounds/dungeonForeground.png');
        this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 48, frameHeight: 48 });
        
        // Load monster sprites (unified with Scavenger Mode)
        this.load.spritesheet('hickory_idle', 'assets/sprites/Hickory_Idle.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('hickory_walk', 'assets/sprites/Hickory_Walk.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('hickory_attack', 'assets/sprites/Hickory_Attack.png', { frameWidth: 32, frameHeight: 32 });
        
        this.load.spritesheet('loot', 'assets/sprites/crate.png', { frameWidth: 64, frameHeight: 64 });
        
        // Load particle assets for effects
        this.load.image('star', 'assets/effects/star.png');
        
        // Load loot table data
        this.load.json('lootTable', 'assets/data/lootTable.json');
    }

    create(data) {
        console.log("DungeonScene create with data:", data);
        
        // Store the data passed from the main game
        this.inventory = data.inventory || [];
        this.playerStats = data.playerStats || { health: 100, maxHealth: 100 };
        this.returnScene = data.returnScene || "Outer Grasslands";
        
        console.log("Dungeon initialized with return scene:", this.returnScene);
        
        // Set initial health from playerStats
        this.playerHealth = this.playerStats.health;
        this.playerMaxHealth = this.playerStats.maxHealth || 100;

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
        
        // Create player at the top left corner of the dungeon map
        this.player = this.physics.add.sprite(50, 120, 'player');
        this.player.setCollideWorldBounds(true);
        // Scale player to match exactly with outer grasslands
        this.player.setScale(2.5);
        // Set smaller collision box for better movement
        this.player.body.setSize(24, 24);
        this.player.body.setOffset(12, 20);
        // Initialize attack properties
        this.player.isAttacking = false;
        this.player.attackCooldown = 0;
        
        // Set initial animation
        this.player.anims.play('idle-down', true);
        
        // Set up player animations - matching main.js animation frames
        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers('player', { start: 24, end: 29 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('player', { start: 6, end: 11 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('player', { start: 30, end: 35 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('player', { start: 18, end: 23 }),
            frameRate: 10,
            repeat: -1
        });
        
        // Create idle animations for each direction
        this.anims.create({
            key: 'idle-down',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'idle-up',
            frames: this.anims.generateFrameNumbers('player', { start: 12, end: 17 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'idle-left',
            frames: [{ key: 'player', frame: 24 }],
            frameRate: 10
        });
        this.anims.create({
            key: 'idle-right',
            frames: [{ key: 'player', frame: 6 }],
            frameRate: 10
        });
        
        // Create attack animations
        this.anims.create({
            key: 'attack-down',
            frames: this.anims.generateFrameNumbers('player', { start: 36, end: 39 }),
            frameRate: 15,
            repeat: 0
        });
        this.anims.create({
            key: 'attack-right',
            frames: this.anims.generateFrameNumbers('player', { start: 42, end: 45 }),
            frameRate: 15,
            repeat: 0
        });
        this.anims.create({
            key: 'attack-up',
            frames: this.anims.generateFrameNumbers('player', { start: 48, end: 51 }),
            frameRate: 15,
            repeat: 0
        });
        this.anims.create({
            key: 'attack-left',
            frames: this.anims.generateFrameNumbers('player', { start: 54, end: 57 }),
            frameRate: 15,
            repeat: 0
        });
        
        // Animation complete listener
        this.player.on('animationcomplete', (animation) => {
            if (animation.key.startsWith('attack-')) {
                this.player.isAttacking = false;
            }
        });
        
        // Set up camera to follow player with bounds matching the dungeon map
        this.cameras.main.setBounds(0, 0, 1024, 1024);
        this.cameras.main.startFollow(this.player);
        
        // Set the physics world bounds to match the dungeon dimensions
        this.physics.world.setBounds(0, 0, 1024, 1024);
        
        // Add foreground image to be displayed on top of player
        this.add.image(0, 0, 'dungeonForeground').setOrigin(0, 0).setDepth(10);
        
        // Set up collisions between player and walls
        this.physics.add.collider(this.player, this.colliders);
        
        // Set up keyboard input - both cursors and WASD keys
        this.cursors = this.input.keyboard.createCursorKeys();
        // Add WASD keys
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // Add attack key (SPACE)
        this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Create loot box from the loot layer - exact position from dungeon.json
        const lootBox = { x: 892, y: 874, width: 46, height: 33 };
        this.lootBox = this.physics.add.sprite(lootBox.x + (lootBox.width / 2), lootBox.y + (lootBox.height / 2), 'loot');
        // Scale loot box to match the rest of the game
        this.lootBox.setScale(1.5);
        this.lootBox.setSize(lootBox.width, lootBox.height);
        
        // Add glow effect to loot box to make it more visible
        this.lootGlow = this.add.graphics();
        this.lootGlow.fillStyle(0xffff00, 0.3);
        this.lootGlow.fillCircle(this.lootBox.x, this.lootBox.y, 30);
        this.lootGlow.setDepth(8);
        
        // Animate the glow for better visibility
        this.tweens.add({
            targets: this.lootGlow,
            alpha: { from: 0.3, to: 0.7 },
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
        
        // Make loot box clickable
        this.lootBox.setInteractive();
        this.lootBox.on('pointerdown', this.collectLoot, this);
        
        // Create monsters
        this.monsters = this.physics.add.group();
        this.createMonsters();
        
        // Set up monster collisions
        this.physics.add.collider(this.monsters, this.colliders);
        this.physics.add.collider(this.monsters, this.monsters);
        this.physics.add.overlap(this.player, this.monsters, this.monsterAttack, null, this);
        
        // Create UI elements
        this.createUI();
        
        // Add mini-map for dungeon navigation
        this.createMinimap();
        
        // Modify the exit button to return to the proper scene
        const exitButton = this.add.text(10, 10, 'Exit Dungeon', {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100).setInteractive();
        
        exitButton.on('pointerdown', () => {
            this.exitDungeon();
        });
    }
    
    update() {
        // Reset player velocity
        this.player.setVelocity(0);
        
        // Handle attack with spacebar
        if (Phaser.Input.Keyboard.JustDown(this.attackKey) && this.player.attackCooldown <= 0) {
            console.log("Player attacking in dungeon! Direction:", this.lastDirection);
            
            // Set attacking flag to prevent movement during attack
            this.player.isAttacking = true;
            
            // Play attack animation based on facing direction
            this.player.anims.play(`attack-${this.lastDirection}`, true);
            
            // Visual effect position based on facing direction
            let effectX = this.player.x;
            let effectY = this.player.y;
            
            if (this.lastDirection === 'right') {
                effectX = this.player.x + 30;
            } else if (this.lastDirection === 'left') {
                effectX = this.player.x - 30;
            } else if (this.lastDirection === 'up') {
                effectY = this.player.y - 30;
            } else if (this.lastDirection === 'down') {
                effectY = this.player.y + 30;
            }
            
            // Create hit effect at effect position
            this.createHitEffect(effectX, effectY);
            
            // Find monsters in attack range based on direction
            const attackRange = 120;
            const verticalTolerance = 50;
            let monstersInRange = [];
            
            if (this.lastDirection === 'right') {
                monstersInRange = this.monsters.getChildren().filter(monster => {
                    return monster.x > this.player.x && 
                           monster.x < this.player.x + attackRange &&
                           Math.abs(monster.y - this.player.y) < verticalTolerance;
                });
            } else if (this.lastDirection === 'left') {
                monstersInRange = this.monsters.getChildren().filter(monster => {
                    return monster.x < this.player.x && 
                           monster.x > this.player.x - attackRange &&
                           Math.abs(monster.y - this.player.y) < verticalTolerance;
                });
            } else if (this.lastDirection === 'up') {
                monstersInRange = this.monsters.getChildren().filter(monster => {
                    return monster.y < this.player.y && 
                           monster.y > this.player.y - attackRange &&
                           Math.abs(monster.x - this.player.x) < verticalTolerance;
                });
            } else if (this.lastDirection === 'down') {
                monstersInRange = this.monsters.getChildren().filter(monster => {
                    return monster.y > this.player.y && 
                           monster.y < this.player.y + attackRange &&
                           Math.abs(monster.x - this.player.x) < verticalTolerance;
                });
            }
            
            // Attack each monster in range
            monstersInRange.forEach(monster => {
                this.attackMonster(monster);
            });
            
            // Set attack cooldown
            this.player.attackCooldown = 500;
            this.time.delayedCall(500, () => {
                this.player.attackCooldown = 0;
            });
        }
        
        // Handle player movement with both arrow keys and WASD
        // Match movement speed to main game (160)
        const speed = 160;
        
        // Only allow movement if not attacking
        if (!this.player.isAttacking) {
            // Check left/right movement
            if (this.cursors.left.isDown || this.wasd.left.isDown) {
                this.player.setVelocityX(-speed);
                this.player.anims.play('walk-left', true);
                this.lastDirection = 'left';
            } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
                this.player.setVelocityX(speed);
                this.player.anims.play('walk-right', true);
                this.lastDirection = 'right';
            }
            
            // Check up/down movement
            if (this.cursors.up.isDown || this.wasd.up.isDown) {
                this.player.setVelocityY(-speed);
                if (!this.cursors.left.isDown && !this.cursors.right.isDown && 
                    !this.wasd.left.isDown && !this.wasd.right.isDown) {
                    this.player.anims.play('walk-up', true);
                    this.lastDirection = 'up';
                }
            } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
                this.player.setVelocityY(speed);
                if (!this.cursors.left.isDown && !this.cursors.right.isDown && 
                    !this.wasd.left.isDown && !this.wasd.right.isDown) {
                    this.player.anims.play('walk-down', true);
                    this.lastDirection = 'down';
                }
            }
            
            // Idle animation if no movement keys pressed
            if (!this.cursors.left.isDown && !this.cursors.right.isDown && 
                !this.cursors.up.isDown && !this.cursors.down.isDown &&
                !this.wasd.left.isDown && !this.wasd.right.isDown && 
                !this.wasd.up.isDown && !this.wasd.down.isDown) {
                // Use idle animation based on last direction
                if (this.lastDirection === 'down') {
                    this.player.anims.play('idle-down', true);
                } else if (this.lastDirection === 'up') {
                    this.player.anims.play('idle-up', true);
                } else if (this.lastDirection === 'left') {
                    this.player.anims.play('idle-left', true);
                } else if (this.lastDirection === 'right') {
                    this.player.anims.play('idle-right', true);
                }
            }
        }
        
        // Update monsters
        this.updateMonsters();
        
        // Update minimap
        this.updateMinimap();
    }
    
    createMonsters() {
        // Generate dungeon monsters similar to Scavenger Mode but stronger
        
        // Define spawn locations throughout the dungeon
        const spawnPoints = [
            { x: 300, y: 150 },  // Top area
            { x: 700, y: 300 },  // Right area
            { x: 500, y: 500 },  // Center area
            { x: 200, y: 600 },  // Left area
            { x: 800, y: 800 },  // Bottom right area
            { x: 400, y: 150 },  // Top area
            { x: 600, y: 400 },  // Middle right area
            { x: 300, y: 700 },  // Bottom left area
            { x: 820, y: 830 },  // Near loot
            { x: 950, y: 900 }   // Near loot - guard
        ];
        
        // Calculate monster level based on player level if available
        const playerLevel = this.playerStats && this.playerStats.level ? this.playerStats.level : 1;
        const monsterLevel = playerLevel + 1; // Slightly tougher than the player
        
        spawnPoints.forEach((point, i) => {
            // Add some randomness to spawn position
            const x = point.x + Phaser.Math.Between(-30, 30);
            const y = point.y + Phaser.Math.Between(-30, 30);
            
            // Create monster based on ScavengerMode monster class
            const monster = this.monsters.create(x, y, 'hickory_idle');
            monster.type = 'dungeon_hickory'; // Special type for dungeon monsters
            
            // Scale monster stats with player level (stronger than Scavenger Mode)
            const difficultyMultiplier = 1.1 + (playerLevel - 1) * 0.15;
            
            monster.health = Math.floor(50 * difficultyMultiplier);
            monster.maxHealth = monster.health;
            monster.damage = Math.floor(8 * difficultyMultiplier);
            monster.speed = 70 + (playerLevel - 1) * 5;
            monster.attackRange = 50;
            monster.detectionRange = 200;
            monster.changeDirectionInterval = 2000;
            monster.lastDirectionChange = 0;
            
            // Scale monster to match player
            monster.setScale(2.5);
            
            // Add level indicator to monster
            const levelText = this.add.text(monster.x, monster.y - 30, `Lv.${monsterLevel}`, {
                font: '10px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(101);
            
            // Link the level text to the monster for updates
            monster.levelText = levelText;
            
            // Create unique animation key for each monster
            const animKey = 'monster_move_' + i;
            
            // Use hickory animations from Scavenger Mode
            if (!this.anims.exists(animKey)) {
                this.anims.create({
                    key: animKey,
                    // Use different hickory sprite based on position (for variety)
                    frames: this.anims.generateFrameNumbers(
                        i < 3 ? 'hickory_idle' : (i < 6 ? 'hickory_walk' : 'hickory_attack'), 
                        { start: 0, end: 5 }
                    ),
                    frameRate: 8,
                    repeat: -1
                });
            }
            
            monster.anims.play(animKey, true);
            monster.setBounce(1);
            monster.setCollideWorldBounds(true);
            monster.setVelocity(Phaser.Math.Between(-70, 70), Phaser.Math.Between(-70, 70));
            
            // Create a small health bar for the monster
            monster.updateHealthBar = function() {
                if (this.levelText) {
                    this.levelText.setPosition(this.x, this.y - 30);
                }
            };
            
            // Override takeDamage method
            monster.takeDamage = (damage) => {
                monster.health -= damage;
                
                // Update monster health bar and check if defeated
                monster.updateHealthBar();
                
                // Check if monster is defeated
                if (monster.health <= 0) {
                    // Remove level text when monster dies
                    if (monster.levelText) {
                        monster.levelText.destroy();
                    }
                    
                    // Create death animation
                    this.createDeathEffect(monster.x, monster.y);
                    
                    // Drop loot
                    this.dropLoot(monster.x, monster.y, monster.type);
                    
                    // Remove monster
                    this.monsters.remove(monster, true, true);
                }
            };
        });
    }
    
    updateMonsters() {
        const time = this.time.now;
        
        this.monsters.getChildren().forEach(monster => {
            // Update health bar position
            monster.updateHealthBar();
            
            // Random movement pattern for monsters, similar to scavenger mode
            // Change direction randomly if it's time
            if (time > monster.lastDirectionChange + monster.changeDirectionInterval) {
                // 70% chance to change direction
                if (Math.random() < 0.7) {
                    monster.setVelocity(
                        Phaser.Math.Between(-monster.speed, monster.speed),
                        Phaser.Math.Between(-monster.speed, monster.speed)
                    );
                }
                monster.lastDirectionChange = time;
            }
            
            // Basic AI: If player is very close, chase them
            const distToPlayer = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, monster.x, monster.y
            );
            
            // Chase the player if within detection range
            if (distToPlayer < monster.detectionRange) {
                // Chase player more aggressively when closer
                const chaseSpeed = distToPlayer < 100 ? monster.speed * 1.2 : monster.speed;
                
                // Calculate angle to player
                const angle = Phaser.Math.Angle.Between(
                    monster.x, monster.y, this.player.x, this.player.y
                );
                
                const velocityX = Math.cos(angle) * chaseSpeed;
                const velocityY = Math.sin(angle) * chaseSpeed;
                
                monster.setVelocity(velocityX, velocityY);
            }
            
            // Flip the sprite based on movement direction for better visuals
            if (monster.body.velocity.x < 0) {
                monster.flipX = true;
            } else if (monster.body.velocity.x > 0) {
                monster.flipX = false;
            }
        });
    }
    
    monsterAttack(player, monster) {
        // Only take damage every second to prevent rapid damage
        if (this.time.now > (monster.lastAttackTime || 0) + 1000) {
            // Apply damage to player
            this.playerHealth -= monster.damage;
            
            // Update health bar
            this.updateHealthBar();
            
            // Flash player red
            this.player.setTint(0xff0000);
            this.time.delayedCall(200, () => {
                this.player.clearTint();
            });
            
            // Camera shake for impact feedback
            this.cameras.main.shake(100, 0.005 * monster.damage);
            
            // Show damage text
            this.showDamageText(this.player.x, this.player.y, monster.damage, 0xff0000);
            
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
            // Reset player health to a minimum value before returning
            this.playerHealth = Math.max(20, this.playerMaxHealth * 0.2);
            
            // Apply health to player stats
            if (this.playerStats) {
                this.playerStats.health = this.playerHealth;
            }
            
            this.exitDungeon();
        });
    }
    
    createUI() {
        // Create UI container (fixed to camera)
        this.uiContainer = this.add.container(10, 40).setScrollFactor(0).setDepth(100);
        
        // Add UI background for better visibility
        const uiBg = this.add.rectangle(70, 8, 180, 40, 0x000000, 0.5);
        this.uiContainer.add(uiBg);
        
        // Add health label
        const healthLabel = this.add.text(0, 0, 'Health:', { 
            font: '16px Arial', 
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.uiContainer.add(healthLabel);
        
        // Add health bar background
        const healthBarBg = this.add.rectangle(70, 8, 100, 16, 0x000000);
        this.uiContainer.add(healthBarBg);
        
        // Add health bar
        this.healthBar = this.add.rectangle(70, 8, 100, 16, 0xff0000);
        this.healthBar.setOrigin(0, 0.5);
        this.uiContainer.add(this.healthBar);
        
        // Add health text for exact value
        this.healthText = this.add.text(180, 8, `${this.playerHealth}/${this.playerMaxHealth}`, { 
            font: '12px Arial', 
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(1, 0.5);
        this.uiContainer.add(this.healthText);
        
        // Update health bar
        this.updateHealthBar();
    }
    
    createMinimap() {
        // Create mini-map in the corner
        const mapSize = 150;
        const mapX = this.cameras.main.width - mapSize - 20;
        const mapY = 20;
        
        // Create mini-map container that doesn't scroll with the camera
        this.miniMapContainer = this.add.container(mapX, mapY).setScrollFactor(0).setDepth(100);
        
        // Add minimap background and border
        const minimapBg = this.add.rectangle(0, 0, mapSize, mapSize, 0x000000, 0.7);
        minimapBg.setStrokeStyle(2, 0xffffff, 1);
        this.miniMapContainer.add(minimapBg);
        
        // Add minimap title
        this.miniMapTitle = this.add.text(0, -mapSize/2 - 15, "DUNGEON MAP", {
            font: '14px Arial', 
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(100).setOrigin(0.5, 0.5);
        this.miniMapContainer.add(this.miniMapTitle);
        
        // Create player dot for minimap
        this.miniMapPlayer = this.add.circle(0, 0, 4, 0x00ff00);
        this.miniMapPlayer.setScrollFactor(0).setDepth(101);
        this.miniMapContainer.add(this.miniMapPlayer);
        
        // Create dots for monsters (will be updated in updateMinimap)
        this.monsterDots = [];
        
        // Create dot for loot chest
        const lootX = (this.lootBox.x / 1024) * mapSize - mapSize/2;
        const lootY = (this.lootBox.y / 1024) * mapSize - mapSize/2;
        const lootDot = this.add.circle(lootX, lootY, 3, 0xffff00);
        this.miniMapContainer.add(lootDot);
        
        // Create walls on minimap
        if (this.colliders) {
            this.colliders.getChildren().forEach(wall => {
                // Scale wall position to minimap size
                const wallX = (wall.x / 1024) * mapSize - mapSize/2;
                const wallY = (wall.y / 1024) * mapSize - mapSize/2;
                
                // Scale wall dimensions to minimap size (divide by ~20 for proper scale)
                const wallWidth = (wall.width / 20) * (mapSize / 1024);
                const wallHeight = (wall.height / 20) * (mapSize / 1024);
                
                // Add wall representation to minimap
                const wallDot = this.add.rectangle(wallX, wallY, wallWidth, wallHeight, 0x444444);
                this.miniMapContainer.add(wallDot);
            });
        }
    }
    
    updateMinimap() {
        if (!this.miniMapPlayer || !this.player) return;
        
        const mapSize = 150;
        
        // Update player position on minimap
        const playerX = (this.player.x / 1024) * mapSize - mapSize/2;
        const playerY = (this.player.y / 1024) * mapSize - mapSize/2;
        this.miniMapPlayer.setPosition(playerX, playerY);
        
        // Clear existing monster dots
        this.monsterDots.forEach(dot => dot.destroy());
        this.monsterDots = [];
        
        // Update monster positions on minimap
        if (this.monsters) {
            this.monsters.getChildren().forEach(monster => {
                // Scale monster position to minimap
                const monsterX = (monster.x / 1024) * mapSize - mapSize/2;
                const monsterY = (monster.y / 1024) * mapSize - mapSize/2;
                
                // Create monster dot with color based on type
                let color = 0xff0000; // Default red
                if (monster.type === 'ghost') color = 0xff00ff;
                if (monster.type === 'bat') color = 0xff8800;
                
                const monsterDot = this.add.circle(monsterX, monsterY, 2, color);
                monsterDot.setScrollFactor(0).setDepth(101);
                this.miniMapContainer.add(monsterDot);
                this.monsterDots.push(monsterDot);
            });
        }
    }
    
    updateHealthBar() {
        // Update health bar width
        const healthPercent = Phaser.Math.Clamp(this.playerHealth / this.playerMaxHealth, 0, 1);
        this.healthBar.width = 100 * healthPercent;
        
        // Update health text
        if (this.healthText) {
            this.healthText.setText(`${Math.ceil(this.playerHealth)}/${this.playerMaxHealth}`);
            
            // Change color based on health percentage
            if (healthPercent < 0.3) {
                this.healthText.setColor('#ff0000');
            } else if (healthPercent < 0.6) {
                this.healthText.setColor('#ffff00');
            } else {
                this.healthText.setColor('#ffffff');
            }
        }
    }
    
    exitDungeon() {
        // Add any items collected to main game inventory
        const dungeonInventory = this.registry.get('inventory') || {};
        const mainInventory = this.registry.get('mainInventory') || {};
        
        // Merge inventories
        Object.keys(dungeonInventory).forEach(item => {
            if (mainInventory[item]) {
                mainInventory[item] += dungeonInventory[item];
            } else {
                mainInventory[item] = dungeonInventory[item];
            }
        });
        
        // Update main inventory
        this.registry.set('mainInventory', mainInventory);
        
        // Add experience to main game
        const dungeonXP = this.registry.get('playerXP') || 0;
        const mainXP = this.registry.get('mainXP') || 0;
        this.registry.set('mainXP', mainXP + dungeonXP);
        
        // Show transition screen
        const fadeRect = this.add.rectangle(
            0, 0, 
            this.cameras.main.width, 
            this.cameras.main.height, 
            0x000000, 0
        ).setOrigin(0, 0).setScrollFactor(0).setDepth(1000);
        
        // Add exit message
        const exitMessage = this.add.text(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2, 
            'Exiting Dungeon...', 
            {
                font: '32px Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setAlpha(0);
        
        // Fade to black
        this.tweens.add({
            targets: fadeRect,
            alpha: 1,
            duration: 1000,
            onComplete: () => {
                // Fade in text
                this.tweens.add({
                    targets: exitMessage,
                    alpha: 1,
                    duration: 500,
                    onComplete: () => {
                        // Wait a bit then transition to main game
                        setTimeout(() => {
                            // Find the zone data for the return scene
                            let returnZoneData;
                            if (this.returnScene) {
                                console.log("Returning to zone:", this.returnScene);
                                
                                // Try to find zone from the main scene data
                                const zoneList = [
                                    { name: "Outer Grasslands", mapKey: "OuterGrasslandsMap", backgroundKey: "outerGrasslands", foregroundKey: "outerGrasslandsForeground" },
                                    { name: "Shady Grove", mapKey: "ShadyGroveMap", backgroundKey: "shadyGrove", foregroundKey: "shadyGroveForeground" },
                                    { name: "Arid Desert", mapKey: "AridDesertMap", backgroundKey: "aridDesert", foregroundKey: "aridDesertForeground" },
                                    { name: "Village", mapKey: "villageCommonsMap", backgroundKey: "villageCommons", foregroundKey: "" }
                                ];
                                
                                returnZoneData = zoneList.find(zone => zone.name === this.returnScene);
                                
                                if (!returnZoneData) {
                                    console.warn("Could not find zone data for:", this.returnScene);
                                    // Default to Outer Grasslands if the return scene is not found
                                    returnZoneData = zoneList[0];
                                }
                            }

                            // Sync player health with playerStats
                            if (this.playerStats) {
                                this.playerStats.health = this.playerHealth;
                                console.log("Setting player health to:", this.playerHealth);
                            }

                            this.scene.start('MainGameScene', {
                                inventory: mainInventory,
                                playerXP: mainXP + dungeonXP,
                                zone: returnZoneData, // Pass the zone data back to main game
                                playerStats: this.playerStats // Pass updated player stats
                            });
                        }, 1000);
                    }
                });
            }
        });
    }
    
    collectLoot() {
        if (!this.hasLootedDungeon) {
            this.hasLootedDungeon = true;
            
            // Play a sound effect if available
            // this.sound.play('chest_open');
            
            // Create reward message
            const rewardText = this.add.text(
                this.cameras.main.worldView.centerX,
                this.cameras.main.worldView.centerY - 50,
                'You found dungeon treasure!',
                { font: '24px Arial', fill: '#ffff00', stroke: '#000000', strokeThickness: 3 }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
            
            // Generate random gold reward (more than regular chests)
            const playerLevel = this.playerStats && this.playerStats.level ? this.playerStats.level : 1;
            const gold = Phaser.Math.Between(100 + (playerLevel * 10), 200 + (playerLevel * 20));
            
            // Get rare and mythic items from loot table
            const lootTable = this.cache.json.get('lootTable');
            const allRareItems = [];
            const allMythicItems = [];
            
            if (lootTable && lootTable.zones) {
                // Collect rare and mythic items from all zones
                Object.keys(lootTable.zones).forEach(zone => {
                    const zoneItems = lootTable.zones[zone];
                    zoneItems.forEach(item => {
                        if (item.rarity === "Rare" && !allRareItems.includes(item)) {
                            allRareItems.push(item);
                        } else if ((item.rarity === "Epic" || item.rarity === "Mythic") && !allMythicItems.includes(item)) {
                            allMythicItems.push(item);
                        }
                    });
                });
            }
            
            // Select random rare and mythic items based on player level
            let randomItem1, randomItem2;
            
            // Higher level players get better loot
            if (playerLevel >= 5 && allMythicItems.length > 0) {
                // For higher level players, guarantee a mythic item
                const itemIndex = Phaser.Math.Between(0, allMythicItems.length - 1);
                randomItem1 = allMythicItems[itemIndex].name;
            } else {
                // Default to rare items for lower level players
                const itemIndex = Phaser.Math.Between(0, allRareItems.length - 1);
                randomItem1 = allRareItems[itemIndex] ? allRareItems[itemIndex].name : "Ancient Relic";
            }
            
            // Second item is always rare
            const itemIndex2 = Phaser.Math.Between(0, allRareItems.length - 1);
            randomItem2 = allRareItems[itemIndex2] ? allRareItems[itemIndex2].name : "Magic Sword";
            
            // Make sure items are different
            while (randomItem2 === randomItem1 && allRareItems.length > 1) {
                const newIndex = Phaser.Math.Between(0, allRareItems.length - 1);
                randomItem2 = allRareItems[newIndex].name;
            }
            
            // Fallback items if loot table is not available
            if (!randomItem1) randomItem1 = "Ancient Relic";
            if (!randomItem2) randomItem2 = "Magic Sword";
            
            // Display rewards
            const goldText = this.add.text(
                this.cameras.main.worldView.centerX,
                this.cameras.main.worldView.centerY,
                `+ ${gold} Gold`,
                { font: '18px Arial', fill: '#ffff00', stroke: '#000000', strokeThickness: 2 }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
            
            const itemText1 = this.add.text(
                this.cameras.main.worldView.centerX,
                this.cameras.main.worldView.centerY + 30,
                `+ 1 ${randomItem1}`,
                { font: '18px Arial', fill: '#ffff00', stroke: '#000000', strokeThickness: 2 }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
            
            const itemText2 = this.add.text(
                this.cameras.main.worldView.centerX,
                this.cameras.main.worldView.centerY + 60,
                `+ 1 ${randomItem2}`,
                { font: '18px Arial', fill: '#ffff00', stroke: '#000000', strokeThickness: 2 }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
            
            // Add visual effect
            this.tweens.add({
                targets: [this.lootBox],
                angle: 10,
                duration: 200,
                yoyo: true,
                repeat: 3
            });
            
            // Add rewards to the player's inventory
            if (this.playerStats) {
                this.playerStats.oromozi = (this.playerStats.oromozi || 0) + gold;
            }
            
            // Add the items to inventory
            const existingItem1 = this.inventory.find(item => item.name === randomItem1);
            if (existingItem1) {
                existingItem1.quantity += 1;
            } else {
                this.inventory.push({ name: randomItem1, quantity: 1 });
            }
            
            const existingItem2 = this.inventory.find(item => item.name === randomItem2);
            if (existingItem2) {
                existingItem2.quantity += 1;
            } else {
                this.inventory.push({ name: randomItem2, quantity: 1 });
            }
            
            // Animate and fade out text
            this.tweens.add({
                targets: [rewardText, goldText, itemText1, itemText2],
                alpha: 0,
                duration: 2000,
                delay: 3000,
                onComplete: () => {
                    rewardText.destroy();
                    goldText.destroy();
                    itemText1.destroy();
                    itemText2.destroy();
                }
            });
            
            // Hide loot glow effect
            this.lootGlow.destroy();
            
            // Hide loot box
            this.lootBox.setAlpha(0.5);
            this.lootBox.disableInteractive();
        }
    }

    // Method to handle player attacking monsters
    attackMonster(monster) {
        if (this.player.attackCooldown > 0) return;

        // Set attack cooldown
        this.player.attackCooldown = 500;
        setTimeout(() => {
            this.player.attackCooldown = 0;
        }, 500);

        // Calculate damage based on player weapon
        let playerDamage = 10; // Base damage
        
        // Get current weapon from main game if available
        if (this.registry.get('playerWeapon')) {
            const weaponType = this.registry.get('playerWeapon');
            if (weaponType === 'woodSword') playerDamage = 15;
            if (weaponType === 'ironSword') playerDamage = 25;
            if (weaponType === 'goldSword') playerDamage = 40;
        }
        
        // Apply damage to monster
        monster.health -= playerDamage;
        
        // Show damage feedback
        this.showDamageText(monster.x, monster.y, playerDamage, 0xff0000);
        
        // Create hit effect
        this.createHitEffect(monster.x, monster.y);
        
        // Flash monster red to indicate hit
        monster.setTint(0xff0000);
        setTimeout(() => {
            monster.clearTint();
        }, 200);

        // Check if monster is defeated
        if (monster.health <= 0) {
            // Create death animation
            this.createDeathEffect(monster.x, monster.y);
            
            // Drop loot
            this.dropLoot(monster.x, monster.y, monster.type);
            
            // Remove monster
            this.monsters.remove(monster, true, true);
        }
    }

    // Function to show damage text
    showDamageText(x, y, amount, color = 0xffffff) {
        // Create the text
        const damageText = this.add.text(x, y - 20, amount.toString(), {
            font: '18px Arial',
            fill: color === 0xffffff ? '#ffffff' : '#ff0000',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Animate the text
        this.tweens.add({
            targets: damageText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power1',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }

    // Function to create hit effect
    createHitEffect(x, y) {
        // Create particle effect for hit
        const particles = this.add.particles('star');
        const emitter = particles.createEmitter({
            x: x,
            y: y,
            speed: { min: 50, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 300,
            quantity: 5,
            blendMode: 'ADD'
        });
        
        // Stop the emitter after a short time
        setTimeout(() => {
            emitter.stop();
            // Destroy particles after they've completed
            setTimeout(() => {
                particles.destroy();
            }, 300);
        }, 50);
    }

    // Function to create death effect
    createDeathEffect(x, y) {
        // Create particle effect for death
        const particles = this.add.particles('star');
        const emitter = particles.createEmitter({
            x: x,
            y: y,
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 500,
            quantity: 15,
            blendMode: 'ADD'
        });
        
        // Stop the emitter after a short time
        setTimeout(() => {
            emitter.stop();
            // Destroy particles after they've completed
            setTimeout(() => {
                particles.destroy();
            }, 500);
        }, 100);
    }

    // Function to handle monster dropping loot
    dropLoot(x, y, monsterType) {
        // 30% chance to drop an item
        if (Math.random() < 0.3) {
            let items = [];
            
            // Different monsters drop different items
            if (monsterType === 'slime') {
                items = ['Slime', 'Herb'];
            } else if (monsterType === 'bat') {
                items = ['Leather', 'String'];
            } else if (monsterType === 'ghost') {
                items = ['Ectoplasm', 'Gold'];
            }
            
            // Select random item from pool
            const item = items[Math.floor(Math.random() * items.length)];
            
            // Create loot sprite
            const loot = this.physics.add.sprite(x, y, 'loot');
            loot.setScale(1.5);
            loot.item = item;
            
            // Add simple animation to make loot noticeable
            this.tweens.add({
                targets: loot,
                y: y - 10,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
            
            // Add text label above the loot
            const lootText = this.add.text(x, y - 20, item, {
                font: '14px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            
            // Set up player collision with loot
            this.physics.add.overlap(this.player, loot, () => {
                // Add to inventory
                this.addToInventory(item, 1);
                
                // Show pickup message
                this.showPickupMessage(item);
                
                // Clean up
                loot.destroy();
                lootText.destroy();
            });
        }
        
        // Always give player some experience
        this.addExperience(monsterType === 'ghost' ? 15 : monsterType === 'bat' ? 8 : 5);
    }

    // Function to add item to player inventory
    addToInventory(item, quantity) {
        // Get the current inventory from registry or initialize empty
        const inventory = this.registry.get('inventory') || {};
        
        // Add item to inventory
        if (inventory[item]) {
            inventory[item] += quantity;
        } else {
            inventory[item] = quantity;
        }
        
        // Update registry
        this.registry.set('inventory', inventory);
        
        console.log(`Added ${quantity} ${item} to inventory`);
    }
    
    // Function to show pickup message
    showPickupMessage(item) {
        // Create toast message at bottom of screen
        const message = this.add.text(
            this.cameras.main.width / 2, 
            this.cameras.main.height - 100, 
            `Picked up: ${item}`, 
            {
                font: '18px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                backgroundColor: '#333333',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(200);
        
        // Fade out after 2 seconds
        this.tweens.add({
            targets: message,
            alpha: 0,
            y: this.cameras.main.height - 120,
            duration: 2000,
            ease: 'Power1',
            onComplete: () => {
                message.destroy();
            }
        });
    }
    
    // Function to add experience to player
    addExperience(amount) {
        // Get current experience or initialize
        const currentXP = this.registry.get('playerXP') || 0;
        const updatedXP = currentXP + amount;
        
        // Update registry
        this.registry.set('playerXP', updatedXP);
        
        // Show XP gain message
        const xpText = this.add.text(
            this.player.x, 
            this.player.y - 30, 
            `+${amount} XP`, 
            {
                font: '16px Arial',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        // Animate XP text
        this.tweens.add({
            targets: xpText,
            y: this.player.y - 60,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => {
                xpText.destroy();
            }
        });
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