"use strict";

/* =======================================================
   GLOBAL CONSTANTS
======================================================= */
const ZONE_LIST = [
  { name: "Outer Grasslands", mapKey: "OuterGrasslandsMap", backgroundKey: "outerGrasslands", foregroundKey: "outerGrasslandsForeground" },
  { name: "Shady Grove", mapKey: "ShadyGroveMap", backgroundKey: "shadyGrove", foregroundKey: "shadyGroveForeground" },
  { name: "Arid Desert", mapKey: "AridDesertMap", backgroundKey: "aridDesert", foregroundKey: "aridDesertForeground" },
  { name: "Village", mapKey: "villageCommonsMap", backgroundKey: "villageCommons", foregroundKey: "" }
];

// Narrative screen states
const SCREEN_NONE = 0;
const SCREEN_LIQUIDITY = 7;
const SCREEN_MERCHANT = 8;
const SCREEN_ROYAL = 9;
const SCREEN_TINKER = 10;
const SCREEN_CRAFT = 11;
const SCREEN_TRADING = 12;
const SCREEN_BATTLE = 13;
const SCREEN_ARMORY = 14;

const BG_SCALE = 0.3;
const PLAYER_SCALE = 2.5;

/* =======================================================
   GAME CONFIGURATION
======================================================= */
const GAME_CONFIG = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "phaser-game",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [MainGameScene, CampingScene, FishingScene, ArtisanAlleyScene], // Added ArtisanAlleyScene
  pixelArt: true,
  roundPixels: true,
  render: {
    pixelArt: true,
    antialias: false
  }
};

/* =======================================================
   HELPER FUNCTIONS
======================================================= */
function createInitialStats(zoneName, existingOromozi = 1000) {
  return { 
    health: 100, 
    thirst: 100, 
    hunger: 100, 
    stamina: 100, 
    oromozi: existingOromozi, 
    currentZone: zoneName || "" 
  };
}

function updateHUD(scene) {
  if (!scene.hudText || !scene.playerStats) return;
  const s = scene.playerStats;
  scene.hudText.setText(`OROMOZI: ${s.oromozi}`);
}

function showDialog(scene, text) {
  const boxW = 220, boxH = 150;
  const boxX = (scene.game.config.width - boxW) / 2;
  const boxY = (scene.game.config.height - boxH) / 2;
  scene.dialogBg.clear();
  scene.dialogBg.fillStyle(0x000000, 0.8);
  scene.dialogBg.fillRect(boxX, boxY, boxW, boxH);
  scene.dialogText.setPosition(boxX + 10, boxY + 10);
  scene.dialogText.setText(text);
  scene.dialogBg.setVisible(true);
  scene.dialogText.setVisible(true);
  scene.dialogBg.setScrollFactor(0);
  scene.dialogText.setScrollFactor(0);
  scene.dialogBg.setDepth(1600);
  scene.dialogText.setDepth(1601);
}

function hideDialog(scene) {
  scene.dialogBg.clear();
  scene.dialogBg.setVisible(false);
  scene.dialogText.setVisible(false);
  updateHUD(scene);
}

function createButtons(scene, lines) {
  clearButtons(scene);
  const boxW = 220, boxH = 150;
  const boxX = (scene.game.config.width - boxW) / 2;
  const boxY = (scene.game.config.height - boxH) / 2;
  let startX = boxX + 10;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const txt = scene.add.text(startX, boxY + 80 + i * 20, line.label, { font: "12px Arial", fill: "#ffff00" });
    txt.setDepth(1601);
    txt.setInteractive({ useHandCursor: true });
    txt.on("pointerdown", () => line.callback());
    scene.buttons.push(txt);
    txt.setScrollFactor(0);
  }
}

function clearButtons(scene) {
  scene.buttons.forEach(btn => btn.destroy());
  scene.buttons = [];
}

function showModalOverlay(scene) {
  hideModalOverlay(scene);
  const modal = scene.add.rectangle(
    scene.cameras.main.worldView.x,
    scene.cameras.main.worldView.y,
    scene.cameras.main.width,
    scene.cameras.main.height,
    0x000000,
    0.4
  );
  modal.setOrigin(0, 0);
  modal.setScrollFactor(0);
  modal.setDepth(800);
  scene.liquidityOverlay = modal;
}

function hideModalOverlay(scene) {
  if (scene.liquidityOverlay) {
    scene.liquidityOverlay.destroy();
    scene.liquidityOverlay = null;
  }
}

function createScrollableMenu(scene, title, options) {
  const boxW = 220, boxH = 150;
  const boxX = (scene.game.config.width - boxW) / 2;
  const boxY = (scene.game.config.height - boxH) / 2;
  const maxVisible = 6;
  let scrollIndex = 0;

  showDialog(scene, `${title}\n(Use UP/DOWN to scroll, SPACE to select)`);
  scene.dialogBg.fillStyle(0x000000, 0.8);
  scene.dialogBg.fillRect(boxX, boxY, boxW, boxH);

  const updateMenu = () => {
    clearButtons(scene);
    const visibleOptions = options.slice(scrollIndex, scrollIndex + maxVisible);
    visibleOptions.forEach((option, i) => {
      const txt = scene.add.text(boxX + 10, boxY + 80 + i * 20, option.label, { font: "12px Arial", fill: "#ffff00" });
      txt.setDepth(1601);
      txt.setInteractive({ useHandCursor: true });
      txt.on("pointerdown", () => {
        scene.input.keyboard.off("keydown-UP");
        scene.input.keyboard.off("keydown-DOWN");
        scene.input.keyboard.off("keydown-SPACE");
        option.callback();
      });
      scene.buttons.push(txt);
      txt.setScrollFactor(0);
    });
  };

  updateMenu();

  scene.input.keyboard.on("keydown-UP", () => {
    if (scrollIndex > 0) {
      scrollIndex--;
      updateMenu();
    }
  });

  scene.input.keyboard.on("keydown-DOWN", () => {
    if (scrollIndex + maxVisible < options.length) {
      scrollIndex++;
      updateMenu();
    }
  });

  scene.input.keyboard.once("keydown-SPACE", () => {
    scene.input.keyboard.off("keydown-UP");
    scene.input.keyboard.off("keydown-DOWN");
    const selectedIndex = scrollIndex;
    if (options[selectedIndex]) options[selectedIndex].callback();
  });
}

function addToInventory(scene, itemName, quantity = 1) {
  const existing = scene.localInventory.find(i => i.name === itemName);
  if (existing) {
    existing.quantity += quantity;
  } else {
    scene.localInventory.push({ name: itemName, quantity });
  }
}

function removeFromInventory(scene, itemName, quantity = 1) {
  const item = scene.localInventory.find(i => i.name === itemName);
  if (!item) return;
  item.quantity -= quantity;
  if (item.quantity <= 0) {
    const index = scene.localInventory.indexOf(item);
    scene.localInventory.splice(index, 1);
  }
}

/* =======================================================
   LIQUIDITY POOL FUNCTIONS
======================================================= */
function showDepositResourceScreen(scene) {
  const resources = scene.localInventory.filter(item => item.quantity > 0);
  if (!resources.length) {
    alert("No resources available to deposit.");
    showLiquidityPoolOptions(scene);
    return;
  }
  const options = resources.map((resource, index) => ({
    label: `${resource.name} x${resource.quantity}`,
    callback: () => promptDepositDetails(scene, resource.name, index)
  }));
  options.push({ label: "Back", callback: () => showLiquidityPoolOptions(scene) });
  createScrollableMenu(scene, "Select a resource to deposit:", options);
}

function promptDepositDetails(scene, resource, index) {
  clearButtons(scene);
  hideDialog(scene);
  let amount = parseInt(prompt(`Enter deposit amount for ${resource} (units):`, "10"), 10);
  let duration = parseInt(prompt("Enter lockup duration (seconds):", "604800"), 10);
  if (isNaN(amount) || isNaN(duration)) {
    alert("Invalid input.");
    showDepositResourceScreen(scene);
    return;
  }
  let estimatedYield = Math.floor(amount * (duration / 86400) * 50);
  showConfirmDeposit(scene, resource, amount, duration, estimatedYield, index);
}

function showConfirmDeposit(scene, resource, amount, duration, estimatedYield, index) {
  showDialog(scene, `Deposit ${amount} ${resource} for ${duration}s?\nYield: ${estimatedYield} units.\nConfirm?`);
  const options = [
    {
      label: "Yes",
      callback: () => {
        removeFromInventory(scene, resource, amount);
        scene.deposits.push({ amount, duration, startTime: Date.now() });
        alert("Deposit successful (simulated).");
        hideDialog(scene);
        hideModalOverlay(scene);
        scene.narrativeScreen = SCREEN_NONE;
      }
    },
    { label: "No", callback: () => showDepositResourceScreen(scene) }
  ];
  createButtons(scene, options);
}

function showLiquidityPoolOptions(scene) {
  scene.narrativeScreen = SCREEN_LIQUIDITY;
  showModalOverlay(scene);
  const options = [
    { label: "Deposit Resource", callback: () => showDepositResourceScreen(scene) },
    {
      label: "View Deposits & Yield",
      callback: () => {
        const deposits = scene.deposits.map((d, i) => `${i}: ${d.amount} units, ${Math.floor((Date.now() - d.startTime) / 1000)}s`).join("\n");
        alert(`Deposits:\n${deposits || "None"}`);
        showLiquidityPoolOptions(scene);
      }
    },
    { label: "Withdraw Resources", callback: () => showWithdrawResourceScreen(scene) },
    {
      label: "Back",
      callback: () => {
        hideDialog(scene);
        hideModalOverlay(scene);
        scene.narrativeScreen = SCREEN_NONE;
      }
    }
  ];
  createScrollableMenu(scene, "Liquidity Pool Options:", options);
}

function showWithdrawResourceScreen(scene) {
  if (!scene.deposits.length) {
    alert("No deposits to withdraw.");
    showLiquidityPoolOptions(scene);
    return;
  }
  const options = scene.deposits.map((deposit, index) => ({
    label: `${deposit.amount} units (${Math.floor((Date.now() - deposit.startTime) / 1000)}s)`,
    callback: () => {
      const elapsed = (Date.now() - deposit.startTime) / 1000;
      const yieldAmt = Math.floor(deposit.amount * (elapsed / 86400) * 50);
      scene.playerStats.oromozi += deposit.amount + yieldAmt;
      scene.deposits.splice(index, 1);
      alert(`Withdrawn ${deposit.amount} units + ${yieldAmt} yield (simulated).`);
      updateHUD(scene);
      showLiquidityPoolOptions(scene);
    }
  }));
  options.push({ label: "Back", callback: () => showLiquidityPoolOptions(scene) });
  createScrollableMenu(scene, "Select a deposit to withdraw:", options);
}

/* =======================================================
   MERCHANT QUARTER FUNCTIONS
======================================================= */
function showMerchantQuarterOptions(scene) {
  scene.narrativeScreen = SCREEN_MERCHANT;
  showModalOverlay(scene);
  const options = [
    { label: "List Item for Sale", callback: () => showListItemScreen(scene) },
    { label: "Browse Marketplace", callback: () => showBrowseMarketplaceScreen(scene) },
    { label: "View My Listed Items", callback: () => showMyListingsScreen(scene) },
    {
      label: "Back",
      callback: () => {
        hideDialog(scene);
        hideModalOverlay(scene);
        scene.narrativeScreen = SCREEN_NONE;
      }
    }
  ];
  createScrollableMenu(scene, "Merchant Quarter Options:", options);
}

function showListItemScreen(scene) {
  if (!scene.localInventory.length) {
    alert("No items to list.");
    showMerchantQuarterOptions(scene);
    return;
  }
  const options = scene.localInventory.map((item, index) => ({
    label: `${item.name} x${item.quantity}`,
    callback: () => promptListItemDetails(scene, item, index)
  }));
  options.push({ label: "Back", callback: () => showMerchantQuarterOptions(scene) });
  createScrollableMenu(scene, "Select an item to list:", options);
}

function promptListItemDetails(scene, item, index) {
  hideDialog(scene);
  let price = parseInt(prompt(`Enter sale price for ${item.name}:`, "1000"), 10);
  if (isNaN(price)) {
    alert("Invalid price.");
    showListItemScreen(scene);
    return;
  }
  showDialog(scene, `List ${item.name} for ${price} OROMOZI?\nConfirm?`);
  const options = [
    {
      label: "Yes",
      callback: () => {
        scene.listedItems.push({ id: index, item: item.name, quantity: 1, price, nonce: Date.now() });
        removeFromInventory(scene, item.name, 1);
        alert("Listing created (simulated).");
        showMerchantQuarterOptions(scene);
      }
    },
    { label: "No", callback: () => showListItemScreen(scene) }
  ];
  createButtons(scene, options);
}

function showBrowseMarketplaceScreen(scene) {
  const marketItems = [
    { item: "Iron Sword", price: 500 },
    { item: "Wooden Armor", price: 300 },
    { item: "Healing Potion", price: 100 }
  ];
  const options = marketItems.map(item => ({
    label: `${item.item} - ${item.price} OROMOZI`,
    callback: () => {
      if (scene.playerStats.oromozi >= item.price) {
        scene.playerStats.oromozi -= item.price;
        addToInventory(scene, item.item);
        alert(`Purchased ${item.item} (simulated).`);
      } else {
        alert("Insufficient OROMOZI!");
      }
      updateHUD(scene);
      showMerchantQuarterOptions(scene);
    }
  }));
  options.push({ label: "Back", callback: () => showMerchantQuarterOptions(scene) });
  createScrollableMenu(scene, "Browse Marketplace:", options);
}

function showMyListingsScreen(scene) {
  if (!scene.listedItems.length) {
    alert("No listed items.");
    showMerchantQuarterOptions(scene);
    return;
  }
  const options = scene.listedItems.map((listing, index) => ({
    label: `${listing.item} x${listing.quantity} - ${listing.price} OROMOZI`,
    callback: () => showManageListingScreen(scene, listing, index)
  }));
  options.push({ label: "Back", callback: () => showMerchantQuarterOptions(scene) });
  createScrollableMenu(scene, "Your Listings:", options);
}

function showManageListingScreen(scene, listing, index) {
  const options = [
    { label: "Edit Price", callback: () => promptEditPrice(scene, listing, index) },
    {
      label: "Cancel Listing",
      callback: () => {
        addToInventory(scene, listing.item, listing.quantity);
        scene.listedItems.splice(index, 1);
        alert(`Listing cancelled (simulated).`);
        showMerchantQuarterOptions(scene);
      }
    },
    { label: "Back", callback: () => showMyListingsScreen(scene) }
  ];
  createScrollableMenu(scene, `Manage ${listing.item} (${listing.price} OROMOZI):`, options);
}

function promptEditPrice(scene, listing, index) {
  hideDialog(scene);
  let newPrice = parseInt(prompt(`Enter new price for ${listing.item} (current: ${listing.price}):`, listing.price), 10);
  if (isNaN(newPrice)) {
    alert("Invalid price.");
    showManageListingScreen(scene, listing, index);
    return;
  }
  showDialog(scene, `Update to ${newPrice} OROMOZI?\nConfirm?`);
  const options = [
    {
      label: "Yes",
      callback: () => {
        scene.listedItems[index].price = newPrice;
        alert(`Price updated (simulated).`);
        showMerchantQuarterOptions(scene);
      }
    },
    { label: "No", callback: () => showManageListingScreen(scene, listing, index) }
  ];
  createButtons(scene, options);
}

/* =======================================================
   VILLAGE INTERACTION HANDLER
======================================================= */
function handleVillageContractInteraction(scene, obj) {
  switch (obj.name.toLowerCase()) {
    case "liquidity_bank":
      showLiquidityPoolOptions(scene);
      break;
    case "merchant_quarter":
      showMerchantQuarterOptions(scene);
      break;
    case "craftsman_workshop":
      showCraftingWorkshopOptions(scene);
      break;
    case "armory":
      showArmoryOptions(scene);
      break;
    case "scavenger_mode":
      showDialog(scene, "Enter Scavenger Mode?\n(Press SPACE to confirm)");
      scene.input.keyboard.once("keydown-SPACE", () => {
        const targetZone = ZONE_LIST.find(z => z.name === "Outer Grasslands");
        scene.playerStats = createInitialStats(targetZone.name, scene.playerStats.oromozi);
        scene.scene.restart({ zone: targetZone, inventory: scene.localInventory, promptCount: 0 });
      });
      break;
    case "artisans_alley":
      showDialog(scene, "Enter Artisans\nAlley?\nA place to create and customize items using Oromozi.\n(Press SPACE to confirm)");
      scene.input.keyboard.once("keydown-SPACE", () => {
        console.log("Attempting to start ArtisanAlleyScene");
        try {
          scene.scene.start('ArtisanAlleyScene', {
            zone: 'Village', 
            playerStats: scene.playerStats,
            inventory: scene.localInventory
          });
          console.log("ArtisanAlleyScene started successfully");
        } catch (error) {
          console.error("Error starting ArtisanAlleyScene:", error);
        }
      });
      break;
    default:
      console.log("Unknown interaction:", obj.name);
  }
}

/* =======================================================
   PHASER SCENE FUNCTIONS
======================================================= */
function preload() {
  this.load.json("villageCommonsMap", "assets/maps/villageCommonsMap.json");
  this.load.image("villageCommons", "assets/backgrounds/villageCommons.png");
  this.load.spritesheet("player", "assets/sprites/player.png", { frameWidth: 48, frameHeight: 48 });
}

function createScene() {
  const zoneData = ZONE_LIST.find(z => z.name === "Village");
  this.playerStats = createInitialStats(zoneData.name, this.playerStats?.oromozi || 1000);
  this.localInventory = this.scene.settings.data?.inventory || [
    { name: "Bread", quantity: 1 },
    { name: "Iron Sword", quantity: 1 }
  ];
  this.currentZone = "Village";
  this.deposits = [];
  this.listedItems = [];

  this.background = this.add.image(0, 0, zoneData.backgroundKey).setOrigin(0, 0).setScale(BG_SCALE);
  this.physics.world.setBounds(0, 0, this.background.displayWidth, this.background.displayHeight);
  this.cameras.main.setBounds(0, 0, this.background.displayWidth, this.background.displayHeight);

  this.obstacles = this.physics.add.staticGroup();
  this.interactionObjects = this.physics.add.staticGroup();

  const mapData = this.cache.json.get(zoneData.mapKey);
  if (mapData && mapData.layers) {
    mapData.layers.forEach(layer => {
      if (layer.type === "objectgroup" && layer.name === "Object Layer 1") {
        layer.objects.forEach(obj => {
          const rect = this.add.rectangle(obj.x * BG_SCALE, obj.y * BG_SCALE, obj.width * BG_SCALE, obj.height * BG_SCALE, 0xff0000, 0);
          rect.setOrigin(0, 0);
          this.physics.add.existing(rect, true);
          this.obstacles.add(rect);
        });
      } else if (layer.type === "objectgroup" && layer.name.toLowerCase() === "interactions") {
        layer.objects.forEach(obj => {
          const interactiveObj = this.add.rectangle(obj.x * BG_SCALE, obj.y * BG_SCALE, obj.width * BG_SCALE, obj.height * BG_SCALE, 0x00ff00, 0);
          interactiveObj.setOrigin(0, 0);
          this.physics.add.existing(interactiveObj, true);
          interactiveObj.setInteractive();
          interactiveObj.on("pointerdown", () => handleVillageContractInteraction(this, obj));
          this.interactionObjects.add(interactiveObj);
          
          // Add a visible label for the interaction point
          addInteractionLabel(this, obj.name, obj.x * BG_SCALE, obj.y * BG_SCALE, obj.width * BG_SCALE, obj.height * BG_SCALE);
        });
      }
    });
  }

  this.player = this.physics.add.sprite(100 * BG_SCALE, 100 * BG_SCALE, "player").setScale(PLAYER_SCALE * 0.5);
  this.player.setCollideWorldBounds(true);
  this.player.setDepth(2000);
  this.player.body.setSize(16, 16).setOffset(16, 16);

  this.anims.create({ key: "walk-down", frames: this.anims.generateFrameNumbers("player", { start: 18, end: 20 }), frameRate: 10, repeat: -1 });
  this.anims.create({ key: "walk-left", frames: this.anims.generateFrameNumbers("player", { start: 24, end: 26 }), frameRate: 10, repeat: -1 });
  this.anims.create({ key: "walk-right", frames: this.anims.generateFrameNumbers("player", { start: 6, end: 8 }), frameRate: 10, repeat: -1 });
  this.anims.create({ key: "walk-up", frames: this.anims.generateFrameNumbers("player", { start: 12, end: 14 }), frameRate: 10, repeat: -1 });
  this.player.anims.play("walk-down", true);

  this.cameras.main.startFollow(this.player);
  this.cameras.main.setZoom(2);

  this.hudText = this.add.text(10, GAME_CONFIG.height - 20, "", { font: "16px Arial", fill: "#ffffff" }).setScrollFactor(0).setDepth(11000);
  this.dialogBg = this.add.graphics().setDepth(1600).setVisible(false);
  this.dialogText = this.add.text(0, 0, "", { font: "12px Arial", fill: "#ffffff", wordWrap: { width: 200 } }).setDepth(1601).setVisible(false);
  this.buttons = [];
  this.narrativeScreen = SCREEN_NONE;

  this.physics.add.collider(this.player, this.obstacles);
  updateHUD(this);
}

function updateScene(time, delta) {
  if (this.isRestarting) return;
  
  if (!this.player || !this.player.body) return;

  // Update game time
  let gameTime = this.registry.get('gameTime') || 0;
  gameTime += delta / 1000;
  this.registry.set('gameTime', gameTime % this.secondsPerDay);
  const gameHour = (6 + Math.floor(gameTime / this.secondsPerHour)) % 24;
  this.isNight = gameHour >= 20 || gameHour < 6;
  
  // Update time display in HUD with safety checks and proper recreation
  const hour = gameHour % 12 === 0 ? 12 : gameHour % 12;
  const ampm = gameHour < 12 ? "AM" : "PM";
  const timeString = `${hour}:00 ${ampm}`;
  
  try {
    if (this.timeText && this.timeText.active) {
      this.timeText.setText(timeString);
    } else {
      // Create a new timeText if it doesn't exist or was destroyed
      if (this.timeText) this.timeText.destroy();
      
      this.timeText = this.add.text(10, 10, timeString, {
        font: "12px Arial",
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2
      }).setScrollFactor(0).setDepth(12000);
    }
  } catch (error) {
    console.warn("Error with time display, recreating:", error);
    try {
      // Last resort - recreate from scratch with no text
      if (this.timeText) this.timeText.destroy();
      this.timeText = this.add.text(10, 10, "", {
        font: "12px Arial",
        fill: "#ffffff",
      }).setScrollFactor(0).setDepth(12000);
      
      // Set text in next frame
      this.time.delayedCall(100, () => {
        if (this.timeText && this.timeText.active) {
          this.timeText.setText(timeString);
        }
      });
    } catch (err) {
      console.error("Failed to recreate time display:", err);
    }
  }

  // Update day/night transition
  if (this.isNight && !this.wasNight) {
    this.tweens.add({
      targets: this.nightOverlay,
      alpha: 0.8,
      duration: 5000,
      ease: 'Linear'
    });
    
    // Fade in stars
    this.stars.forEach(star => {
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.Between(3, 9) * 0.1,
        duration: 3000,
        ease: 'Linear'
      });
    });
  } else if (!this.isNight && this.wasNight) {
    this.tweens.add({
      targets: this.nightOverlay,
      alpha: 0,
      duration: 5000,
      ease: 'Linear'
    });
    
    // Fade out stars
    this.stars.forEach(star => {
      this.tweens.add({
        targets: star,
        alpha: 0,
        duration: 3000,
        ease: 'Linear'
      });
    });
  }
  this.wasNight = this.isNight;

  // Update player shadow
  if (this.playerShadow) {
    this.playerShadow.setPosition(this.player.x, this.player.y + 12);
  }

  // Clear monsters safely
  if (this.monsters && (!this.isNight || this.currentZone === "Village")) {
    this.monsters.clear(true, true);
  }

  // Handle player death and scene restart
  if (this.playerStats && this.playerStats.health <= 0 && this.currentZone !== "Village" && !this.isDying) {
    console.log("Player died in Scavenger Mode!");
    handlePlayerDeath(this);
    return;
  }

  // Set time to 5:00 PM when 'T' is pressed
  if (Phaser.Input.Keyboard.JustDown(this.keys.t)) {
    this.registry.set('gameTime', 110); // 11 hours * 10 seconds per hour
    console.log("Time set to 5:00 PM");
  }

  // Zone changing shortcut with better transition
  if (Phaser.Input.Keyboard.JustDown(this.keys.z)) {
    console.log("Switching zone, current gameTime:", this.registry.get('gameTime'));
    currentZoneIndex = (currentZoneIndex + 1) % zoneList.length;
    
    // Add transition effect
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(500, () => {
      this.scene.restart({ zone: zoneList[currentZoneIndex], inventory: this.localInventory, promptCount: this.promptCount });
    });
    return;
  }
  
  // Show inventory on I key press (when not in other dialogs)
  if (Phaser.Input.Keyboard.JustDown(this.keys.i) && this.narrativeScreen === SCREEN_NONE) {
    this.narrativeScreen = SCREEN_ITEM_MENU;
    showItemMenu(this);
    return;
  }
}

/* =======================================================
   PHASER SCENE CLASS
======================================================= */
class MainGameScene extends Phaser.Scene {
  constructor() {
    super("MainGameScene");
  }
  preload() { preload.call(this); }
  create() { createScene.call(this); }
  update() { updateScene.call(this); }
}

const game = new Phaser.Game(GAME_CONFIG);

function showArmoryOptions(scene) {
  const options = [
    {
      label: "Manage Equipment",
      callback: () => showEquipmentManagement(scene)
    },
    {
      label: "Upgrade Skills",
      callback: () => showSkillUpgrades(scene)
    },
    {
      label: "Exit",
      callback: () => hideModalOverlay(scene)
    }
  ];
  createScrollableMenu(scene, "Armory", options);
}

function showEquipmentManagement(scene) {
  const equippedItems = scene.playerStats.equippedItems || {};
  const options = [
    {
      label: "Weapons",
      callback: () => showEquipmentCategory(scene, "weapon", equippedItems.weapon)
    },
    {
      label: "Armor",
      callback: () => showEquipmentCategory(scene, "armor", equippedItems.armor)
    },
    {
      label: "Special Moves",
      callback: () => showEquipmentCategory(scene, "special", equippedItems.special)
    },
    {
      label: "Back",
      callback: () => showArmoryOptions(scene)
    }
  ];
  createScrollableMenu(scene, "Equipment Management", options);
}

function showEquipmentCategory(scene, category, currentItem) {
  const inventoryItems = scene.localInventory.filter(item => item.type === category);
  const options = inventoryItems.map(item => ({
    label: `${item.name}${currentItem === item.name ? " (Equipped)" : ""}`,
    callback: () => equipItem(scene, category, item)
  }));
  options.push({
    label: "Back",
    callback: () => showEquipmentManagement(scene)
  });
  createScrollableMenu(scene, `Select ${category.charAt(0).toUpperCase() + category.slice(1)}`, options);
}

function equipItem(scene, category, item) {
  if (!scene.playerStats.equippedItems) {
    scene.playerStats.equippedItems = {};
  }
  scene.playerStats.equippedItems[category] = item.name;
  showEquipmentCategory(scene, category, item.name);
}

function showSkillUpgrades(scene) {
  const skills = [
    { name: "Attack", current: scene.playerStats.attack || 1, cost: 100 },
    { name: "Defense", current: scene.playerStats.defense || 1, cost: 100 },
    { name: "Durability", current: scene.playerStats.durability || 1, cost: 100 },
    { name: "Luck", current: scene.playerStats.luck || 1, cost: 100 },
    { name: "Fortune", current: scene.playerStats.fortune || 1, cost: 100 }
  ];

  const options = skills.map(skill => ({
    label: `${skill.name} (Level ${skill.current}) - ${skill.cost} Oromozi`,
    callback: () => upgradeSkill(scene, skill)
  }));
  options.push({
    label: "Back",
    callback: () => showArmoryOptions(scene)
  });
  createScrollableMenu(scene, "Skill Upgrades", options);
}

function upgradeSkill(scene, skill) {
  const cost = skill.cost * skill.current;
  if (scene.playerStats.oromozi >= cost) {
    scene.playerStats.oromozi -= cost;
    scene.playerStats[skill.name.toLowerCase()] = skill.current + 1;
    updateHUD(scene);
    showSkillUpgrades(scene);
  } else {
    showDialog(scene, `Not enough Oromozi! Need ${cost} but only have ${scene.playerStats.oromozi}`);
  }
}

function addInteractionLabel(scene, name, x, y, width, height) {
  // Format the label name
  let displayName = name.replace(/_/g, ' ');
  
  // Capitalize first letter of each word
  displayName = displayName.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  // Special case for Artisans Alley - add line break
  if (name === 'artisans_alley') {
    displayName = "Artisans\nAlley";
  }
  
  // Create the label with background for better visibility
  const textBg = scene.add.rectangle(x + width/2, y - 15, 120, 30, 0x000000, 0.5);
  textBg.setDepth(199);
  
  const label = scene.add.text(x + width/2, y - 15, displayName, { 
    font: "14px Arial", 
    fill: "#ffffff",
    stroke: "#000000",
    strokeThickness: 2,
    align: 'center'
  });
  
  label.setOrigin(0.5, 0.5);
  label.setDepth(200);
}