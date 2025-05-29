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
 * - Added simple text health display at top of screen
 * - Guaranteed rare weapon drop from final treasure chest
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
        this.healthText = null; // Simple health text display
        this.lootBox = null;
        this.lootGlow = null;
        this.hasLootedDungeon = false;
        this.lastDirection = 'down'; // Default direction
        
        // Store player data from main game
        this.inventory = [];
        this.playerStats = null;
        this.returnScene = null;
        
        // Initialize log messages system (matches main game)
        this.logMessages = [];
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

        // Initialize log messages system (matches main game)
        this.logMessages = [];
        
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
        // Set slightly larger collision box for better collision detection
        this.player.body.setSize(24, 24);
        this.player.body.setOffset(12, 16);
        
        // Initialize attack properties - done differently than in previous dungeonScene implementation
        this.player.isAttacking = false;
        
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
        
        // Monster animations - identical to Scavenger Mode
        this.anims.create({
            key: "monster_idle",
            frames: this.anims.generateFrameNumbers("hickory_idle", { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: "monster_walk",
            frames: this.anims.generateFrameNumbers("hickory_walk", { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: "monster_attack",
            frames: this.anims.generateFrameNumbers("hickory_attack", { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        
        // Animation complete listener - identical to Scavenger Mode
        this.player.on('animationcomplete', (animation) => {
            if (animation.key.startsWith('attack-')) {
                this.player.isAttacking = false;
            }
        });
        
        // Set up camera to follow player with bounds matching the dungeon map
        this.cameras.main.setBounds(0, 0, 1024, 1024);
        this.cameras.main.startFollow(this.player, true, 0.9, 0.9);
        this.cameras.main.setZoom(0.9); // Zoom out more to see more of the dungeon
        
        // Set the physics world bounds to match the dungeon dimensions
        this.physics.world.setBounds(0, 0, 1024, 1024);
        
        // Ensure camera fade effect for smooth transitions
        this.cameras.main.fadeIn(1000);
        
        // Add foreground image to be displayed on top of player
        this.add.image(0, 0, 'dungeonForeground').setOrigin(0, 0).setDepth(10);
        
        // ULTRA-SIMPLE HUD - only essential elements
        // 1. Health bar - very simple at bottom left
        this.healthBar = this.add.graphics();
        this.healthBar.setScrollFactor(0);
        this.healthBar.setDepth(1000);
        
        // 2. Mini-map - just a tiny dot in the top right
        const mapSize = 60;
        const mapX = this.game.config.width - mapSize - 5;
        const mapY = 5;
        
        // Simple minimap background
        this.minimapBg = this.add.rectangle(mapX + mapSize/2, mapY + mapSize/2, mapSize, mapSize, 0x000000, 0.5);
        this.minimapBg.setStrokeStyle(1, 0xffffff, 0.7);
        this.minimapBg.setScrollFactor(0);
        this.minimapBg.setDepth(1000);
        
        // Player dot on minimap
        this.miniMapPlayer = this.add.circle(0, 0, 2, 0x00ff00);
        this.miniMapPlayer.setScrollFactor(0);
        this.miniMapPlayer.setDepth(1001);
        
        // Add log text display in top right corner (matches main game)
        this.logText = this.add.text(this.cameras.main.width - 10, 80, "Dungeon Log", {
            font: "12px Arial",
            fill: "#ff9900",
            stroke: "#000000",
            strokeThickness: 2,
            align: "right",
            wordWrap: { width: 200 }
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);
        
        // Initialize HUD
        this.updateDungeonHUD();
        
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
    }
    
    update() {
        // Reset player velocity
        this.player.setVelocity(0);
        
        // Update HUD with current values
        this.updateDungeonHUD();
        
        // Handle attack with spacebar - match Scavenger Mode (no cooldown check needed as it matches animation)
        if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.player.isAttacking) {
            console.log("Player attacking in dungeon! Direction:", this.lastDirection);
            
            // Set attacking flag to prevent movement during attack
            this.player.isAttacking = true;
            this.player.setVelocity(0);
            this.player.anims.play(`attack-${this.lastDirection}`, true);
            
            // Camera shake effect for attack (matches main game)
            this.cameras.main.shake(50, 0.005);
            
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
            
            // Find monsters in attack range based on direction - exactly as in Scavenger Mode
            const attackRange = 120; // Increased range for better detection
            const verticalTolerance = 50; // Increased tolerance
            let monstersInRange = [];
            
            if (this.lastDirection === 'right') {
                monstersInRange = this.monsters.getChildren().filter(monster => {
                    const inRange = monster.x > this.player.x && monster.x < this.player.x + attackRange &&
                                    Math.abs(monster.y - this.player.y) < verticalTolerance;
                    return inRange;
                });
            } else if (this.lastDirection === 'left') {
                monstersInRange = this.monsters.getChildren().filter(monster => {
                    const inRange = monster.x < this.player.x && monster.x > this.player.x - attackRange &&
                                    Math.abs(monster.y - this.player.y) < verticalTolerance;
                    return inRange;
                });
            } else if (this.lastDirection === 'up') {
                monstersInRange = this.monsters.getChildren().filter(monster => {
                    const inRange = monster.y < this.player.y && monster.y > this.player.y - attackRange &&
                                    Math.abs(monster.x - this.player.x) < verticalTolerance;
                    return inRange;
                });
            } else if (this.lastDirection === 'down') {
                monstersInRange = this.monsters.getChildren().filter(monster => {
                    const inRange = monster.y > this.player.y && monster.y < this.player.y + attackRange &&
                                    Math.abs(monster.x - this.player.x) < verticalTolerance;
                    return inRange;
                });
            }
            
            // Calculate player attack power with level scaling - exactly like Scavenger Mode
            const baseAttack = 10 + (this.playerStats.level - 1) * 2;
            const randomFactor = Phaser.Math.Between(-2, 3);
            const attackPower = baseAttack + randomFactor;
            
            // Attack each monster in range
            monstersInRange.forEach(monster => {
                monster.takeDamage(attackPower);
            });
        }
        
        // Handle player movement with both arrow keys and WASD
        // Match movement speed to Scavenger mode (100 instead of 160)
        const speed = 100;
        
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
        
        // Update player stats if they change
        if (this.playerStats && this.xpText) {
            this.xpText.setText(`${this.playerStats.experience || 0}`);
        }
    }
    
    createMonsters() {
        // Generate dungeon monsters exactly like Scavenger Mode but slightly stronger
        
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
        
        // Calculate monster level based on player level if available - match Scavenger Mode
        const playerLevel = this.playerStats && this.playerStats.level ? this.playerStats.level : 1;
        
        // Monsters are slightly tougher than in Scavenger Mode
        const difficultyMultiplier = 1.1 + (playerLevel - 1) * 0.2; // Slightly higher than Scavenger's 1.0
        
        spawnPoints.forEach((point, i) => {
            // Add some randomness to spawn position
            const x = point.x + Phaser.Math.Between(-30, 30);
            const y = point.y + Phaser.Math.Between(-30, 30);
            
            // Create monster just like in Scavenger Mode
            const monster = this.physics.add.sprite(x, y, "hickory_idle");
            this.monsters.add(monster);
            
            // Set properties identical to Scavenger Mode with slight adjustment for difficulty
            monster.setCollideWorldBounds(true);
            monster.setDepth(2000);
            
            // Improve collision handling - add proper body size
            monster.body.setSize(28, 28);
            monster.body.setOffset(2, 4);
            
            monster.currentState = "idle";
            
            // Scale monster stats with player level - slightly tougher than Scavenger Mode
            monster.speed = 50 + (playerLevel - 1) * 5;
            monster.attackRange = 40; // Same as Scavenger Mode
            monster.detectionRange = 200 + (playerLevel - 1) * 10;
            monster.attackCooldown = Math.max(800, 1000 - (playerLevel - 1) * 50); // Same as Scavenger Mode
            monster.lastAttackTime = 0;
            monster.maxHealth = Math.floor(80 * difficultyMultiplier);
            monster.health = monster.maxHealth;
            monster.damage = 5 + Math.floor((playerLevel - 1) * 1.5); // Slightly more damage than Scavenger Mode
            
            // Create health bar - identical to Scavenger Mode
            monster.healthBar = this.add.graphics();
            monster.healthBar.setDepth(2001); // Above monster
            
            // Add monster name/level display - identical to Scavenger Mode
            monster.levelText = this.add.text(monster.x, monster.y - 30, `Monster Lv.${playerLevel}`, {
                font: '10px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(2001);
            
            // Scale monster to match player
            monster.setScale(2.5);
            
            // Monster health bar update method - identical to Scavenger Mode
            monster.updateHealthBar = function() {
                if (!this.healthBar) return;
                
                this.healthBar.clear();
                const barWidth = 30; // Width of the health bar
                const barHeight = 5; // Height of the health bar
                const healthRatio = this.health / this.maxHealth;
                
                // Background (red)
                this.healthBar.fillStyle(0xff0000);
                this.healthBar.fillRect(this.x - barWidth / 2, this.y - 20, barWidth, barHeight);
                
                // Fill (green portion)
                this.healthBar.fillStyle(0x00ff00); // Green
                this.healthBar.fillRect(this.x - barWidth / 2, this.y - 20, barWidth * healthRatio, barHeight);
                
                // Outline
                this.healthBar.lineStyle(1, 0xffffff); // White border
                this.healthBar.strokeRect(this.x - barWidth / 2, this.y - 20, barWidth, barHeight);
                
                // Update level text position
                if (this.levelText) {
                    this.levelText.setPosition(this.x, this.y - 30);
                }
            };
            
            // Set up identical animations as Scavenger Mode
            monster.anims.play("monster_idle", true);
            
            // The takeDamage method - identical to Scavenger Mode
            monster.takeDamage = (damage) => {
                monster.health -= damage;
                console.log(`Monster took ${damage} damage, health now: ${monster.health}`);
                
                // Show damage number - use createFloatingText method for consistency
                this.showDamageText(monster.x, monster.y - 20, `-${damage}`, 0xff0000);
                
                if (monster.health <= 0) {
                    // Death effect
                    this.createDeathEffect(monster.x, monster.y);
                    
                    // Award experience
                    const expGain = 10 + Math.floor(Math.random() * 5);
                    if (this.playerStats) {
                        this.playerStats.experience = (this.playerStats.experience || 0) + expGain;
                    }
                    this.showDamageText(monster.x, monster.y - 40, `+${expGain} EXP`, 0x00ffff);
                    
                    // Chance for better loot in dungeon (40% just like Scavenger Mode but better items)
                    if (Math.random() < 0.4) {
                        const loot = this.getRandomDungeonLoot();
                        if (loot) {
                            // Add to inventory
                            const existingItem = this.inventory.find(item => item.name === loot);
                            if (existingItem) {
                                existingItem.quantity += 1;
                            } else {
                                this.inventory.push({ name: loot, quantity: 1 });
                            }
                            
                            // Log the monster loot
                            this.addToLog(`Monster dropped: ${loot}`);
                            
                            // Show floating text
                            this.showDamageText(monster.x, monster.y - 60, `+${loot}`, 0xffff00);
                        }
                    }
                    
                    // Clean up
                    if (monster.healthBar) monster.healthBar.destroy();
                    if (monster.levelText) monster.levelText.destroy();
                    monster.destroy();
                    console.log("Monster defeated!");
                } else {
                    // Visual feedback
                    monster.setTint(0xff0000);
                    this.time.delayedCall(100, () => {
                        monster.clearTint();
                    });
                    monster.updateHealthBar(); // Immediate update for feedback
                }
            };
            
            // The attack method - identical to Scavenger Mode
            monster.attack = (player) => {
                if (this.playerHealth > 0) {
                    // Calculate damage with defense reduction
                    const defense = this.playerStats && this.playerStats.defense ? this.playerStats.defense : 5;
                    const damage = Math.max(1, monster.damage - Math.floor(defense * 0.3));
                    
                    // Apply damage
                    this.playerHealth = Math.max(this.playerHealth - damage, 0);
                    
                    // Update health display
                    this.updateDungeonHUD();
                    
                    // Visual feedback
                    player.setTint(0xff0000);
                    this.time.delayedCall(100, () => player.clearTint());
                    this.cameras.main.shake(100, 0.005 * damage);
                    
                    // Floating damage text
                    this.showDamageText(player.x, player.y - 20, `-${damage}`, 0xff0000);
                    
                    // Check if player is dead
                    if (this.playerHealth <= 0) {
                        this.playerDied();
                    }
                }
            };
        });
    }
    
    // Helper method to get random dungeon loot (better than Scavenger Mode but similar style)
    getRandomDungeonLoot() {
        // Get player level for loot scaling
        const playerLevel = this.playerStats && this.playerStats.level ? this.playerStats.level : 1;
        
        // Higher chance of rare items in dungeon
        const rarityRoll = Math.random();
        
        // Dungeon-specific loot table
        const commonItems = ["Cloth", "Stick", "Stone", "Iron Ore", "Herbs"];
        const uncommonItems = ["Leather", "Copper Ore", "Thread", "Wood", "Water"];
        const rareItems = ["Fire Crystal", "Steel Ingot", "Poisonous Berries", "Vines"];
        const epicItems = ["Ancient Relic", "Mystic Gem", "Dragon Scale", "Shadow Essence"];
        
        // 10% chance for epic items if player level is high enough
        if (rarityRoll > 0.9 && playerLevel >= 3) {
            const index = Math.floor(Math.random() * epicItems.length);
            return epicItems[index];
        }
        // 20% chance for rare items
        else if (rarityRoll > 0.7) {
            const index = Math.floor(Math.random() * rareItems.length);
            return rareItems[index];
        }
        // 30% chance for uncommon items
        else if (rarityRoll > 0.4) {
            const index = Math.floor(Math.random() * uncommonItems.length);
            return uncommonItems[index];
        }
        // 40% chance for common items
        else {
            const index = Math.floor(Math.random() * commonItems.length);
            return commonItems[index];
        }
    }
    
    // Helper method to create floating text (mimics createFloatingText from main.js)
    showDamageText(x, y, text, color = 0xffffff, fontSize = 16) {
        const floatingText = this.add.text(x, y, text, {
            fontFamily: 'Arial',
            fontSize: `${fontSize}px`,
            color: `#${color.toString(16).padStart(6, '0')}`,
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        
        floatingText.setDepth(5000);
        
        this.tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }
    
    updateMonsters() {
        const time = this.time.now;
        
        this.monsters.getChildren().forEach(monster => {
            // Skip if monster is not fully initialized
            if (!monster.updateHealthBar) return;
            
            // Update health bar position
            monster.updateHealthBar();
            
            // Get reference to player
            const player = this.player;
            if (!player) return;
            
            // Calculate distance to player
            const distance = Phaser.Math.Distance.Between(monster.x, monster.y, player.x, player.y);
            
            // State machine identical to Scavenger Mode
            if (distance <= monster.attackRange) {
                if (monster.currentState !== "attacking") {
                    monster.currentState = "attacking";
                    monster.anims.play("monster_attack", true);
                }
                monster.setVelocity(0);
                if (time > monster.lastAttackTime + monster.attackCooldown) {
                    monster.attack(player);
                    monster.lastAttackTime = time;
                }
            } else if (distance <= monster.detectionRange) {
                if (monster.currentState !== "walking") {
                    monster.currentState = "walking";
                    monster.anims.play("monster_walk", true);
                }
                
                // Calculate path to player avoiding obstacles
                const angle = Phaser.Math.Angle.Between(monster.x, monster.y, player.x, player.y);
                
                // Set velocity based on angle to player
                let vx = Math.cos(angle) * monster.speed;
                let vy = Math.sin(angle) * monster.speed;
                
                // Check for collisions with walls before applying velocity
                monster.setVelocity(vx, vy);
            } else {
                if (monster.currentState !== "idle") {
                    monster.currentState = "idle";
                    monster.anims.play("monster_idle", true);
                }
                monster.setVelocity(0);
            }
            
            // Update monster flip based on player position (identical to Scavenger Mode)
            monster.flipX = player.x < monster.x;
        });
    }
    
    playerDied() {
        // Player death logic
        this.playerHealth = 0;
        this.updateDungeonHUD();
        
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
        
        // Death message indicating loss of items
        const deathMessage = this.add.text(
            this.cameras.main.worldView.centerX,
            this.cameras.main.worldView.centerY + 50,
            'You have died! You will return to Village Commons.\nAll your items have been lost!',
            { font: '16px Arial', fill: '#ffffff', align: 'center' }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        
        // Create continue button
        const continueButton = this.add.text(
            this.cameras.main.worldView.centerX,
            this.cameras.main.worldView.centerY + 100,
            'Continue',
            { font: '18px Arial', fill: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive();
        
        continueButton.on('pointerdown', () => {
            // Create new default inventory for Village Commons
            const defaultInventory = [
                { name: "Cloth", quantity: 1 },
                { name: "Stick", quantity: 2 }
            ];
            
            // Get Village zone data
            const villageZone = {
                name: "Village", 
                mapKey: "villageCommonsMap", 
                backgroundKey: "villageCommons", 
                foregroundKey: ""
            };
            
            // Reset player stats but keep level, experience, and oromozi
            if (this.playerStats) {
                const currentLevel = this.playerStats.level || 1;
                const currentExp = this.playerStats.experience || 0;
                const currentOromozi = this.playerStats.oromozi || 0;
                
                this.playerStats = {
                    health: 100,
                    thirst: 100,
                    hunger: 100,
                    stamina: 100,
                    oromozi: currentOromozi,
                    currentZone: "Village",
                    experience: currentExp,
                    level: currentLevel
                };
            }
            
            // Add fade out effect
            this.cameras.main.fadeOut(1000);
            
            // Start the main game scene after fade
            this.time.delayedCall(1000, () => {
                this.scene.start('MainGameScene', {
                    inventory: defaultInventory,
                    zone: villageZone,
                    playerStats: this.playerStats
                });
            });
        });
        
        // Add a visual death effect
        this.createDeathEffect(this.player.x, this.player.y);
    }
    
    updateDungeonHUD() {
        // Update health bar - very simple version
        if (this.healthBar) {
            const healthPercent = this.playerHealth / this.playerMaxHealth;
            this.healthBar.clear();
            
            // Small health bar at bottom left
            const barWidth = 100;
            const barHeight = 8;
            const barX = 10;
            const barY = this.game.config.height - 20;
            
            // Background
            this.healthBar.fillStyle(0x000000, 0.5);
            this.healthBar.fillRect(barX, barY, barWidth, barHeight);
            
            // Health portion
            this.healthBar.fillStyle(0x00ff00, 1);
            this.healthBar.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // Border
            this.healthBar.lineStyle(1, 0xffffff, 0.8);
            this.healthBar.strokeRect(barX, barY, barWidth, barHeight);
        }
        
        // Update minimap player position
        if (this.miniMapPlayer && this.minimapBg) {
            const mapSize = 60;
            const mapX = this.game.config.width - mapSize - 5;
            const mapY = 5;
            
            // Calculate scaled position 
            const playerX = mapX + mapSize/2 + (this.player.x / 1024) * mapSize - mapSize/2;
            const playerY = mapY + mapSize/2 + (this.player.y / 1024) * mapSize - mapSize/2;
            
            // Update player dot position
            this.miniMapPlayer.setPosition(playerX, playerY);
        }
    }
    
    updateMinimap() {
        // We're using the simplified updateDungeonHUD method for minimap updates now
        this.updateDungeonHUD();
    }
    
    exitDungeon() {
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
                            
                            // Debug log
                            console.log("Exiting dungeon with inventory:", this.inventory);

                            // Start the main game scene with our data
                            this.scene.start('MainGameScene', {
                                inventory: this.inventory,
                                zone: returnZoneData,
                                playerStats: this.playerStats
                            });
                        }, 1000);
                    }
                });
            }
        });
    }
    
    // Function to add messages to the log (matches main game's addToLog function)
    addToLog(message) {
        if (!this.logMessages || !this.logText) return;
        if (!message || typeof message !== 'string') {
            message = String(message || 'Event occurred');
        }
        
        try {
            console.log("Dungeon Log update:", message);
            this.logMessages.push(message);
            if (this.logMessages.length > 5) {
                this.logMessages.shift(); // Remove the oldest message
            }
            this.logText.setText(this.logMessages.join('\n'));
            
            // Add visual highlight to log briefly
            this.logText.setTint(0xffff00);
            this.time.delayedCall(1000, () => {
                if (this.logText && this.logText.clearTint) {
                    this.logText.clearTint();
                }
            });
        } catch (error) {
            console.warn("Error updating log:", error);
        }
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
            
            // Get loot table and check for the return zone
            const lootTable = this.cache.json.get('lootTable');
            const returnZone = this.returnScene || "Outer Grasslands";
            console.log("Generating dungeon loot for zone:", returnZone);
            
            let zoneSpecificItems = [];
            let highTierWeapons = [];
            let highTierItems = [];
            
            if (lootTable && lootTable.zones) {
                // First, collect items from the player's return zone (prioritize these)
                if (lootTable.zones[returnZone]) {
                    zoneSpecificItems = lootTable.zones[returnZone].filter(item => 
                        item.rarity === "Epic" || item.rarity === "Rare" || item.rarity === "Mythic"
                    );
                    
                    // Log found items for debugging
                    console.log(`Found ${zoneSpecificItems.length} high-tier items from ${returnZone}`);
                }
                
                // Then, collect rare and mythic items from all zones as fallback
                Object.keys(lootTable.zones).forEach(zone => {
                    const zoneItems = lootTable.zones[zone];
                    zoneItems.forEach(item => {
                        if (item.type === "Weapon" && (item.rarity === "Rare" || item.rarity === "Epic" || item.rarity === "Mythic")) {
                            highTierWeapons.push(item);
                        } else if ((item.rarity === "Epic" || item.rarity === "Mythic")) {
                            highTierItems.push(item);
                        }
                    });
                });
            }
            
            // Guaranteed rare weapon from zone if available, otherwise fallback to any high tier weapon
            let rareWeapon;
            const zoneWeapons = zoneSpecificItems.filter(item => item.type === "Weapon");
            
            if (zoneWeapons.length > 0) {
                // Prioritize weapons from the player's return zone
                const itemIndex = Phaser.Math.Between(0, zoneWeapons.length - 1);
                rareWeapon = zoneWeapons[itemIndex].name;
                console.log(`Selected zone-specific weapon: ${rareWeapon}`);
            } else if (highTierWeapons.length > 0) {
                // Fallback to any high tier weapon
                const itemIndex = Phaser.Math.Between(0, highTierWeapons.length - 1);
                rareWeapon = highTierWeapons[itemIndex].name;
                console.log(`Selected fallback weapon: ${rareWeapon}`);
            } else {
                // Fallback weapons if loot table doesn't have any
                const fallbackWeapons = [
                    "Dragon Slayer Sword", 
                    "Soul Reaver", 
                    "Mythril Blade", 
                    "Ancient Bow", 
                    "Runic Staff"
                ];
                rareWeapon = fallbackWeapons[Phaser.Math.Between(0, fallbackWeapons.length - 1)];
                console.log(`Selected hardcoded weapon: ${rareWeapon}`);
            }
            
            // Second item is a high value item from zone if available, otherwise any high tier item
            let randomItem2;
            const zoneSpecialty = zoneSpecificItems.filter(item => item.type !== "Weapon");
            
            if (zoneSpecialty.length > 0) {
                // Prioritize non-weapon items from the player's return zone
                const itemIndex = Phaser.Math.Between(0, zoneSpecialty.length - 1);
                randomItem2 = zoneSpecialty[itemIndex].name;
                console.log(`Selected zone-specific item: ${randomItem2}`);
            } else if (highTierItems.length > 0) {
                // Fallback to any high tier item
                const itemIndex = Phaser.Math.Between(0, highTierItems.length - 1);
                randomItem2 = highTierItems[itemIndex].name;
                console.log(`Selected fallback item: ${randomItem2}`);
            } else {
                // Fallback mythic items
                const fallbackItems = [
                    "Ancient Relic", 
                    "Dragon Scale", 
                    "Shadow Essence", 
                    "Crystal Heart", 
                    "Phoenix Feather"
                ];
                randomItem2 = fallbackItems[Phaser.Math.Between(0, fallbackItems.length - 1)];
                console.log(`Selected hardcoded item: ${randomItem2}`);
            }
            
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
                `+ 1 ${rareWeapon}`,
                { font: '22px Arial', fill: '#ff00ff', stroke: '#000000', strokeThickness: 3 }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
            
            const itemText2 = this.add.text(
                this.cameras.main.worldView.centerX,
                this.cameras.main.worldView.centerY + 60,
                `+ 1 ${randomItem2}`,
                { font: '18px Arial', fill: '#00ffff', stroke: '#000000', strokeThickness: 2 }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
            
            // Add visual effect for the rare weapon
            this.tweens.add({
                targets: itemText1,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 500,
                yoyo: true,
                repeat: 3
            });
            
            // Add box opening animation
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
                // Update gold display
                if (this.goldText) {
                    this.goldText.setText(`${this.playerStats.oromozi}`);
                }
            }
            
            // Add the items to inventory
            const existingItem1 = this.inventory.find(item => item.name === rareWeapon);
            if (existingItem1) {
                existingItem1.quantity += 1;
            } else {
                this.inventory.push({ name: rareWeapon, quantity: 1 });
            }
            
            const existingItem2 = this.inventory.find(item => item.name === randomItem2);
            if (existingItem2) {
                existingItem2.quantity += 1;
            } else {
                this.inventory.push({ name: randomItem2, quantity: 1 });
            }
            
            // Log the items in the log display
            this.addToLog(`Received Treasure: ${gold} Gold`);
            this.addToLog(`Received: ${rareWeapon}`);
            this.addToLog(`Received: ${randomItem2}`);
            
            // Create special effects for legendary weapon discovery
            this.createWeaponDiscoveryEffect(this.lootBox.x, this.lootBox.y);
            
            // Hide loot glow effect
            this.lootGlow.destroy();
            
            // Hide loot box
            this.lootBox.setAlpha(0.5);
            this.lootBox.disableInteractive();
            
            // Add "EXIT" text to indicate dungeon completion
            const exitPrompt = this.add.text(
                this.cameras.main.worldView.centerX,
                this.cameras.main.worldView.centerY + 50,
                'Dungeon Complete! Exiting...',
                { font: '20px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
            
            // Animate and fade out text with longer delay to give player time to see rewards
            this.tweens.add({
                targets: [rewardText, goldText, itemText1, itemText2, exitPrompt],
                alpha: 0,
                duration: 2000,
                delay: 4000,
                onComplete: () => {
                    rewardText.destroy();
                    goldText.destroy();
                    itemText1.destroy();
                    itemText2.destroy();
                    exitPrompt.destroy();
                    
                    // Automatically exit the dungeon after showing rewards
                    this.time.delayedCall(1000, () => {
                        this.exitDungeon();
                    });
                }
            });
        }
    }
    
    // Special effect for discovering a rare weapon
    createWeaponDiscoveryEffect(x, y) {
        // Create a particle emitter for a "magical" effect
        const particles = this.add.particles('star');
        
        const emitter = particles.createEmitter({
            x: x,
            y: y,
            speed: { min: 50, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.6, end: 0 },
            blendMode: 'ADD',
            lifespan: 2000,
            quantity: 1,
            frequency: 100,
            tint: [0xff00ff, 0xffff00, 0x00ffff]
        });
        
        // Stop the emitter after a few seconds
        this.time.delayedCall(3000, () => {
            emitter.stop();
            // Destroy the particle manager after particles fade
            this.time.delayedCall(2000, () => {
                particles.destroy();
            });
        });
    }

    // Function to create hit effect - matches createSimpleEffect from Scavenger Mode
    createHitEffect(x, y, color = 0xff0000) {
        // Create a circle that fades out
        const circle = this.add.circle(x, y, 15, color, 0.7);
        circle.setDepth(3000);
        
        // Fade out and expand
        this.tweens.add({
            targets: circle,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => {
                circle.destroy();
            }
        });
    }

    // Function to create death effect - similar to createSimpleEffect but more particles
    createDeathEffect(x, y) {
        // Create a larger circle with different color for death effect
        const circle = this.add.circle(x, y, 25, 0xff0000, 0.7);
        circle.setDepth(3000);
        
        // Fade out and expand
        this.tweens.add({
            targets: circle,
            alpha: 0,
            scale: 3,
            duration: 800,
            onComplete: () => {
                circle.destroy();
            }
        });
        
        // Add a second smaller circle for more impact
        const circle2 = this.add.circle(x, y, 15, 0xffffff, 0.5);
        circle2.setDepth(3001);
        
        // Fade out and expand faster
        this.tweens.add({
            targets: circle2,
            alpha: 0,
            scale: 2,
            duration: 400,
            onComplete: () => {
                circle2.destroy();
            }
        });
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
        // Add to log
        this.addToLog(`Picked up: ${item}`);
        
        // Create toast message - RAISED position to be visible on screen
        const message = this.add.text(
            this.cameras.main.width / 2, 
            this.cameras.main.height - 70, // Raised from bottom
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
            y: this.cameras.main.height - 90, // Raised animation end position
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