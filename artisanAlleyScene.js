// ... existing code ...
  // Show the main design studio interface
  showDesignStudio(objectType) {
    this.currentScreen = 'design_studio_editor';
    
    // Create an even smaller dialog for the design editor - scaled down by 15%
    const boxW = 323; // Reduced from 380 by 15%
    const boxH = 238; // Reduced from 280 by 15%
    const boxX = (this.game.config.width - boxW) / 2;
    const boxY = (this.game.config.height - boxH) / 2;
    
    // Clear previous dialog and buttons
    this.dialogBg.clear();
    this.dialogBg.fillStyle(0x000000, 0.8);
    this.dialogBg.fillRect(boxX, boxY, boxW, boxH);
    this.dialogBg.setVisible(true);
    this.clearButtons();
    
    // Add title - smaller font size
    const title = this.add.text(boxX + boxW/2, boxY + 8, `DESIGN STUDIO: ${objectType.name.toUpperCase()}`, 
      { font: '10px Arial', fill: '#ffffff', align: 'center' }
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
    
    // Create preview area for the design - scale down by 15%
    const previewX = boxX + 8;
    const previewY = boxY + 25;
    const previewWidth = 110; // Reduced from 130 by 15%
    const previewHeight = 119; // Reduced from 140 by 15%
    
    // Preview background
    const previewBg = this.add.rectangle(previewX, previewY, previewWidth, previewHeight, 0x333333)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    this.buttons.push(previewBg);
    
    // Create placeholder furniture preview based on object type
    this.createFurniturePreview(objectType, previewX, previewY, previewWidth, previewHeight);
    
    // Create customization panels - adjusted spacing to prevent text overlap
    const panelX = previewX + previewWidth + 10;
    const panelY = previewY;
    const panelWidth = 187; // Adjusted to fit the smaller container
    
    // Materials panel - improved spacing and more compact layout
    this.createCompactSelectionPanel('Material', availableMaterials, panelX, panelY, 
      (material) => this.updateDesignProperty('material', material));
    
    // Colors panel - increased vertical space between panels
    this.createCompactSelectionPanel('Color', availableColors, panelX, panelY + 36, 
      (color) => this.updateDesignProperty('color', color));
    
    // Style panel
    this.createCompactSelectionPanel('Style', availableStyles, panelX, panelY + 72, 
      (style) => this.updateDesignProperty('style', style));
    
    // Pattern panel
    this.createCompactSelectionPanel('Pattern', availablePatterns, panelX, panelY + 108, 
      (pattern) => this.updateDesignProperty('pattern', pattern));
    
    // Stats display - scaled down by 15%
    this.createStatsDisplay(boxX + 8, boxY + 153, 144, 60);
    
    // Powerup selection - adjusted position to prevent overlap
    this.createPowerupSelection(boxX + 161, boxY + 153, 144, 60, availablePowerups);
    
    // Action buttons - adjusted position
    const buttonY = boxY + boxH - 18;
    
    // Create button - reduced font size
    const createBtn = this.add.text(boxX + boxW - 120, buttonY, 'Create Furniture', 
      { font: '10px Arial', fill: '#99ff99' }
    ).setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    createBtn.on('pointerdown', () => {
      this.createFurnitureItem(objectType);
    });
    
    // Cancel button - reduced font size and adjusted position
    const cancelBtn = this.add.text(boxX + boxW - 35, buttonY, 'Cancel', 
      { font: '10px Arial', fill: '#ff9999' }
    ).setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    cancelBtn.on('pointerdown', () => {
      this.openDesignStudioTypeSelection();
    });
    
    this.buttons.push(createBtn, cancelBtn);
  }

  // Create a compact selection panel with options arranged in multiple rows
  createCompactSelectionPanel(title, options, x, y, callback) {
    // Create label
    const label = this.add.text(x, y, title, { font: '10px Arial', fill: '#ffffff' })
      .setDepth(1602).setScrollFactor(0);
    this.buttons.push(label);
    
    // Calculate layout - use smaller sizes and better spacing
    const itemWidth = 36;
    const itemHeight = 10;
    const itemsPerRow = 3;
    const rowSpacing = 3;
    const colSpacing = 4;
    
    // Create options in two rows
    options.forEach((option, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      
      const optionX = x + col * (itemWidth + colSpacing);
      const optionY = y + 11 + row * (itemHeight + rowSpacing);
      
      const optionText = this.add.text(optionX, optionY, option, 
        { font: '8px Arial', fill: '#cccccc', backgroundColor: '#333333', padding: { x: 2, y: 1 } }
      ).setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
      // Highlight the first option of each type as selected by default
      if (index === 0) {
        optionText.setStyle({ fill: '#ffffff', backgroundColor: '#555555' });
      }
      
      optionText.on('pointerdown', () => {
        // Call the callback with the selected option
        callback(option);
        
        // Update visual selection
        this.buttons.forEach(btn => {
          if (btn.text && btn.text.startsWith(option)) {
            btn.setStyle({ fill: '#ffffff', backgroundColor: '#555555' });
          } else if (btn.text && options.includes(btn.text) && title === label.text) {
            btn.setStyle({ fill: '#cccccc', backgroundColor: '#333333' });
          }
        });
      });
      
      this.buttons.push(optionText);
    });
  }

  // Create a more compact display area for stats
  createStatsDisplay(x, y, width, height) {
    // Background
    const statsBg = this.add.rectangle(x, y, width, height, 0x222222)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Title
    const statsTitle = this.add.text(x + width/2, y + 2, 'STATS', 
      { font: '9px Arial', fill: '#ffffff', fontStyle: 'bold' }
    ).setOrigin(0.5, 0).setDepth(1603).setScrollFactor(0);
    
    this.buttons.push(statsBg, statsTitle);
    
    // Create stat display (only show relevant stats for this object type)
    const relevantStats = Object.entries(this.designProperties.stats)
      .filter(([_, value]) => value > 0)
      .slice(0, 6); // Show up to 6 stats in a more compact format
    
    // Arrange stats in two columns with better spacing
    relevantStats.forEach(([stat, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      
      const statX = x + 6 + (column * (width / 2 - 6));
      const statY = y + 14 + (row * 10);
      
      // Stat name - shorter name to prevent overlap
      const shortStatName = stat.length > 8 ? stat.substring(0, 8) : stat;
      const statName = this.add.text(statX, statY, shortStatName.charAt(0).toUpperCase() + shortStatName.slice(1), 
        { font: '8px Arial', fill: '#cccccc' }
      ).setDepth(1603).setScrollFactor(0);
      
      // Stat value with dynamic color based on value
      const valueColor = value >= 7 ? '#99ff99' : (value >= 4 ? '#ffff99' : '#ff9999');
      const statValue = this.add.text(statX + 45, statY, value.toString(), 
        { font: '8px Arial', fill: valueColor, align: 'right' }
      ).setDepth(1603).setScrollFactor(0);
      
      this.buttons.push(statName, statValue);
      
      // Store reference to update later
      this.designProperties.statDisplays = this.designProperties.statDisplays || {};
      this.designProperties.statDisplays[stat] = statValue;
    });
  }

  // Create a more compact powerup selection area
  createPowerupSelection(x, y, width, height, powerups) {
    // Background
    const powerupBg = this.add.rectangle(x, y, width, height, 0x222222)
      .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
    
    // Title
    const powerupTitle = this.add.text(x + width/2, y + 2, 'POWERUP', 
      { font: '9px Arial', fill: '#ffffff', fontStyle: 'bold' }
    ).setOrigin(0.5, 0).setDepth(1603).setScrollFactor(0);
    
    this.buttons.push(powerupBg, powerupTitle);
    
    // Create dropdown for powerup selection
    const dropdownBg = this.add.rectangle(x + 6, y + 14, width - 12, 12, 0x333333)
      .setOrigin(0, 0).setDepth(1603).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    
    // Dropdown text
    const dropdownText = this.add.text(x + 8, y + 15, 'Select Powerup', 
      { font: '8px Arial', fill: '#ffffff' }
    ).setDepth(1604).setScrollFactor(0);
    
    // Dropdown arrow
    const dropdownArrow = this.add.text(x + width - 16, y + 15, '▼', 
      { font: '8px Arial', fill: '#ffffff' }
    ).setDepth(1604).setScrollFactor(0);
    
    this.buttons.push(dropdownBg, dropdownText, dropdownArrow);
    
    // Create description text area (smaller)
    const descriptionText = this.add.text(x + 6, y + 28, 'Select a powerup', 
      { font: '7px Arial', fill: '#cccccc', wordWrap: { width: width - 12 } }
    ).setDepth(1603).setScrollFactor(0);
    
    this.buttons.push(descriptionText);
    
    // Handle dropdown click
    let isDropdownOpen = false;
    let dropdownMenu = null;
    
    const toggleDropdown = () => {
      isDropdownOpen = !isDropdownOpen;
      
      if (isDropdownOpen) {
        // Create dropdown menu (smaller and with fewer options visible at once)
        dropdownMenu = this.add.container(x + 6, y + 26).setDepth(1605).setScrollFactor(0);
        
        // Show only 3 options at a time to save space
        const visibleOptions = Math.min(3, powerups.length);
        
        // Background
        const menuBg = this.add.rectangle(0, 0, width - 12, visibleOptions * 11, 0x444444)
          .setOrigin(0, 0);
        
        dropdownMenu.add(menuBg);
        
        // Add options
        powerups.forEach((powerup, index) => {
          // Only show first few options to save space
          if (index < visibleOptions) {
            const optionBg = this.add.rectangle(0, index * 11, width - 12, 11, 0x444444)
              .setOrigin(0, 0)
              .setInteractive({ useHandCursor: true });
            
            const optionText = this.add.text(3, index * 11 + 2, powerup.name, 
              { font: '7px Arial', fill: '#ffffff' }
            );
            
            // Handle option selection
            optionBg.on('pointerdown', () => {
              // Update dropdown text
              dropdownText.setText(powerup.name);
              
              // Update description (shortened)
              const shortDesc = powerup.description.length > 25 
                ? powerup.description.substring(0, 25) + '...' 
                : powerup.description;
              descriptionText.setText(shortDesc);
              
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
          }
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
    
    // Add powerup level slider if not "none" (more compact)
    const levelLabel = this.add.text(x + 6, y + height - 12, 'Level:', 
      { font: '8px Arial', fill: '#ffffff' }
    ).setDepth(1603).setScrollFactor(0);
    
    // Level indicator
    const levelValue = this.add.text(x + 34, y + height - 12, '1', 
      { font: '8px Arial', fill: '#ffff99' }
    ).setDepth(1603).setScrollFactor(0);
    
    // Level buttons
    const decreaseBtn = this.add.text(x + 44, y + height - 12, '-', 
      { font: '8px Arial', fill: '#ff9999' }
    ).setDepth(1603).setScrollFactor(0).setInteractive({ useHandCursor: true });
    
    const increaseBtn = this.add.text(x + 54, y + height - 12, '+', 
      { font: '8px Arial', fill: '#99ff99' }
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
          width * 0.5, 
          height * 0.5, 
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
  
  // Create a chair preview - scaled down for smaller display
  createChairPreview(x, y, width, height) {
    const centerX = x + width/2;
    const centerY = y + height/2;
    
    // Scale factor to ensure everything fits properly
    const scaleFactor = 0.85; // Additional 15% reduction
    
    // Chair back
    const chairBack = this.add.rectangle(
      centerX,
      centerY - height * 0.1 * scaleFactor,
      width * 0.22 * scaleFactor,
      height * 0.28 * scaleFactor,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Chair seat
    const chairSeat = this.add.rectangle(
      centerX,
      centerY + height * 0.03 * scaleFactor,
      width * 0.22 * scaleFactor,
      height * 0.07 * scaleFactor,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Chair legs - make shorter to prevent overlapping outside the preview area
    const legWidth = width * 0.035 * scaleFactor;
    const legHeight = height * 0.1 * scaleFactor;
    
    const frontLeftLeg = this.add.rectangle(
      centerX - width * 0.09 * scaleFactor,
      centerY + height * 0.1 * scaleFactor,
      legWidth,
      legHeight,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    const frontRightLeg = this.add.rectangle(
      centerX + width * 0.09 * scaleFactor,
      centerY + height * 0.1 * scaleFactor,
      legWidth,
      legHeight,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    this.previewObjects.push(chairBack, chairSeat, frontLeftLeg, frontRightLeg);
    this.buttons.push(chairBack, chairSeat, frontLeftLeg, frontRightLeg);
  }

  // Create a couch preview - scaled down for smaller display
  createCouchPreview(x, y, width, height) {
    const centerX = x + width/2;
    const centerY = y + height/2;
    
    // Scale factor to ensure everything fits properly
    const scaleFactor = 0.85; // Additional 15% reduction
    
    // Couch back
    const couchBack = this.add.rectangle(
      centerX,
      centerY - height * 0.07 * scaleFactor,
      width * 0.45 * scaleFactor,
      height * 0.22 * scaleFactor,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Couch seat
    const couchSeat = this.add.rectangle(
      centerX,
      centerY + height * 0.07 * scaleFactor,
      width * 0.45 * scaleFactor,
      height * 0.13 * scaleFactor,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    // Couch arms
    const leftArm = this.add.rectangle(
      centerX - width * 0.25 * scaleFactor,
      centerY,
      width * 0.07 * scaleFactor,
      height * 0.28 * scaleFactor,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    const rightArm = this.add.rectangle(
      centerX + width * 0.25 * scaleFactor,
      centerY,
      width * 0.07 * scaleFactor,
      height * 0.28 * scaleFactor,
      0x8B4513
    ).setDepth(1603).setScrollFactor(0);
    
    this.previewObjects.push(couchBack, couchSeat, leftArm, rightArm);
    this.buttons.push(couchBack, couchSeat, leftArm, rightArm);
  }

  designStudioEditor(theme, material) {
    // Initialize the furniture design editor
    this.currentScreen = 'design_editor';
    
    // Create a smaller dialog for the design editor
    const boxW = 350, boxH = 280;
    const boxX = (this.game.config.width - boxW) / 2;
    const boxY = (this.game.config.height - boxH) / 2;
    
    // Clear previous dialog
    this.dialogBg.clear();
    this.dialogBg.fillStyle(0x000000, 0.8);
    this.dialogBg.fillRect(boxX, boxY, boxW, boxH);
    this.dialogBg.setVisible(true);
    
    // Add title
    const title = this.add.text(boxX + boxW/2, boxY + 15, `${theme.toUpperCase()} ${material.toUpperCase()} FURNITURE DESIGNER`, 
      { font: '14px Arial', fill: '#ffffff', align: 'center' }
    ).setOrigin(0.5).setDepth(1601).setScrollFactor(0);
    this.buttons.push(title);
    
    // Create the design canvas
    const canvasWidth = 180;
    const canvasHeight = 140;
    const canvasX = boxX + (boxW - canvasWidth) / 2;
    const canvasY = boxY + 40;
    
    // Create the canvas background
    const canvas = this.add.rectangle(canvasX, canvasY, canvasWidth, canvasHeight, 0x333333)
      .setOrigin(0, 0).setDepth(1601).setScrollFactor(0);
    this.buttons.push(canvas);
    
    // Add a grid pattern to the canvas - with fewer grid lines
    for (let x = 0; x <= canvasWidth; x += 30) {
      const line = this.add.line(canvasX + x, canvasY, 0, 0, 0, canvasHeight, 0x555555)
        .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
      this.buttons.push(line);
    }
    
    for (let y = 0; y <= canvasHeight; y += 30) {
      const line = this.add.line(canvasX, canvasY + y, 0, 0, canvasWidth, 0, 0x555555)
        .setOrigin(0, 0).setDepth(1602).setScrollFactor(0);
      this.buttons.push(line);
    }
    
    // Add furniture template based on theme
    let templateGraphic;
    if (theme === 'modern') {
      // Simple, clean lines for modern furniture
      templateGraphic = this.add.rectangle(canvasX + canvasWidth/2, canvasY + canvasHeight/2, canvasWidth * 0.5, canvasHeight * 0.3, 0xFFFFFF, 0.2)
        .setDepth(1602).setScrollFactor(0);
    } else if (theme === 'rustic') {
      // Irregular shape for rustic furniture
      templateGraphic = this.add.rectangle(canvasX + canvasWidth/2, canvasY + canvasHeight/2, canvasWidth * 0.6, canvasHeight * 0.4, 0xFFFFFF, 0.2)
        .setDepth(1602).setScrollFactor(0);
    } else if (theme === 'elegant') {
      // Curves for elegant furniture
      templateGraphic = this.add.rectangle(canvasX + canvasWidth/2, canvasY + canvasHeight/2, canvasWidth * 0.4, canvasHeight * 0.6, 0xFFFFFF, 0.2)
        .setDepth(1602).setScrollFactor(0);
    } else {
      // Default template
      templateGraphic = this.add.rectangle(canvasX + canvasWidth/2, canvasY + canvasHeight/2, canvasWidth * 0.5, canvasHeight * 0.5, 0xFFFFFF, 0.2)
        .setDepth(1602).setScrollFactor(0);
    }
    this.buttons.push(templateGraphic);
    
    // Create color palette
    const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFFFFF, 0x000000];
    let selectedColorIndex = 0;
    
    const colorSize = 15;
    const colorMargin = 5;
    const colorStartX = boxX + 20;
    const colorStartY = canvasY + canvasHeight + 10;
    
    const colorButtons = [];
    
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
    for (let x = 0; x < 6; x++) {
      designPixels[x] = [];
      for (let y = 0; y < 5; y++) {
        designPixels[x][y] = null;
      }
    }
    
    // Make canvas clickable to "paint" pixels
    canvas.setInteractive().on('pointerdown', (pointer) => {
      // Calculate grid cell
      const relativeX = pointer.x - canvasX;
      const relativeY = pointer.y - canvasY;
      
      const gridX = Math.floor(relativeX / 30);
      const gridY = Math.floor(relativeY / 30);
      
      if (gridX >= 0 && gridX < 6 && gridY >= 0 && gridY < 5) {
        // Remove existing pixel if any
        if (designPixels[gridX][gridY]) {
          designPixels[gridX][gridY].destroy();
          designPixels[gridX][gridY] = null;
        }
        
        // Add new pixel with selected color
        const pixel = this.add.rectangle(
          canvasX + gridX * 30 + 2, 
          canvasY + gridY * 30 + 2, 
          26, 
          26, 
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
      for (let x = 0; x < 6; x++) {
        for (let y = 0; y < 5; y++) {
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
    const saveBtn = this.add.text(boxX + boxW - 120, buttonY, 'Save Design', { font: '12px Arial', fill: '#99ff99' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    saveBtn.on('pointerdown', () => {
      // Check if any pixels were drawn
      let hasPixels = false;
      for (let x = 0; x < 6; x++) {
        for (let y = 0; y < 5; y++) {
          if (designPixels[x][y]) {
            hasPixels = true;
            break;
          }
        }
        if (hasPixels) break;
      }
      
      if (!hasPixels) {
        this.showDialog('Please add at least one colored pixel to your design.');
        return;
      }
      
      // Save the design (add to inventory with bonus stats)
      this.addToInventory(`${theme} ${material} Furniture Design`, 1);
      
      // Show completion message
      this.showDialog(`Your ${theme} ${material} furniture design has been saved to your inventory!`);
      
      // Close the design editor
      this.closeCurrentScreen();
    });
    
    this.buttons.push(saveBtn);
    
    // Cancel button
    const cancelBtn = this.add.text(boxX + boxW - 50, buttonY, 'Cancel', { font: '12px Arial', fill: '#ff9999' })
      .setDepth(1602).setScrollFactor(0).setInteractive({ useHandCursor: true });
      
    cancelBtn.on('pointerdown', () => {
      this.closeCurrentScreen();
    });
    
    this.buttons.push(cancelBtn);
  }
// ... existing code ... 