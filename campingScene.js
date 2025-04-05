// CampingScene.js (explicitly fixed)

class CampingScene extends Phaser.Scene {
  constructor() {
    super('CampingScene');

    // Zone initialization
    this.zone = null;

    // Player and scene elements
    this.player = null;
    this.campfire = null;
    this.lightRadius = 150;
    this.maxLightRadius = 400;
    this.campfireScale = 1.5;
    this.maxCampfireScale = 3;
    this.campfireOriginY = 0.75;
    this.maxCampfireOriginY = 1;
    this.cursors = null;
    this.campfireLight = null;
    this.darkOverlay = null;

    // Fire management
    this.burnTime = 0;
    this.maxStokes = 7;
    this.currentStokes = 0;
    this.burnMeter = null;
    this.timerEvent = null;
    this.isFireLit = false;

    // Inventory
    this.inventory = [];
    this.menuVisible = false;
    this.menuText = null;

    // Cooking properties
    this.isCooking = false;
    this.cookingTime = 0;
    this.cookingDuration = 30;
    this.cookingComplete = false;
    this.cookedFoodItem = null;
    this.skillet = null;
    this.progressBar = null;
    this.cookingTimer = null;
    this.claimText = null;
    this.cookingStartTime = 0;

    // Dialog menu properties
    this.dialogVisible = false;
    this.dialogBox = null;
    this.dialogTitle = null;
    this.dialogTextItems = [];
    this.selectedItemIndex = 0;
    this.cookableItems = [];

    // Torch properties
    this.torch = null;
    this.torchLight = null;
    this.torchBurnTime = 0;
    this.torchCurrentStokes = 0;
    this.isTorchLit = false;
    this.torchLightRadius = 150;
    this.torchScale = 0.75;
    this.maxTorchScale = 1.5;
    this.torchOriginY = 0.75;
    this.maxTorchOriginY = 1;
    this.torchBurnMeter = null;

    // Stoking menu properties
    this.stokingDialogVisible = false;
    this.stokingDialogBox = null;
    this.stokingDialogTitle = null;
    this.stokingDialogTextItems = [];
    this.stokingItems = [];
    this.stokingTarget = null;
    this.quantityInputVisible = false;
    this.quantityInputText = null;
    this.selectedQuantity = 1;

    // Player stats properties
    this.playerStats = {
      health: 100,
      stamina: 100,
      thirst: 100,
      hunger: 100,
      oromozi: 1000
    };
    this.statsText = null;
    this.regenTimer = null;
  }

  preload() {
    // Only load textures if they haven't been loaded yet
    if (!this.textures.exists('campsite_map')) {
      this.load.tilemapTiledJSON('campsite_map', 'assets/maps/campsite.json');
    }
    if (!this.textures.exists('forest_night')) {
      this.load.image('forest_night', 'assets/images/forest_night.png');
    }
    if (!this.textures.exists('player')) {
      this.load.spritesheet('player', 'assets/images/player.png', { frameWidth: 48, frameHeight: 48 });
    }
    if (!this.textures.exists('campfire')) {
      this.load.spritesheet('campfire', 'assets/images/campfire.png', { frameWidth: 32, frameHeight: 48 });
    }
    if (!this.textures.exists('smoke')) {
      this.load.spritesheet('smoke', 'assets/images/smoke.png', { frameWidth: 32, frameHeight: 48 });
    }
    if (!this.textures.exists('skillet')) {
      this.load.image('skillet', 'assets/images/skillet.png');
    }
  }

  create(data) {
    // Initialize zone from data passed from MainGameScene
    this.zone = data.zone || {
      backgroundKey: 'forest_night' // Default background if no zone is passed
    };

    // Use the current zone's background
    this.add.image(0, 0, this.zone.backgroundKey)
      .setOrigin(0, 0)
      .setScale(1);
    
    // Add a semi-transparent overlay to darken the scene
    this.darkOverlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.5)
      .setOrigin(0, 0);
    
    // Add title
    this.add.text(400, 50, 'Camping', {
      fontSize: '32px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Initialize player
    this.player = this.physics.add.sprite(400, 300, 'player')
      .setScale(2)
      .setDepth(2);
    
    // Set up player animations
    this.anims.create({ key: 'idleDown', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'moveRight', frames: this.anims.generateFrameNumbers('player', { start: 6, end: 11 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'idleUp', frames: this.anims.generateFrameNumbers('player', { start: 12, end: 17 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'moveDown', frames: this.anims.generateFrameNumbers('player', { start: 18, end: 23 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'moveLeft', frames: this.anims.generateFrameNumbers('player', { start: 24, end: 29 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'moveUp', frames: this.anims.generateFrameNumbers('player', { start: 30, end: 35 }), frameRate: 10, repeat: -1 });
    this.player.play('idleDown');
    
    // Set up keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Add campfire representation using existing crate sprite
    this.campfire = this.add.sprite(400, 300, 'loot_crate')
      .setScale(1.5)
      .setInteractive({ useHandCursor: true });
    
    // Add campfire text
    this.campfireText = this.add.text(400, 250, 'Campfire', {
      fontSize: '24px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Add return button
    const returnButton = this.add.text(400, 500, 'Return to Game', {
      fontSize: '24px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    
    // Add button hover effect
    returnButton.on('pointerover', () => returnButton.setScale(1.1));
    returnButton.on('pointerout', () => returnButton.setScale(1));
    
    // Handle return to game
    returnButton.on('pointerdown', () => {
      this.scene.start('MainGameScene', {
        inventory: this.inventory,
        playerStats: this.playerStats,
        zone: this.zone
      });
    });
    
    // Add campfire interaction
    this.campfire.on('pointerdown', () => {
      if (!this.campfire.isLit) {
        this.campfire.setTint(0xff6600);
        this.campfireText.setText('Campfire (Lit)');
        this.campfire.isLit = true;
        
        // Create a simple fire effect
        this.createSimpleEffect(this, this.campfire.x, this.campfire.y, 0xff6600);
      } else {
        this.campfire.clearTint();
        this.campfireText.setText('Campfire');
        this.campfire.isLit = false;
      }
    });

    // Start the burn timer
    this.startBurnTimer();
  }

  update() {
    // Handle player movement
    if (this.player && this.cursors) {
      const speed = 100;
      let dx = 0;
      let dy = 0;

      if (this.cursors.left.isDown) {
        dx = -speed;
        this.player.play('moveLeft', true);
      } else if (this.cursors.right.isDown) {
        dx = speed;
        this.player.play('moveRight', true);
      } else if (this.cursors.up.isDown) {
        dy = -speed;
        this.player.play('moveUp', true);
      } else if (this.cursors.down.isDown) {
        dy = speed;
        this.player.play('moveDown', true);
      } else {
        // If no movement keys are pressed, play idle animation
        const currentAnim = this.player.anims.currentAnim;
        if (currentAnim) {
          const direction = currentAnim.key.replace('move', '').toLowerCase();
          this.player.play(`idle${direction.charAt(0).toUpperCase() + direction.slice(1)}`, true);
        }
      }

      this.player.setVelocity(dx, dy);
    }
  }

  startBurnTimer() {
    // Create a timer event that fires every second
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.isFireLit) {
          this.burnTime++;
          this.updateBurnMeter();
        }
      },
      loop: true
    });
  }

  updateBurnMeter() {
    if (this.burnMeter) {
      const burnPercentage = Math.min(this.burnTime / 60, 1); // 60 seconds max burn time
      this.burnMeter.setScale(burnPercentage, 1);
      this.burnMeter.setTint(0xff6600);
    }
  }

  createSimpleEffect(scene, x, y, color) {
    const particles = scene.add.particles(0, 0, 'smoke', {
      x: x,
      y: y,
      speed: { min: 50, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 1000,
      quantity: 1,
      tint: color,
      blendMode: 'ADD'
    });
    
    // Destroy particles after 2 seconds
    scene.time.delayedCall(2000, () => {
      particles.destroy();
    });
  }

  stokeFire() {
    if (this.currentStokes < this.maxStokes) {
      this.currentStokes++;
      this.burnTime = Math.max(0, this.burnTime - 10); // Reduce burn time by 10 seconds
      this.updateBurnMeter();
      
      // Create a stoking effect
      this.createSimpleEffect(this, this.campfire.x, this.campfire.y, 0xff6600);
    }
  }

  stokeTorch() {
    if (this.torchCurrentStokes < this.maxStokes) {
      this.torchCurrentStokes++;
      this.torchBurnTime = Math.max(0, this.torchBurnTime - 10);
      this.updateTorchBurnMeter();
      
      // Create a stoking effect
      this.createSimpleEffect(this, this.torch.x, this.torch.y, 0xff6600);
    }
  }

  updateTorchBurnMeter() {
    if (this.torchBurnMeter) {
      const burnPercentage = Math.min(this.torchBurnTime / 30, 1); // 30 seconds max torch burn time
      this.torchBurnMeter.setScale(burnPercentage, 1);
      this.torchBurnMeter.setTint(0xff6600);
    }
  }

  handleFireClick() {
    if (!this.isFireLit) {
      this.isFireLit = true;
      this.burnTime = 60; // Start with 60 seconds of burn time
      this.currentStokes = 0;
      
      // Create fire effect
      this.createSimpleEffect(this, this.campfire.x, this.campfire.y, 0xff6600);
      
      // Update visual state
      this.campfire.setTint(0xff6600);
      this.campfireText.setText('Campfire (Lit)');
    }
  }
}