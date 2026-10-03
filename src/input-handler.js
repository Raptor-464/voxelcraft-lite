class InputHandler {
    constructor(gameEngine, multiplayerManager) {
        this.gameEngine = gameEngine;
        this.multiplayerManager = multiplayerManager;
        this.keys = {};
        this.selectedBlockIndex = 0;
        this.blockTypes = ['grass', 'dirt', 'stone', 'sand', 'wood', 'brick'];

        this.setupKeyboardInput();
        this.setupMouseInput();
        this.setupTouchInput();
        this.setupHotbar();
    }

    setupKeyboardInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleKeyPress(e);
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    handleKeyPress(e) {
        // Number keys for block selection
        if (e.key >= '1' && e.key <= '6') {
            this.selectedBlockIndex = parseInt(e.key) - 1;
            this.updateHotbarDisplay();
        }

        // Space for jump
        if (e.key === ' ') {
            this.gameEngine.player.velocity.y = this.gameEngine.player.jumpForce;
            this.gameEngine.player.isJumping = true;
        }
    }

    setupMouseInput() {
        document.addEventListener('click', (e) => {
            if (this.isUIElementClicked(e.target)) return;
            this.placeBlock();
        });

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.isUIElementClicked(e.target)) return;
            this.breakBlock();
        });
    }

    placeBlock() {
        const blockInfo = this.gameEngine.getBlockInFront();
        if (!blockInfo) return;

        const blockType = this.blockTypes[this.selectedBlockIndex];
        const adjacentPos = {
            x: blockInfo.position.x + Math.round(blockInfo.normal.x),
            y: blockInfo.position.y + Math.round(blockInfo.normal.y),
            z: blockInfo.position.z + Math.round(blockInfo.normal.z)
        };

        const inventory = this.gameEngine.player.inventory;
        if (inventory.hasItem(blockType)) {
            this.gameEngine.placeBlock(adjacentPos, blockType);
            inventory.removeItem(blockType, 1);
            this.multiplayerManager.broadcastBlockPlaced(adjacentPos, blockType);
        }
    }

    breakBlock() {
        const blockInfo = this.gameEngine.getBlockInFront();
        if (!blockInfo) return;
        this.gameEngine.breakBlock(blockInfo.position);
        this.multiplayerManager.broadcastBlockBroken(blockInfo.position);
    }

    setupTouchInput() {
        const gameContainer = document.getElementById('gameContainer');

        // Movement joystick
        const joystick = document.getElementById('leftJoystick');
        let isJoystickActive = false;

        joystick.addEventListener('touchstart', (e) => {
            isJoystickActive = true;
        });

        joystick.addEventListener('touchmove', (e) => {
            if (!isJoystickActive) return;
            const touch = e.touches[0];
            const rect = joystick.getBoundingClientRect();
            const x = touch.clientX - rect.left - rect.width / 2;
            const y = touch.clientY - rect.top - rect.height / 2;
            const distance = Math.sqrt(x * x + y * y);
            const maxDistance = rect.width / 2;

            if (distance > maxDistance) {
                const ratio = maxDistance / distance;
                const moveX = x * ratio;
                const moveY = y * ratio;
                this.gameEngine.player.velocity.x = moveX * 0.1;
                this.gameEngine.player.velocity.z = moveY * 0.1;
            }
        });

        joystick.addEventListener('touchend', () => {
            isJoystickActive = false;
            this.gameEngine.player.velocity.x = 0;
            this.gameEngine.player.velocity.z = 0;
        });

        // Action buttons
        document.getElementById('jumpBtn').addEventListener('click', () => {
            this.gameEngine.player.velocity.y = this.gameEngine.player.jumpForce;
        });

        document.getElementById('placeBtn').addEventListener('click', () => this.placeBlock());
        document.getElementById('breakBtn').addEventListener('click', () => this.breakBlock());
    }

    setupHotbar() {
        const hotbarSlots = document.getElementById('hotbarSlots');
        this.blockTypes.forEach((blockType, index) => {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            if (index === this.selectedBlockIndex) slot.classList.add('selected');
            slot.textContent = `${index + 1}: ${blockType}`;
            slot.addEventListener('click', () => {
                this.selectedBlockIndex = index;
                this.updateHotbarDisplay();
            });
            hotbarSlots.appendChild(slot);
        });
    }

    updateHotbarDisplay() {
        document.querySelectorAll('.hotbar-slot').forEach((slot, index) => {
            if (index === this.selectedBlockIndex) {
                slot.classList.add('selected');
            } else {
                slot.classList.remove('selected');
            }
        });
    }

    isUIElementClicked(target) {
        return target.closest('.hud') !== null ||
               target.closest('.menu') !== null ||
               target.closest('.touch-controls') !== null;
    }
}
