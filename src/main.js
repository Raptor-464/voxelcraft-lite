// Initialize game
let gameEngine;
let multiplayerManager;
let uiController;
let inputHandler;

window.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('gameContainer');

    // Initialize core systems
    gameEngine = new GameEngine(gameContainer);
    multiplayerManager = new MultiplayerManager();
    uiController = new UIController(gameEngine, multiplayerManager);
    inputHandler = new InputHandler(gameEngine, multiplayerManager);

    // Add initial player to multiplayer
    multiplayerManager.connectedPlayers.set(multiplayerManager.playerId, {
        id: multiplayerManager.playerId,
        name: multiplayerManager.playerName,
        position: gameEngine.player.position
    });

    console.log('🎮 VoxelCraft initialized successfully!');
    console.log('Player Name:', multiplayerManager.playerName);
    console.log('Controls: WASD=Move, Space=Jump, 1-6=BlockSelect, ESC=Menu, I=Inventory, M=Multiplayer');
});

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Game paused (window minimized)');
    } else {
        console.log('Game resumed');
    }
});
