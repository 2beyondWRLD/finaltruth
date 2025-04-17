class CampingScene extends Phaser.Scene {
  constructor() {
    super('CampingScene');
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
    this.zone = null;

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
    this.cookingDuration = 30; // Total time to cook (in seconds)
    this.cookingComplete = false;
    this.cookedFoodItem = null;
    this.skillet = null;
    this.progressBar = null;
    this.cookingTimer = null;
    this.claimText = null;
    this.cookingStartTime = 0; // Timestamp for persistence

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
  }

  preload() {
      this.load.tilemapTiledJSON('campsite_map', 'assets/maps/campsite.json');
      this.load.image('forest_night', 'assets/images/forest_night.png');
      this.load.spritesheet('player', 'assets/images/player.png', { frameWidth: 48, frameHeight: 48 });
      this.load.spritesheet('campfire', 'assets/images/campfire.png', { frameWidth: 32, frameHeight: 48 });
      this.load.spritesheet('smoke', 'assets/images/smoke.png', { frameWidth: 32, frameHeight: 48 });
      this.load.image('skillet', 'assets/images/skillet.png');
  }

  create(data) {
    // Clean up any existing player
    if (this.player) {
      this.player.destroy();
    }

    // Store the zone from incoming data
    this.zone = data.zone;

    // Preserve incoming inventory
    console.log('Incoming data:', data);
    this.inventory = data.inventory ? JSON.parse(JSON.stringify(data.inventory)) : [];
    console.log('Final inventory on entering CampingScene:', this.inventory);
    console.log('Stokeable items:', this.findStokeItems());
    console.log('Cookable items:', this.inventory.filter(item => {
      const name = item.name.toLowerCase();
      return name.includes('cod') || 
             name.includes('fish') ||
             name.includes('meat') ||
             name.includes('food') ||
             name.includes('raw');
    }));

    // Restore states from registry with fallback values
    const cookingState = this.registry.get('cookingState') || {};
    this.isCooking = cookingState.isCooking || false;
    this.cookingTime = cookingState.cookingTime || 0;
    this.cookingComplete = cookingState.cookingComplete || false;
    this.cookedFoodItem = cookingState.cookedFoodItem || null;
    this.cookingStartTime = cookingState.cookingStartTime || 0;

    const fireState = this.registry.get('fireState') || {};
    this.isFireLit = fireState.isFireLit || false;
    this.burnTime = fireState.burnTime || 0;
    this.currentStokes = fireState.currentStokes || 0;
    // Reset light properties to default values when fire is not lit
    this.lightRadius = this.isFireLit ? (fireState.lightRadius || 150) : 150;
    this.campfireScale = this.isFireLit ? (fireState.campfireScale || 1.5) : 1.5;
    this.campfireOriginY = this.isFireLit ? (fireState.campfireOriginY || 0.75) : 0.75;

    const torchState = this.registry.get('torchState') || {};
    this.isTorchLit = torchState.isTorchLit || false;
    this.torchBurnTime = torchState.torchBurnTime || 0;
    this.torchCurrentStokes = torchState.torchCurrentStokes || 0;
    // Reset torch properties to default values when torch is not lit
    this.torchLightRadius = this.isTorchLit ? (torchState.torchLightRadius || 150) : 150;
    this.torchScale = this.isTorchLit ? (torchState.torchScale || 0.75) : 0.75;
    this.torchOriginY = this.isTorchLit ? (torchState.torchOriginY || 0.75) : 0.75;

    console.log('Restored cooking state - isCooking:', this.isCooking, 'cookingTime:', this.cookingTime, 'cookingComplete:', this.cookingComplete, 'cookedFoodItem:', this.cookedFoodItem);
    console.log('Restored fire state - isFireLit:', this.isFireLit, 'burnTime:', this.burnTime);

    // Enable lighting with a slightly brighter ambient color
    this.lights.enable().setAmbientColor(0x444444);

    // Load tilemap and add background
    const map = this.make.tilemap({ key: 'campsite_map' });
    const campsiteLayer = map.images.find(layer => layer.name === 'campsite');
    if (campsiteLayer) {
      this.add.image(0, 0, 'forest_night').setOrigin(0, 0).setScale(1).setPipeline('Light2D');
    }

    // Create player
    this.player = this.physics.add.sprite(288, 288, 'player')
      .setScale(2)
      .setDepth(2)
      .setPipeline('Light2D');
    this.player.pipelineData = { castShadows: false };
    this.player.body.setSize(24, 24).setOffset(12, 20);
    
    // Player animations
    this.anims.create({ key: 'idleDown', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'moveRight', frames: this.anims.generateFrameNumbers('player', { start: 6, end: 11 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'idleUp', frames: this.anims.generateFrameNumbers('player', { start: 12, end: 17 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'moveDown', frames: this.anims.generateFrameNumbers('player', { start: 18, end: 23 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'moveLeft', frames: this.anims.generateFrameNumbers('player', { start: 24, end: 29 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'moveUp', frames: this.anims.generateFrameNumbers('player', { start: 30, end: 35 }), frameRate: 10, repeat: -1 });
    this.player.play('idleDown');
    
    // Create campfire animation before applying it
    this.anims.create({ key: 'smokeRise', frames: this.anims.generateFrameNumbers('smoke', { start: 0, end: 4 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'campfireBurn', frames: this.anims.generateFrameNumbers('campfire', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    
    // Create campfire
    const campfireLayer = map.getObjectLayer('campfire');
    if (campfireLayer && campfireLayer.objects.length > 0) {
      const campfireObj = campfireLayer.objects[0];
      
      // Set correct positioning
      const originalCampfireY = campfireObj.y + (campfireObj.height / 2) - 10;
      const campfireX = campfireObj.x + (campfireObj.width / 2);

      // Store original position for reference
      this.originalCampfireX = campfireX;
      this.originalCampfireY = originalCampfireY;
      
      // Create the campfire sprite
      this.campfire = this.physics.add.sprite(campfireX, originalCampfireY, 'smoke')
        .setScale(0.5)
        .setDepth(1)
        .setPipeline('Light2D');
      
      // Set initial animation
      this.campfire.play('smokeRise');
      
      // Add light at campfire position
      this.campfireLight = this.lights.addLight(campfireX, originalCampfireY, 0, 0xffaa33, 3);
      
      console.log('Campfire created at:', campfireX, originalCampfireY);
      console.log('Is fire lit:', this.isFireLit);
      
      // If fire is already lit (from state), update its appearance
      if (this.isFireLit) {
        console.log('Restoring lit campfire');
        this.campfire.setTexture('campfire');
        this.campfire.play('campfireBurn');
        this.campfire.setScale(this.campfireScale);
        this.campfire.setOrigin(0.5, this.campfireOriginY);
        this.campfireLight.setRadius(this.lightRadius);
        console.log('Campfire scale:', this.campfireScale, 'Origin Y:', this.campfireOriginY);
      } else {
        // For unlit fire, set origin properly
        this.campfire.setOrigin(0.5, this.campfireOriginY);
      }

      // Make campfire interactive and very clickable
      this.campfire.setInteractive({ useHandCursor: true, pixelPerfect: false });
      this.campfire.input.hitArea.setTo(-32, -32, 64, 64); // Larger hit area
      this.campfire.on('pointerdown', this.handleFireClick, this);
    }

    // Create torch
    const torchLayer = map.getObjectLayer('site_torch');
    if (torchLayer && torchLayer.objects.length > 0) {
      const torchObj = torchLayer.objects[0];
      const originalTorchY = torchObj.y + (torchObj.height / 2) - 20;
      const torchX = torchObj.x + (torchObj.width / 2);

      this.torch = this.physics.add.sprite(torchX, originalTorchY, 'smoke')
        .setScale(0.25)
        .setDepth(1)
        .setPipeline('Light2D')
        .setOrigin(0.5, this.torchOriginY);
      this.torch.play('smokeRise');

      this.torchLight = this.lights.addLight(torchX, originalTorchY, 0, 0xffaa33, 3);
      if (this.isTorchLit) {
        this.torch.setTexture('campfire').play('campfireBurn');
        this.torch.setScale(this.torchScale).setOrigin(0.5, this.torchOriginY);
        this.torchLight.setRadius(this.torchLightRadius);
      }

      this.torchBurnMeter = this.add.graphics();
      this.updateTorchBurnMeter();

      // Make torch interactive too
      this.torch.setInteractive({ useHandCursor: true });
      this.torch.input.hitArea.setTo(-16, -16, 32, 32); // Larger hit area
      this.torch.on('pointerdown', () => {
        if (this.isTorchLit) {
          this.showDialog('Torch is lit', [{ text: 'OK', callback: () => {} }]);
        } else {
          this.showStokingMenu('torch');
        }
      });
    }

    // Add dark overlay
    this.darkOverlay = this.add.rectangle(288, 288, 576, 576, 0x000000, 0.7)
      .setOrigin(0.5)
      .setDepth(3)
      .setPipeline('Light2D');
    this.darkOverlay.setBlendMode(Phaser.BlendModes.SCREEN);

    // Create burn meter
    this.burnMeter = this.add.graphics();
    this.updateBurnMeter();

    // Restore cooking UI and state
    if ((this.isCooking || this.cookingComplete) && this.cookingStartTime > 0) {
      this.skillet = this.add.image(this.campfire.x, this.campfire.y + 5, 'skillet').setScale(3).setDepth(2);
      this.progressBar = this.add.graphics().setDepth(3);

      // Calculate elapsed time since cooking started
      const currentTime = Date.now();
      const totalElapsedTime = Math.floor((currentTime - this.cookingStartTime) / 1000); // In seconds
      const adjustedCookingTime = this.cookingTime + totalElapsedTime;

      if (adjustedCookingTime >= this.cookingDuration) {
        // Cooking is complete
        this.cookingComplete = true;
        this.isCooking = false;
        this.progressBar.fillStyle(0x0000ff, 1);
        this.progressBar.fillRect(this.campfire.x - 25, this.campfire.y - 40, 50, 5);
        this.claimText = this.add.text(this.campfire.x, this.campfire.y - 60, 'Claim', {
          fontSize: '14px',
          color: '#ffffff'
        }).setOrigin(0.5).setDepth(3);

        // Update registry when cooking completes on restore
        this.registry.set('cookingState', {
          isCooking: false,
          cookingTime: adjustedCookingTime,
          cookingComplete: true,
          cookedFoodItem: this.cookedFoodItem,
          cookingStartTime: this.cookingStartTime
        });
      } else if (this.isFireLit) {
        // Resume cooking
        this.cookingTime = adjustedCookingTime;
        this.isCooking = true;
        this.progressBar.fillStyle(0x00ff00, 1);
        this.progressBar.fillRect(this.campfire.x - 25, this.campfire.y - 40, 50 * (this.cookingTime / this.cookingDuration), 5);
        this.cookingTimer = this.time.addEvent({
          delay: 1000,
          callback: this.updateCooking,
          callbackScope: this,
          loop: true
        });
      } else {
        // Fire is out, stop cooking and discard item
        this.isCooking = false;
        this.cookingComplete = false;
        this.skillet.destroy();
        this.progressBar.destroy();
        this.cookedFoodItem = null;

        // Update registry when cooking is discarded
        this.registry.set('cookingState', {
          isCooking: false,
          cookingTime: 0,
          cookingComplete: false,
          cookedFoodItem: null,
          cookingStartTime: 0
        });
      }
    }

    // Make skillet/cooking area interactive to claim food
    if (this.skillet) {
      this.skillet.setInteractive({ useHandCursor: true });
      this.skillet.on('pointerdown', () => {
        if (this.cookingComplete) {
          this.claimCookedFood();
        }
      });
    }

    // Set world and camera bounds
    this.physics.world.setBounds(0, 0, 576, 576);
    this.cameras.main.setBounds(0, 0, 576, 576).startFollow(this.player, true);

    // Input setup
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      stoke: Phaser.Input.Keyboard.KeyCodes.F,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
      select: Phaser.Input.Keyboard.KeyCodes.ENTER,
      dialogUp: Phaser.Input.Keyboard.KeyCodes.UP,
      dialogDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
      increaseQty: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      decreaseQty: Phaser.Input.Keyboard.KeyCodes.LEFT
    });

    // Stoke fire or torch with F key
    this.input.keyboard.on('keydown-F', () => {
      if (!this.dialogVisible && !this.stokingDialogVisible) {
        const playerPos = this.player.getCenter();
        const campfirePos = this.campfire.getCenter();
        const distanceToCampfire = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, campfirePos.x, campfirePos.y);

        if (distanceToCampfire < 50) {
          this.showStokingMenu('campfire');
        } else if (this.torch) {
          const torchPos = this.torch.getCenter();
          const distanceToTorch = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, torchPos.x, torchPos.y);
          if (distanceToTorch < 50) {
            this.showStokingMenu('torch');
          }
        }
      }
    });

    // Exit with ESC key
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.dialogVisible) {
        this.closeDialog();
      } else if (this.stokingDialogVisible) {
        this.closeStokingDialog();
      } else {
        this.returnToMainScene();
      }
    });

    // Dialog navigation with UP key
    this.input.keyboard.on('keydown-UP', () => {
      if (this.dialogVisible) {
        this.selectedItemIndex = Math.max(0, this.selectedItemIndex - 1);
        this.updateDialogSelection();
      } else if (this.stokingDialogVisible && !this.quantityInputVisible) {
        this.selectedItemIndex = Math.max(0, this.selectedItemIndex - 1);
        this.updateStokingDialogSelection();
      }
    });

    // Dialog navigation with DOWN key
    this.input.keyboard.on('keydown-DOWN', () => {
      if (this.dialogVisible) {
        this.selectedItemIndex = Math.min(this.cookableItems.length - 1, this.selectedItemIndex + 1);
        this.updateDialogSelection();
      } else if (this.stokingDialogVisible && !this.quantityInputVisible) {
        this.selectedItemIndex = Math.min(this.stokingItems.length - 1, this.selectedItemIndex + 1);
        this.updateStokingDialogSelection();
      }
    });

    // Quantity adjustment with LEFT and RIGHT keys
    this.input.keyboard.on('keydown-LEFT', () => {
      if (this.stokingDialogVisible && this.quantityInputVisible) {
        const maxQty = this.stokingItems[this.selectedItemIndex].quantity;
        this.selectedQuantity = Math.max(1, this.selectedQuantity - 1);
        this.updateQuantityInput(maxQty);
      }
    });

    this.input.keyboard.on('keydown-RIGHT', () => {
      if (this.stokingDialogVisible && this.quantityInputVisible) {
        const maxQty = this.stokingItems[this.selectedItemIndex].quantity;
        this.selectedQuantity = Math.min(maxQty, this.selectedQuantity + 1);
        this.updateQuantityInput(maxQty);
      }
    });

    // Select item with ENTER key
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.dialogVisible) {
        this.selectDialogOption();
      } else if (this.stokingDialogVisible) {
        if (!this.quantityInputVisible) {
          this.showQuantityInput();
        } else {
          this.useStokingItem();
        }
      } else if (this.cookingComplete && this.claimText) {
        this.claimCookedFood();
      }
    });

    // Start burn timer
    this.startBurnTimer();
  }

  update() {
    // Handle player movement only when dialogs are not visible
    if (!this.dialogVisible && !this.stokingDialogVisible) {
      this.player.setVelocity(0);
        if (this.cursors.left.isDown) {
        this.player.setVelocityX(-100).anims.play('moveLeft', true);
        } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(100).anims.play('moveRight', true);
        } else if (this.cursors.up.isDown) {
        this.player.setVelocityY(-100).anims.play('moveUp', true);
        } else if (this.cursors.down.isDown) {
        this.player.setVelocityY(100).anims.play('moveDown', true);
      } else {
        this.player.anims.play('idleDown', true);
      }
    } else {
      // Stop player movement when dialogs are open
      this.player.setVelocity(0);
    }
  }

  stokeFire(item, quantity) {
    if (this.currentStokes < this.maxStokes) {
      const name = item.name.toLowerCase();
      let stokes = 0;

      if (name.includes("wood") || name.includes("stick")) stokes = 3;
      else if (name === "lint" || name === "trash") stokes = 0.1;

      if (stokes > 0) {
        item.quantity -= quantity;
        if (item.quantity <= 0) {
          const index = this.inventory.indexOf(item);
          if (index > -1) this.inventory.splice(index, 1);
        }

        const totalStokes = stokes * quantity;
        this.currentStokes = Math.min(this.currentStokes + totalStokes, this.maxStokes);
        this.burnTime = this.currentStokes * 30;

        // Reset properties to default values if fire is being lit for the first time
        if (!this.isFireLit) {
          this.lightRadius = 150;
          this.campfireScale = 1.5;
          this.campfireOriginY = 0.75;
        }

        this.lightRadius = Math.min(this.lightRadius + (20 * totalStokes), this.maxLightRadius);
        this.campfireLight.setRadius(this.lightRadius);
        this.campfireScale = Math.min(this.campfireScale + (0.1 * totalStokes), this.maxCampfireScale);
        this.campfireOriginY = Math.min(this.campfireOriginY + (0.01 * totalStokes), this.maxCampfireOriginY);
        
        if (!this.isFireLit) {
          this.isFireLit = true;
          this.campfire.setTexture('campfire').play('campfireBurn');
          console.log("Fire lit successfully!");
        }
        
        // Always use original position
        this.campfire.setPosition(this.originalCampfireX, this.originalCampfireY);
        this.campfire.setScale(this.campfireScale).setOrigin(0.5, this.campfireOriginY);

        this.updateBurnMeter();
        console.log(`Stoked campfire with ${quantity} ${item.name}! Stokes: ${this.currentStokes}, Burn time: ${this.burnTime}s`);

        // Update fire state in registry
        this.registry.set('fireState', {
          isFireLit: this.isFireLit,
          burnTime: this.burnTime,
          currentStokes: this.currentStokes,
          lightRadius: this.lightRadius,
          campfireScale: this.campfireScale,
          campfireOriginY: this.campfireOriginY
        });
      }
    } else {
      console.log("Max stokes reached for campfire!");
    }
  }

  stokeTorch(item, quantity) {
    if (this.torchCurrentStokes < this.maxStokes) {
      const name = item.name.toLowerCase();
      let stokes = 0;

      if (name.includes("wood") || name.includes("stick")) stokes = 3;
      else if (name === "lint" || name === "trash") stokes = 0.1;

      if (stokes > 0) {
        item.quantity -= quantity;
        if (item.quantity <= 0) {
          const index = this.inventory.indexOf(item);
          if (index > -1) this.inventory.splice(index, 1);
        }

        const totalStokes = stokes * quantity;
        this.torchCurrentStokes = Math.min(this.torchCurrentStokes + totalStokes, this.maxStokes);
        this.torchBurnTime = this.torchCurrentStokes * 30;

        // Reset properties to default values if torch is being lit for the first time
        if (!this.isTorchLit) {
          this.torchLightRadius = 150;
          this.torchScale = 0.75;
          this.torchOriginY = 0.75;
        }

        this.torchLightRadius = Math.min(this.torchLightRadius + (20 * totalStokes), this.maxLightRadius);
        this.torchLight.setRadius(this.torchLightRadius);
        this.torchScale = Math.min(this.torchScale + (0.1 * totalStokes), this.maxTorchScale);
        this.torchOriginY = Math.min(this.torchOriginY + (0.01 * totalStokes), this.maxTorchOriginY);
        
        if (!this.isTorchLit) {
          this.isTorchLit = true;
          this.torch.setTexture('campfire').play('campfireBurn');
          console.log("Torch lit successfully!");
        }

        // Always use original position
        this.torch.setPosition(this.torch.x, this.torch.y);
        this.torch.setScale(this.torchScale).setOrigin(0.5, this.torchOriginY);

        this.updateTorchBurnMeter();
        console.log(`Stoked torch with ${quantity} ${item.name}! Stokes: ${this.torchCurrentStokes}, Burn time: ${this.torchBurnTime}s`);

        // Update torch state in registry
        this.registry.set('torchState', {
          isTorchLit: this.isTorchLit,
          torchBurnTime: this.torchBurnTime,
          torchCurrentStokes: this.torchCurrentStokes,
          torchLightRadius: this.torchLightRadius,
          torchScale: this.torchScale,
          torchOriginY: this.torchOriginY
        });
      }
    } else {
      console.log("Max stokes reached for torch!");
    }
  }

  findStokeItems() {
    return this.inventory.filter(item => {
      const name = item.name.toLowerCase();
      return (name.includes("wood") || name.includes("stick") || name === "lint" || name === "trash") && item.quantity > 0;
    });
  }

  showStokingMenu(target) {
    this.stokingItems = this.findStokeItems();
    if (this.stokingItems.length === 0) {
      console.log(`No stoking items in inventory for ${target}!`);
      this.showDialog(`No items to stoke ${target}`, [{ text: 'OK', callback: () => {} }]);
      return;
    }

    this.stokingDialogVisible = true;
    this.stokingTarget = target;
    this.selectedItemIndex = 0;
    this.quantityInputVisible = false;
    this.selectedQuantity = 1;

    this.stokingDialogBox = this.add.rectangle(288, 288, 200, 150, 0x000000, 0.9).setDepth(5);
    this.stokingDialogBox.setStrokeStyle(2, 0xffffff, 1);

    this.stokingDialogTitle = this.add.text(288, 230, `Select Item to Stoke ${target}`, { fontSize: '16px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(6);

    this.stokingDialogTextItems = [];
    this.stokingItems.forEach((item, index) => {
      const text = this.add.text(288, 260 + index * 20, `${item.name} (x${item.quantity})`, { fontSize: '14px', color: '#ffffff' })
        .setOrigin(0.5)
        .setDepth(6);
      
      // Make text interactive
      text.setInteractive({ useHandCursor: true });
      text.on('pointerdown', () => {
        this.selectedItemIndex = index;
        this.showQuantityInput();
      });
      
      this.stokingDialogTextItems.push(text);
    });

    // Add a cancel option
    const cancelText = this.add.text(288, 260 + this.stokingItems.length * 20, 'Cancel', { fontSize: '14px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(6);
    cancelText.setInteractive({ useHandCursor: true });
    cancelText.on('pointerdown', () => {
      this.closeStokingDialog();
    });
    this.stokingDialogTextItems.push(cancelText);

    this.updateStokingDialogSelection();
  }

  updateStokingDialogSelection() {
    this.stokingDialogTextItems.forEach((text, index) => {
      text.setColor(index === this.selectedItemIndex ? '#ffff00' : '#ffffff');
    });
  }

  showQuantityInput() {
    this.quantityInputVisible = true;
    const selectedItem = this.stokingItems[this.selectedItemIndex];
    const maxQty = selectedItem.quantity;
    this.selectedQuantity = 1;

    this.stokingDialogTextItems.forEach(text => text.destroy());
    this.stokingDialogTextItems = [];

    const text = this.add.text(288, 260, `How many ${selectedItem.name} to use?`, { fontSize: '14px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(6);
    this.stokingDialogTextItems.push(text);

    this.quantityInputText = this.add.text(288, 280, `Quantity: ${this.selectedQuantity} (Max: ${maxQty})`, { fontSize: '14px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(6);
    this.stokingDialogTextItems.push(this.quantityInputText);

    // Add confirm and cancel buttons
    const confirmText = this.add.text(288, 310, 'Confirm', { fontSize: '14px', color: '#00ff00' })
      .setOrigin(0.5)
      .setDepth(6);
    confirmText.setInteractive({ useHandCursor: true });
    confirmText.on('pointerdown', () => {
      this.useStokingItem();
    });
    this.stokingDialogTextItems.push(confirmText);

    const cancelText = this.add.text(288, 330, 'Cancel', { fontSize: '14px', color: '#ff0000' })
      .setOrigin(0.5)
      .setDepth(6);
    cancelText.setInteractive({ useHandCursor: true });
    cancelText.on('pointerdown', () => {
      this.closeStokingDialog();
    });
    this.stokingDialogTextItems.push(cancelText);

    // Add increment/decrement buttons
    const decText = this.add.text(250, 280, '-', { fontSize: '16px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(6);
    decText.setInteractive({ useHandCursor: true });
    decText.on('pointerdown', () => {
      if (this.selectedQuantity > 1) {
        this.selectedQuantity--;
        this.updateQuantityInput(maxQty);
      }
    });
    this.stokingDialogTextItems.push(decText);

    const incText = this.add.text(326, 280, '+', { fontSize: '16px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(6);
    incText.setInteractive({ useHandCursor: true });
    incText.on('pointerdown', () => {
      if (this.selectedQuantity < maxQty) {
        this.selectedQuantity++;
        this.updateQuantityInput(maxQty);
      }
    });
    this.stokingDialogTextItems.push(incText);
  }

  updateQuantityInput(maxQty) {
    this.quantityInputText.setText(`Quantity: ${this.selectedQuantity} (Max: ${maxQty})`);
  }

  useStokingItem() {
    const selectedItem = this.stokingItems[this.selectedItemIndex];
    const quantity = this.selectedQuantity;

    if (this.stokingTarget === 'campfire') {
      this.stokeFire(selectedItem, quantity);
    } else if (this.stokingTarget === 'torch') {
      this.stokeTorch(selectedItem, quantity);
    }

    this.closeStokingDialog();
  }

  closeStokingDialog() {
    this.stokingDialogVisible = false;
    if (this.stokingDialogBox) this.stokingDialogBox.destroy();
    if (this.stokingDialogTitle) this.stokingDialogTitle.destroy();
    this.stokingDialogTextItems.forEach(text => text.destroy());
    this.stokingDialogTextItems = [];
    this.stokingItems = [];
    this.stokingTarget = null;
    this.quantityInputVisible = false;
    this.selectedItemIndex = 0;
    this.selectedQuantity = 1;
    if (this.quantityInputText) {
      this.quantityInputText.destroy();
      this.quantityInputText = null;
    }
  }

  updateBurnMeter() {
    this.burnMeter.clear();
    const meterX = this.campfire.x + 40;
    const meterY = this.campfire.y - 20;
    const meterWidth = 50;
    const meterHeight = 10;
    const maxBurnTime = this.maxStokes * 30;
    const remainingPercent = this.burnTime / maxBurnTime;

    this.burnMeter.fillStyle(0x000000, 0.7).fillRect(meterX, meterY, meterWidth, meterHeight);
    this.burnMeter.fillStyle(0xffaa33, 1).fillRect(meterX, meterY, meterWidth * remainingPercent, meterHeight);
    this.burnMeter.setDepth(4);
  }

  updateTorchBurnMeter() {
    this.torchBurnMeter.clear();
    const meterX = this.torch.x + 40;
    const meterY = this.torch.y - 20;
    const meterWidth = 50;
    const meterHeight = 10;
    const maxBurnTime = this.maxStokes * 30;
    const remainingPercent = this.torchBurnTime / maxBurnTime;

    this.torchBurnMeter.fillStyle(0x000000, 0.7).fillRect(meterX, meterY, meterWidth, meterHeight);
    this.torchBurnMeter.fillStyle(0xffaa33, 1).fillRect(meterX, meterY, meterWidth * remainingPercent, meterHeight);
    this.torchBurnMeter.setDepth(4);
  }

  startBurnTimer() {
    if (this.timerEvent) this.timerEvent.remove();
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.burnTime > 0) {
          this.burnTime--;
          this.updateBurnMeter();
          if (this.burnTime <= 0) this.extinguishFire();
        }
        if (this.torch && this.torchBurnTime > 0) {
          this.torchBurnTime--;
          this.updateTorchBurnMeter();
          if (this.torchBurnTime <= 0) this.extinguishTorch();
        }
      },
      loop: true
    });
  }

  extinguishFire() {
    this.lightRadius = 0;
    this.campfireLight.setRadius(this.lightRadius);
    this.campfireScale = 0.5;
    this.campfire.setScale(this.campfireScale);
    this.isFireLit = false;
    this.campfire.anims.stop().setTexture('smoke').play('smokeRise');
    if (this.isCooking && !this.cookingComplete) {
      this.isCooking = false;
      if (this.cookingTimer) this.cookingTimer.remove();
      if (this.skillet) this.skillet.destroy();
      if (this.progressBar) this.progressBar.destroy();
      if (this.claimText) this.claimText.destroy();
      this.cookingComplete = false;
      this.cookedFoodItem = null;
      console.log("Cooking stopped: Fire is out!");

      // Update cooking state in registry
      this.registry.set('cookingState', {
        isCooking: false,
        cookingTime: 0,
        cookingComplete: false,
        cookedFoodItem: null,
        cookingStartTime: 0
      });
    }
    console.log("Fire extinguished!");

    // Update fire state in registry
    this.registry.set('fireState', {
      isFireLit: false,
      burnTime: 0,
      currentStokes: 0,
      lightRadius: 0,
      campfireScale: this.campfireScale,
      campfireOriginY: this.campfireOriginY
    });
  }

  extinguishTorch() {
    this.torchLightRadius = 0;
    this.torchLight.setRadius(this.torchLightRadius);
    this.torchScale = 0.25;
    this.torch.setScale(this.torchScale);
    this.isTorchLit = false;
    this.torch.anims.stop().setTexture('smoke').play('smokeRise');
    console.log("Torch extinguished!");

    // Update torch state in registry
    this.registry.set('torchState', {
      isTorchLit: false,
      torchBurnTime: 0,
      torchCurrentStokes: 0,
      torchLightRadius: 0,
      torchScale: this.torchScale,
      torchOriginY: this.torchOriginY
    });
  }

  returnToMainScene() {
    if (this.timerEvent) this.timerEvent.remove();
    if (this.cookingTimer) this.cookingTimer.remove();

    // Update registry with current states before leaving
    this.registry.set('cookingState', {
      isCooking: this.isCooking,
      cookingTime: this.cookingTime,
      cookingComplete: this.cookingComplete,
      cookedFoodItem: this.cookedFoodItem,
      cookingStartTime: this.cookingStartTime
    });

    this.registry.set('fireState', {
      isFireLit: this.isFireLit,
      burnTime: this.burnTime,
      currentStokes: this.currentStokes,
      lightRadius: this.lightRadius,
      campfireScale: this.campfireScale,
      campfireOriginY: this.campfireOriginY
    });

    this.registry.set('torchState', {
      isTorchLit: this.isTorchLit,
      torchBurnTime: this.torchBurnTime,
      torchCurrentStokes: this.torchCurrentStokes,
      torchLightRadius: this.torchLightRadius,
      torchScale: this.torchScale,
      torchOriginY: this.torchOriginY
    });

    const mainScene = this.scene.get('MainGameScene');
    this.scene.start('MainGameScene', {
      zone: this.zone,
      inventory: this.inventory,
      promptCount: mainScene.promptCount
    });
  }

  handleFireClick() {
    console.log("Fire clicked! isFireLit:", this.isFireLit, "isCooking:", this.isCooking, "cookingComplete:", this.cookingComplete);
    
    if (this.isFireLit) {
      if (!this.isCooking) {
        // Check for cookable items in inventory
        const cookableItems = this.inventory.filter(item => {
          const name = item.name.toLowerCase();
          return name.includes('cod') || 
                 name.includes('fish') ||
                 name.includes('meat') ||
                 name.includes('food') ||
                 name.includes('raw');
        });

        console.log("Cookable items found:", cookableItems);

        if (cookableItems.length > 0) {
          this.cookableItems = cookableItems; // Store the cookable items
          const options = cookableItems.map(item => ({
            text: `${item.name} (${item.quantity})`,
            callback: () => {
              this.startCooking(item);
            }
          }));
          options.push({ text: 'Cancel', callback: () => {} });

          this.showDialog('What would you like to cook?', options);
        } else {
          this.showDialog('You have no food items to cook.', [{ text: 'OK', callback: () => {} }]);
        }
      } else if (this.cookingComplete) {
        this.claimCookedFood();
      } else {
        this.showDialog('You are already cooking something.', [{ text: 'OK', callback: () => {} }]);
      }
    } else {
      // If fire is not lit, show stoke menu instead
      console.log("Fire not lit, showing stoke menu");
      this.showStokingMenu('campfire');
    }
  }

  showDialog(title, options) {
    this.dialogVisible = true;
    this.selectedItemIndex = 0;

    // Store options with callbacks
    this.dialogOptions = options;

    this.dialogBox = this.add.rectangle(288, 288, 200, 150, 0x000000, 0.9).setDepth(5);
    this.dialogBox.setStrokeStyle(2, 0xffffff, 1);

    this.dialogTitle = this.add.text(288, 230, title, { fontSize: '16px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(6);

    this.dialogTextItems = [];
    options.forEach((option, index) => {
      const text = this.add.text(288, 260 + index * 20, option.text, { fontSize: '14px', color: '#ffffff' })
        .setOrigin(0.5)
        .setDepth(6);
      
      // Make text interactive
      text.setInteractive({ useHandCursor: true });
      text.on('pointerdown', () => {
        this.selectedItemIndex = index;
        this.selectDialogOption();
      });
      
      this.dialogTextItems.push(text);
    });

    this.updateDialogSelection();
  }

  selectDialogOption() {
    if (this.dialogOptions && this.dialogOptions[this.selectedItemIndex]) {
      const callback = this.dialogOptions[this.selectedItemIndex].callback;
      this.closeDialog();
      if (callback) callback();
    } else {
      this.closeDialog();
    }
  }

  updateDialogSelection() {
    this.dialogTextItems.forEach((text, index) => {
      text.setColor(index === this.selectedItemIndex ? '#ffff00' : '#ffffff');
    });
  }

  closeDialog() {
    this.dialogVisible = false;
    if (this.dialogBox) this.dialogBox.destroy();
    if (this.dialogTitle) this.dialogTitle.destroy();
    this.dialogTextItems.forEach(text => text.destroy());
    this.dialogTextItems = [];
    this.cookableItems = [];
    this.dialogOptions = null;
    this.selectedItemIndex = 0;
    this.dialogTitle = null;
  }

  startCooking(foodItem) {
    console.log("Starting to cook:", foodItem.name);
    
    // Find the item in inventory and reduce quantity by 1
    const index = this.inventory.findIndex(item => item.name === foodItem.name);
    if (index === -1) {
      console.error("Item not found in inventory:", foodItem.name);
      return;
    }
    
    // Reduce quantity
    this.inventory[index].quantity--;
    if (this.inventory[index].quantity <= 0) {
      this.inventory.splice(index, 1);
    }

    this.cookingStartTime = Date.now(); // Record start time

    // Create skillet and progress bar
    this.skillet = this.add.image(this.campfire.x, this.campfire.y + 5, 'skillet').setScale(3).setDepth(2);
    this.skillet.setInteractive({ useHandCursor: true });
    this.skillet.on('pointerdown', () => {
      if (this.cookingComplete) {
        this.claimCookedFood();
      }
    });
    
    this.isCooking = true;
    this.cookingTime = 0;
    this.cookingComplete = false;
    this.cookedFoodItem = { name: 'Cooked ' + foodItem.name, quantity: 1 };

    this.progressBar = this.add.graphics().setDepth(3);
    this.updateCooking();

    this.cookingTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateCooking,
      callbackScope: this,
      loop: true
    });

    // Update cooking state in registry
    this.registry.set('cookingState', {
      isCooking: true,
      cookingTime: 0,
      cookingComplete: false,
      cookedFoodItem: this.cookedFoodItem,
      cookingStartTime: this.cookingStartTime
    });
    
    console.log("Cooking started for:", this.cookedFoodItem.name);
  }

  updateCooking() {
    if (this.isCooking && this.isFireLit) {
      this.cookingTime++;
      const progress = this.cookingTime / this.cookingDuration;
      this.progressBar.clear();

      if (this.cookingTime >= this.cookingDuration) {
        this.isCooking = false;
        this.cookingComplete = true;
        this.cookingTimer.remove();
        console.log("Cooking complete! Click to claim.");

        this.progressBar.fillStyle(0x0000ff, 1);
        this.progressBar.fillRect(this.campfire.x - 25, this.campfire.y - 40, 50, 5);

        if (!this.claimText) {
          this.claimText = this.add.text(this.campfire.x, this.campfire.y - 60, 'Claim', { fontSize: '14px', color: '#ffffff' })
            .setOrigin(0.5)
            .setDepth(3);
        }

        // Update cooking state in registry
        this.registry.set('cookingState', {
          isCooking: false,
          cookingTime: this.cookingTime,
          cookingComplete: true,
          cookedFoodItem: this.cookedFoodItem,
          cookingStartTime: this.cookingStartTime
        });
      } else {
        this.progressBar.fillStyle(0x00ff00, 1);
        this.progressBar.fillRect(this.campfire.x - 25, this.campfire.y - 40, 50 * progress, 5);
      }
    }
  }

  claimCookedFood() {
    if (this.cookingComplete) {
      console.log("Claiming cooked food:", this.cookedFoodItem);
      
      // Add cooked food to inventory
      this.inventory.push(this.cookedFoodItem);
      
      // Clean up cooking UI
      if (this.skillet) this.skillet.destroy();
      if (this.progressBar) this.progressBar.destroy();
      if (this.claimText) this.claimText.destroy();
      
      // Reset cooking state
      this.cookingComplete = false;
      this.cookedFoodItem = null;
      
      console.log("Updated inventory:", this.inventory);

      // Update cooking state in registry
      this.registry.set('cookingState', {
        isCooking: false,
        cookingTime: 0,
        cookingComplete: false,
        cookedFoodItem: null,
        cookingStartTime: 0
      });
      
      // Show confirmation dialog
      this.showDialog('Food claimed and added to inventory!', [{ text: 'OK', callback: () => {} }]);
    }
  }
}