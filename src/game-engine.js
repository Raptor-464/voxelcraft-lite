class GameEngine {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 300, 500);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(100, 80, 100);
        this.camera.lookAt(100, 50, 100);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.setupLighting();
        this.world = new World(this.scene);
        this.player = new Player(this.scene, this.camera);
        this.gameTime = 0;
        this.dayLength = 1200; // seconds for full day
        this.isDay = true;
        this.dayNumber = 1;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.setupEvents();
        this.animate();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(500, 300, 500);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.camera.left = -500;
        this.sunLight.shadow.camera.right = 500;
        this.sunLight.shadow.camera.top = 500;
        this.sunLight.shadow.camera.bottom = -500;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.scene.add(this.sunLight);
    }

    setupEvents() {
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    updateDayNightCycle(deltaTime) {
        this.gameTime += deltaTime;
        const cycleProgress = (this.gameTime % this.dayLength) / this.dayLength;
        const sunAngle = cycleProgress * Math.PI * 2;

        this.sunLight.position.x = Math.cos(sunAngle) * 400;
        this.sunLight.position.y = Math.sin(sunAngle) * 300 + 150;
        this.sunLight.position.z = 300;

        const lightIntensity = Math.max(0.2, Math.sin(sunAngle));
        this.sunLight.intensity = lightIntensity;

        const wasDay = this.isDay;
        this.isDay = Math.sin(sunAngle) > 0;
        if (wasDay !== this.isDay) {
            this.dayNumber += this.isDay ? 1 : 0;
        }

        const skyColor = this.isDay ?
            new THREE.Color().lerpColors(
                new THREE.Color(0x87CEEB),
                new THREE.Color(0xFFAA00),
                Math.abs(Math.sin(sunAngle))
            ) :
            new THREE.Color(0x1a1a2e);
        this.scene.background = skyColor;
        this.scene.fog.color = skyColor;
    }

    getTimeString() {
        const cycleProgress = (this.gameTime % this.dayLength) / this.dayLength;
        const hour = Math.floor(cycleProgress * 24);
        const minute = Math.floor((cycleProgress * 24 - hour) * 60);
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    placeBlock(position, blockType) {
        this.world.setBlock(position, blockType);
    }

    breakBlock(position) {
        const block = this.world.getBlock(position);
        if (block && block.type !== 'air') {
            this.player.inventory.addItem(block.type, 1);
            this.world.setBlock(position, 'air');
        }
    }

    getBlockInFront() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        for (let i = 0; i < intersects.length; i++) {
            const object = intersects[i].object;
            if (object.userData && object.userData.blockPosition) {
                return {
                    position: object.userData.blockPosition,
                    normal: intersects[i].normal
                };
            }
        }
        return null;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = 0.016; // ~60fps
        this.updateDayNightCycle(deltaTime);
        this.player.update(deltaTime);
        this.world.update(this.player.camera.position);

        this.renderer.render(this.scene, this.camera);
    }
}

class World {
    constructor(scene) {
        this.scene = scene;
        this.blockSize = 2;
        this.chunks = new Map();
        this.chunkSize = 32;
        this.renderDistance = 3;
        this.blocks = new Map();
        this.meshes = new Map();
        this.blockTypes = {
            'air': { color: 0x87CEEB, solid: false },
            'grass': { color: 0x2ecc71, solid: true },
            'dirt': { color: 0x8B4513, solid: true },
            'stone': { color: 0x808080, solid: true },
            'sand': { color: 0xf4d03f, solid: true },
            'wood': { color: 0x704214, solid: true },
            'leaves': { color: 0x27ae60, solid: true },
            'brick': { color: 0xc0392b, solid: true },
            'glass': { color: 0x87CEEB, solid: true },
            'water': { color: 0x3498db, solid: false },
            'coal': { color: 0x1a1a1a, solid: true },
            'iron': { color: 0xa0a0a0, solid: true },
            'gold': { color: 0xffd700, solid: true },
            'diamond': { color: 0x00bfff, solid: true }
        };

        this.generateWorld();
    }

    generateWorld() {
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.generateChunk(x, z);
            }
        }
    }

    generateChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        if (this.chunks.has(chunkKey)) return;

        const startX = chunkX * this.chunkSize;
        const startZ = chunkZ * this.chunkSize;

        for (let x = startX; x < startX + this.chunkSize; x++) {
            for (let z = startZ; z < startZ + this.chunkSize; z++) {
                const height = this.getTerrainHeight(x, z);
                for (let y = 0; y <= height; y++) {
                    let blockType = 'stone';
                    if (y === height) blockType = 'grass';
                    else if (y === height - 1 || y === height - 2) blockType = 'dirt';
                    else if (y < height * 0.3) blockType = Math.random() > 0.85 ? 'coal' : 'stone';
                    else if (y < height * 0.15) blockType = Math.random() > 0.9 ? 'diamond' : 'stone';

                    if (Math.random() < 0.02 && blockType === 'grass') blockType = 'wood';
                    if (blockType === 'wood' && Math.random() < 0.3) this.setBlock({ x, y: y + 1, z }, 'leaves');

                    this.setBlock({ x, y, z }, blockType);
                }
            }
        }
        this.chunks.set(chunkKey, true);
    }

    getTerrainHeight(x, z) {
        const scale = 0.05;
        let height = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxHeight = 0;

        for (let i = 0; i < 4; i++) {
            height += this.perlinNoise(x * scale * frequency, z * scale * frequency) * amplitude * 30;
            maxHeight += 30 * amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        return Math.max(5, Math.min(60, Math.floor(height + 30)));
    }

    perlinNoise(x, z) {
        const xi = Math.floor(x) & 255;
        const zi = Math.floor(z) & 255;
        const xf = x - Math.floor(x);
        const zf = z - Math.floor(z);
        const u = xf * xf * (3.0 - 2.0 * xf);
        const v = zf * zf * (3.0 - 2.0 * zf);
        return Math.sin(xi + zi * 73) * 0.5 + 0.5;
    }

    setBlock(pos, type) {
        const key = `${pos.x},${pos.y},${pos.z}`;
        this.blocks.set(key, { type, pos });
        this.updateBlockVisuals(pos);
    }

    getBlock(pos) {
        const key = `${pos.x},${pos.y},${pos.z}`;
        return this.blocks.get(key) || { type: 'air', pos };
    }

    updateBlockVisuals(pos) {
        const meshKey = `${pos.x},${pos.y},${pos.z}`;
        if (this.meshes.has(meshKey)) {
            this.scene.remove(this.meshes.get(meshKey));
            this.meshes.delete(meshKey);
        }

        const block = this.getBlock(pos);
        if (block.type === 'air') return;

        const geometry = new THREE.BoxGeometry(this.blockSize, this.blockSize, this.blockSize);
        const material = new THREE.MeshPhongMaterial({
            color: this.blockTypes[block.type]?.color || 0xffffff
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(pos.x * this.blockSize, pos.y * this.blockSize, pos.z * this.blockSize);
        mesh.userData.blockPosition = pos;

        this.scene.add(mesh);
        this.meshes.set(meshKey, mesh);
    }

    update(playerPos) {
        const playerChunkX = Math.floor(playerPos.x / this.chunkSize / this.blockSize);
        const playerChunkZ = Math.floor(playerPos.z / this.chunkSize / this.blockSize);

        for (let x = playerChunkX - this.renderDistance; x <= playerChunkX + this.renderDistance; x++) {
            for (let z = playerChunkZ - this.renderDistance; z <= playerChunkZ + this.renderDistance; z++) {
                this.generateChunk(x, z);
            }
        }
    }
}

class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.velocity = new THREE.Vector3();
        this.position = new THREE.Vector3(50, 100, 50);
        this.isJumping = false;
        this.moveSpeed = 1;
        this.jumpForce = 0.5;
        this.gravity = -0.02;
        this.health = 20;
        this.maxHealth = 20;
        this.hunger = 20;
        this.maxHunger = 20;
        this.inventory = new Inventory();

        // Default starting items
        this.inventory.addItem('grass', 64);
        this.inventory.addItem('wood', 32);
        this.inventory.addItem('stone', 48);
    }

    update(deltaTime) {
        this.velocity.y += this.gravity;
        this.position.add(this.velocity);

        this.camera.position.lerp(this.position.clone().add(new THREE.Vector3(0, 10, 0)), 0.1);
    }
}

class Inventory {
    constructor() {
        this.items = {};
    }

    addItem(type, amount) {
        if (!this.items[type]) this.items[type] = 0;
        this.items[type] += amount;
    }

    removeItem(type, amount) {
        if (!this.items[type] || this.items[type] < amount) return false;
        this.items[type] -= amount;
        if (this.items[type] === 0) delete this.items[type];
        return true;
    }

    hasItem(type, amount = 1) {
        return (this.items[type] || 0) >= amount;
    }

    getItems() {
        return this.items;
    }
}
