class ArtisanAlleyScene extends Phaser.Scene {
  constructor() {
    super('ArtisanAlleyScene');
    this.player = null;
    this.background = null;
    this.foreground = null;
    this.dialogBg = null;
    this.dialogText = null;
    this.buttons = [];
    this.shopkeeper = null;
    this.interactionObjects = null;
    this.returnZone = null;
    this.playerStats = null;
    this.localInventory = null;
    this.hudText = null;
    this.oromoziBalance = 0;
    this.shopItems = [];
    this.creationStations = [];
    this.stationTypes = [
      { name: 'character_studio', label: 'Character Studio' },
      { name: 'fashion_studio', label: 'Fashion Studio' },
      { name: 'design_studio', label: 'Design Studio' },
      { name: 'music_studio', label: 'Music Studio' }
    ];
    this.currentScreen = 'none';
    this.creationMaterials = {
      cloth: { name: 'Cloth', cost: 25, quantity: 0 },
      dye: { name: 'Dye', cost: 15, quantity: 0 },
      wood: { name: 'Wood', cost: 20, quantity: 0 },
      metal: { name: 'Metal', cost: 30, quantity: 0 },
      gems: { name: 'Gems', cost: 50, quantity: 0 },
      leather: { name: 'Leather', cost: 35, quantity: 0 }
    };
    this.cosmeticItems = [
      { name: 'Character Skin', type: 'character', cost: 150, description: 'A new skin for your character' },
      { name: 'Fashion Item', type: 'fashion', cost: 120, description: 'Stylish clothing for your character' },
      { name: 'Furniture Piece', type: 'design', cost: 200, description: 'Decorative item for your virtual space' },
      { name: 'Music Track', type: 'music', cost: 100, description: 'A custom 8-bit tune for your gatherings' }
    ];
    this.selectedItem = null;
    this.customizationOptions = {
      characterSkins: ['default', 'warrior', 'mage', 'rogue', 'ranger', 'noble'],
      fashionStyles: ['casual', 'formal', 'fantasy', 'futuristic', 'vintage', 'cultural'],
      designThemes: ['rustic', 'modern', 'fantasy', 'natural', 'luxurious', 'minimalist'],
      musicGenres: ['upbeat', 'mysterious', 'epic', 'peaceful', 'adventurous', 'romantic'],
      colors: ['red', 'blue', 'green', 'purple', 'yellow', 'black', 'white'],
      patterns: ['solid', 'striped', 'checkered', 'dotted'],
      materials: ['wood', 'metal', 'glass', 'stone'],
      notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    };
    this.debugCollision = true; // Enable collision debugging by default for testing
    this.contextMenuItems = []; // Add property to store context menu items
  }

  init(data) {
    this.returnZone = data.zone || 'Village';
    this.playerStats = data.playerStats || { oromozi: 1000 };
    this.localInventory = data.inventory || [];
    this.oromoziBalance = this.playerStats.oromozi;
  }

  preload() {
    this.load.image('artisanAlley', 'assets/backgrounds/artisanAlley.png');
    this.load.image('artisanAlleyForeground', 'assets/foregrounds/artisanAlleyForeground.png');
    this.load.image('artisanAlleyCollisions', 'assets/collisionlayer/artisanAlleycollisions.png', { cache: false });
    this.load.json('artisanAlleyMap', 'assets/maps/artisanAlley.json');
    this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('shopkeeper', 'assets/sprites/shopkeeper.png', { frameWidth: 48, frameHeight: 48 });
  }

  create() {
    // Set up the scene
    this.background = this.add.image(0, 0, 'artisanAlley').setOrigin(0, 0).setScale(0.3);
    const bgWidth = this.background.displayWidth;
    const bgHeight = this.background.displayHeight;
    
    // Initialize audio context
    this.initAudio();
    
    this.physics.world.setBounds(0, 0, bgWidth, bgHeight);
    this.cameras.main.setBounds(0, 0, bgWidth, bgHeight);
 
    // Add debug text for collision information
    this.debugText = this.add.text(10, 30, '', { font: '12px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 }).setScrollFactor(0).setDepth(12000);
    
    // Add persistent coordinate display (always visible)
    this.coordDisplay = this.add.text(10, 10, 'Coordinates: (0, 0)', { 
      font: '12px Arial', 
      fill: '#ffff00', 
      stroke: '#000000', 
      strokeThickness: 2 
    }).setScrollFactor(0).setDepth(12001);
  
    // Store temporary markers
    this.positionMarkers = [];
    this.markerCount = 0;
  
    // Create collision objects group
    this.obstacles = this.physics.add.staticGroup();
    this.interactionObjects = this.physics.add.staticGroup();
    
    // Add collision layer
    this.collisionImage = this.add.image(0, 0, 'artisanAlleyCollisions').setOrigin(0, 0).setScale(0.3).setAlpha(0);
          
    // Load the collision bitmap from the collision image
    this.collisionBitmap = this.textures.get('artisanAlleyCollisions').getSourceImage();
    
    // Create custom interaction points for each building
    this.createInteractionPoints();
    
    // Add player character at a safe starting position (center bottom area)
    this.player = this.physics.add.sprite(bgWidth/2, bgHeight - 100, 'player').setScale(2.5 * 0.5);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(100);
    this.player.body.setSize(16, 72).setOffset(16, -12);
    
    // Create animations
    this.anims.create({ key: 'walk-down', frames: this.anims.generateFrameNumbers('player', { start: 18, end: 20 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'walk-left', frames: this.anims.generateFrameNumbers('player', { start: 24, end: 26 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'walk-right', frames: this.anims.generateFrameNumbers('player', { start: 6, end: 8 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'walk-up', frames: this.anims.generateFrameNumbers('player', { start: 12, end: 14 }), frameRate: 10, repeat: -1 });
    this.player.anims.play('walk-down', true);
    
    // Add foreground
    this.foreground = this.add.image(0, 0, 'artisanAlleyForeground').setOrigin(0, 0).setScale(0.3).setDepth(200);
    
    // Set up camera
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(2);
    
    // Create UI elements
    this.hudText = this.add.text(10, 560, `OROMOZI: ${this.oromoziBalance}`, { font: '16px Arial', fill: '#ffffff' }).setScrollFactor(0).setDepth(1000);
    this.dialogBg = this.add.graphics().setDepth(1600).setVisible(false);
    this.dialogText = this.add.text(0, 0, '', { font: '12px Arial', fill: '#ffffff', wordWrap: { width: 200 } }).setDepth(1601).setVisible(false);
    
    // Add keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      cancel: Phaser.Input.Keyboard.KeyCodes.ESC,
      debug: Phaser.Input.Keyboard.KeyCodes.F9,
      mark: Phaser.Input.Keyboard.KeyCodes.M
    });
    
    // Debug collision toggle
    this.input.keyboard.on('keydown-F9', () => {
      this.debugCollision = !this.debugCollision;
      
      // Show/hide the collision layer
      this.collisionImage.setAlpha(this.debugCollision ? 0.5 : 0);
      
      // Update interaction zone visualization
      this.interactionObjects.getChildren().forEach(obj => {
        if (this.debugCollision) {
          obj.setFillStyle(0x00ff00, 0.2);
          obj.setStrokeStyle(2, 0x00ff00, 0.8);
        } else {
          obj.setFillStyle(0x00ff00, 0);
          obj.setStrokeStyle(0);
        }
      });
    });
    
    // Add keyboard listener for interaction
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.currentScreen === 'none') {
        // Check if player is near any crafting station
        this.checkCraftingStationInteraction();
      } else {
        // Handle UI interaction based on current screen
        this.handleUIInteraction();
      }
    });
    
    // Set up return to village on ESC key
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.currentScreen !== 'none') {
        this.closeCurrentScreen();
      } else {
        this.returnToVillage();
      }
    });
    
    // Add marker placement on M key
    this.input.keyboard.on('keydown-M', () => {
      this.placeMarkerAtPlayerPosition();
    });
    
    console.log("ArtisanAlleyScene created successfully");
  }
  
  // Method to create custom interaction points for each building
  createInteractionPoints() {
    // Custom positions for each station (manually positioned on buildings)
    const interactionPoints = [
      { name: 'music_studio', x: 22, y: 205, width: 49, height: 49, label: 'Music Studio', color: 0x9370DB }, // Purple for music
      { name: 'fashion_studio', x: 58, y: 108, width: 49, height: 49, label: 'Fashion Studio', color: 0xFF69B4 }, // Pink for fashion
      { name: 'design_studio', x: 208, y: 98, width: 49, height: 49, label: 'Design Studio', color: 0x8B4513 }, // Brown for furniture
      { name: 'character_studio', x: 236, y: 206, width: 49, height: 49, label: 'Character Studio', color: 0x32CD32 }, // Green for character
      { name: 'return_to_village', x: 124, y: 18, width: 49, height: 49, label: 'Return to Village', color: 0x4169E1 } // Blue for return
    ];
    
    // Create each interaction zone
    interactionPoints.forEach(point => {
      console.log(`Creating interaction zone for ${point.name} at (${point.x}, ${point.y})`);
      
      // Create the interaction zone
      const zone = this.add.rectangle(point.x, point.y, point.width, point.height, point.color, 0);
      zone.setOrigin(0, 0);
      zone.name = point.name;
      this.physics.add.existing(zone, true);
      zone.setInteractive();
      zone.on("pointerdown", () => this.handleStationInteraction(point.name));
      this.interactionObjects.add(zone);
      
      // Apply debug visualization with custom color
      if (this.debugCollision) {
        zone.setFillStyle(point.color, 0.2);
        zone.setStrokeStyle(2, point.color, 0.8);
      }
      
      // Add visual indicator text with custom colors
      const label = point.label;
      const indicator = this.add.text(point.x + point.width/2, point.y - 10, label, { 
        font: '12px Arial',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5).setDepth(101);
      
      // Add a custom icon based on station type
      let iconText = '⚙️'; // Default gear icon
      
      switch(point.name) {
        case 'music_studio':
          iconText = '♪';
          break;
        case 'fashion_studio':
          iconText = '👕';
          break;
        case 'design_studio':
          iconText = '🪑';
          break;
        case 'character_studio':
          iconText = '👤';
          break;
        case 'return_to_village':
          iconText = '↩️';
          break;
      }
      
      // Create a circular background for the icon
      const markerBg = this.add.circle(
        point.x + point.width/2, 
        point.y + point.height/2, 
        15, 
        point.color, 
        0.7
      );
      markerBg.setDepth(99);
      
      // Add the icon text
      const markerIcon = this.add.text(
        point.x + point.width/2, 
        point.y + point.height/2, 
        iconText, 
        { 
          font: '14px Arial',
          fill: '#ffffff',
        }
      ).setOrigin(0.5).setDepth(100);
      
      // Add pulse animation to make interaction points more noticeable
      this.tweens.add({
        targets: markerBg,
        alpha: { from: 0.7, to: 0.4 },
        scale: { from: 1, to: 1.2 },
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    });
  }
  
  // Helper method to get station label
  getStationLabel(stationName) {
    if (stationName === 'character_studio') return 'Character Studio';
    if (stationName === 'fashion_studio') return 'Fashion Studio';
    if (stationName === 'design_studio') return 'Design Studio'; 
    if (stationName === 'music_studio') return 'Music Studio';
    if (stationName === 'return_to_village') return 'Return to Village';
    return stationName;
  }
  
  // Handle station interaction
  handleStationInteraction(stationName) {
    console.log("Interacting with station:", stationName);
    
    if (stationName === 'return_to_village') {
      this.returnToVillage();
      return;
    }
    
    // Directly open the specific editor based on station name
    switch(stationName) {
      case 'music_studio':
        // Open the Music Studio DAW directly
        this.createMusicTrack('upbeat'); // Default to upbeat genre, user can change
        break;
      
      case 'character_studio':
        // Open the Character Sprite Editor directly
        this.characterStudioEditor('default'); // Default character type, user can modify
        break;
      
      case 'fashion_studio':
        // Open the Fashion Studio directly
        // First choose style, user will then pick color
        this.showDialog(`Choose a fashion style:`);
        const fashionOptions = this.customizationOptions.fashionStyles.map(style => ({
          label: `${style}`,
          callback: () => this.chooseFashionColor(style)
        }));
        this.createButtons(fashionOptions);
        break;
      
      case 'design_studio':
        // Open the enhanced Design Studio with object type selection
        this.openDesignStudioTypeSelection();
        break;
      
      default:
        // Fallback to the old menu if somehow we get an unknown station
        const station = this.stationTypes.find(s => s.name === stationName);
        if (station) {
          this.openCraftingStation(station);
        }
        break;
    }
  }
  
  checkCraftingStationInteraction() {
    let nearbyStation = null;
    const playerX = this.player.x;
    const playerY = this.player.y;
    
    // Check interaction with objects from the map
    this.interactionObjects.getChildren().forEach(obj => {
      const objBounds = obj.getBounds();
      const playerBounds = this.player.getBounds();
      
      if (Phaser.Geom.Intersects.RectangleToRectangle(objBounds, playerBounds)) {
        nearbyStation = obj.name;
      }
    });
    
    if (nearbyStation) {
      // Directly call handleStationInteraction to open the appropriate editor
      this.handleStationInteraction(nearbyStation);
    }
  }
  
  openCraftingStation(station) {
    this.currentScreen = station.name;
    
    // Show dialog with station options
    this.showDialog(`${station.label}\nWhat would you like to do?`);
    
    // Create buttons for station options
    const options = [
      { label: 'Browse Items', callback: () => this.showStationItems(station) },
      { label: 'Create Custom Item', callback: () => this.showCustomCreation(station) },
      { label: 'Buy Materials', callback: () => this.showMaterialsShop(station) },
      { label: 'Exit', callback: () => this.closeCurrentScreen() }
    ];
    
    this.createButtons(options);
  }
  
  showStationItems(station) {
    // Filter items based on station type
    const stationType = station.name.split('_')[0];
    const filteredItems = this.cosmeticItems.filter(item => item.type === stationType);
    
    if (filteredItems.length === 0) {
      this.showDialog('No items available for this station yet.');
      this.createButtons([
        { label: 'Back', callback: () => this.openCraftingStation(station) }
      ]);
      return;
    }
    
    this.showDialog(`${station.label} - Available Items:`);
    
    const options = filteredItems.map(item => ({
      label: `${item.name} (${item.cost} Oromozi)`,
      callback: () => this.selectItem(item, station)
    }));
    
    options.push({ label: 'Back', callback: () => this.openCraftingStation(station) });
    
    this.createButtons(options);
  }
  
  selectItem(item, station) {
    this.selectedItem = item;
    
    this.showDialog(`${item.name}\n${item.description}\nCost: ${item.cost} Oromozi\n\nWould you like to purchase this item?`);
    
    const options = [
      { label: 'Yes', callback: () => this.purchaseItem(item) },
      { label: 'No', callback: () => this.showStationItems(station) }
    ];
    
    this.createButtons(options);
  }
  
  purchaseItem(item) {
    if (this.oromoziBalance >= item.cost) {
      this.oromoziBalance -= item.cost;
      this.playerStats.oromozi = this.oromoziBalance;
      this.updateHUD();
      
      // Add item to inventory
      this.addToInventory(item.name, 1);
      
      this.showDialog(`You purchased ${item.name}!\nIt has been added to your inventory.`);
      this.createButtons([
        { label: 'OK', callback: () => this.closeCurrentScreen() }
      ]);
    } else {
      this.showDialog('You do not have enough Oromozi for this purchase.');
      this.createButtons([
        { label: 'OK', callback: () => this.closeCurrentScreen() }
      ]);
    }
  }
  
  showCustomCreation(station) {
    const stationType = station.name.split('_')[0];
    
    // Define materials needed based on station type
    let requiredMaterials = [];
    switch(stationType) {
      case 'character':
        requiredMaterials = ['cloth', 'dye'];
        break;
      case 'fashion':
        requiredMaterials = ['cloth', 'dye', 'gems'];
        break;
      case 'design':
        requiredMaterials = ['wood', 'metal'];
        break;
      case 'music':
        requiredMaterials = []; // Music doesn't require materials
        break;
    }
    
    // Check if player has required materials
    const hasMaterials = requiredMaterials.every(material => 
      this.localInventory.some(item => item.name.toLowerCase() === material && item.quantity > 0)
    );
    
    if (requiredMaterials.length > 0 && !hasMaterials) {
      this.showDialog(`You need ${requiredMaterials.join(' and ')} to create a custom item.\nVisit the materials shop to purchase these.`);
      this.createButtons([
        { label: 'Shop for Materials', callback: () => this.showMaterialsShop(station) },
        { label: 'Back', callback: () => this.openCraftingStation(station) }
      ]);
      return;
    }
    
    // Show customization options
    this.showDialog(`Create a custom ${station.label} item:`);
    
    let options = [];
    
    switch(stationType) {
      case 'character':
        options = this.customizationOptions.characterSkins.map(skin => ({
          label: `${skin} character skin`,
          callback: () => this.characterStudioEditor(skin)
        }));
        break;
      case 'fashion':
        // First choose style, then color in a separate step
        options = this.customizationOptions.fashionStyles.map(style => ({
          label: `${style} fashion style`,
          callback: () => this.chooseFashionColor(style)
        }));
        break;
      case 'design':
        // First choose theme, then material in a separate step
        options = this.customizationOptions.designThemes.map(theme => ({
          label: `${theme} design theme`,
          callback: () => this.chooseDesignMaterial(theme)
        }));
        break;
      case 'music':
        options = this.customizationOptions.musicGenres.map(genre => ({
          label: `${genre} music track`,
          callback: () => this.createMusicTrack(genre)
        }));
        // Add option for custom melody editor
        options.push({
          label: 'Create custom melody',
          callback: () => this.openMusicEditor()
        });
        break;
    }
    
    options.push({ label: 'Back', callback: () => this.openCraftingStation(station) });
    this.createButtons(options);
  }
  
  characterStudioEditor(skinBase) {
    // Initialize the character sprite editor
    this.currentScreen = 'character_editor';
    
    // Create a larger dialog for the character editor
    const boxW = 450, boxH = 350;
    const boxX = (this.game.config.width - boxW) / 2;
    const boxY = (this.game.config.height - boxH) / 2;
    
    // Clear previous dialog
    this.dialogBg.clear();
    this.dialogBg.fillStyle(0x000000, 0.8);
    this.dialogBg.fillRect(boxX, boxY, boxW, boxH);
    this.dialogBg.setVisible(true);
    
    // Add title
    const title = this.add.text(boxX + boxW/2, boxY + 15, `${skinBase.toUpperCase()} CHARACTER EDITOR`, 
      { font: '16px Arial', fill: '#ffffff', align: 'center' }
    ).setOrigin(0.5).setDepth(1601).setScrollFactor(0);
    this.buttons.push(title);
    
    // Create character preview area
    const previewAreaWidth = 200;
    const previewAreaHeight = 200;
    const previewX = boxX + 30;
    const previewY = boxY + 50;
    
    // Add preview background
    const previewBg = this.add.rectangle(previewX, previewY, previewAreaWidth, previewAreaHeight, 0x333333)
      .setOrigin(0, 0).setDepth(1601).setScrollFactor(0);
    this.buttons.push(previewBg);
    
    // Create character sprite (8x8 grid of pixels, scaled up)
    const gridSize = 8;
    const pixelSize = previewAreaWidth / gridSize;
    
    // Character pixel data array (8x8 grid)
    const characterPixels = [];
    
    // Initial character data based on selected skin
    const characterData = this.getBaseCharacterData(skinBase);
    
    // Create character preview by drawing pixels
    for (let y = 0; y < gridSize; y++) {
      characterPixels[y] = [];
      for (let x = 0; x < gridSize; x++) {
        const pixelColor = characterData[y][x];
        const pixel = this.add.rectangle(
          previewX + x * pixelSize, 
          previewY + y * pixelSize, 
          pixelSize - 1, 
          pixelSize - 1, 
          pixelColor
        ).setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
        
        characterPixels[y][x] = {
          graphic: pixel,
          color: pixelColor
        };
      }
    }
    
    // Add grid lines for better visibility
    for (let i = 0; i <= gridSize; i++) {
      // Horizontal lines
      const hLine = this.add.line(
        previewX, 
        previewY + i * pixelSize, 
        0, 
        0, 
        previewAreaWidth, 
        0, 
        0x555555
      ).setOrigin(0, 0).setDepth(1603).setScrollFactor(0);
      
      // Vertical lines
      const vLine = this.add.line(
        previewX + i * pixelSize, 
        previewY, 
        0, 
        0, 
        0, 
        previewAreaHeight, 
        0x555555
      ).setOrigin(0, 0).setDepth(1603).setScrollFactor(0);
      
      this.buttons.push(hLine, vLine);
    }
    
    // Create color palette
    const colors = [
      0xFFFFFF, // White
      0x000000, // Black
      0xFF0000, // Red
      0x00FF00, // Green
      0x0000FF, // Blue
      0xFFFF00, // Yellow
      0xFF00FF, // Magenta
      0x00FFFF, // Cyan
      0xFFA500, // Orange
      0x800080, // Purple
      0x8B4513, // Brown
      0xADD8E6, // Light Blue
      0xFFC0CB, // Pink
      0x808080, // Gray
      0xFFD700, // Gold
      0xC0C0C0  // Silver
    ];
    
    let selectedColorIndex = 0;
    const colorButtons = [];
    
    const colorSize = 20;
    const colorMargin = 5;
    const colorsPerRow = 8;
    const colorStartX = boxX + 250;
    const colorStartY = boxY + 50;
    
    colors.forEach((color, index) => {
      const row = Math.floor(index / colorsPerRow);
      const col = index % colorsPerRow;
      
      const colorButton = this.add.rectangle(
        colorStartX + col * (colorSize + colorMargin), 
        colorStartY + row * (colorSize + colorMargin), 
        colorSize, 
        colorSize, 
        color
      ).setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
      
      // Add selection indicator
      const indicator = this.add.rectangle(
        colorStartX + col * (colorSize + colorMargin) - 2, 
        colorStartY + row * (colorSize + colorMargin) - 2, 
        colorSize + 4, 
        colorSize + 4, 
        0xFFFFFF, 
        index === selectedColorIndex ? 1 : 0
      ).setOrigin(0, 0).setDepth(1601).setScrollFactor(0);
      
      colorButton.setInteractive().on('pointerdown', () => {
        // Update selected color
        selectedColorIndex = index;
        // Update indicators
        colorButtons.forEach((btn, i) => {
          btn.indicator.setAlpha(i === index ? 1 : 0);
        });
      });
      
      colorButtons.push({ button: colorButton, indicator });
      this.buttons.push(colorButton);
      this.buttons.push(indicator);
    });
    
    // Make character pixels clickable for editing
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const pixel = characterPixels[y][x].graphic;
        
        pixel.setInteractive().on('pointerdown', () => {
          // Change pixel color to selected color
          characterPixels[y][x].color = colors[selectedColorIndex];
          pixel.setFillStyle(colors[selectedColorIndex]);
        });
      }
    }
    
    // Add control buttons
    const buttonY = boxY + boxH - 40;
    
    // Symmetry toggle
    let symmetryEnabled = true;
    const symmetryBtn = this.add.text(boxX + 30, buttonY, 'Symmetry: ON', { font: '14px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    symmetryBtn.on('pointerdown', () => {
      symmetryEnabled = !symmetryEnabled;
      symmetryBtn.setText(`Symmetry: ${symmetryEnabled ? 'ON' : 'OFF'}`);
    });
    
    // Reset button
    const resetBtn = this.add.text(boxX + 150, buttonY, 'Reset', { font: '14px Arial', fill: '#ff9999' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    resetBtn.on('pointerdown', () => {
      // Reset to base character data
      const resetData = this.getBaseCharacterData(skinBase);
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          characterPixels[y][x].color = resetData[y][x];
          characterPixels[y][x].graphic.setFillStyle(resetData[y][x]);
        }
      }
    });
    
    // Save button
    const saveBtn = this.add.text(boxX + boxW - 200, buttonY, 'Save Character', { font: '14px Arial', fill: '#99ff99' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    saveBtn.on('pointerdown', () => {
      // Create custom character skin item
      const characterName = `Custom ${skinBase} Character`;
      
      // Remove materials from inventory
      this.removeFromInventory('cloth', 1);
      this.removeFromInventory('dye', 1);
      
      // Add to inventory
      this.addToInventory(characterName, 1);
      
      // Show completion message
      this.clearButtons();
      this.showDialog(`You created "${characterName}"!\nIt has been added to your inventory.`);
      this.createButtons([
        { label: 'OK', callback: () => this.closeCurrentScreen() }
      ]);
    });
    
    // Cancel button
    const cancelBtn = this.add.text(boxX + boxW - 80, buttonY, 'Cancel', { font: '14px Arial', fill: '#ff9999' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    cancelBtn.on('pointerdown', () => {
      this.clearButtons();
      this.showCustomCreation({ name: 'character_studio', label: 'Character Studio' });
    });
    
    this.buttons.push(symmetryBtn, resetBtn, saveBtn, cancelBtn);
    
    // Modify pixel placement to support symmetry
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const pixel = characterPixels[y][x].graphic;
        
        // Replace the previous event listener
        pixel.off('pointerdown');
        
        pixel.on('pointerdown', () => {
          // Change pixel color to selected color
          characterPixels[y][x].color = colors[selectedColorIndex];
          pixel.setFillStyle(colors[selectedColorIndex]);
          
          // If symmetry is enabled, mirror the pixel change
          if (symmetryEnabled && x !== gridSize / 2) { // Don't duplicate center column
            const mirrorX = gridSize - 1 - x;
            characterPixels[y][mirrorX].color = colors[selectedColorIndex];
            characterPixels[y][mirrorX].graphic.setFillStyle(colors[selectedColorIndex]);
          }
        });
      }
    }
  }
  
  // Returns an 8x8 pixel array representing the base character template
  getBaseCharacterData(skinType) {
    // Create an 8x8 grid with default colors
    const data = [];
    
    // Default colors based on skin type
    let headColor, bodyColor, detailColor, outlineColor;
    
    switch(skinType) {
      case 'warrior':
        headColor = 0xFFC0CB;  // Pink
        bodyColor = 0x8B4513;  // Brown
        detailColor = 0xC0C0C0; // Silver
        outlineColor = 0x000000; // Black
        break;
      case 'mage':
        headColor = 0xFFC0CB;  // Pink
        bodyColor = 0x800080;  // Purple
        detailColor = 0xFFD700; // Gold
        outlineColor = 0x000000; // Black
        break;
      case 'rogue':
        headColor = 0xFFC0CB;  // Pink
        bodyColor = 0x808080;  // Gray
        detailColor = 0x000000; // Black
        outlineColor = 0x000000; // Black
        break;
      case 'ranger':
        headColor = 0xFFC0CB;  // Pink
        bodyColor = 0x00FF00;  // Green
        detailColor = 0x8B4513; // Brown
        outlineColor = 0x000000; // Black
        break;
      case 'noble':
        headColor = 0xFFC0CB;  // Pink
        bodyColor = 0x0000FF;  // Blue
        detailColor = 0xFFD700; // Gold
        outlineColor = 0x000000; // Black
        break;
      default: // default character
        headColor = 0xFFC0CB;  // Pink
        bodyColor = 0xFF0000;  // Red
        detailColor = 0xFFFFFF; // White
        outlineColor = 0x000000; // Black
        break;
    }
    
    // Initialize with transparent pixels
    for (let y = 0; y < 8; y++) {
      data[y] = [];
      for (let x = 0; x < 8; x++) {
        data[y][x] = 0x333333; // Background color
      }
    }
    
    // Create a simple character template
    
    // Head
    data[1][3] = outlineColor;
    data[1][4] = outlineColor;
    data[2][2] = outlineColor;
    data[2][3] = headColor;
    data[2][4] = headColor;
    data[2][5] = outlineColor;
    data[3][2] = outlineColor;
    data[3][3] = headColor;
    data[3][4] = headColor;
    data[3][5] = outlineColor;
    
    // Body
    data[4][2] = outlineColor;
    data[4][3] = bodyColor;
    data[4][4] = bodyColor;
    data[4][5] = outlineColor;
    data[5][2] = outlineColor;
    data[5][3] = bodyColor;
    data[5][4] = bodyColor;
    data[5][5] = outlineColor;
    data[6][3] = outlineColor;
    data[6][4] = outlineColor;
    
    // Details based on character type
    switch(skinType) {
      case 'warrior':
        // Helmet
        data[1][3] = detailColor;
        data[1][4] = detailColor;
        // Armor
        data[4][3] = detailColor;
        data[4][4] = detailColor;
        break;
      case 'mage':
        // Hat
        data[0][3] = detailColor;
        data[0][4] = detailColor;
        // Robe details
        data[5][2] = detailColor;
        data[5][5] = detailColor;
        break;
      case 'rogue':
        // Hood
        data[1][2] = detailColor;
        data[1][5] = detailColor;
        // Cloak
        data[5][1] = detailColor;
        data[5][6] = detailColor;
        break;
      case 'ranger':
        // Hat
        data[1][2] = detailColor;
        data[1][5] = detailColor;
        // Bow
        data[4][1] = detailColor;
        data[4][6] = detailColor;
        break;
      case 'noble':
        // Crown
        data[0][3] = detailColor;
        data[0][4] = detailColor;
        // Cape
        data[5][1] = detailColor;
        data[5][6] = detailColor;
        break;
      default: // default character
        // Details
        data[3][3] = detailColor; // Eyes
        data[3][4] = detailColor;
        break;
    }
    
    return data;
  }
  
  chooseFashionColor(style) {
    this.showDialog(`Choose a color for your ${style} fashion item:`);
    
    const options = this.customizationOptions.colors.map(color => ({
      label: `${color}`,
      callback: () => this.fashionStudioEditor(style, color)
    }));
    
    options.push({ label: 'Back', callback: () => this.showCustomCreation({ name: 'fashion_studio', label: 'Fashion Studio' }) });
    this.createButtons(options);
  }
  
  fashionStudioEditor(style, color) {
    // Initialize the fashion studio costume creator
    this.currentScreen = 'fashion_editor';
    
    // Create a larger dialog for the fashion editor
    const boxW = 450, boxH = 350;
    const boxX = (this.game.config.width - boxW) / 2;
    const boxY = (this.game.config.height - boxH) / 2;
    
    // Clear previous dialog
    this.dialogBg.clear();
    this.dialogBg.fillStyle(0x000000, 0.8);
    this.dialogBg.fillRect(boxX, boxY, boxW, boxH);
    this.dialogBg.setVisible(true);
    
    // Add title
    const title = this.add.text(boxX + boxW/2, boxY + 15, `${style.toUpperCase()} ${color.toUpperCase()} COSTUME DESIGNER`, 
      { font: '16px Arial', fill: '#ffffff', align: 'center' }
    ).setOrigin(0.5).setDepth(1601).setScrollFactor(0);
    this.buttons.push(title);
    
    // Create costume preview area
    const previewAreaWidth = 200;
    const previewAreaHeight = 200;
    const previewX = boxX + 30;
    const previewY = boxY + 50;
    
    // Add preview background
    const previewBg = this.add.rectangle(previewX, previewY, previewAreaWidth, previewAreaHeight, 0x333333)
      .setOrigin(0, 0).setDepth(1601).setScrollFactor(0);
    this.buttons.push(previewBg);
    
    // Create character silhouette
    const characterSilhouette = this.add.rectangle(
      previewX + previewAreaWidth/2, 
      previewY + previewAreaHeight/2, 
      80, 
      150, 
      0x222222
    ).setOrigin(0.5, 0.5).setDepth(1602).setScrollFactor(0);
    this.buttons.push(characterSilhouette);
    
    // Add costume parts
    const costumeItems = [];
    
    // Clothing options based on style
    const clothing = this.getFashionItems(style, color);
    
    // Display the clothing items
    clothing.forEach(item => {
      // Create item graphics
      const itemGraphic = this.add.rectangle(
        previewX + previewAreaWidth/2 + item.offsetX, 
        previewY + previewAreaHeight/2 + item.offsetY, 
        item.width, 
        item.height, 
        item.color
      ).setOrigin(0.5, 0.5).setDepth(1603).setScrollFactor(0);
      
      costumeItems.push({
        graphic: itemGraphic,
        name: item.name,
        selected: true // All items start as selected
      });
      
      this.buttons.push(itemGraphic);
    });
    
    // Create item selection panel
    const panelX = boxX + 250;
    const panelY = boxY + 50;
    const panelWidth = 180;
    const panelHeight = 200;
    
    // Add panel background
    const panelBg = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x444444)
      .setOrigin(0, 0).setDepth(1601).setScrollFactor(0);
    this.buttons.push(panelBg);
    
    // Add item checkboxes
    clothing.forEach((item, index) => {
      // Create checkbox
      const checkboxSize = 15;
      const checkboxX = panelX + 10;
      const checkboxY = panelY + 20 + index * 30;
      
      const checkbox = this.add.rectangle(checkboxX, checkboxY, checkboxSize, checkboxSize, 0xFFFFFF)
        .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
      
      const checkmark = this.add.text(checkboxX + 2, checkboxY - 2, '✓', { font: '14px Arial', fill: '#000000' })
        .setDepth(1603).setScrollFactor(0);
      
      // Create label
      const label = this.add.text(checkboxX + checkboxSize + 10, checkboxY, item.name, 
        { font: '14px Arial', fill: '#ffffff' }
      ).setDepth(1602).setScrollFactor(0);
      
      // Make checkbox interactive
      checkbox.setInteractive().on('pointerdown', () => {
        // Toggle selection
        const isSelected = !costumeItems[index].selected;
        costumeItems[index].selected = isSelected;
        
        // Update visuals
        checkmark.setVisible(isSelected);
        costumeItems[index].graphic.setVisible(isSelected);
      });
      
      this.buttons.push(checkbox, checkmark, label);
    });
    
    // Pattern selection
    const patternY = panelY + 160;
    const patternLabel = this.add.text(panelX + 10, patternY, 'Pattern:', 
      { font: '14px Arial', fill: '#ffffff' }
    ).setDepth(1602).setScrollFactor(0);
    this.buttons.push(patternLabel);
    
    // Create pattern buttons
    const patterns = this.customizationOptions.patterns;
    let selectedPattern = patterns[0];
    const patternButtons = [];
    
    patterns.forEach((pattern, index) => {
      const button = this.add.text(panelX + 10 + index * 60, patternY + 25, pattern, 
        { font: '12px Arial', fill: index === 0 ? '#ffff00' : '#ffffff' }
      ).setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
      button.on('pointerdown', () => {
        // Update selected pattern
        selectedPattern = pattern;
        
        // Update button highlighting
        patternButtons.forEach((btn, i) => {
          btn.setFill(i === index ? '#ffff00' : '#ffffff');
        });
        
        // Apply pattern to visible items
        this.applyPattern(costumeItems, pattern, color);
      });
      
      patternButtons.push(button);
      this.buttons.push(button);
    });
    
    // Add control buttons
    const buttonY = boxY + boxH - 40;
    
    // Reset button
    const resetBtn = this.add.text(boxX + 30, buttonY, 'Reset', { font: '14px Arial', fill: '#ff9999' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    resetBtn.on('pointerdown', () => {
      // Show all items
      costumeItems.forEach((item, index) => {
        item.selected = true;
        item.graphic.setVisible(true);
        // Update checkmarks
        this.buttons[8 + index * 3 + 1].setVisible(true);
      });
      
      // Reset pattern
      selectedPattern = patterns[0];
      patternButtons.forEach((btn, i) => {
        btn.setFill(i === 0 ? '#ffff00' : '#ffffff');
      });
      
      // Apply default pattern
      this.applyPattern(costumeItems, patterns[0], color);
    });
    
    // Save button
    const saveBtn = this.add.text(boxX + boxW - 200, buttonY, 'Save Costume', { font: '14px Arial', fill: '#99ff99' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    saveBtn.on('pointerdown', () => {
      // Create custom fashion item
      const fashionName = `${color} ${style} ${selectedPattern} Costume`;
      
      // Remove materials from inventory
      this.removeFromInventory('cloth', 1);
      this.removeFromInventory('dye', 1);
      this.removeFromInventory('gems', 1);
      
      // Add to inventory
      this.addToInventory(fashionName, 1);
      
      // Show completion message
      this.clearButtons();
      this.showDialog(`You created "${fashionName}"!\nIt has been added to your inventory.`);
      this.createButtons([
        { label: 'OK', callback: () => this.closeCurrentScreen() }
      ]);
    });
    
    // Cancel button
    const cancelBtn = this.add.text(boxX + boxW - 80, buttonY, 'Cancel', { font: '14px Arial', fill: '#ff9999' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    cancelBtn.on('pointerdown', () => {
      this.clearButtons();
      this.chooseFashionColor(style);
    });
    
    this.buttons.push(resetBtn, saveBtn, cancelBtn);
  }
  
  // Get fashion items based on style and color
  getFashionItems(style, color) {
    // Convert color string to hex
    const colorHex = this.getColorHex(color);
    
    // Base items common to all styles
    const items = [
      { name: 'Base Top', width: 60, height: 40, offsetX: 0, offsetY: -40, color: colorHex }
    ];
    
    // Style-specific items
    switch(style) {
      case 'casual':
        items.push(
          { name: 'T-Shirt', width: 70, height: 50, offsetX: 0, offsetY: -40, color: colorHex },
          { name: 'Jeans', width: 50, height: 60, offsetX: 0, offsetY: 30, color: 0x0000FF }
        );
        break;
      case 'formal':
        items.push(
          { name: 'Suit Jacket', width: 75, height: 60, offsetX: 0, offsetY: -40, color: colorHex },
          { name: 'Tie', width: 10, height: 30, offsetX: 0, offsetY: -30, color: 0xFF0000 },
          { name: 'Dress Pants', width: 50, height: 70, offsetX: 0, offsetY: 30, color: 0x000000 }
        );
        break;
      case 'fantasy':
        items.push(
          { name: 'Robe', width: 90, height: 120, offsetX: 0, offsetY: 0, color: colorHex },
          { name: 'Belt', width: 60, height: 10, offsetX: 0, offsetY: 0, color: 0x8B4513 },
          { name: 'Hood', width: 40, height: 20, offsetX: 0, offsetY: -70, color: colorHex }
        );
        break;
      case 'futuristic':
        items.push(
          { name: 'Tech Suit', width: 70, height: 120, offsetX: 0, offsetY: 0, color: colorHex },
          { name: 'Shoulder Pads', width: 80, height: 15, offsetX: 0, offsetY: -55, color: 0xC0C0C0 },
          { name: 'Visor', width: 40, height: 10, offsetX: 0, offsetY: -70, color: 0x00FFFF }
        );
        break;
      case 'vintage':
        items.push(
          { name: 'Vest', width: 60, height: 50, offsetX: 0, offsetY: -40, color: colorHex },
          { name: 'High Pants', width: 50, height: 70, offsetX: 0, offsetY: 30, color: 0x8B4513 },
          { name: 'Hat', width: 40, height: 20, offsetX: 0, offsetY: -80, color: colorHex }
        );
        break;
      case 'cultural':
        items.push(
          { name: 'Decorated Robe', width: 80, height: 110, offsetX: 0, offsetY: 0, color: colorHex },
          { name: 'Sash', width: 10, height: 120, offsetX: -20, offsetY: 0, color: 0xFFD700 },
          { name: 'Ornate Hat', width: 50, height: 20, offsetX: 0, offsetY: -80, color: 0xFFD700 }
        );
        break;
    }
    
    return items;
  }
  
  // Helper to get hex color from string
  getColorHex(colorName) {
    const colorMap = {
      'red': 0xFF0000,
      'green': 0x00FF00,
      'blue': 0x0000FF,
      'yellow': 0xFFFF00,
      'purple': 0x800080,
      'black': 0x000000,
      'white': 0xFFFFFF
    };
    
    return colorMap[colorName.toLowerCase()] || 0xFF0000;
  }
  
  // Apply pattern to costume items
  applyPattern(items, pattern, color) {
    const colorHex = this.getColorHex(color);
    
    items.forEach(item => {
      if (!item.selected) return;
      
      switch(pattern) {
        case 'striped':
          // Create stripe effect
          item.graphic.setFillStyle(colorHex);
          if (item.name.includes('Top') || item.name.includes('T-Shirt') || 
              item.name.includes('Robe') || item.name.includes('Suit')) {
            
            // Add stripe overlay
            if (!item.stripeOverlay) {
              const width = item.graphic.width * 0.8;
              const height = 10;
              const x = item.graphic.x;
              const y = item.graphic.y - 10;
              
              item.stripeOverlay = this.add.rectangle(x, y, width, height, 0xFFFFFF)
                .setOrigin(0.5, 0.5).setDepth(1604).setScrollFactor(0);
              this.buttons.push(item.stripeOverlay);
            } else {
              item.stripeOverlay.setVisible(true);
            }
          }
          break;
          
        case 'checkered':
          // Create checkered effect
          item.graphic.setFillStyle(colorHex);
          
          // Remove any existing stripe overlay
          if (item.stripeOverlay) {
            item.stripeOverlay.setVisible(false);
          }
          
          // Add checker pattern (just change to a slightly darker shade for simplicity)
          item.graphic.setFillStyle(this.getDarkerColor(colorHex));
          break;
          
        case 'dotted':
          // Create dotted effect
          item.graphic.setFillStyle(colorHex);
          
          // Remove any existing stripe overlay
          if (item.stripeOverlay) {
            item.stripeOverlay.setVisible(false);
          }
          
          // Add dot overlay (not actually drawing dots, just a visual approximation)
          item.graphic.setFillStyle(this.getLighterColor(colorHex));
          break;
          
        default: // solid
          // Plain solid color
          item.graphic.setFillStyle(colorHex);
          
          // Remove any existing stripe overlay
          if (item.stripeOverlay) {
            item.stripeOverlay.setVisible(false);
          }
          break;
      }
    });
  }
  
  // Get a darker shade of a color
  getDarkerColor(color) {
    // Simple approximation: reduce each RGB component by 30%
    const r = ((color >> 16) & 0xFF) * 0.7;
    const g = ((color >> 8) & 0xFF) * 0.7;
    const b = (color & 0xFF) * 0.7;
    
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }
  
  // Get a lighter shade of a color
  getLighterColor(color) {
    // Simple approximation: increase each RGB component by 30% (max 255)
    const r = Math.min(255, ((color >> 16) & 0xFF) * 1.3);
    const g = Math.min(255, ((color >> 8) & 0xFF) * 1.3);
    const b = Math.min(255, (color & 0xFF) * 1.3);
    
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }
  
  chooseDesignMaterial(theme) {
    this.showDialog(`Choose a material for your ${theme} design item:`);
    
    const options = this.customizationOptions.materials.map(material => ({
      label: `${material}`,
      callback: () => this.designStudioEditor(theme, material)
    }));
    
    options.push({ label: 'Back', callback: () => this.showCustomCreation({ name: 'design_studio', label: 'Design Studio' }) });
    this.createButtons(options);
  }
  
  designStudioEditor(theme, material) {
    // Initialize the furniture design editor
    this.currentScreen = 'design_editor';
    
    // Create a larger dialog for the design editor
    const boxW = 400, boxH = 300;
    const boxX = (this.game.config.width - boxW) / 2;
    const boxY = (this.game.config.height - boxH) / 2;
    
    // Clear previous dialog
    this.dialogBg.clear();
    this.dialogBg.fillStyle(0x000000, 0.8);
    this.dialogBg.fillRect(boxX, boxY, boxW, boxH);
    this.dialogBg.setVisible(true);
    
    // Add title
    const title = this.add.text(boxX + boxW/2, boxY + 15, `${theme.toUpperCase()} ${material.toUpperCase()} FURNITURE DESIGNER`, 
      { font: '16px Arial', fill: '#ffffff', align: 'center' }
    ).setOrigin(0.5).setDepth(1601).setScrollFactor(0);
    this.buttons.push(title);
    
    // Create the design canvas
    const canvasWidth = 200;
    const canvasHeight = 150;
    const canvasX = boxX + (boxW - canvasWidth) / 2;
    const canvasY = boxY + 40;
    
    // Create the canvas background
    const canvas = this.add.rectangle(canvasX, canvasY, canvasWidth, canvasHeight, 0x333333)
      .setOrigin(0, 0).setDepth(1601).setScrollFactor(0);
    this.buttons.push(canvas);
    
    // Add a grid pattern to the canvas
    for (let x = 0; x <= canvasWidth; x += 20) {
      const line = this.add.line(canvasX + x, canvasY, 0, 0, 0, canvasHeight, 0x555555)
        .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
      this.buttons.push(line);
    }
    
    for (let y = 0; y <= canvasHeight; y += 20) {
      const line = this.add.line(canvasX, canvasY + y, 0, 0, canvasWidth, 0, 0x555555)
        .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
      this.buttons.push(line);
    }
    
    // Add furniture template based on theme
    let templateGraphic;
    switch(theme) {
      case 'rustic':
        templateGraphic = this.createRusticTemplate(canvasX, canvasY, material);
        break;
      case 'modern':
        templateGraphic = this.createModernTemplate(canvasX, canvasY, material);
        break;
      case 'fantasy':
        templateGraphic = this.createFantasyTemplate(canvasX, canvasY, material);
        break;
      case 'natural':
        templateGraphic = this.createNaturalTemplate(canvasX, canvasY, material);
        break;
      case 'luxurious':
        templateGraphic = this.createLuxuriousTemplate(canvasX, canvasY, material);
        break;
      case 'minimalist':
        templateGraphic = this.createMinimalistTemplate(canvasX, canvasY, material);
        break;
    }
    
    // Add color palette
    const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFFFFF, 0x000000];
    let selectedColorIndex = 0;
    const colorButtons = [];
    
    const colorSize = 20;
    const colorMargin = 5;
    const colorStartX = boxX + 20;
    const colorStartY = boxY + boxH - 50;
    
    colors.forEach((color, index) => {
      const colorButton = this.add.rectangle(
        colorStartX + index * (colorSize + colorMargin), 
        colorStartY, 
        colorSize, 
        colorSize, 
        color
      ).setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
      
      // Add selection indicator
      const indicator = this.add.rectangle(
        colorStartX + index * (colorSize + colorMargin) - 2, 
        colorStartY - 2, 
        colorSize + 4, 
        colorSize + 4, 
        0xFFFFFF, 
        index === selectedColorIndex ? 1 : 0
      ).setOrigin(0, 0).setDepth(1601).setScrollFactor(0);
      
      colorButton.setInteractive().on('pointerdown', () => {
        // Update selected color
        selectedColorIndex = index;
        // Update indicators
        colorButtons.forEach((btn, i) => {
          btn.indicator.setAlpha(i === index ? 1 : 0);
        });
      });
      
      colorButtons.push({ button: colorButton, indicator });
      this.buttons.push(colorButton);
      this.buttons.push(indicator);
    });
    
    // Add drawing pixels array to track design
    const designPixels = [];
    for (let x = 0; x < 10; x++) {
      designPixels[x] = [];
      for (let y = 0; y < 8; y++) {
        designPixels[x][y] = null;
      }
    }
    
    // Make canvas clickable to "paint" pixels
    canvas.setInteractive().on('pointerdown', (pointer) => {
      // Calculate grid cell
      const relativeX = pointer.x - canvasX;
      const relativeY = pointer.y - canvasY;
      
      const gridX = Math.floor(relativeX / 20);
      const gridY = Math.floor(relativeY / 20);
      
      if (gridX >= 0 && gridX < 10 && gridY >= 0 && gridY < 8) {
        // Remove existing pixel if any
        if (designPixels[gridX][gridY]) {
          designPixels[gridX][gridY].destroy();
          designPixels[gridX][gridY] = null;
        }
        
        // Add new pixel with selected color
        const pixel = this.add.rectangle(
          canvasX + gridX * 20 + 1, 
          canvasY + gridY * 20 + 1, 
          18, 
          18, 
          colors[selectedColorIndex]
        ).setOrigin(0, 0).setDepth(1603).setScrollFactor(0);
        
        designPixels[gridX][gridY] = pixel;
        this.buttons.push(pixel);
      }
    });
    
    // Add control buttons
    const buttonY = boxY + boxH - 30;
    
    // Clear button
    const clearBtn = this.add.text(boxX + 20, buttonY, 'Clear Design', { font: '12px Arial', fill: '#ff9999' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    clearBtn.on('pointerdown', () => {
      // Clear all design pixels
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 8; y++) {
          if (designPixels[x][y]) {
            designPixels[x][y].destroy();
            designPixels[x][y] = null;
          }
        }
      }
      // Redraw template
      if (templateGraphic) {
        if (Array.isArray(templateGraphic)) {
          templateGraphic.forEach(g => g.setAlpha(1));
        } else {
          templateGraphic.setAlpha(1);
        }
      }
    });
    
    this.buttons.push(clearBtn);
    
    // Save button
    const saveBtn = this.add.text(boxX + boxW - 100, buttonY, 'Save Design', { font: '12px Arial', fill: '#99ff99' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    saveBtn.on('pointerdown', () => {
      // Create a custom furniture item
      const itemName = `${material.charAt(0).toUpperCase() + material.slice(1)} ${theme} Furniture`;
      this.addToInventory(itemName, 1);
      
      // Remove materials from inventory
      this.removeFromInventory('wood', 1);
      this.removeFromInventory('metal', 1);
      
      // Show completion message
      this.clearButtons();
      this.showDialog(`You created "${itemName}"!\nIt has been added to your inventory.`);
      this.createButtons([
        { label: 'OK', callback: () => this.closeCurrentScreen() }
      ]);
    });
    
    this.buttons.push(saveBtn);
    
    // Cancel button
    const cancelBtn = this.add.text(boxX + boxW - 50, buttonY, 'Cancel', { font: '12px Arial', fill: '#ff9999' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    cancelBtn.on('pointerdown', () => {
      this.clearButtons();
      this.chooseDesignMaterial(theme);
    });
    
    this.buttons.push(cancelBtn);
  }
  
  // Template creation methods for different furniture styles
  createRusticTemplate(x, y, material) {
    // Create a rustic chair or table outline
    const color = material === 'wood' ? 0x8B4513 : 0x696969;
    
    // Chair back
    const back = this.add.rectangle(x + 100, y + 30, 40, 10, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Chair seat
    const seat = this.add.rectangle(x + 100, y + 60, 40, 10, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Chair legs
    const leg1 = this.add.rectangle(x + 100, y + 70, 5, 30, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    const leg2 = this.add.rectangle(x + 135, y + 70, 5, 30, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Back supports
    const support1 = this.add.rectangle(x + 100, y + 40, 5, 20, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    const support2 = this.add.rectangle(x + 135, y + 40, 5, 20, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    this.buttons.push(back, seat, leg1, leg2, support1, support2);
    
    return [back, seat, leg1, leg2, support1, support2];
  }
  
  createModernTemplate(x, y, material) {
    // Create a modern geometric furniture outline
    const color = material === 'glass' ? 0xADD8E6 : 0x808080;
    
    // Coffee table
    const top = this.add.rectangle(x + 60, y + 50, 80, 20, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Modern legs (single center support)
    const base = this.add.rectangle(x + 85, y + 70, 30, 10, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    const support = this.add.rectangle(x + 95, y + 80, 10, 20, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    this.buttons.push(top, base, support);
    
    return [top, base, support];
  }
  
  createFantasyTemplate(x, y, material) {
    // Create a fantasy-themed furniture with ornate details
    const color = material === 'gems' ? 0x9370DB : 0xDAA520;
    
    // Throne base
    const base = this.add.rectangle(x + 70, y + 60, 60, 40, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Throne back
    const back = this.add.rectangle(x + 70, y + 20, 60, 40, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Ornate top
    const top1 = this.add.circle(x + 80, y + 10, 10, color)
      .setDepth(1602).setScrollFactor(0);
    
    const top2 = this.add.circle(x + 100, y + 5, 15, color)
      .setDepth(1602).setScrollFactor(0);
    
    const top3 = this.add.circle(x + 120, y + 10, 10, color)
      .setDepth(1602).setScrollFactor(0);
    
    this.buttons.push(base, back, top1, top2, top3);
    
    return [base, back, top1, top2, top3];
  }
  
  createNaturalTemplate(x, y, material) {
    // Create a nature-inspired furniture with organic shapes
    const color = material === 'wood' ? 0x8B4513 : 0x556B2F;
    
    // Tree-inspired shelf
    const trunk = this.add.rectangle(x + 100, y + 40, 20, 80, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Branches/shelves
    const branch1 = this.add.rectangle(x + 60, y + 50, 40, 10, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    const branch2 = this.add.rectangle(x + 120, y + 70, 40, 10, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    const branch3 = this.add.rectangle(x + 70, y + 90, 30, 10, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    this.buttons.push(trunk, branch1, branch2, branch3);
    
    return [trunk, branch1, branch2, branch3];
  }
  
  createLuxuriousTemplate(x, y, material) {
    // Create an elegant, luxurious furniture piece
    const color = material === 'metal' ? 0xFFD700 : 0x800080;
    
    // Elegant sofa base
    const base = this.add.rectangle(x + 50, y + 70, 100, 30, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Sofa back
    const back = this.add.rectangle(x + 50, y + 30, 20, 40, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    const back2 = this.add.rectangle(x + 70, y + 30, 80, 15, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Ornate legs
    const leg1 = this.add.rectangle(x + 60, y + 100, 10, 10, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    const leg2 = this.add.rectangle(x + 130, y + 100, 10, 10, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    this.buttons.push(base, back, back2, leg1, leg2);
    
    return [base, back, back2, leg1, leg2];
  }
  
  createMinimalistTemplate(x, y, material) {
    // Create a clean, minimalist furniture design
    const color = material === 'glass' ? 0xF0F8FF : 0xD3D3D3;
    
    // Simple shelf unit
    const frame = this.add.rectangle(x + 60, y + 30, 80, 90, color, 0)
      .setStrokeStyle(2, color).setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Shelves
    const shelf1 = this.add.rectangle(x + 60, y + 60, 80, 2, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    const shelf2 = this.add.rectangle(x + 60, y + 90, 80, 2, color)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    this.buttons.push(frame, shelf1, shelf2);
    
    return [frame, shelf1, shelf2];
  }
  
  createCustomItem(type, properties) {
    // Remove materials from inventory
    let requiredMaterials = [];
    switch(type) {
      case 'character':
        requiredMaterials = ['cloth', 'dye'];
        break;
      case 'fashion':
        requiredMaterials = ['cloth', 'dye', 'gems'];
        break;
      case 'design':
        requiredMaterials = ['wood', 'metal'];
        break;
      // Music doesn't require materials
    }
    
    requiredMaterials.forEach(material => {
      this.removeFromInventory(material, 1);
    });
    
    // Create item name based on properties
    let itemName = '';
    if (properties.skin) {
      itemName = `${properties.skin.charAt(0).toUpperCase() + properties.skin.slice(1)} Character Skin`;
    } else if (properties.style && properties.color) {
      itemName = `${properties.color.charAt(0).toUpperCase() + properties.color.slice(1)} ${properties.style} Fashion Item`;
    } else if (properties.theme && properties.material) {
      itemName = `${properties.material.charAt(0).toUpperCase() + properties.material.slice(1)} ${properties.theme} Furniture`;
    }
    
    // Add to inventory
    this.addToInventory(itemName, 1);
    
    this.showDialog(`You created "${itemName}"!\nIt has been added to your inventory.`);
    this.createButtons([
      { label: 'OK', callback: () => this.closeCurrentScreen() }
    ]);
  }
  
  openMusicEditor() {
    this.showDialog('Music Editor\nCreate your own 8-bit melody by selecting notes in sequence.');
    
    const notes = this.customizationOptions.notes;
    let melody = [];
    
    const updateDisplay = () => {
      this.showDialog(`Music Editor\nYour melody: ${melody.join(' ')}\nSelect up to 8 notes.`);
      
      let options = notes.map(note => ({
        label: note,
        callback: () => {
          if (melody.length < 8) {
            melody.push(note);
            updateDisplay();
          }
        }
      }));
      
      if (melody.length > 0) {
        options.push({ 
          label: 'Delete Last', 
          callback: () => {
            melody.pop();
            updateDisplay();
          }
        });
      }
      
      if (melody.length > 0) {
        options.push({ 
          label: 'Save Melody', 
          callback: () => this.saveMelody(melody) 
        });
      }
      
      options.push({ 
        label: 'Cancel', 
        callback: () => this.closeCurrentScreen() 
      });
      
      this.createButtons(options);
    };
    
    updateDisplay();
  }
  
  saveMelody(notes) {
    const melodyName = `Custom Melody (${notes.slice(0, 3).join('-')}...)`;
    this.addToInventory(melodyName, 1);
    
    this.showDialog(`You created "${melodyName}"!\nIt has been added to your inventory.`);
    this.createButtons([
      { label: 'OK', callback: () => this.closeCurrentScreen() }
    ]);
  }
  
  showMaterialsShop(station) {
    this.showDialog('Materials Shop\nPurchase crafting materials:');
    
    const options = Object.values(this.creationMaterials).map(material => ({
      label: `${material.name} (${material.cost} Oromozi)`,
      callback: () => this.purchaseMaterial(material)
    }));
    
    options.push({ label: 'Back', callback: () => this.openCraftingStation(station) });
    
    this.createButtons(options);
  }
  
  purchaseMaterial(material) {
    if (this.oromoziBalance >= material.cost) {
      this.oromoziBalance -= material.cost;
      this.playerStats.oromozi = this.oromoziBalance;
      this.updateHUD();
      
      // Add material to inventory
      this.addToInventory(material.name, 1);
      
      this.showDialog(`You purchased ${material.name}!\nIt has been added to your inventory.`);
      this.createButtons([
        { label: 'Buy More', callback: () => this.showMaterialsShop({ name: '' }) },
        { label: 'Done', callback: () => this.closeCurrentScreen() }
      ]);
    } else {
      this.showDialog('You do not have enough Oromozi for this purchase.');
      this.createButtons([
        { label: 'OK', callback: () => this.showMaterialsShop({ name: '' }) }
      ]);
    }
  }
  
  handleUIInteraction() {
    // This would handle any special UI interactions based on current screen
  }
  
  closeCurrentScreen() {
    this.hideDialog();
    this.currentScreen = 'none';
    
    // Make sure to clear any context menus when closing screens
    if (this.clearContextMenu) {
      this.clearContextMenu();
    }
  }
  
  returnToVillage() {
    // Create the proper Village zone data structure
    const villageZone = {
      name: "Village", 
      mapKey: "villageCommonsMap", 
      backgroundKey: "villageCommons", 
      foregroundKey: ""
    };
    
    // Add a camera fade transition for smoother scene change
    this.cameras.main.fadeOut(500);
    
    // Wait for fade to complete before changing scene
    this.time.delayedCall(500, () => {
    // Return to village commons with updated inventory and stats
    this.scene.start('MainGameScene', {
        zone: villageZone,
      inventory: this.localInventory,
        playerStats: this.playerStats,
        promptCount: 0
      });
    });
  }
  
  showDialog(text) {
    const boxW = 220, boxH = 150;
    const boxX = (this.game.config.width - boxW) / 2;
    const boxY = (this.game.config.height - boxH) / 2;
    this.dialogBg.clear();
    this.dialogBg.fillStyle(0x000000, 0.8);
    this.dialogBg.fillRect(boxX, boxY, boxW, boxH);
    this.dialogText.setPosition(boxX + 10, boxY + 10);
    this.dialogText.setText(text);
    this.dialogBg.setVisible(true);
    this.dialogText.setVisible(true);
    this.dialogBg.setScrollFactor(0);
    this.dialogText.setScrollFactor(0);
    this.dialogBg.setDepth(1600);
    this.dialogText.setDepth(1601);
  }
  
  hideDialog() {
    this.dialogBg.clear();
    this.dialogBg.setVisible(false);
    this.dialogText.setVisible(false);
    this.clearButtons();
  }
  
  createButtons(options) {
    this.clearButtons();
    const boxW = 220, boxH = 150;
    const boxX = (this.game.config.width - boxW) / 2;
    const boxY = (this.game.config.height - boxH) / 2;
    let startX = boxX + 10;
    
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const txt = this.add.text(startX, boxY + 80 + i * 20, option.label, { font: '12px Arial', fill: '#ffff00' });
      txt.setDepth(1601);
      txt.setInteractive({ useHandCursor: true });
      txt.on('pointerdown', () => option.callback());
      this.buttons.push(txt);
      txt.setScrollFactor(0);
    }
  }
  
  clearButtons() {
    this.buttons.forEach(btn => btn.destroy());
    this.buttons = [];
  }
  
  updateHUD() {
    if (!this.hudText) return;
    this.hudText.setText(`OROMOZI: ${this.oromoziBalance}`);
  }
  
  addToInventory(itemName, quantity = 1) {
    const existing = this.localInventory.find(i => i.name === itemName);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.localInventory.push({ name: itemName, quantity });
    }
  }
  
  removeFromInventory(itemName, quantity = 1) {
    const item = this.localInventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    if (!item) return;
    
    item.quantity -= quantity;
    if (item.quantity <= 0) {
      const index = this.localInventory.indexOf(item);
      this.localInventory.splice(index, 1);
    }
  }
  
  update() {
    if (!this.player || !this.player.body) return;
    
    // Always update the coordinate display
    if (this.coordDisplay) {
      const x = Math.floor(this.player.x);
      const y = Math.floor(this.player.y);
      this.coordDisplay.setText(`Coordinates: (${x}, ${y})`);
    }
    
    // Update debug info
    if (this.debugCollision && this.debugText) {
      // Show player position and collision debug info
      const interactionZoneName = this.checkInteractionAtPosition(this.player.x, this.player.y);
      
      // Check pixel color at player position for collision detection
      const playerPixelX = Math.floor(this.player.x / 0.3);
      const playerPixelY = Math.floor(this.player.y / 0.3);
      
      // Debug collision points
      let collisionStatus = "No collision data";
      
      if (this.collisionBitmap) {
        try {
          // Check the collision points for 72px tall hitbox
          const halfWidth = 8; // Half of the 16px width
          const topOffset = 12; // Distance from center to top of hitbox
          const bottomOffset = 60; // Distance from center to bottom of hitbox (72-12=60)
          
          const centerAlpha = this.textures.getPixelAlpha(playerPixelX, playerPixelY, 'artisanAlleyCollisions');
          const topAlpha = this.textures.getPixelAlpha(playerPixelX, playerPixelY - topOffset, 'artisanAlleyCollisions');
          const bottomAlpha = this.textures.getPixelAlpha(playerPixelX, playerPixelY + bottomOffset, 'artisanAlleyCollisions');
          const bottomLeftAlpha = this.textures.getPixelAlpha(playerPixelX - halfWidth, playerPixelY + bottomOffset, 'artisanAlleyCollisions');
          const bottomRightAlpha = this.textures.getPixelAlpha(playerPixelX + halfWidth, playerPixelY + bottomOffset, 'artisanAlleyCollisions');
          const leftAlpha = this.textures.getPixelAlpha(playerPixelX - halfWidth, playerPixelY, 'artisanAlleyCollisions');
          const rightAlpha = this.textures.getPixelAlpha(playerPixelX + halfWidth, playerPixelY, 'artisanAlleyCollisions');
          const midBottomAlpha = this.textures.getPixelAlpha(playerPixelX, playerPixelY + 30, 'artisanAlleyCollisions');
          
          collisionStatus = 
            `C:${centerAlpha>0 ? "Y" : "n"} T:${topAlpha>0 ? "Y" : "n"} B:${bottomAlpha>0 ? "Y" : "n"}\n` +
            `L:${leftAlpha>0 ? "Y" : "n"} R:${rightAlpha>0 ? "Y" : "n"} BL:${bottomLeftAlpha>0 ? "Y" : "n"}\n` +
            `BR:${bottomRightAlpha>0 ? "Y" : "n"} MB:${midBottomAlpha>0 ? "Y" : "n"}`;
        } catch (e) {
          console.error("Error checking collision pixel:", e);
          collisionStatus = "Error checking collision";
        }
      }
      
      this.debugText.setText(
        `Pixel position: (${playerPixelX}, ${playerPixelY})\n` +
        `Collision:\n${collisionStatus}\n` +
        `Interaction: ${interactionZoneName || 'none'}\n` +
        `Press F9 to toggle debug | E to interact`
      );
    } else if (this.debugText) {
      this.debugText.setText('');
    }
    
    // Only process movement if no dialog is showing
    if (this.currentScreen === 'none') {
      const speed = 120;
      
      // Handle movement using either WASD or arrow keys
      const left = this.cursors.left.isDown || this.wasdKeys.left.isDown;
      const right = this.cursors.right.isDown || this.wasdKeys.right.isDown;
      const up = this.cursors.up.isDown || this.wasdKeys.up.isDown;
      const down = this.cursors.down.isDown || this.wasdKeys.down.isDown;
      
      // Reset velocity
      this.player.setVelocity(0);
      
      // Calculate next position for collision check
      let nextX = this.player.x;
      let nextY = this.player.y;
      
      if (left) nextX -= speed * (1/60);
      if (right) nextX += speed * (1/60);
      if (up) nextY -= speed * (1/60);
      if (down) nextY += speed * (1/60);
      
      // Check if the next position would cause a collision with the collision map
      const wouldCollide = this.checkCollisionWithMap(nextX, nextY);
      
      // Only move if there's no collision
      if (!wouldCollide) {
      if (left) {
        this.player.setVelocityX(-speed);
        this.player.anims.play('walk-left', true);
      } else if (right) {
        this.player.setVelocityX(speed);
        this.player.anims.play('walk-right', true);
      }
      
      if (up) {
        this.player.setVelocityY(-speed);
        if (!left && !right) this.player.anims.play('walk-up', true);
      } else if (down) {
        this.player.setVelocityY(speed);
        if (!left && !right) this.player.anims.play('walk-down', true);
        }
      }
      
      if (!left && !right && !up && !down) {
        this.player.anims.stop();
      }
      
      // Check for station interaction when E is pressed
      if (Phaser.Input.Keyboard.JustDown(this.wasdKeys.interact)) {
        this.checkCraftingStationInteraction();
      }
    } else {
      // Stop player movement when dialog is open
      this.player.setVelocity(0);
      this.player.anims.stop();
    }
  }
  
  // Check collision with the collision map image
  checkCollisionWithMap(x, y) {
    if (!this.collisionBitmap) return false;
    
    // Convert world coordinates to pixel coordinates in the collision map
    const pixelX = Math.floor(x / 0.3);
    const pixelY = Math.floor(y / 0.3);
    
    // Check multiple points around the player for better collision detection
    // Check the player's center point and points around the extended hitbox
    try {
      // Center point
      const centerAlpha = this.textures.getPixelAlpha(pixelX, pixelY, 'artisanAlleyCollisions');
      
      // Check collision box points (using the extended 72px tall collision box dimensions)
      const halfWidth = 8; // Half of the 16px width
      const topOffset = 12; // Distance from center to top of hitbox
      const bottomOffset = 60; // Distance from center to bottom of hitbox (72-12=60)
      
      // Top point
      const topAlpha = this.textures.getPixelAlpha(pixelX, pixelY - topOffset, 'artisanAlleyCollisions');
      
      // Points along the bottom (checking multiple points for better coverage)
      const bottomAlpha = this.textures.getPixelAlpha(pixelX, pixelY + bottomOffset, 'artisanAlleyCollisions');
      const bottomLeftAlpha = this.textures.getPixelAlpha(pixelX - halfWidth, pixelY + bottomOffset, 'artisanAlleyCollisions');
      const bottomRightAlpha = this.textures.getPixelAlpha(pixelX + halfWidth, pixelY + bottomOffset, 'artisanAlleyCollisions');
      
      // Middle points on left and right
      const leftAlpha = this.textures.getPixelAlpha(pixelX - halfWidth, pixelY, 'artisanAlleyCollisions');
      const rightAlpha = this.textures.getPixelAlpha(pixelX + halfWidth, pixelY, 'artisanAlleyCollisions');
      
      // Additional lower-middle points to ensure better coverage
      const midBottomAlpha = this.textures.getPixelAlpha(pixelX, pixelY + 30, 'artisanAlleyCollisions');
      
      // If any of these points has a non-zero alpha, there's a collision
      return centerAlpha > 0 || 
             topAlpha > 0 || 
             bottomAlpha > 0 || 
             leftAlpha > 0 || 
             rightAlpha > 0 || 
             bottomLeftAlpha > 0 || 
             bottomRightAlpha > 0 || 
             midBottomAlpha > 0;
    } catch (e) {
      console.error("Error checking collision pixels:", e);
      return false;
    }
  }
  
  // Helper method to check if player is at an interaction zone
  checkInteractionAtPosition(x, y) {
    let interactionName = null;
    const playerBounds = new Phaser.Geom.Rectangle(x - 8, y - 8, 16, 16);
    
    this.interactionObjects.getChildren().forEach(obj => {
      const objBounds = obj.getBounds();
      if (Phaser.Geom.Intersects.RectangleToRectangle(objBounds, playerBounds)) {
        interactionName = obj.name;
      }
    });
    
    return interactionName;
  }
  
  // Method to place a marker at player's current position
  placeMarkerAtPlayerPosition() {
    if (!this.player) return;
    
    const x = Math.floor(this.player.x);
    const y = Math.floor(this.player.y);
    this.markerCount++;
    
    // Create a visual marker
    const marker = this.add.circle(x, y, 10, 0xff0000, 0.7);
    marker.setDepth(500);
    
    // Add text with position and marker number
    const markerText = this.add.text(x, y - 15, `#${this.markerCount}: (${x}, ${y})`, {
      font: '10px Arial',
      fill: '#ff0000',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(501);
    
    // Store the marker objects
    this.positionMarkers.push({ marker, text: markerText, x, y });
    
    // Log to console for easy copy-paste
    console.log(`Marker #${this.markerCount} position: { x: ${x}, y: ${y} }`);
  }
  
  createMusicTrack(genre) {
    // Initialize the polyphonic DAW
    this.currentScreen = 'music_daw';
    
    // Create a properly sized dialog for the polyphonic DAW that fits in viewport
    // Scale down dimensions by 15%
    const boxW = Math.floor(480 * 0.85);
    const boxH = Math.floor(360 * 0.85);
    const boxX = Math.floor((this.game.config.width - boxW) / 2);
    const boxY = Math.floor((this.game.config.height - boxH) / 2);
    
    // Clear previous dialog
    this.dialogBg.clear();
    this.dialogBg.fillStyle(0x000000, 0.9);
    this.dialogBg.fillRect(boxX, boxY, boxW, boxH);
    this.dialogBg.setVisible(true);
    
    // Add title
    const title = this.add.text(boxX + boxW/2, boxY + 10, '🎵 POLYPHONIC DAW', 
      { font: '12px Arial', fill: '#ffffff', align: 'center' }
    ).setOrigin(0.5).setDepth(1601).setScrollFactor(0);
    this.buttons.push(title);
    
    // Define the 4 tracks with their properties
    const tracks = [
      { 
        name: 'BASS', 
        color: 0xFF0000, 
        notes: ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3'],
        waveform: 'square',
        volume: 0.8,
        instruments: ['BASS', 'SUB', 'PLUCK', 'SYNTH']
      },
      { 
        name: 'SYNTH', 
        color: 0x00FF00, 
        notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
        waveform: 'sawtooth',
        volume: 0.6,
        instruments: ['SYNTH', 'LEAD', 'ARP', 'KEYS']
      },
      { 
        name: 'DRUMS', 
        color: 0xFFFF00, 
        notes: ['Kick', 'Snare', 'HiHat', 'Crash', 'Tom1', 'Tom2', 'Ride', 'Clap'],
        waveform: 'square',
        volume: 1.0,
        instruments: ['DRUMS', 'ACOUSTIC', 'ELECTRO', 'PERCUSSION']
      },
      { 
        name: 'PAD', 
        color: 0x00FFFF, 
        notes: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
        waveform: 'sine',
        volume: 0.4,
        instruments: ['PAD', 'STRINGS', 'AMBIENT', 'CHOIR', 'AURA', 'SHIMMER']
      }
    ];
    
    // Track tab system
    let activeTrack = 0;
    const tabHeight = 22; // Reduced from 25
    const tabWidth = boxW / 4;
    
    // Create track tabs
    const trackTabs = [];
    
    // Track for double-click detection
    const clickTimers = [null, null, null, null];
    
    // Create tooltip for instructions
    let tooltipText = null;
    
    tracks.forEach((track, index) => {
      // Create tab background
      const tab = this.add.rectangle(
        boxX + index * tabWidth, 
        boxY + 25, // Moved up
        tabWidth, 
        tabHeight, 
        index === activeTrack ? track.color : 0x444444
      ).setOrigin(0, 0).setDepth(1601).setScrollFactor(0);
      
      // Add tab label
      const tabLabel = this.add.text(
        boxX + index * tabWidth + tabWidth/2 - 10, // Moved left to make room for arrow
        boxY + 25 + tabHeight/2, 
        track.name, 
        { font: '9px Arial', fill: '#000000', align: 'center' }
      ).setOrigin(0.5, 0.5).setDepth(1602).setScrollFactor(0);
      
      // Add a visible button background for the arrow
      const arrowBg = this.add.rectangle(
        boxX + index * tabWidth + tabWidth - 15,
        boxY + 25 + tabHeight/2,
        16,
        16,
        0xFFFFFF,
        0.5
      ).setOrigin(0.5, 0.5).setDepth(1601).setScrollFactor(0)
        .setStrokeStyle(1, 0x000000)
        .setInteractive({ useHandCursor: true });
      
      // Add dropdown arrow
      const arrowBtn = this.add.text(
        boxX + index * tabWidth + tabWidth - 15, 
        boxY + 25 + tabHeight/2, 
        '▼', // Unicode down arrow
        { font: '10px Arial', fill: '#000000', align: 'center', fontStyle: 'bold' }
      ).setOrigin(0.5, 0.5).setDepth(1602).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      
      // Make tab interactive for track selection
      tab.setInteractive({ useHandCursor: true })
         .on('pointerdown', () => {
           // Switch active track
           activeTrack = index;
           
           // Update tab visuals
           trackTabs.forEach((t, i) => {
             t.tab.setFillStyle(i === activeTrack ? tracks[i].color : 0x444444);
           });
           
           // Update sequencer grid visibility
           updateGridVisibility();
         });
      
      // Make arrow button interactive for instrument selection
      arrowBtn.on('pointerdown', () => {
        showInstrumentMenu(index);
      })
      .on('pointerover', () => {
        arrowBg.setFillStyle(0xFFFFFF, 0.8);
      })
      .on('pointerout', () => {
        arrowBg.setFillStyle(0xFFFFFF, 0.5);
      });
      
      arrowBg.on('pointerdown', () => {
        showInstrumentMenu(index);
      })
      .on('pointerover', () => {
        arrowBg.setFillStyle(0xFFFFFF, 0.8);
      })
      .on('pointerout', () => {
        arrowBg.setFillStyle(0xFFFFFF, 0.5);
      });
      
      trackTabs.push({ tab, label: tabLabel, arrow: arrowBtn, arrowBg });
      this.buttons.push(tab, tabLabel, arrowBtn, arrowBg);
    });

    // Function to show instrument selection menu
    const showInstrumentMenu = (trackIndex) => {
      // Create a menu background
      const menuWidth = 100; // Reduced from 120
      const menuHeight = tracks[trackIndex].instruments.length * 17 + 10; // Reduced from 20px per item
      
      // Position menu - handle positioning for the PAD track specially to ensure visibility
      let menuX, menuY;
      
      // For the last tab (PAD), position dropdown to the left to keep it in view
      if (trackIndex === 3) { // PAD is the 4th track (index 3)
        menuX = boxX + (trackIndex * tabWidth) - (menuWidth/2);
        menuY = boxY + 25 + tabHeight + 5;
      } else {
        menuX = boxX + trackIndex * tabWidth + (tabWidth - menuWidth)/2;
        menuY = boxY + 25 + tabHeight + 5; // 5px gap below the tab
      }
      
      // Ensure menu doesn't go off screen
      menuX = Math.max(5, Math.min(menuX, this.game.config.width - menuWidth - 5));
      
      // Remove any existing context menu
      this.clearContextMenu();
      
      // Highlight the arrow button when menu is open
      trackTabs[trackIndex].arrowBg.setFillStyle(tracks[trackIndex].color, 0.8);
      trackTabs[trackIndex].arrow.setColor('#FFFFFF');
      
      // Create menu background with rounded corners
      const menuBg = this.add.rectangle(
        menuX, 
        menuY, 
        menuWidth, 
        menuHeight, 
        0x222222, 
        0.95
      ).setOrigin(0, 0).setDepth(1700).setScrollFactor(0)
       .setStrokeStyle(2, tracks[trackIndex].color);
      
      // Add a little triangle pointer at the top of the menu
      const triangleSize = 6; // Reduced from 8
      let triangleX;
      
      // Adjust triangle position for PAD track
      if (trackIndex === 3) {
        triangleX = boxX + trackIndex * tabWidth + tabWidth - 15;
      } else {
        triangleX = boxX + trackIndex * tabWidth + tabWidth - 15; // Position directly below the arrow
      }
      
      // Create triangle pointing up
      const triangle = this.add.polygon(
        triangleX,
        menuY,
        [
          { x: -triangleSize, y: -triangleSize },
          { x: triangleSize, y: -triangleSize },
          { x: 0, y: 0 }
        ],
        tracks[trackIndex].color
      ).setDepth(1700).setScrollFactor(0);
      
      // Create menu title
      const menuTitle = this.add.text(
        menuX + menuWidth/2, 
        menuY + 5, 
        'Select Instrument', 
        { font: '9px Arial', fill: '#ffffff', align: 'center', fontStyle: 'bold' }
      ).setOrigin(0.5, 0).setDepth(1701).setScrollFactor(0);
      
      // Track menu items for cleanup
      this.contextMenuItems = [menuBg, menuTitle, triangle];
      
      // Create menu options
      tracks[trackIndex].instruments.forEach((instrument, idx) => {
        // Menu item background that highlights on hover
        const optionBg = this.add.rectangle(
          menuX + 5,
          menuY + 22 + idx * 17 - 2, // Adjusted spacing
          menuWidth - 10,
          15, // Reduced height
          instrument === tracks[trackIndex].name ? tracks[trackIndex].color : 0x333333,
          instrument === tracks[trackIndex].name ? 0.5 : 0.3
        ).setOrigin(0, 0).setDepth(1701).setScrollFactor(0)
         .setInteractive({ useHandCursor: true });
        
        const option = this.add.text(
          menuX + menuWidth/2, 
          menuY + 22 + idx * 17 + 6, // Adjusted spacing
          instrument, 
          { 
            font: '9px Arial', // Reduced from 12px
            fill: instrument === tracks[trackIndex].name ? '#ffffff' : '#cccccc', 
            align: 'center'
          }
        ).setOrigin(0.5, 0.5).setDepth(1702).setScrollFactor(0);
        
        // Handle instrument selection
        optionBg.on('pointerdown', () => {
          // Change the instrument
          tracks[trackIndex].name = instrument;
          
          // Update the tab label
          trackTabs[trackIndex].label.setText(instrument);
          
          // Clear the menu
          this.clearContextMenu();
          
          // Reset arrow button style
          trackTabs[trackIndex].arrowBg.setFillStyle(0xFFFFFF, 0.5);
          trackTabs[trackIndex].arrow.setColor('#000000');
        })
        .on('pointerover', () => {
          optionBg.setFillStyle(tracks[trackIndex].color, 0.7);
          option.setColor('#ffffff');
        })
        .on('pointerout', () => {
          if (instrument === tracks[trackIndex].name) {
            optionBg.setFillStyle(tracks[trackIndex].color, 0.5);
            option.setColor('#ffffff');
          } else {
            optionBg.setFillStyle(0x333333, 0.3);
            option.setColor('#cccccc');
          }
        });
        
        this.contextMenuItems.push(optionBg, option);
      });
      
      // Add click outside to close menu
      const closeMenu = this.add.rectangle(0, 0, this.game.config.width, this.game.config.height, 0x000000, 0.01)
        .setOrigin(0, 0).setDepth(1699).setScrollFactor(0).setInteractive();
      closeMenu.on('pointerdown', () => {
        // Reset arrow button style
        trackTabs[trackIndex].arrowBg.setFillStyle(0xFFFFFF, 0.5);
        trackTabs[trackIndex].arrow.setColor('#000000');
        
        this.clearContextMenu();
      });
      this.contextMenuItems.push(closeMenu);
    };
    
    // Function to clear the context menu
    this.clearContextMenu = () => {
      if (this.contextMenuItems && this.contextMenuItems.length > 0) {
        this.contextMenuItems.forEach(item => item.destroy());
        this.contextMenuItems = [];
      }
    };
    
    // Sequencer grid setup - made more compact for 85% scale
    const gridStartX = boxX + 35; // Adjusted position
    const gridStartY = boxY + 55; // Adjusted position
    const cellWidth = 20; // Reduced from 24
    const cellHeight = 17; // Reduced from 20
    const gridCols = 16; // 16 steps
    const gridRows = 8; // 8 notes per track
    
    // Create step number labels
    for (let col = 0; col < gridCols; col++) {
      const stepLabel = this.add.text(
        gridStartX + col * cellWidth + cellWidth/2, 
        gridStartY - 10, 
        (col + 1).toString(), 
        { font: '7px Arial', fill: '#ffffff', align: 'center' }
      ).setOrigin(0.5).setDepth(1601).setScrollFactor(0);
      this.buttons.push(stepLabel);
      
      // Add visual separator every 4 steps
      if ((col + 1) % 4 === 0 && col < gridCols - 1) {
        const separator = this.add.line(
          gridStartX + (col + 1) * cellWidth - cellWidth/2,
          gridStartY - 15,
          0, 0, 0, gridRows * cellHeight + 30,
          0x666666, 0.5
        ).setOrigin(0, 0).setDepth(1600).setScrollFactor(0);
        this.buttons.push(separator);
      }
    }
    
    // Store sequencer data for all tracks
    const sequencerData = tracks.map(() => {
      const trackData = [];
      for (let step = 0; step < gridCols; step++) {
        trackData[step] = [];
        for (let note = 0; note < gridRows; note++) {
          trackData[step][note] = false;
        }
      }
      return trackData;
    });
    
    // Create sequencer grids for each track (only one visible at a time)
    const trackGrids = [];
    
    tracks.forEach((track, trackIndex) => {
      const grid = [];
      
      // Create note labels for this track
      const noteLabels = [];
      track.notes.forEach((note, noteIndex) => {
        const label = this.add.text(
          gridStartX - 25, 
          gridStartY + noteIndex * cellHeight + cellHeight/2, 
          note, 
          { font: '7px Arial', fill: '#ffffff', align: 'center' }
        ).setOrigin(0.5).setDepth(1601).setScrollFactor(0);
        
        label.setVisible(trackIndex === activeTrack);
        noteLabels.push(label);
        this.buttons.push(label);
      });
      
      // Create grid cells
      for (let step = 0; step < gridCols; step++) {
        grid[step] = [];
        for (let note = 0; note < gridRows; note++) {
          const cell = this.add.rectangle(
            gridStartX + step * cellWidth, 
            gridStartY + note * cellHeight, 
            cellWidth - 2, 
            cellHeight - 2, 
            0x333333
          ).setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
          
          // Highlight every 4th step
          if ((step + 1) % 4 === 0) {
            cell.setStrokeStyle(1, 0x666666);
          }
          
          // Make cell interactive
          cell.setInteractive().on('pointerdown', () => {
            // Toggle cell state
            const isActive = sequencerData[trackIndex][step][note];
            sequencerData[trackIndex][step][note] = !isActive;
            
            // Update visual
            cell.setFillStyle(!isActive ? track.color : 0x333333);
            
            // Play note preview
            if (!isActive) {
              this.playTrackNote(track, note, 0.2, track.volume);
            }
          });
          
          cell.setVisible(trackIndex === activeTrack);
          grid[step][note] = cell;
          this.buttons.push(cell);
        }
      }
      
      trackGrids.push({ grid, noteLabels });
    });
    
    // Function to update grid visibility based on active track
    const updateGridVisibility = () => {
      trackGrids.forEach((trackGrid, trackIndex) => {
        const isVisible = trackIndex === activeTrack;
        
        // Update note labels
        trackGrid.noteLabels.forEach(label => label.setVisible(isVisible));
        
        // Update grid cells
        for (let step = 0; step < gridCols; step++) {
          for (let note = 0; note < gridRows; note++) {
            trackGrid.grid[step][note].setVisible(isVisible);
            
            // Update cell color based on sequencer data
            const isActive = sequencerData[trackIndex][step][note];
            trackGrid.grid[step][note].setFillStyle(isActive ? tracks[trackIndex].color : 0x333333);
          }
        }
      });
    };
    
    // Initialize grid visibility
    updateGridVisibility();
    
    // Create playback controls - positioned more compactly
    const controlY = gridStartY + gridRows * cellHeight + 15; // Reduced spacing
    
    // Playback state
    let isPlaying = false;
    let currentStep = 0;
    let bpm = 120;
    let isLooping = false;
    let playbackTimer = null;
    
    // Create playback marker
    const playbackMarker = this.add.rectangle(
      gridStartX, 
      gridStartY, 
      cellWidth, 
      gridRows * cellHeight, 
      0xFFFFFF, 
      0.3
    ).setOrigin(0, 0).setDepth(1605).setScrollFactor(0).setVisible(false);
    this.buttons.push(playbackMarker);
    
    // Play button
    const playBtn = this.add.text(gridStartX, controlY, '▶ PLAY', { font: '9px Arial', fill: '#00FF00' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    // Stop button
    const stopBtn = this.add.text(gridStartX + 55, controlY, '■ STOP', { font: '9px Arial', fill: '#FF0000' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    // Loop button
    const loopBtn = this.add.text(gridStartX + 105, controlY, '↻ LOOP', { font: '9px Arial', fill: '#FFFF00' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    // BPM controls
    const bpmLabel = this.add.text(gridStartX + 160, controlY, 'BPM:', { font: '9px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0);
    
    const bpmValue = this.add.text(gridStartX + 190, controlY, bpm.toString(), { font: '9px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0);
    
    const bpmDec = this.add.text(gridStartX + 180, controlY, '◀', { font: '9px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    const bpmInc = this.add.text(gridStartX + 215, controlY, '▶', { font: '9px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    this.buttons.push(playBtn, stopBtn, loopBtn, bpmLabel, bpmValue, bpmDec, bpmInc);
    
    // Preset patterns for quick start - moved to single row
    const presetY = controlY + 20;
    const presetLabel = this.add.text(gridStartX, presetY, 'PRESETS:', { font: '8px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0);
    
    const kickDrumBtn = this.add.text(gridStartX + 50, presetY, 'KICK', { font: '8px Arial', fill: '#FFFF99' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    const bassLineBtn = this.add.text(gridStartX + 85, presetY, 'BASS', { font: '8px Arial', fill: '#FFFF99' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    const chordBtn = this.add.text(gridStartX + 120, presetY, 'CHORD', { font: '8px Arial', fill: '#FFFF99' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    const clearBtn = this.add.text(gridStartX + 160, presetY, 'CLEAR', { font: '8px Arial', fill: '#FF9999' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    this.buttons.push(presetLabel, kickDrumBtn, bassLineBtn, chordBtn, clearBtn);
    
    // Main control buttons
    const buttonY = boxY + boxH - 25; // Positioned near bottom
    
    const saveBtn = this.add.text(boxX + boxW - 100, buttonY, 'SAVE TRACK', { font: '10px Arial', fill: '#00FF00' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    const cancelBtn = this.add.text(boxX + boxW - 40, buttonY, 'EXIT', { font: '10px Arial', fill: '#FF0000' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    this.buttons.push(saveBtn, cancelBtn);
    
    // Playback functionality
    const playStep = () => {
      if (!isPlaying) return;
      
      // Update playback marker position
      playbackMarker.x = gridStartX + currentStep * cellWidth;
      playbackMarker.setVisible(true);
      
      // Play all active notes across all tracks for current step
      tracks.forEach((track, trackIndex) => {
        for (let note = 0; note < gridRows; note++) {
          if (sequencerData[trackIndex][currentStep][note]) {
            this.playTrackNote(track, note, 0.15, track.volume);
          }
        }
      });
      
      // Advance to next step
      currentStep = (currentStep + 1) % gridCols;
      
      // Check if sequence should continue
      if (currentStep === 0 && !isLooping) {
        isPlaying = false;
        playbackMarker.setVisible(false);
        playBtn.setText('▶ PLAY');
        if (playbackTimer) clearTimeout(playbackTimer);
        return;
      }
      
      // Schedule next step
      const stepDuration = (60 / bpm) * 250; // 16th notes at given BPM
      playbackTimer = setTimeout(playStep, stepDuration);
    };
    
    // Button event handlers
    playBtn.on('pointerdown', () => {
      if (isPlaying) {
        isPlaying = false;
        playBtn.setText('▶ PLAY');
        playbackMarker.setVisible(false);
        if (playbackTimer) clearTimeout(playbackTimer);
      } else {
        isPlaying = true;
        playBtn.setText('⏸ PAUSE');
        playStep();
      }
    });
    
    stopBtn.on('pointerdown', () => {
      isPlaying = false;
      currentStep = 0;
      playBtn.setText('▶ PLAY');
      playbackMarker.setVisible(false);
      if (playbackTimer) clearTimeout(playbackTimer);
    });
    
    loopBtn.on('pointerdown', () => {
      isLooping = !isLooping;
      loopBtn.setFill(isLooping ? '#00FF00' : '#FFFF00');
    });
    
    bpmDec.on('pointerdown', () => {
      if (bpm > 60) {
        bpm -= 10;
        bpmValue.setText(bpm.toString());
      }
    });
    
    bpmInc.on('pointerdown', () => {
      if (bpm < 200) {
        bpm += 10;
        bpmValue.setText(bpm.toString());
      }
    });
    
    // Preset pattern handlers
    kickDrumBtn.on('pointerdown', () => {
      if (activeTrack === 2) { // Drums track
        // Add kick pattern on steps 1, 5, 9, 13
        [0, 4, 8, 12].forEach(step => {
          sequencerData[2][step][0] = true; // Kick is first note
        });
        updateGridVisibility();
      }
    });
    
    bassLineBtn.on('pointerdown', () => {
      if (activeTrack === 0) { // Bass track
        // Add simple bass line
        [0, 2, 4, 6].forEach((step, index) => {
          sequencerData[0][step][index % 4] = true;
        });
        updateGridVisibility();
      }
    });
    
    chordBtn.on('pointerdown', () => {
      if (activeTrack === 3) { // Pad track
        // Add chord pattern
        [0, 8].forEach(step => {
          [0, 2, 4].forEach(note => { // C-E-G chord
            sequencerData[3][step][note] = true;
          });
        });
        updateGridVisibility();
      }
    });
    
    clearBtn.on('pointerdown', () => {
      // Clear current track
      for (let step = 0; step < gridCols; step++) {
        for (let note = 0; note < gridRows; note++) {
          sequencerData[activeTrack][step][note] = false;
        }
      }
      updateGridVisibility();
    });
    
    saveBtn.on('pointerdown', () => {
      // Stop playback
      isPlaying = false;
      if (playbackTimer) clearTimeout(playbackTimer);
      
      // Create composition name
      const trackName = `Polyphonic Composition`;
      this.addToInventory(trackName, 1);
      
      // Show completion message
      this.clearButtons();
      this.showDialog(`"${trackName}" saved to inventory!\n\nYour 4-track composition is ready!`);
      this.createButtons([
        { label: 'OK', callback: () => this.closeCurrentScreen() }
      ]);
    });
    
    cancelBtn.on('pointerdown', () => {
      // Stop playback
      isPlaying = false;
      if (playbackTimer) clearTimeout(playbackTimer);
      
      this.clearButtons();
      this.closeCurrentScreen();
    });
  }
  
  // Helper method to play notes for different tracks
  playTrackNote(track, noteIndex, duration, volume = 0.5) {
    try {
      // Ensure audio context is running
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;
      
      // Handle drum instruments
      if (track.name === 'DRUMS' || track.name === 'ACOUSTIC' || track.name === 'ELECTRO' || track.name === 'PERCUSSION') {
        // 808-style drum machine sounds
        switch(noteIndex) {
          case 0: // Kick
            if (track.name === 'ELECTRO') {
              this.play808Kick(now, duration, volume * 1.2, 120); // More electronic kick
            } else if (track.name === 'ACOUSTIC') {
              this.play808Kick(now, duration, volume, 80); // Softer, more acoustic-like kick
            } else if (track.name === 'PERCUSSION') {
              this.play808Tom(now, duration, volume, 60); // Use tom for percussion
            } else {
              this.play808Kick(now, duration, volume);
            }
            break;
          case 1: // Snare
            if (track.name === 'ELECTRO') {
              this.play808Snare(now, duration, volume * 1.2, 0.7); // Sharper snare
            } else if (track.name === 'ACOUSTIC') {
              this.play808Snare(now, duration, volume, 0.3); // More resonant snare
            } else if (track.name === 'PERCUSSION') {
              this.play808Clap(now, duration, volume); // Use clap for percussion
            } else {
              this.play808Snare(now, duration, volume);
            }
            break;
          case 2: // HiHat
            if (track.name === 'ELECTRO') {
              this.play808HiHat(now, duration * 0.5, volume, 8000); // Shorter, higher hihat
            } else if (track.name === 'ACOUSTIC') {
              this.play808HiHat(now, duration * 1.5, volume * 0.8, 6000); // Longer, softer hihat
            } else if (track.name === 'PERCUSSION') {
              this.play808HiHat(now, duration * 0.25, volume * 1.2, 10000); // Very short, bright percussion
            } else {
              this.play808HiHat(now, duration, volume);
            }
            break;
          case 3: // Crash
            if (track.name === 'ELECTRO') {
              this.play808Crash(now, duration * 0.8, volume, 7000); // Electronic crash
            } else if (track.name === 'ACOUSTIC') {
              this.play808Crash(now, duration * 1.5, volume * 0.7, 5000); // Longer crash
            } else if (track.name === 'PERCUSSION') {
              this.play808Ride(now, duration, volume); // Use ride for percussion
            } else {
              this.play808Crash(now, duration, volume);
            }
            break;
          case 4: // Tom1
            if (track.name === 'ELECTRO') {
              this.play808Tom(now, duration, volume, 180); // Higher electronic tom
            } else if (track.name === 'ACOUSTIC') {
              this.play808Tom(now, duration * 1.2, volume * 0.9, 130); // More resonant tom
            } else if (track.name === 'PERCUSSION') {
              this.play808Tom(now, duration, volume * 1.1, 200); // High percussion
            } else {
              this.play808Tom(now, duration, volume, 150);
            }
            break;
          case 5: // Tom2
            if (track.name === 'ELECTRO') {
              this.play808Tom(now, duration, volume, 120); // Mid electronic tom
            } else if (track.name === 'ACOUSTIC') {
              this.play808Tom(now, duration * 1.2, volume * 0.9, 90); // More resonant tom
            } else if (track.name === 'PERCUSSION') {
              this.play808Tom(now, duration, volume * 1.1, 140); // Mid percussion
            } else {
              this.play808Tom(now, duration, volume, 100);
            }
            break;
          case 6: // Ride
            if (track.name === 'ELECTRO') {
              this.play808Ride(now, duration, volume, 7000); // Brighter ride
            } else if (track.name === 'ACOUSTIC') {
              this.play808Ride(now, duration * 1.3, volume * 0.8, 4000); // Warmer ride
            } else if (track.name === 'PERCUSSION') {
              this.play808Crash(now, duration * 0.5, volume, 8000); // Use crash for percussion
            } else {
              this.play808Ride(now, duration, volume);
            }
            break;
          case 7: // Clap
            if (track.name === 'ELECTRO') {
              this.play808Clap(now, duration, volume * 1.2); // Louder clap
            } else if (track.name === 'ACOUSTIC') {
              this.play808Snare(now, duration, volume * 0.7); // Use snare instead for acoustic
            } else if (track.name === 'PERCUSSION') {
              this.play808Clap(now, duration * 0.6, volume * 1.1); // Short, sharp clap
            } else {
              this.play808Clap(now, duration, volume);
            }
            break;
        }
      } else {
        // Melodic instruments
        const noteFrequencies = {
          'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47, 'C3': 130.81,
          'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94, 'C4': 261.63,
          'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25
        };
        
        const noteName = track.notes[noteIndex];
        const frequency = noteFrequencies[noteName] || 440;
        
        // Bass instruments
        if (track.name === 'BASS' || track.name === 'SUB' || track.name === 'PLUCK') {
          if (track.name === 'SUB') {
            // Sub bass - lower, more sine-like
            this.play8BitBass(now, frequency * 0.5, duration, volume, 'sine');
          } else if (track.name === 'PLUCK') {
            // Plucky bass - short attack, quick decay
            this.play8BitBass(now, frequency, duration * 0.5, volume * 1.2, 'triangle');
          } else {
            // Standard bass
            this.play8BitBass(now, frequency, duration, volume);
          }
        }
        // Synth instruments
        else if (track.name === 'SYNTH' || track.name === 'LEAD' || track.name === 'ARP' || track.name === 'KEYS') {
          if (track.name === 'LEAD') {
            // Lead synth - more sawtooth, longer sustain
            this.play8BitSynth(now, frequency, duration * 1.2, volume, 'sawtooth');
          } else if (track.name === 'ARP') {
            // Arpeggiator-like - shorter notes
            this.play8BitSynth(now, frequency, duration * 0.4, volume * 1.1, 'square');
          } else if (track.name === 'KEYS') {
            // Keys - more piano-like
            this.play8BitSynth(now, frequency, duration * 0.8, volume, 'triangle');
          } else {
            // Standard synth
            this.play8BitSynth(now, frequency, duration, volume);
          }
        }
        // Pad instruments
        else if (track.name === 'PAD' || track.name === 'STRINGS' || track.name === 'AMBIENT' || 
                track.name === 'CHOIR' || track.name === 'AURA' || track.name === 'SHIMMER') {
          if (track.name === 'STRINGS') {
            // Strings - more sawtooth, longer attack, slight vibrato
            this.play8BitPad(now, frequency, duration * 1.5, volume, 'sawtooth', 0.03, true);
          } else if (track.name === 'AMBIENT') {
            // Ambient - very long release, lower volume, smooth sine waves
            this.play8BitPad(now, frequency, duration * 3, volume * 0.6, 'sine', 0.2, true);
          } else if (track.name === 'CHOIR') {
            // Choir - warmer, more detuned, vocal-like formants
            this.play8BitPad(now, frequency, duration * 2, volume * 0.75, 'sine', 0.05, true);
          } else if (track.name === 'AURA') {
            // Aura - ethereal atmosphere with wide stereo and very slow attack
            this.play8BitPad(now, frequency, duration * 4, volume * 0.5, 'sine', 0.1, true);
          } else if (track.name === 'SHIMMER') {
            // Shimmer - bright, octave-up harmonics with sparkle
            const shimmerFreq = frequency * 2; // Octave up
            this.play8BitPad(now, shimmerFreq, duration * 2.5, volume * 0.65, 'triangle', 0.15, true);
            // Add main note at lower volume
            this.play8BitPad(now, frequency, duration * 2, volume * 0.3, 'sine', 0.05, true);
          } else {
            // Standard pad - balanced, warm sustain
            this.play8BitPad(now, frequency, duration * 2, volume * 0.8, 'sine', 0.07, true);
          }
        }
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }

  // 808-style drum sounds
  play808Kick(now, duration, volume, freq = 150) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + duration);
    
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(gain);
    gain.connect(this.trackGains.drums);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  play808Snare(now, duration, volume, noiseMix = 0.5) {
    const noise = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();
    const osc = this.audioContext.createOscillator();
    const oscGain = this.audioContext.createGain();
    
    // Create noise buffer
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = buffer;
    noise.connect(noiseGain);
    noiseGain.connect(this.trackGains.drums);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + duration);
    osc.connect(oscGain);
    oscGain.connect(this.trackGains.drums);
    
    noiseGain.gain.setValueAtTime(volume * 0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    oscGain.gain.setValueAtTime(volume * 0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    noise.start(now);
    osc.start(now);
    noise.stop(now + duration);
    osc.stop(now + duration);
  }

  play808HiHat(now, duration, volume, frequency = 7000) {
    const noise = this.audioContext.createBufferSource();
    const noiseFilter = this.audioContext.createBiquadFilter();
    const noiseGain = this.audioContext.createGain();
    
    // Create noise buffer
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = buffer;
    
    // Set up filter
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = frequency;
    noiseFilter.Q.value = 5;
    
    // Set up gain
    noiseGain.gain.setValueAtTime(volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Connect nodes
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.trackGains.drums);
    
    noise.start(now);
  }

  play808Crash(now, duration, volume, frequency = 6000) {
    const noise = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    // Create noise buffer
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = frequency;
    filter.Q.value = 1;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.trackGains.drums);
    
    gain.gain.setValueAtTime(volume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration * 2);
    
    noise.start(now);
    noise.stop(now + duration * 2);
  }

  play808Tom(now, duration, volume, frequency) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.1, now + duration);
    
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(gain);
    gain.connect(this.trackGains.drums);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  play808Ride(now, duration, volume, freq = 2000) {
    const noise = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    // Create noise buffer
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 1;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.trackGains.drums);
    
    gain.gain.setValueAtTime(volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration * 1.5);
    
    noise.start(now);
    noise.stop(now + duration * 1.5);
  }

  play808Clap(now, duration, volume) {
    const noise = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    // Create noise buffer
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.trackGains.drums);
    
    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    noise.start(now);
    noise.stop(now + duration);
  }

  // 8-bit style synth sounds
  play8BitBass(now, frequency, duration, volume, waveType = 'square') {
    const osc = this.audioContext.createOscillator();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();
    
    // Bass oscillator
    osc.type = waveType;
    osc.frequency.setValueAtTime(frequency, now);
    
    // Low pass filter for warmth
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1;
    
    gain.gain.setValueAtTime(volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.trackGains.bass);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  play8BitSynth(now, frequency, duration, volume, waveType = 'sawtooth') {
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc1.type = 'square';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(frequency, now);
    osc2.frequency.setValueAtTime(frequency * 1.01, now); // Slight detune
    
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    
    gain.gain.setValueAtTime(volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.trackGains.synth);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  play8BitPad(now, frequency, duration, volume, waveType = 'sine', detune = 0.05, useChorus = false) {
    // Main oscillators - pads use multiple oscillators for richness
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const osc3 = this.audioContext.createOscillator(); // Third oscillator for more harmonics
    
    // Multiple filters for a richer sound
    const filter1 = this.audioContext.createBiquadFilter();
    const filter2 = this.audioContext.createBiquadFilter();
    
    // Main gain node
    const gain = this.audioContext.createGain();
    
    // Set oscillator types and frequencies
    osc1.type = waveType;
    osc1.frequency.setValueAtTime(frequency, now);
    
    osc2.type = waveType === 'sine' ? 'triangle' : waveType; // Slight variation in waveform
    osc2.frequency.setValueAtTime(frequency * (1 + detune), now); // Slight detune above
    
    osc3.type = waveType === 'sawtooth' ? 'sine' : 'sawtooth'; // Complementary waveform
    osc3.frequency.setValueAtTime(frequency * (1 - detune * 0.7), now); // Slight detune below
    
    // Filter setup for warmth and smoothness
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(3000, now);
    filter1.frequency.exponentialRampToValueAtTime(1500, now + duration); // Filter sweep
    filter1.Q.value = 2;
    
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(2000, now);
    filter2.Q.value = 1;
    
    // Very slow attack and extremely long release for pad sound
    const attackTime = 0.3; // 300ms attack
    const releaseTime = duration * 4; // Very long release - 4x the note duration
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attackTime); // Slow, smooth attack
    gain.gain.setValueAtTime(volume, now + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration + releaseTime); // Very long release
    
    // Connect all oscillators through filters to gain
    osc1.connect(filter1);
    osc2.connect(filter1);
    osc3.connect(filter2);
    
    filter1.connect(gain);
    filter2.connect(gain);
    gain.connect(this.trackGains.pad);
    
    // Add chorus effect for richer pad sounds
    if (useChorus || waveType === 'sine') { // Always use chorus for sine pads
      const chorusOsc = this.audioContext.createOscillator();
      const chorusGain = this.audioContext.createGain();
      
      chorusOsc.type = 'sine';
      chorusOsc.frequency.setValueAtTime(4 + Math.random() * 2, now); // 4-6 Hz chorus rate with randomness
      
      chorusGain.gain.setValueAtTime(8, now); // Stronger chorus effect
      
      chorusOsc.connect(chorusGain);
      chorusGain.connect(osc1.detune);
      chorusGain.connect(osc2.detune);
      
      chorusOsc.start(now);
      chorusOsc.stop(now + duration + releaseTime);
      
      // Add a second slower chorus for more movement
      const chorusOsc2 = this.audioContext.createOscillator();
      const chorusGain2 = this.audioContext.createGain();
      
      chorusOsc2.type = 'sine';
      chorusOsc2.frequency.setValueAtTime(0.5 + Math.random() * 0.5, now); // Slower rate
      
      chorusGain2.gain.setValueAtTime(15, now); // Deeper modulation
      
      chorusOsc2.connect(chorusGain2);
      chorusGain2.connect(osc3.detune);
      
      chorusOsc2.start(now);
      chorusOsc2.stop(now + duration + releaseTime);
    }
    
    // Add reverb simulation using delay and feedback
    const delay = this.audioContext.createDelay();
    const feedbackGain = this.audioContext.createGain();
    const reverbMix = this.audioContext.createGain();
    
    delay.delayTime.value = 0.15;
    feedbackGain.gain.value = 0.25;
    reverbMix.gain.value = 0.2;
    
    gain.connect(delay);
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);
    delay.connect(reverbMix);
    reverbMix.connect(this.trackGains.pad);
    
    // Start and stop all oscillators
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    
    osc1.stop(now + duration + releaseTime);
    osc2.stop(now + duration + releaseTime);
    osc3.stop(now + duration + releaseTime);
  }

  initAudio() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3; // Lower master volume to prevent clipping
      this.masterGain.connect(this.audioContext.destination);
      
      // Create separate gain nodes for each track type
      this.trackGains = {
        bass: this.audioContext.createGain(),
        synth: this.audioContext.createGain(),
        drums: this.audioContext.createGain(),
        pad: this.audioContext.createGain()
      };
      
      // Connect track gains to master
      Object.values(this.trackGains).forEach(gain => {
        gain.connect(this.masterGain);
      });
      
      console.log('Audio system initialized successfully');
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  // New Design Studio - Start with furniture type selection
  openDesignStudioTypeSelection() {
    this.currentScreen = 'design_studio';
    
    // Create object types with their resource requirements and base stats
    const designObjectTypes = [
      { name: 'Chair', resources: { wood: 2, cloth: 1 }, baseComfort: 5, baseStyle: 3 },
      { name: 'Couch', resources: { wood: 3, cloth: 3 }, baseComfort: 8, baseStyle: 5 },
      { name: 'Table', resources: { wood: 4, metal: 1 }, baseSturdiness: 7, baseStyle: 4 },
      { name: 'Wall Art', resources: { cloth: 1, dye: 2 }, baseStyle: 8, basePrestige: 5 },
      { name: 'Light Fixture', resources: { metal: 2, gems: 1 }, baseStyle: 6, baseIllumination: 7 },
      { name: 'Door', resources: { wood: 3, metal: 1 }, baseSecurity: 6, baseStyle: 3 },
      { name: 'Wallpaper', resources: { cloth: 2, dye: 3 }, baseStyle: 7, baseAmbience: 6 },
      { name: 'Dresser', resources: { wood: 5, metal: 1 }, baseStorage: 8, baseStyle: 4 },
      { name: 'Bar', resources: { wood: 6, metal: 2 }, baseSociability: 8, baseStyle: 7 },
      { name: 'Carpet', resources: { cloth: 4, dye: 2 }, baseComfort: 6, baseStyle: 5 }
    ];
    
    // Show selection dialog
    this.showDialog('DESIGN STUDIO\n\nWhat would you like to design?');
    
    // Create buttons in two rows for better layout
    const firstRow = designObjectTypes.slice(0, 5);
    const secondRow = designObjectTypes.slice(5);
    
    const options = [];
    
    // First row options
    firstRow.forEach((item, index) => {
      options.push({
        label: item.name,
        callback: () => this.startDesignProcess(item)
      });
    });
    
    // Add spacing between rows
    options.push({ label: ' ', callback: () => {} });
    
    // Second row options
    secondRow.forEach((item, index) => {
      options.push({
        label: item.name,
        callback: () => this.startDesignProcess(item)
      });
    });
    
    // Add back button
    options.push({ label: 'Cancel', callback: () => this.closeCurrentScreen() });
    
    this.createButtons(options);
  }
  
  // Start the design process for the selected object type
  startDesignProcess(objectType) {
    // Store the selected object type
    this.currentDesignObject = objectType;
    
    // Check if player has required resources
    const hasResources = this.checkDesignResources(objectType.resources);
    
    if (!hasResources) {
      // Show missing resources dialog
      this.showMissingResourcesDialog(objectType);
      return;
    }
    
    // Continue to design interface
    this.showDesignStudio(objectType);
  }
  
  // Check if player has required resources
  checkDesignResources(requiredResources) {
    for (const [resource, amount] of Object.entries(requiredResources)) {
      // Find the resource in player inventory
      const inventoryItem = this.localInventory.find(item => 
        item.name.toLowerCase() === resource.toLowerCase() || 
        item.name.toLowerCase() === resource.toLowerCase() + 's'
      );
      
      // Check if player has enough
      if (!inventoryItem || inventoryItem.quantity < amount) {
        return false;
      }
    }
    
    return true;
  }
  
  // Show dialog for missing resources
  showMissingResourcesDialog(objectType) {
    let resourceText = 'You need:\n';
    
    for (const [resource, amount] of Object.entries(objectType.resources)) {
      // Find current amount in inventory
      const inventoryItem = this.localInventory.find(item => 
        item.name.toLowerCase() === resource.toLowerCase() || 
        item.name.toLowerCase() === resource.toLowerCase() + 's'
      );
      const currentAmount = inventoryItem ? inventoryItem.quantity : 0;
      
      resourceText += `${resource}: ${currentAmount}/${amount}\n`;
    }
    
    this.showDialog(`Insufficient resources to craft ${objectType.name}.\n\n${resourceText}`);
    
    this.createButtons([
      { label: 'Buy Materials', callback: () => this.showMaterialsShop({ name: 'design_studio' }) },
      { label: 'Choose Different Item', callback: () => this.openDesignStudioTypeSelection() },
      { label: 'Exit', callback: () => this.closeCurrentScreen() }
    ]);
  }
  
  // Show the main design studio interface
  showDesignStudio(objectType) {
    this.currentScreen = 'design_studio_editor';
    
    // Create a larger dialog for the design editor
    const boxW = 450, boxH = 350;
    const boxX = (this.game.config.width - boxW) / 2;
    const boxY = (this.game.config.height - boxH) / 2;
    
    // Clear previous dialog and buttons
    this.dialogBg.clear();
    this.dialogBg.fillStyle(0x000000, 0.8);
    this.dialogBg.fillRect(boxX, boxY, boxW, boxH);
    this.dialogBg.setVisible(true);
    this.clearButtons();
    
    // Add title
    const title = this.add.text(boxX + boxW/2, boxY + 15, `DESIGN STUDIO: ${objectType.name.toUpperCase()}`, 
      { font: '16px Arial', fill: '#ffffff', align: 'center' }
    ).setOrigin(0.5).setDepth(1601).setScrollFactor(0);
    this.buttons.push(title);
    
    // Initialize design properties
    this.designProperties = {
      material: 'wood',
      color: 'brown',
      style: 'modern',
      pattern: 'none',
      powerup: 'none',
      powerupLevel: 1,
      stats: {
        comfort: objectType.baseComfort || 0,
        style: objectType.baseStyle || 0,
        sturdiness: objectType.baseSturdiness || 0,
        prestige: objectType.basePrestige || 0,
        illumination: objectType.baseIllumination || 0,
        security: objectType.baseSecurity || 0,
        ambience: objectType.baseAmbience || 0,
        storage: objectType.baseStorage || 0,
        sociability: objectType.baseSociability || 0
      }
    };
    
    // Define available options
    const availableMaterials = ['wood', 'metal', 'glass', 'stone', 'fabric', 'leather'];
    const availableColors = ['brown', 'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple'];
    const availableStyles = ['modern', 'rustic', 'minimalist', 'elegant', 'industrial', 'vintage'];
    const availablePatterns = ['none', 'striped', 'checkered', 'floral', 'geometric'];
    const availablePowerups = [
      { name: 'none', description: 'No powerup' },
      { name: 'comfort', description: 'Increases comfort for users (+2 Joy)' },
      { name: 'inspiration', description: 'Boosts creativity for users (+1 Creativity)' },
      { name: 'focus', description: 'Improves concentration (+1 Productivity)' },
      { name: 'social', description: 'Enhances social interactions (+1 Charisma)' },
      { name: 'prestige', description: 'Increases establishment prestige (+2 Reputation)' }
    ];
    
    // Create preview area for the design
    const previewX = boxX + 30;
    const previewY = boxY + 50;
    const previewWidth = 180;
    const previewHeight = 180;
    
    // Preview background
    const previewBg = this.add.rectangle(previewX, previewY, previewWidth, previewHeight, 0x333333)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    this.buttons.push(previewBg);
    
    // Create placeholder furniture preview based on object type
    this.createFurniturePreview(objectType, previewX, previewY, previewWidth, previewHeight);
    
    // Create customization panels
    const panelX = previewX + previewWidth + 20;
    const panelY = previewY;
    const panelWidth = 190;
    
    // Materials panel
    this.createSelectionPanel('Material', availableMaterials, panelX, panelY, 
      (material) => this.updateDesignProperty('material', material));
    
    // Colors panel
    this.createSelectionPanel('Color', availableColors, panelX, panelY + 60, 
      (color) => this.updateDesignProperty('color', color));
    
    // Style panel
    this.createSelectionPanel('Style', availableStyles, panelX, panelY + 120, 
      (style) => this.updateDesignProperty('style', style));
    
    // Pattern panel
    this.createSelectionPanel('Pattern', availablePatterns, panelX, panelY + 180, 
      (pattern) => this.updateDesignProperty('pattern', pattern));
    
    // Stats display
    this.createStatsDisplay(boxX + 30, boxY + 240, 180, 90);
    
    // Powerup selection
    this.createPowerupSelection(boxX + 230, boxY + 240, 190, 90, availablePowerups);
    
    // Action buttons
    const buttonY = boxY + boxH - 30;
    
    // Create button
    const createBtn = this.add.text(boxX + boxW - 180, buttonY, 'Create Furniture', 
      { font: '14px Arial', fill: '#99ff99' }
    ).setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    createBtn.on('pointerdown', () => {
      this.createFurnitureItem(objectType);
    });
    
    // Cancel button
    const cancelBtn = this.add.text(boxX + boxW - 50, buttonY, 'Cancel', 
      { font: '14px Arial', fill: '#ff9999' }
    ).setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    cancelBtn.on('pointerdown', () => {
      this.openDesignStudioTypeSelection();
    });
    
    this.buttons.push(createBtn, cancelBtn);
  }
  
  // Create a selection panel with options
  createSelectionPanel(title, options, x, y, callback) {
    // Panel title
    const panelTitle = this.add.text(x, y, title, 
      { font: '14px Arial', fill: '#ffffff', fontStyle: 'bold' }
    ).setDepth(1602).setScrollFactor(0);
    
    this.buttons.push(panelTitle);
    
    // Create option buttons
    options.forEach((option, index) => {
      const isEven = index % 2 === 0;
      const row = Math.floor(index / 2);
      
      const btnX = x + (isEven ? 0 : 100);
      const btnY = y + 25 + row * 25;
      
      const optionBtn = this.add.text(btnX, btnY, option, 
        { font: '12px Arial', fill: '#cccccc' }
      ).setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
      // Handle selection
      optionBtn.on('pointerdown', () => {
        // Update all options to unselected style
        this.buttons.forEach(btn => {
          if (btn.text && options.includes(btn.text) && btn.y >= y && btn.y < y + 60) {
            btn.setFill('#cccccc');
          }
        });
        
        // Set this option as selected
        optionBtn.setFill('#ffff00');
        
        // Call the callback with selected option
        callback(option);
      });
      
      // Set initial selection for first option
      if (index === 0) {
        optionBtn.setFill('#ffff00');
      }
      
      this.buttons.push(optionBtn);
    });
  }
  
  // Create a display area for stats
  createStatsDisplay(x, y, width, height) {
    // Background
    const statsBg = this.add.rectangle(x, y, width, height, 0x222222)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Title
    const statsTitle = this.add.text(x + width/2, y + 10, 'STATS', 
      { font: '14px Arial', fill: '#ffffff', fontStyle: 'bold' }
    ).setOrigin(0.5, 0).setDepth(1603).setScrollFactor(0);
    
    this.buttons.push(statsBg, statsTitle);
    
    // Create stat display (only show relevant stats for this object type)
    const relevantStats = Object.entries(this.designProperties.stats)
      .filter(([_, value]) => value > 0)
      .slice(0, 4); // Show at most 4 stats
    
    relevantStats.forEach(([stat, value], index) => {
      const statY = y + 35 + index * 15;
      
      // Stat name
      const statName = this.add.text(x + 10, statY, stat.charAt(0).toUpperCase() + stat.slice(1), 
        { font: '12px Arial', fill: '#cccccc' }
      ).setDepth(1603).setScrollFactor(0);
      
      // Stat value with dynamic color based on value
      const valueColor = value >= 7 ? '#99ff99' : (value >= 4 ? '#ffff99' : '#ff9999');
      const statValue = this.add.text(x + width - 30, statY, value.toString(), 
        { font: '12px Arial', fill: valueColor, align: 'right' }
      ).setDepth(1603).setScrollFactor(0);
      
      this.buttons.push(statName, statValue);
      
      // Store reference to update later
      this.designProperties.statDisplays = this.designProperties.statDisplays || {};
      this.designProperties.statDisplays[stat] = statValue;
    });
  }
  
  // Create powerup selection area
  createPowerupSelection(x, y, width, height, powerups) {
    // Background
    const powerupBg = this.add.rectangle(x, y, width, height, 0x222222)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Title
    const powerupTitle = this.add.text(x + width/2, y + 10, 'POWERUP', 
      { font: '14px Arial', fill: '#ffffff', fontStyle: 'bold' }
    ).setOrigin(0.5, 0).setDepth(1603).setScrollFactor(0);
    
    this.buttons.push(powerupBg, powerupTitle);
    
    // Create dropdown for powerup selection
    const dropdownBg = this.add.rectangle(x + 10, y + 35, width - 20, 20, 0x333333)
      .setOrigin(0, 0).setDepth(1603).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    
    // Dropdown text
    const dropdownText = this.add.text(x + 15, y + 37, 'Select Powerup', 
      { font: '12px Arial', fill: '#ffffff' }
    ).setDepth(1604).setScrollFactor(0);
    
    // Dropdown arrow
    const dropdownArrow = this.add.text(x + width - 25, y + 37, '▼', 
      { font: '12px Arial', fill: '#ffffff' }
    ).setDepth(1604).setScrollFactor(0);
    
    this.buttons.push(dropdownBg, dropdownText, dropdownArrow);
    
    // Create description text area
    const descriptionText = this.add.text(x + 10, y + 65, 'Select a powerup to enhance your furniture', 
      { font: '11px Arial', fill: '#cccccc', wordWrap: { width: width - 20 } }
    ).setDepth(1603).setScrollFactor(0);
    
    this.buttons.push(descriptionText);
    
    // Handle dropdown click
    let isDropdownOpen = false;
    let dropdownMenu = null;
    
    const toggleDropdown = () => {
      isDropdownOpen = !isDropdownOpen;
      
      if (isDropdownOpen) {
        // Create dropdown menu
        dropdownMenu = this.add.container(x + 10, y + 55).setDepth(1605).setScrollFactor(0);
        
        // Background
        const menuBg = this.add.rectangle(0, 0, width - 20, powerups.length * 20, 0x444444)
          .setOrigin(0, 0);
        
        dropdownMenu.add(menuBg);
        
        // Add options
        powerups.forEach((powerup, index) => {
          const optionBg = this.add.rectangle(0, index * 20, width - 20, 20, 0x444444)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
          
          const optionText = this.add.text(5, index * 20 + 2, powerup.name, 
            { font: '12px Arial', fill: '#ffffff' }
          );
          
          // Handle option selection
          optionBg.on('pointerdown', () => {
            // Update dropdown text
            dropdownText.setText(powerup.name);
            
            // Update description
            descriptionText.setText(powerup.description);
            
            // Update design property
            this.updateDesignProperty('powerup', powerup.name);
            
            // Close dropdown
            toggleDropdown();
          });
          
          // Hover effect
          optionBg.on('pointerover', () => {
            optionBg.setFillStyle(0x666666);
          });
          
          optionBg.on('pointerout', () => {
            optionBg.setFillStyle(0x444444);
          });
          
          dropdownMenu.add(optionBg);
          dropdownMenu.add(optionText);
        });
        
        this.buttons.push(dropdownMenu);
      } else if (dropdownMenu) {
        // Remove dropdown menu
        dropdownMenu.destroy();
        dropdownMenu = null;
      }
    };
    
    // Handle dropdown click
    dropdownBg.on('pointerdown', toggleDropdown);
    dropdownArrow.on('pointerdown', toggleDropdown);
    
    // Add powerup level slider if not "none"
    const levelLabel = this.add.text(x + 15, y + height - 25, 'Level:', 
      { font: '12px Arial', fill: '#ffffff' }
    ).setDepth(1603).setScrollFactor(0);
    
    // Level indicator
    const levelValue = this.add.text(x + 60, y + height - 25, '1', 
      { font: '12px Arial', fill: '#ffff99' }
    ).setDepth(1603).setScrollFactor(0);
    
    // Level buttons
    const decreaseBtn = this.add.text(x + 75, y + height - 25, '-', 
      { font: '14px Arial', fill: '#ff9999' }
    ).setDepth(1603).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    const increaseBtn = this.add.text(x + 90, y + height - 25, '+', 
      { font: '14px Arial', fill: '#99ff99' }
    ).setDepth(1603).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    this.buttons.push(levelLabel, levelValue, decreaseBtn, increaseBtn);
    
    // Handle level buttons
    decreaseBtn.on('pointerdown', () => {
      if (this.designProperties.powerupLevel > 1) {
        this.designProperties.powerupLevel--;
        levelValue.setText(this.designProperties.powerupLevel.toString());
      }
    });
    
    increaseBtn.on('pointerdown', () => {
      if (this.designProperties.powerupLevel < 3) {
        this.designProperties.powerupLevel++;
        levelValue.setText(this.designProperties.powerupLevel.toString());
      }
    });
  }
  
  // Create furniture preview based on object type
  createFurniturePreview(objectType, x, y, width, height) {
    // Store reference to preview objects to update later
    this.previewObjects = [];
    
    // Create a placeholder preview based on object type
    switch(objectType.name.toLowerCase()) {
      case 'chair':
        this.createChairPreview(x, y, width, height);
        break;
      case 'couch':
        this.createCouchPreview(x, y, width, height);
        break;
      case 'table':
        this.createTablePreview(x, y, width, height);
        break;
      case 'wall art':
        this.createWallArtPreview(x, y, width, height);
        break;
      case 'light fixture':
        this.createLightFixturePreview(x, y, width, height);
        break;
      case 'door':
        this.createDoorPreview(x, y, width, height);
        break;
      case 'wallpaper':
        this.createWallpaperPreview(x, y, width, height);
        break;
      case 'dresser':
        this.createDresserPreview(x, y, width, height);
        break;
      case 'bar':
        this.createBarPreview(x, y, width, height);
        break;
      case 'carpet':
        this.createCarpetPreview(x, y, width, height);
        break;
      default:
        // Generic box as placeholder
        const placeholder = this.add.rectangle(
          x + width/2, 
          y + height/2, 
          width * 0.6, 
          height * 0.6, 
          0x8B4513
        ).setDepth(1603).setScrollFactor(0);
        
        this.previewObjects.push(placeholder);
        this.buttons.push(placeholder);
        break;
    }
  }
  
  // Update a design property and refresh the preview
  updateDesignProperty(property, value) {
    this.designProperties[property] = value;
    this.updateFurniturePreview();
    this.updateStatsForDesign();
  }
  
  // Update furniture preview based on current properties
  updateFurniturePreview() {
    // Color mapping
    const colorMap = {
      'brown': 0x8B4513,
      'black': 0x000000,
      'white': 0xFFFFFF,
      'red': 0xFF0000,
      'blue': 0x0000FF,
      'green': 0x00FF00,
      'yellow': 0xFFFF00,
      'purple': 0x800080
    };
    
    // Get color based on material and selected color
    let baseColor = colorMap[this.designProperties.color] || 0x8B4513;
    
    // Adjust color based on material
    if (this.designProperties.material === 'metal') {
      // Make metal colors more shiny/desaturated
      baseColor = this.adjustColorForMetal(baseColor);
    } else if (this.designProperties.material === 'glass') {
      // Make glass colors more transparent
      baseColor = this.adjustColorForGlass(baseColor);
    } else if (this.designProperties.material === 'stone') {
      // Make stone colors more grayish
      baseColor = this.adjustColorForStone(baseColor);
    }
    
    // Update all preview objects with new color
    this.previewObjects.forEach(obj => {
      if (obj.setFillStyle) {
        obj.setFillStyle(baseColor);
      }
      
      // Apply pattern if not "none"
      if (this.designProperties.pattern !== 'none') {
        // Pattern effects would be implemented here
      }
    });
  }
  
  // Color adjustment helpers
  adjustColorForMetal(color) {
    // Make color more desaturated and lighter for metal
    return this.adjustColor(color, 0.3, 1.2);
  }
  
  adjustColorForGlass(color) {
    // Make color lighter and more translucent for glass
    return this.adjustColor(color, 0.5, 1.5);
  }
  
  adjustColorForStone(color) {
    // Make color more grayish for stone
    return this.adjustColor(color, 0.2, 0.8);
  }
  
  adjustColor(color, saturationFactor, brightnessFactor) {
    // Extract RGB components
    const r = ((color >> 16) & 0xFF) / 255;
    const g = ((color >> 8) & 0xFF) / 255;
    const b = (color & 0xFF) / 255;
    
    // Calculate HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    // Adjust saturation and brightness
    s = Math.min(1, Math.max(0, s * saturationFactor));
    l = Math.min(1, Math.max(0, l * brightnessFactor));
    
    // Convert back to RGB
    let r1, g1, b1;
    
    if (s === 0) {
      r1 = g1 = b1 = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r1 = hue2rgb(p, q, h + 1/3);
      g1 = hue2rgb(p, q, h);
      b1 = hue2rgb(p, q, h - 1/3);
    }
    
    // Convert back to hex
    return (Math.round(r1 * 255) << 16) | (Math.round(g1 * 255) << 8) | Math.round(b1 * 255);
  }
  
  // Update stats based on selected design properties
  updateStatsForDesign() {
    // Base stat modifiers by material
    const materialModifiers = {
      'wood': { sturdiness: 1, style: 1 },
      'metal': { sturdiness: 3, style: -1 },
      'glass': { style: 2, sturdiness: -1 },
      'stone': { sturdiness: 2, style: 0 },
      'fabric': { comfort: 2, style: 1 },
      'leather': { comfort: 3, style: 2 }
    };
    
    // Style modifiers
    const styleModifiers = {
      'modern': { style: 2 },
      'rustic': { comfort: 1, style: 1 },
      'minimalist': { style: 1 },
      'elegant': { style: 3, prestige: 2 },
      'industrial': { sturdiness: 2, style: -1 },
      'vintage': { style: 2, prestige: 1 }
    };
    
    // Pattern modifiers
    const patternModifiers = {
      'none': {},
      'striped': { style: 1 },
      'checkered': { style: 1 },
      'floral': { style: 2 },
      'geometric': { style: 1, prestige: 1 }
    };
    
    // Get original base stats
    const baseStats = { ...this.currentDesignObject };
    
    // Apply modifiers
    const materialMods = materialModifiers[this.designProperties.material] || {};
    const styleMods = styleModifiers[this.designProperties.style] || {};
    const patternMods = patternModifiers[this.designProperties.pattern] || {};
    
    // Reset stats to base values from object type
    for (const stat in this.designProperties.stats) {
      this.designProperties.stats[stat] = baseStats[`base${stat.charAt(0).toUpperCase() + stat.slice(1)}`] || 0;
    }
    
    // Apply material modifiers
    for (const stat in materialMods) {
      if (this.designProperties.stats[stat] !== undefined) {
        this.designProperties.stats[stat] += materialMods[stat];
      }
    }
    
    // Apply style modifiers
    for (const stat in styleMods) {
      if (this.designProperties.stats[stat] !== undefined) {
        this.designProperties.stats[stat] += styleMods[stat];
      }
    }
    
    // Apply pattern modifiers
    for (const stat in patternMods) {
      if (this.designProperties.stats[stat] !== undefined) {
        this.designProperties.stats[stat] += patternMods[stat];
      }
    }
    
    // Apply powerup effects
    if (this.designProperties.powerup !== 'none') {
      const powerupStat = this.designProperties.powerup;
      const powerupLevel = this.designProperties.powerupLevel;
      
      if (this.designProperties.stats[powerupStat] !== undefined) {
        this.designProperties.stats[powerupStat] += powerupLevel * 2;
      }
    }
    
    // Ensure stats are within reasonable bounds
    for (const stat in this.designProperties.stats) {
      this.designProperties.stats[stat] = Math.max(0, Math.min(10, this.designProperties.stats[stat]));
    }
    
    // Update the UI if stat displays exist
    if (this.designProperties.statDisplays) {
      for (const stat in this.designProperties.statDisplays) {
        const value = this.designProperties.stats[stat];
        const display = this.designProperties.statDisplays[stat];
        
        if (display) {
          // Update text
          display.setText(value.toString());
          
          // Update color based on value
          const valueColor = value >= 7 ? '#99ff99' : (value >= 4 ? '#ffff99' : '#ff9999');
          display.setFill(valueColor);
        }
      }
    }
  }
  
  // Create furniture item and add to inventory
  createFurnitureItem(objectType) {
    // Consume required resources
    for (const [resource, amount] of Object.entries(objectType.resources)) {
      this.removeFromInventory(resource, amount);
    }
    
    // Generate item name
    const itemName = this.generateFurnitureItemName(objectType);
    
    // Determine powerup effect description
    let powerupEffect = '';
    if (this.designProperties.powerup !== 'none') {
      const effectValue = this.designProperties.powerupLevel * 2;
      const statName = this.designProperties.powerup.charAt(0).toUpperCase() + this.designProperties.powerup.slice(1);
      powerupEffect = ` (${statName} +${effectValue})`;
    }
    
    // Add to inventory with stats
    this.addToInventory(itemName + powerupEffect, 1);
    
    // Show completion message
    this.showDialog(`You created "${itemName}"!\n\nYour design has been added to your inventory.${powerupEffect ? '\n\nPowerup: ' + powerupEffect : ''}`);
    this.createButtons([
      { label: 'Create Another', callback: () => this.openDesignStudioTypeSelection() },
      { label: 'Exit', callback: () => this.closeCurrentScreen() }
    ]);
  }
  
  // Generate a descriptive name for the created furniture
  generateFurnitureItemName(objectType) {
    const material = this.designProperties.material.charAt(0).toUpperCase() + this.designProperties.material.slice(1);
    const style = this.designProperties.style.charAt(0).toUpperCase() + this.designProperties.style.slice(1);
    const color = this.designProperties.color.charAt(0).toUpperCase() + this.designProperties.color.slice(1);
    
    // Generate name with pattern if not "none"
    let patternPart = '';
    if (this.designProperties.pattern !== 'none') {
      patternPart = ' ' + this.designProperties.pattern.charAt(0).toUpperCase() + this.designProperties.pattern.slice(1);
    }
    
    return `${color}${patternPart} ${style} ${material} ${objectType.name}`;
  }
  
  // Create a chair preview
  createChairPreview(x, y, width, height) {
    const centerX = x + width/2;
    const centerY = y + height/2;
    
    // Chair back
    const chairBack = this.add.rectangle(
      centerX,
      centerY - height * 0.15,
      width * 0.3,
      height * 0.4,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Chair seat
    const chairSeat = this.add.rectangle(
      centerX,
      centerY + height * 0.05,
      width * 0.3,
      height * 0.1,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Chair legs
    const legWidth = width * 0.05;
    const legHeight = height * 0.2;
    
    const frontLeftLeg = this.add.rectangle(
      centerX - width * 0.12,
      centerY + height * 0.2,
      legWidth,
      legHeight,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    const frontRightLeg = this.add.rectangle(
      centerX + width * 0.12,
      centerY + height * 0.2,
      legWidth,
      legHeight,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    this.previewObjects.push(chairBack, chairSeat, frontLeftLeg, frontRightLeg);
    this.buttons.push(chairBack, chairSeat, frontLeftLeg, frontRightLeg);
  }
  
  // Create a couch preview
  createCouchPreview(x, y, width, height) {
    const centerX = x + width/2;
    const centerY = y + height/2;
    
    // Couch back
    const couchBack = this.add.rectangle(
      centerX,
      centerY - height * 0.1,
      width * 0.6,
      height * 0.3,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Couch seat
    const couchSeat = this.add.rectangle(
      centerX,
      centerY + height * 0.1,
      width * 0.6,
      height * 0.2,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Couch arms
    const leftArm = this.add.rectangle(
      centerX - width * 0.35,
      centerY,
      width * 0.1,
      height * 0.4,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    const rightArm = this.add.rectangle(
      centerX + width * 0.35,
      centerY,
      width * 0.1,
      height * 0.4,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    this.previewObjects.push(couchBack, couchSeat, leftArm, rightArm);
    this.buttons.push(couchBack, couchSeat, leftArm, rightArm);
  }
  
  // Create a table preview
  createTablePreview(x, y, width, height) {
    const centerX = x + width/2;
    const centerY = y + height/2;
    
    // Table top
    const tableTop = this.add.rectangle(
      centerX,
      centerY - height * 0.1,
      width * 0.6,
      height * 0.1,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Table legs
    const legWidth = width * 0.05;
    const legHeight = height * 0.3;
    
    const frontLeftLeg = this.add.rectangle(
      centerX - width * 0.25,
      centerY + height * 0.05,
      legWidth,
      legHeight,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    const frontRightLeg = this.add.rectangle(
      centerX + width * 0.25,
      centerY + height * 0.05,
      legWidth,
      legHeight,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    this.previewObjects.push(tableTop, frontLeftLeg, frontRightLeg);
    this.buttons.push(tableTop, frontLeftLeg, frontRightLeg);
  }
  
  // Create a wall art preview
  createWallArtPreview(x, y, width, height) {
    const centerX = x + width/2;
    const centerY = y + height/2;
    
    // Frame
    const frame = this.add.rectangle(
      centerX,
      centerY,
      width * 0.6,
      height * 0.4,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Canvas/picture inside frame
    const canvas = this.add.rectangle(
      centerX,
      centerY,
      width * 0.5,
      height * 0.3,
      0xFFFFFF
    ).setDepth(1604).setScrollFactor(0);
    
    this.previewObjects.push(frame, canvas);
    this.buttons.push(frame, canvas);
  }
  
  // Create a light fixture preview
  createLightFixturePreview(x, y, width, height) {
    const centerX = x + width/2;
    const centerY = y + height/2;
    
    // Hanging cord
    const cord = this.add.rectangle(
      centerX,
      centerY - height * 0.15,
      width * 0.02,
      height * 0.3,
      0x000000
    ).setDepth(1603).setScrollFactor(0);
    
    // Fixture base
    const fixtureBase = this.add.rectangle(
      centerX,
      centerY + height * 0.05,
      width * 0.3,
      height * 0.1,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Light bulb/shade
    const lightShade = this.add.rectangle(
      centerX,
      centerY + height * 0.05,
      width * 0.25,
      height * 0.25,
      0xFFFF99
    ).setDepth(1604).setScrollFactor(0).setAlpha(0.8);
    
    this.previewObjects.push(cord, fixtureBase, lightShade);
    this.buttons.push(cord, fixtureBase, lightShade);
  }
  
  // Create a door preview
  createDoorPreview(x, y, width, height) {
    const centerX = x + width/2;
    const centerY = y + height/2;
    
    // Door frame
    const doorFrame = this.add.rectangle(
      centerX,
      centerY,
      width * 0.4,
      height * 0.7,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Door handle
    const doorHandle = this.add.circle(
      centerX + width * 0.15,
      centerY,
      width * 0.03,
      0xC0C0C0
    ).setDepth(1604).setScrollFactor(0);
    
    this.previewObjects.push(doorFrame, doorHandle);
    this.buttons.push(doorFrame, doorHandle);
  }
  
  // Create a wallpaper preview
  createWallpaperPreview(x, y, width, height) {
    const centerX = x + width/2;
    const centerY = y + height/2;
    
    // Wallpaper background
    const wallpaper = this.add.rectangle(
      centerX,
      centerY,
      width * 0.7,
      height * 0.7,
      0xFFFFFF
    ).setDepth(1603).setScrollFactor(0);
    
    this.previewObjects.push(wallpaper);
    this.buttons.push(wallpaper);
  }
  
  // Create a dresser preview
  createDresserPreview(x, y, width, height) {
    const centerX = x + width/2;
    const centerY = y + height/2;
    
    // Dresser body
    const dresserBody = this.add.rectangle(
      centerX,
      centerY,
      width * 0.5,
      height * 0.4,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Dresser drawers
    const drawerHeight = height * 0.1;
    const drawers = [];
    
    for (let i = 0; i < 3; i++) {
      const drawer = this.add.rectangle(
        centerX,
        centerY - height * 0.15 + i * drawerHeight,
        width * 0.45,
        drawerHeight - 4,
        0x734A12
      ).setDepth(1604).setScrollFactor(0);
      
      // Drawer handle
      const handle = this.add.rectangle(
        centerX,
        centerY - height * 0.15 + i * drawerHeight,
        width * 0.1,
        height * 0.02,
        0xC0C0C0
      ).setDepth(1605).setScrollFactor(0);
      
      drawers.push(drawer, handle);
      this.buttons.push(drawer, handle);
    }
    
    this.previewObjects.push(dresserBody, ...drawers);
    this.buttons.push(dresserBody);
  }
  
  // Create a bar preview
  createBarPreview(x, y, width, height) {
    const centerX = x + width/2;
    const centerY = y + height/2;
    
    // Bar counter
    const barCounter = this.add.rectangle(
      centerX,
      centerY,
      width * 0.6,
      height * 0.1,
      0x8B4513
    ).setDepth(1604).setScrollFactor(0);
    
    // Bar front panel
    const barFront = this.add.rectangle(
      centerX,
      centerY + height * 0.15,
      width * 0.6,
      height * 0.2,
      0x734A12
    ).setDepth(1603).setScrollFactor(0);
    
    // Bar shelf behind
    const barShelf = this.add.rectangle(
      centerX,
      centerY - height * 0.2,
      width * 0.5,
      height * 0.3,
      0x8B4513
    ).setDepth(1602).setScrollFactor(0);
    
    this.previewObjects.push(barCounter, barFront, barShelf);
    this.buttons.push(barCounter, barFront, barShelf);
  }
  
  // Create a carpet preview
  createCarpetPreview(x, y, width, height) {
    const centerX = x + width/2;
    const centerY = y + height/2;
    
    // Carpet base
    const carpet = this.add.rectangle(
      centerX,
      centerY,
      width * 0.7,
      height * 0.4,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Carpet border
    const carpetBorder = this.add.rectangle(
      centerX,
      centerY,
      width * 0.7,
      height * 0.4,
      0x734A12,
      0
    ).setStrokeStyle(4, 0x734A12).setDepth(1604).setScrollFactor(0);
    
    this.previewObjects.push(carpet, carpetBorder);
    this.buttons.push(carpet, carpetBorder);
  }
} 