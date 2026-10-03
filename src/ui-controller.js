class UIController {
    constructor(gameEngine, multiplayerManager) {
        this.gameEngine = gameEngine;
        this.multiplayerManager = multiplayerManager;
        this.setupUI();
        this.updateLoop = setInterval(() => this.updateHUD(), 500);
    }

    setupUI() {
        // Crafting Menu
        const craftingMenu = document.getElementById('craftingMenu');
        const toggleMenu = document.getElementById('toggleMenu');
        const closeMenu = document.getElementById('closeMenu');

        toggleMenu.addEventListener('click', () => this.toggleCraftingMenu());
        closeMenu.addEventListener('click', () => this.closeCraftingMenu());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeCraftingMenu();
        });

        this.setupRecipes();
        this.setupInventory();
        this.setupMultiplayer();
    }

    setupRecipes() {
        const recipes = [
            { name: 'Wooden Planks', input: 'wood', output: 'planks', amount: 1 },
            { name: 'Bricks', input: 'stone', output: 'brick', amount: 2 },
            { name: 'Glass', input: 'sand', output: 'glass', amount: 3 },
            { name: 'Stone Bricks', input: 'stone', output: 'stone_brick', amount: 2 },
            { name: 'Crafting Table', input: 'wood', output: 'crafting_table', amount: 4 },
            { name: 'Chest', input: 'wood', output: 'chest', amount: 8 },
            { name: 'Sword (Wood)', input: 'wood', output: 'wood_sword', amount: 2 },
            { name: 'Pickaxe (Stone)', input: 'stone', output: 'stone_pickaxe', amount: 3 }
        ];

        const recipeGrid = document.getElementById('recipeGrid');
        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <h4>${recipe.name}</h4>
                <p>📥 ${recipe.input}</p>
                <p>📤 ${recipe.output}</p>
                <button>Craft</button>
            `;
            card.querySelector('button').addEventListener('click', () => this.craftItem(recipe));
            recipeGrid.appendChild(card);
        });
    }

    setupInventory() {
        const inventoryBtn = document.createElement('button');
        inventoryBtn.id = 'inventoryBtn';
        inventoryBtn.className = 'menu-btn';
        inventoryBtn.textContent = 'Inventory (I)';
        document.querySelector('.top-right').appendChild(inventoryBtn);

        inventoryBtn.addEventListener('click', () => this.toggleInventory());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'i') this.toggleInventory();
        });
    }

    setupMultiplayer() {
        const multiplayerBtn = document.createElement('button');
        multiplayerBtn.id = 'multiplayerBtn';
        multiplayerBtn.className = 'menu-btn';
        multiplayerBtn.textContent = 'Multiplayer (M)';
        document.querySelector('.top-right').appendChild(multiplayerBtn);

        multiplayerBtn.addEventListener('click', () => this.toggleMultiplayer());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'm') this.toggleMultiplayer();
        });
    }

    toggleCraftingMenu() {
        const menu = document.getElementById('craftingMenu');
        menu.classList.toggle('hidden');
    }

    closeCraftingMenu() {
        document.getElementById('craftingMenu').classList.add('hidden');
    }

    toggleInventory() {
        const menu = document.getElementById('inventoryMenu');
        if (menu.classList.contains('hidden')) {
            this.updateInventoryDisplay();
        }
        menu.classList.toggle('hidden');
    }

    updateInventoryDisplay() {
        const inventoryGrid = document.getElementById('inventoryGrid');
        inventoryGrid.innerHTML = '';
        const items = this.gameEngine.player.inventory.getItems();

        Object.entries(items).forEach(([type, amount]) => {
            const item = document.createElement('div');
            item.className = 'inventory-item';
            item.innerHTML = `
                <h4>${this.formatBlockName(type)}</h4>
                <p>×${amount}</p>
            `;
            inventoryGrid.appendChild(item);
        });
    }

    toggleMultiplayer() {
        const menu = document.getElementById('multiplayerMenu');
        if (menu.classList.contains('hidden')) {
            this.updatePlayersList();
        }
        menu.classList.toggle('hidden');

        const joinBtn = document.getElementById('joinServer');
        const hostBtn = document.getElementById('hostServer');

        hostBtn.addEventListener('click', () => this.hostServer());
        joinBtn.addEventListener('click', () => this.joinServer());
    }

    hostServer() {
        const result = this.multiplayerManager.hostServer();
        alert(`${result.message}\nServer Code: ${result.serverCode}`);
    }

    joinServer() {
        const playerName = document.getElementById('playerName').value || 'Guest';
        const serverCode = document.getElementById('serverCode').value;
        const result = this.multiplayerManager.joinServer(serverCode, playerName);
        alert(result.message);
        this.updatePlayersList();
    }

    updatePlayersList() {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '<strong>Connected Players:</strong>';
        this.multiplayerManager.getConnectedPlayers().forEach(player => {
            const entry = document.createElement('div');
            entry.className = 'player-entry';
            entry.textContent = `${player.name} (${player.id.substring(0, 8)})`;
            playersList.appendChild(entry);
        });
    }

    craftItem(recipe) {
        const inventory = this.gameEngine.player.inventory;
        if (inventory.hasItem(recipe.input, recipe.amount)) {
            inventory.removeItem(recipe.input, recipe.amount);
            inventory.addItem(recipe.output, 1);
            this.updateInventoryDisplay();
            alert(`Crafted 1x ${recipe.name}!`);
        } else {
            alert(`Not enough ${recipe.input}!`);
        }
    }

    updateHUD() {
        // Update coordinates
        const pos = this.gameEngine.player.position;
        document.getElementById('coordsDisplay').textContent =
            `${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)}`;

        // Update time
        const dayNum = this.gameEngine.dayNumber;
        const timeStr = this.gameEngine.getTimeString();
        document.getElementById('timeDisplay').textContent = `Day ${dayNum}, ${timeStr}`;

        // Update day/night icon
        const sunMoon = document.getElementById('sunMoon');
        sunMoon.textContent = this.gameEngine.isDay ? '☀️' : '🌙';

        // Update health and hunger
        document.getElementById('healthDisplay').textContent =
            `${this.gameEngine.player.health}/${this.gameEngine.player.maxHealth}`;
        document.getElementById('hungerDisplay').textContent =
            `${this.gameEngine.player.hunger}/${this.gameEngine.player.maxHunger}`;
    }

    formatBlockName(type) {
        return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
}
