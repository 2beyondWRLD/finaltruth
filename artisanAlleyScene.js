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
    // Initialize the music studio DAW
    this.currentScreen = 'music_editor';
    
    // Create a larger dialog for the music studio
    const boxW = 500, boxH = 400;
    const boxX = (this.game.config.width - boxW) / 2;
    const boxY = (this.game.config.height - boxH) / 2;
    
    // Clear previous dialog
    this.dialogBg.clear();
    this.dialogBg.fillStyle(0x000000, 0.8);
    this.dialogBg.fillRect(boxX, boxY, boxW, boxH);
    this.dialogBg.setVisible(true);
    
    // Add title
    const title = this.add.text(boxX + boxW/2, boxY + 15, `8-BIT ${genre.toUpperCase()} MUSIC STUDIO`, 
      { font: '16px Arial', fill: '#ffffff', align: 'center' }
    ).setOrigin(0.5).setDepth(1601).setScrollFactor(0);
    this.buttons.push(title);
    
    // Define musical notes and their frequencies (C4 to B4)
    const noteFrequencies = {
      'C': 261.63,
      'C#': 277.18,
      'D': 293.66,
      'D#': 311.13,
      'E': 329.63,
      'F': 349.23,
      'F#': 369.99,
      'G': 392.00,
      'G#': 415.30,
      'A': 440.00,
      'A#': 466.16,
      'B': 493.88
    };
    
    // Create the sequencer grid
    const gridStartX = boxX + 50;
    const gridStartY = boxY + 60;
    const cellWidth = 25;
    const cellHeight = 20;
    const gridCols = 32; // 32 bars
    const gridRows = 12; // 12 notes
    
    // Store grid cells for interaction
    const gridCells = [];
    
    // Create note labels
    const noteLabels = Object.keys(noteFrequencies).reverse();
    noteLabels.forEach((note, rowIndex) => {
      const label = this.add.text(gridStartX - 30, gridStartY + rowIndex * cellHeight, note, 
        { font: '12px Arial', fill: '#ffffff' }
      ).setDepth(1601).setScrollFactor(0);
      this.buttons.push(label);
    });
    
    // Create bar number labels
    for (let col = 0; col < gridCols; col += 4) {
      const label = this.add.text(gridStartX + col * cellWidth, gridStartY - 20, (col + 1).toString(), 
        { font: '10px Arial', fill: '#ffffff' }
      ).setDepth(1601).setScrollFactor(0);
      this.buttons.push(label);
    }
    
    // Add grid background
    const gridBg = this.add.rectangle(gridStartX, gridStartY, gridCols * cellWidth, gridRows * cellHeight, 0x222222)
      .setOrigin(0, 0).setDepth(1601).setScrollFactor(0);
    this.buttons.push(gridBg);
    
    // Create grid cells
    for (let row = 0; row < gridRows; row++) {
      gridCells[row] = [];
      for (let col = 0; col < gridCols; col++) {
        // Create cell with border
        const cell = this.add.rectangle(
          gridStartX + col * cellWidth, 
          gridStartY + row * cellHeight, 
          cellWidth - 1, 
          cellHeight - 1, 
          0x333333
        ).setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
        
        // Highlight every 4th column for rhythm reference
        if (col % 4 === 0) {
          cell.setFillStyle(0x444444);
        }
        
        // Make cell interactive
        cell.setInteractive().on('pointerdown', () => {
          // Toggle cell state
          const isActive = cell.fillColor !== 0x00FF00;
          
          // If toggling on, deactivate other notes in the same column (only one note per time)
          if (isActive) {
            for (let r = 0; r < gridRows; r++) {
              if (r !== row) {
                gridCells[r][col].setFillStyle(col % 4 === 0 ? 0x444444 : 0x333333);
              }
            }
          }
          
          // Set cell color based on state
          cell.setFillStyle(isActive ? 0x00FF00 : (col % 4 === 0 ? 0x444444 : 0x333333));
          
          // If turning on, play the note for preview
          if (isActive) {
            this.playNote(noteLabels[row], 0.2);
          }
        });
        
        gridCells[row][col] = cell;
        this.buttons.push(cell);
      }
    }
    
    // Create horizontal grid lines
    for (let row = 0; row <= gridRows; row++) {
      const line = this.add.line(
        gridStartX, 
        gridStartY + row * cellHeight, 
        0, 
        0, 
        gridCols * cellWidth, 
        0, 
        0x555555
      ).setOrigin(0, 0).setDepth(1603).setScrollFactor(0);
      this.buttons.push(line);
    }
    
    // Create vertical grid lines
    for (let col = 0; col <= gridCols; col++) {
      const line = this.add.line(
        gridStartX + col * cellWidth, 
        gridStartY, 
        0, 
        0, 
        0, 
        gridRows * cellHeight, 
        0x555555
      ).setOrigin(0, 0).setDepth(1603).setScrollFactor(0);
      this.buttons.push(line);
    }
    
    // Add playback controls
    const controlY = gridStartY + gridRows * cellHeight + 20;
    
    // Play button
    const playBtn = this.add.text(gridStartX, controlY, '▶ Play', { font: '14px Arial', fill: '#99ff99' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    // Stop button
    const stopBtn = this.add.text(gridStartX + 100, controlY, '■ Stop', { font: '14px Arial', fill: '#ff9999' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    // Loop toggle
    const loopToggle = this.add.text(gridStartX + 200, controlY, '↻ Loop: OFF', { font: '14px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    // BPM control
    const bpmLabel = this.add.text(gridStartX + 300, controlY, 'BPM:', { font: '14px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0);
      
    const bpmValue = this.add.text(gridStartX + 350, controlY, '120', { font: '14px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0);
    
    const bpmDec = this.add.text(gridStartX + 340, controlY, '-', { font: '14px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    const bpmInc = this.add.text(gridStartX + 390, controlY, '+', { font: '14px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    this.buttons.push(playBtn, stopBtn, loopToggle, bpmLabel, bpmValue, bpmDec, bpmInc);
    
    // Add pattern presets based on genre
    const presetY = controlY + 40;
    const presetLabel = this.add.text(gridStartX, presetY, 'Presets:', { font: '14px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0);
    this.buttons.push(presetLabel);
    
    // Create preset buttons
    const presets = this.createMusicPresets(genre);
    let presetX = gridStartX + 80;
    
    presets.forEach((preset, index) => {
      const presetBtn = this.add.text(presetX, presetY, preset.name, { font: '12px Arial', fill: '#ffff99' })
        .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
        
      presetBtn.on('pointerdown', () => {
        // Clear current grid
        this.clearMusicGrid(gridCells, gridCols, gridRows);
        
        // Apply preset pattern
        preset.pattern.forEach(note => {
          const rowIndex = noteLabels.indexOf(note.note);
          if (rowIndex !== -1) {
            const col = note.position;
            gridCells[rowIndex][col].setFillStyle(0x00FF00);
          }
        });
      });
      
      this.buttons.push(presetBtn);
      presetX += preset.name.length * 8 + 20; // Space presets based on name length
    });
    
    // Save and cancel buttons
    const buttonY = boxY + boxH - 40;
    
    const clearBtn = this.add.text(boxX + 20, buttonY, 'Clear All', { font: '14px Arial', fill: '#ff9999' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    clearBtn.on('pointerdown', () => {
      this.clearMusicGrid(gridCells, gridCols, gridRows);
    });
    
    const saveBtn = this.add.text(boxX + boxW - 200, buttonY, 'Save Track', { font: '14px Arial', fill: '#99ff99' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    const cancelBtn = this.add.text(boxX + boxW - 100, buttonY, 'Cancel', { font: '14px Arial', fill: '#ff9999' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    this.buttons.push(clearBtn, saveBtn, cancelBtn);
    
    // Playback variables
    let isPlaying = false;
    let playbackCol = 0;
    let looping = false;
    let bpm = 120;
    let playbackTimer = null;
    let playbackMarker = null;
    
    // Playback marker
    playbackMarker = this.add.rectangle(
      gridStartX, 
      gridStartY, 
      cellWidth, 
      gridRows * cellHeight, 
      0xFFFFFF, 
      0.2
    ).setOrigin(0, 0).setDepth(1604).setScrollFactor(0).setVisible(false);
    this.buttons.push(playbackMarker);
    
    // Play button functionality
    playBtn.on('pointerdown', () => {
      if (isPlaying) return;
      
      isPlaying = true;
      playbackMarker.setVisible(true);
      
      // Calculate interval based on BPM (beats per minute)
      // 4 grid columns = 1 beat
      const interval = (60 / bpm) * 250; // milliseconds per column
      
      const playStep = () => {
        if (!isPlaying) return;
        
        // Move marker
        playbackMarker.x = gridStartX + playbackCol * cellWidth;
        
        // Play active notes in current column
        for (let row = 0; row < gridRows; row++) {
          if (gridCells[row][playbackCol].fillColor === 0x00FF00) {
            this.playNote(noteLabels[row], 0.2);
          }
        }
        
        // Advance to next column
        playbackCol++;
        
        // Check for end of sequence
        if (playbackCol >= gridCols) {
          if (looping) {
            playbackCol = 0;
          } else {
            isPlaying = false;
            playbackMarker.setVisible(false);
            return;
          }
        }
        
        // Schedule next step
        playbackTimer = setTimeout(playStep, interval);
      };
      
      // Start from beginning
      playbackCol = 0;
      playStep();
    });
    
    // Stop button functionality
    stopBtn.on('pointerdown', () => {
      isPlaying = false;
      if (playbackTimer) clearTimeout(playbackTimer);
      playbackMarker.setVisible(false);
      playbackCol = 0;
    });
    
    // Loop toggle functionality
    loopToggle.on('pointerdown', () => {
      looping = !looping;
      loopToggle.setText(looping ? '↻ Loop: ON' : '↻ Loop: OFF');
    });
    
    // BPM controls
    bpmDec.on('pointerdown', () => {
      if (bpm > 60) {
        bpm -= 5;
        bpmValue.setText(bpm.toString());
      }
    });
    
    bpmInc.on('pointerdown', () => {
      if (bpm < 240) {
        bpm += 5;
        bpmValue.setText(bpm.toString());
      }
    });
    
    // Save button functionality
    saveBtn.on('pointerdown', () => {
      // Stop playback
      isPlaying = false;
      if (playbackTimer) clearTimeout(playbackTimer);
      
      // Create a track name
      const trackName = `8-bit ${genre} Track`;
      this.addToInventory(trackName, 1);
      
      // Show completion message
      this.clearButtons();
      this.showDialog(`You created "${trackName}"!\nIt has been added to your inventory.`);
      this.createButtons([
        { label: 'OK', callback: () => this.closeCurrentScreen() }
      ]);
    });
    
    // Cancel button functionality
    cancelBtn.on('pointerdown', () => {
      // Stop playback
      isPlaying = false;
      if (playbackTimer) clearTimeout(playbackTimer);
      
      this.clearButtons();
      this.showCustomCreation({ name: 'music_studio', label: 'Music Studio' });
    });
  }
  
  // Helper method to clear the music grid
  clearMusicGrid(gridCells, gridCols, gridRows) {
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        gridCells[row][col].setFillStyle(col % 4 === 0 ? 0x444444 : 0x333333);
      }
    }
  }
  
  // Helper method to create preset patterns based on genre
  createMusicPresets(genre) {
    const presets = [];
    
    switch(genre) {
      case 'upbeat':
        presets.push({
          name: 'Happy Melody',
          pattern: [
            { note: 'C', position: 0 },
            { note: 'E', position: 4 },
            { note: 'G', position: 8 },
            { note: 'C', position: 12 },
            { note: 'A', position: 16 },
            { note: 'G', position: 20 },
            { note: 'E', position: 24 },
            { note: 'C', position: 28 }
          ]
        });
        presets.push({
          name: 'Dance Beat',
          pattern: [
            { note: 'C', position: 0 },
            { note: 'C', position: 8 },
            { note: 'G', position: 16 },
            { note: 'G', position: 24 }
          ]
        });
        break;
        
      case 'mysterious':
        presets.push({
          name: 'Suspense',
          pattern: [
            { note: 'D', position: 0 },
            { note: 'A#', position: 4 },
            { note: 'A', position: 8 },
            { note: 'D#', position: 16 },
            { note: 'D', position: 20 },
            { note: 'A#', position: 24 }
          ]
        });
        presets.push({
          name: 'Enigma',
          pattern: [
            { note: 'B', position: 0 },
            { note: 'E', position: 8 },
            { note: 'G', position: 12 },
            { note: 'F#', position: 16 },
            { note: 'B', position: 24 }
          ]
        });
        break;
        
      case 'epic':
        presets.push({
          name: 'Battle Theme',
          pattern: [
            { note: 'C', position: 0 },
            { note: 'C', position: 4 },
            { note: 'G', position: 8 },
            { note: 'G', position: 12 },
            { note: 'A', position: 16 },
            { note: 'A', position: 20 },
            { note: 'G', position: 24 }
          ]
        });
        presets.push({
          name: 'Triumph',
          pattern: [
            { note: 'C', position: 0 },
            { note: 'E', position: 4 },
            { note: 'G', position: 8 },
            { note: 'C', position: 16 },
            { note: 'D', position: 20 },
            { note: 'E', position: 24 }
          ]
        });
        break;
        
      case 'peaceful':
        presets.push({
          name: 'Lullaby',
          pattern: [
            { note: 'G', position: 0 },
            { note: 'E', position: 8 },
            { note: 'D', position: 16 },
            { note: 'C', position: 24 }
          ]
        });
        presets.push({
          name: 'Gentle Flow',
          pattern: [
            { note: 'C', position: 0 },
            { note: 'E', position: 4 },
            { note: 'G', position: 8 },
            { note: 'E', position: 12 },
            { note: 'C', position: 16 },
            { note: 'E', position: 20 },
            { note: 'G', position: 24 },
            { note: 'E', position: 28 }
          ]
        });
        break;
        
      case 'adventurous':
        presets.push({
          name: 'Quest',
          pattern: [
            { note: 'C', position: 0 },
            { note: 'D', position: 4 },
            { note: 'E', position: 8 },
            { note: 'F', position: 12 },
            { note: 'G', position: 16 },
            { note: 'A', position: 20 },
            { note: 'B', position: 24 },
            { note: 'C', position: 28 }
          ]
        });
        presets.push({
          name: 'Journey',
          pattern: [
            { note: 'E', position: 0 },
            { note: 'G', position: 8 },
            { note: 'A', position: 16 },
            { note: 'B', position: 24 }
          ]
        });
        break;
        
      case 'romantic':
        presets.push({
          name: 'Love Theme',
          pattern: [
            { note: 'C', position: 0 },
            { note: 'E', position: 4 },
            { note: 'A', position: 8 },
            { note: 'G', position: 16 },
            { note: 'F', position: 20 },
            { note: 'E', position: 24 }
          ]
        });
        presets.push({
          name: 'Serenade',
          pattern: [
            { note: 'E', position: 0 },
            { note: 'G#', position: 4 },
            { note: 'B', position: 8 },
            { note: 'A', position: 16 },
            { note: 'B', position: 20 },
            { note: 'E', position: 24 }
          ]
        });
        break;
    }
    
    // Add a universal rhythm pattern
    presets.push({
      name: 'Basic Beat',
      pattern: [
        { note: 'C', position: 0 },
        { note: 'C', position: 8 },
        { note: 'G', position: 16 },
        { note: 'C', position: 24 }
      ]
    });
    
    return presets;
  }
  
  // Helper method to play a note
  playNote(note, duration) {
    try {
      // Create audio context if it doesn't exist
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Define note frequencies (C4 to B4)
      const noteFrequencies = {
        'C': 261.63,
        'C#': 277.18,
        'D': 293.66,
        'D#': 311.13,
        'E': 329.63,
        'F': 349.23,
        'F#': 369.99,
        'G': 392.00,
        'G#': 415.30,
        'A': 440.00,
        'A#': 466.16,
        'B': 493.88
      };
      
      // Create oscillator
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      // Set waveform to square for 8-bit sound
      oscillator.type = 'square';
      
      // Set frequency based on note
      if (noteFrequencies[note]) {
        oscillator.frequency.setValueAtTime(noteFrequencies[note], this.audioContext.currentTime);
      }
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Set envelope
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      // Play note
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.log('Audio playback error:', error);
    }
  }
} 