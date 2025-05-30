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
      { name: 'character_studio', x: 150, y: 100, width: 70, height: 70, label: 'Character Studio' },
      { name: 'fashion_studio', x: 350, y: 150, width: 70, height: 70, label: 'Fashion Studio' },
      { name: 'design_studio', x: 500, y: 100, width: 70, height: 70, label: 'Design Studio' },
      { name: 'music_studio', x: 400, y: 300, width: 70, height: 70, label: 'Music Studio' },
      { name: 'return_to_village', x: 100, y: 400, width: 70, height: 70, label: 'Return to Village' }
    ];
    
    // Create each interaction zone
    interactionPoints.forEach(point => {
      console.log(`Creating interaction zone for ${point.name} at (${point.x}, ${point.y})`);
      
      // Create the interaction zone
      const zone = this.add.rectangle(point.x, point.y, point.width, point.height, 0x00ff00, 0);
      zone.setOrigin(0, 0);
      zone.name = point.name;
      this.physics.add.existing(zone, true);
      zone.setInteractive();
      zone.on("pointerdown", () => this.handleStationInteraction(point.name));
      this.interactionObjects.add(zone);
      
      // Apply debug visualization
      if (this.debugCollision) {
        zone.setFillStyle(0x00ff00, 0.2);
        zone.setStrokeStyle(2, 0x00ff00, 0.8);
      }
      
      // Add visual indicator text
      const label = point.label;
      const indicator = this.add.text(point.x + point.width/2, point.y - 10, label, { 
        font: '10px Arial',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(101);
      
      // Add a permanent visual marker to make the interaction zone more visible
      const marker = this.add.circle(point.x + point.width/2, point.y + point.height/2, 8, 0xffff00, 0.7);
      marker.setDepth(99);
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
    
    // Find the corresponding station type
    const station = this.stationTypes.find(s => s.name === stationName);
    if (station) {
      this.openCraftingStation(station);
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
      // If it's the return portal
      if (nearbyStation === 'return_to_village') {
        this.returnToVillage();
        return;
      }
      
      // Find the corresponding station type
      const station = this.stationTypes.find(s => s.name === nearbyStation);
      if (station) {
        this.openCraftingStation(station);
      }
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
          callback: () => this.createCustomItem(stationType, { skin })
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
  
  chooseFashionColor(style) {
    this.showDialog(`Choose a color for your ${style} fashion item:`);
    
    const options = this.customizationOptions.colors.map(color => ({
      label: `${color}`,
      callback: () => this.createCustomItem('fashion', { style, color })
    }));
    
    options.push({ label: 'Back', callback: () => this.showCustomCreation({ name: 'fashion_studio', label: 'Fashion Studio' }) });
    this.createButtons(options);
  }
  
  chooseDesignMaterial(theme) {
    this.showDialog(`Choose a material for your ${theme} design item:`);
    
    const options = this.customizationOptions.materials.map(material => ({
      label: `${material}`,
      callback: () => this.createCustomItem('design', { theme, material })
    }));
    
    options.push({ label: 'Back', callback: () => this.showCustomCreation({ name: 'design_studio', label: 'Design Studio' }) });
    this.createButtons(options);
  }
  
  createMusicTrack(genre) {
    // Create a predefined track based on the selected genre
    const trackName = `${genre.charAt(0).toUpperCase() + genre.slice(1)} Track`;
    
    this.showDialog(`Creating a ${genre} music track...`);
    
    // Simulate track creation
    setTimeout(() => {
      this.addToInventory(trackName, 1);
      
      this.showDialog(`Created "${trackName}"!\nIt has been added to your inventory.`);
      this.createButtons([
        { label: 'OK', callback: () => this.closeCurrentScreen() }
      ]);
    }, 1000);
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
} 