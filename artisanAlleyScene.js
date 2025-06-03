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
        // Open the Design Studio directly
        // First choose theme, user will then pick material
        this.showDialog(`Choose a design theme:`);
        const designOptions = this.customizationOptions.designThemes.map(theme => ({
          label: `${theme}`,
          callback: () => this.chooseDesignMaterial(theme)
        }));
        this.createButtons(designOptions);
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
    const boxW = 480, boxH = 360; // Reduced from 600x450
    const boxX = (this.game.config.width - boxW) / 2;
    const boxY = (this.game.config.height - boxH) / 2;
    
    // Clear previous dialog
    this.dialogBg.clear();
    this.dialogBg.fillStyle(0x000000, 0.9);
    this.dialogBg.fillRect(boxX, boxY, boxW, boxH);
    this.dialogBg.setVisible(true);
    
    // Add title
    const title = this.add.text(boxX + boxW/2, boxY + 10, '🎵 POLYPHONIC DAW', 
      { font: '14px Arial', fill: '#ffffff', align: 'center' }
    ).setOrigin(0.5).setDepth(1601).setScrollFactor(0);
    this.buttons.push(title);
    
    // Define the 4 tracks with their properties
    const tracks = [
      { 
        name: 'BASS', 
        color: 0xFF0000, 
        notes: ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3'],
        waveform: 'square',
        volume: 0.8
      },
      { 
        name: 'SYNTH', 
        color: 0x00FF00, 
        notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
        waveform: 'sawtooth',
        volume: 0.6
      },
      { 
        name: 'DRUMS', 
        color: 0xFFFF00, 
        notes: ['Kick', 'Snare', 'HiHat', 'Crash', 'Tom1', 'Tom2', 'Ride', 'Clap'],
        waveform: 'square',
        volume: 1.0
      },
      { 
        name: 'PAD', 
        color: 0x00FFFF, 
        notes: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
        waveform: 'sine',
        volume: 0.4
      }
    ];
    
    // Track tab system
    let activeTrack = 0;
    const tabHeight = 25; // Reduced from 30
    const tabWidth = boxW / 4;
    
    // Create track tabs
    const trackTabs = [];
    tracks.forEach((track, index) => {
      const tab = this.add.rectangle(
        boxX + index * tabWidth, 
        boxY + 25, // Moved up
        tabWidth, 
        tabHeight, 
        index === activeTrack ? track.color : 0x444444
      ).setOrigin(0, 0).setDepth(1601).setScrollFactor(0);
      
      const tabLabel = this.add.text(
        boxX + index * tabWidth + tabWidth/2, 
        boxY + 25 + tabHeight/2, 
        track.name, 
        { font: '10px Arial', fill: '#000000', align: 'center' }
      ).setOrigin(0.5).setDepth(1602).setScrollFactor(0);
      
      // Make tab interactive
      tab.setInteractive().on('pointerdown', () => {
        // Switch active track
        activeTrack = index;
        
        // Update tab visuals
        trackTabs.forEach((t, i) => {
          t.tab.setFillStyle(i === activeTrack ? tracks[i].color : 0x444444);
        });
        
        // Update sequencer grid visibility
        updateGridVisibility();
      });
      
      trackTabs.push({ tab, label: tabLabel });
      this.buttons.push(tab, tabLabel);
    });
    
    // Sequencer grid setup - made more compact
    const gridStartX = boxX + 40; // Reduced margin
    const gridStartY = boxY + 60; // Moved up
    const cellWidth = 24; // Reduced from 30
    const cellHeight = 20; // Reduced from 25
    const gridCols = 16; // 16 steps
    const gridRows = 8; // 8 notes per track
    
    // Create step number labels
    for (let col = 0; col < gridCols; col++) {
      const stepLabel = this.add.text(
        gridStartX + col * cellWidth + cellWidth/2, 
        gridStartY - 12, 
        (col + 1).toString(), 
        { font: '8px Arial', fill: '#ffffff', align: 'center' }
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
          gridStartX - 30, 
          gridStartY + noteIndex * cellHeight + cellHeight/2, 
          note, 
          { font: '8px Arial', fill: '#ffffff', align: 'center' }
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
    const controlY = gridStartY + gridRows * cellHeight + 20; // Reduced spacing
    
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
    const playBtn = this.add.text(gridStartX, controlY, '▶ PLAY', { font: '12px Arial', fill: '#00FF00' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    // Stop button
    const stopBtn = this.add.text(gridStartX + 65, controlY, '■ STOP', { font: '12px Arial', fill: '#FF0000' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    // Loop button
    const loopBtn = this.add.text(gridStartX + 125, controlY, '↻ LOOP', { font: '12px Arial', fill: '#FFFF00' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    // BPM controls
    const bpmLabel = this.add.text(gridStartX + 190, controlY, 'BPM:', { font: '12px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0);
    
    const bpmValue = this.add.text(gridStartX + 230, controlY, bpm.toString(), { font: '12px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0);
    
    const bpmDec = this.add.text(gridStartX + 215, controlY, '◀', { font: '12px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    const bpmInc = this.add.text(gridStartX + 260, controlY, '▶', { font: '12px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    this.buttons.push(playBtn, stopBtn, loopBtn, bpmLabel, bpmValue, bpmDec, bpmInc);
    
    // Preset patterns for quick start - moved to single row
    const presetY = controlY + 25;
    const presetLabel = this.add.text(gridStartX, presetY, 'PRESETS:', { font: '10px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0);
    
    const kickDrumBtn = this.add.text(gridStartX + 60, presetY, 'KICK', { font: '9px Arial', fill: '#FFFF99' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    const bassLineBtn = this.add.text(gridStartX + 100, presetY, 'BASS', { font: '9px Arial', fill: '#FFFF99' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    const chordBtn = this.add.text(gridStartX + 140, presetY, 'CHORD', { font: '9px Arial', fill: '#FFFF99' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    const clearBtn = this.add.text(gridStartX + 185, presetY, 'CLEAR', { font: '9px Arial', fill: '#FF9999' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    this.buttons.push(presetLabel, kickDrumBtn, bassLineBtn, chordBtn, clearBtn);
    
    // Main control buttons
    const buttonY = boxY + boxH - 25; // Positioned near bottom
    
    const saveBtn = this.add.text(boxX + boxW - 120, buttonY, 'SAVE TRACK', { font: '12px Arial', fill: '#00FF00' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    const cancelBtn = this.add.text(boxX + boxW - 50, buttonY, 'EXIT', { font: '12px Arial', fill: '#FF0000' })
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
      
      if (track.name === 'DRUMS') {
        // 808-style drum machine sounds
        switch(noteIndex) {
          case 0: // Kick
            this.play808Kick(now, duration, volume);
            break;
          case 1: // Snare
            this.play808Snare(now, duration, volume);
            break;
          case 2: // HiHat
            this.play808HiHat(now, duration, volume);
            break;
          case 3: // Crash
            this.play808Crash(now, duration, volume);
            break;
          case 4: // Tom1
            this.play808Tom(now, duration, volume, 150);
            break;
          case 5: // Tom2
            this.play808Tom(now, duration, volume, 100);
            break;
          case 6: // Ride
            this.play808Ride(now, duration, volume);
            break;
          case 7: // Clap
            this.play808Clap(now, duration, volume);
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
        
        switch(track.name) {
          case 'BASS':
            this.play8BitBass(now, frequency, duration, volume);
            break;
          case 'SYNTH':
            this.play8BitSynth(now, frequency, duration, volume);
            break;
          case 'PAD':
            this.play8BitPad(now, frequency, duration, volume);
            break;
        }
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }

  // 808-style drum sounds
  play808Kick(now, duration, volume) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + duration);
    
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(gain);
    gain.connect(this.trackGains.drums);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  play808Snare(now, duration, volume) {
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

  play808HiHat(now, duration, volume) {
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
    filter.frequency.value = 7000;
    filter.Q.value = 1;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.trackGains.drums);
    
    gain.gain.setValueAtTime(volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    noise.start(now);
    noise.stop(now + duration);
  }

  play808Crash(now, duration, volume) {
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
    
    gain.gain.setValueAtTime(volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    noise.start(now);
    noise.stop(now + duration);
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

  play808Ride(now, duration, volume) {
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
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.trackGains.drums);
    
    gain.gain.setValueAtTime(volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    noise.start(now);
    noise.stop(now + duration);
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
  play8BitBass(now, frequency, duration, volume) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(frequency, now);
    
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

  play8BitSynth(now, frequency, duration, volume) {
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

  play8BitPad(now, frequency, duration, volume) {
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(frequency, now);
    osc2.frequency.setValueAtTime(frequency * 1.02, now); // Slight detune
    
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1;
    
    gain.gain.setValueAtTime(volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration * 3); // Longer release
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.trackGains.pad);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration * 3);
    osc2.stop(now + duration * 3);
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
} 