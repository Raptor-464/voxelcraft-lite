const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const inventoryNode = document.getElementById('inventory');
const selectedBlockNode = document.getElementById('selectedBlock');

const BLOCK_TYPES = {
  grass: { name: 'Grass', color: '#4ade80', solid: true },
  dirt: { name: 'Dirt', color: '#b45309', solid: true },
  stone: { name: 'Stone', color: '#94a3b8', solid: true },
  sand: { name: 'Sand', color: '#facc15', solid: true },
  wood: { name: 'Wood', color: '#a16207', solid: true },
  brick: { name: 'Brick', color: '#ef4444', solid: true },
  glass: { name: 'Glass', color: '#7dd3fc', solid: true },
  water: { name: 'Water', color: '#38bdf8', solid: false },
  leaves: { name: 'Leaves', color: '#22c55e', solid: true }
};

const tileSize = 32;
const worldSize = 18;
const camera = { x: 0, y: 0, zoom: 1.0 };
const blocks = [];
const inventory = {
  grass: 20,
  dirt: 20,
  stone: 20,
  sand: 12,
  wood: 12,
  brick: 0,
  glass: 0,
  leaves: 0
};
const selected = { block: 'grass' };

function randomRange(min, max) { return Math.random() * (max - min) + min; }

function initWorld() {
  for (let y = 0; y < worldSize; y++) {
    const row = [];
    for (let x = 0; x < worldSize; x++) {
      let type = 'water';
      const h = Math.random();
      if (h > 0.77) type = 'stone';
      else if (h > 0.62) type = 'sand';
      else if (h > 0.45) type = 'grass';
      else type = 'dirt';

      if (Math.random() < 0.08) type = 'wood';
      if (Math.random() < 0.05) type = 'leaves';

      row.push({ x, y, type, height: 1 });
    }
    blocks.push(row);
  }
}

function updateSelectedBlock() {
  selectedBlockNode.textContent = BLOCK_TYPES[selected.block].name;
}

function renderInventory() {
  inventoryNode.innerHTML = '';
  Object.entries(inventory).forEach(([key, value]) => {
    const item = document.createElement('div');
    item.className = 'inventory-item';
    item.innerHTML = `<span>${BLOCK_TYPES[key]?.name || key}</span><strong>${value}</strong>`;
    inventoryNode.appendChild(item);
  });
}

function addInventoryItem(type, amount = 1) {
  if (!inventory[type]) inventory[type] = 0;
  inventory[type] += amount;
  renderInventory();
}

function getTileAtMouse(x, y) {
  const rect = canvas.getBoundingClientRect();
  const sx = (x - rect.left) * (canvas.width / rect.width);
  const sy = (y - rect.top) * (canvas.height / rect.height);

  const worldX = Math.floor((sx - camera.x) / (tileSize * camera.zoom));
  const worldY = Math.floor((sy - camera.y) / (tileSize * camera.zoom));
  return { worldX, worldY };
}

function placeBlock(worldX, worldY) {
  if (worldX < 0 || worldY < 0 || worldX >= worldSize || worldY >= worldSize) return;
  const tile = blocks[worldY][worldX];
  if (tile.type === 'water') {
    if (inventory[selected.block] > 0) {
      tile.type = selected.block;
      inventory[selected.block] -= 1;
      renderInventory();
    }
  }
}

function removeBlock(worldX, worldY) {
  if (worldX < 0 || worldY < 0 || worldX >= worldSize || worldY >= worldSize) return;
  const tile = blocks[worldY][worldX];
  if (tile.type !== 'water') {
    addInventoryItem(tile.type, 1);
    tile.type = 'water';
  }
}

function attemptCraft(recipe) {
  const recipes = {
    planks: { wood: 2 },
    bricks: { stone: 2 },
    stoneBrick: { brick: 2 },
    glass: { sand: 3 }
  };

  const required = recipes[recipe];
  if (!required) return;

  const canCraft = Object.entries(required).every(([type, amount]) => inventory[type] >= amount);
  if (!canCraft) {
    alert('Not enough materials for this craft.');
    return;
  }

  Object.entries(required).forEach(([type, amount]) => {
    inventory[type] -= amount;
  });

  const outputs = {
    planks: 'wood',
    bricks: 'brick',
    stoneBrick: 'stone',
    glass: 'glass'
  };

  addInventoryItem(outputs[recipe], 1);
}

function drawTile(tile, screenX, screenY) {
  const type = BLOCK_TYPES[tile.type];
  if (!type) return;

  ctx.fillStyle = type.color;
  ctx.fillRect(screenX, screenY, tileSize * camera.zoom, tileSize * camera.zoom);

  if (type.name === 'Grass') {
    ctx.fillStyle = 'rgba(34,197,94,0.3)';
    ctx.fillRect(screenX + 5, screenY + 5, 8, 8);
  }

  if (type.name === 'Wood') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(screenX + 8, screenY + 4, 6, tileSize * camera.zoom - 8);
  }

  if (type.name === 'Glass') {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX + 3, screenY + 3, tileSize * camera.zoom - 6, tileSize * camera.zoom - 6);
  }
}

function renderWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const startX = Math.max(0, -Math.floor(camera.x / (tileSize * camera.zoom)));
  const startY = Math.max(0, -Math.floor(camera.y / (tileSize * camera.zoom)));

  for (let y = startY; y < Math.min(worldSize, startY + 32); y++) {
    for (let x = startX; x < Math.min(worldSize, startX + 48); x++) {
      const tile = blocks[y][x];
      const screenX = x * tileSize * camera.zoom + camera.x;
      const screenY = y * tileSize * camera.zoom + camera.y;
      drawTile(tile, screenX, screenY);
    }
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function handleKeydown(event) {
  const keys = {
    '1': 'grass',
    '2': 'dirt',
    '3': 'stone',
    '4': 'wood',
    '5': 'brick',
    '6': 'glass'
  };

  if (event.key in keys) {
    selected.block = keys[event.key];
    updateSelectedBlock();
  }

  if (event.key === 'w') camera.y += 24;
  if (event.key === 's') camera.y -= 24;
  if (event.key === 'a') camera.x += 24;
  if (event.key === 'd') camera.x -= 24;
  if (event.key === 'g') {
    attemptCraft('planks');
  }
  if (event.key === 'c') {
    attemptCraft('bricks');
  }
  if (event.key === 'v') {
    attemptCraft('glass');
  }

  camera.x = Math.max(-200, Math.min(200, camera.x));
  camera.y = Math.max(-200, Math.min(200, camera.y));
}

function handlePointer(event) {
  const tile = getTileAtMouse(event.clientX, event.clientY);
  if (event.button === 0) {
    placeBlock(tile.worldX, tile.worldY);
  }
  if (event.button === 2) {
    removeBlock(tile.worldX, tile.worldY);
  }
}

canvas.addEventListener('click', (event) => handlePointer(event));
canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  handlePointer(event);
});
window.addEventListener('keydown', handleKeydown);

document.querySelectorAll('.recipe').forEach((button) => {
  button.addEventListener('click', () => {
    const recipe = button.dataset.recipe;
    if (recipe === 'planks') attemptCraft('planks');
    if (recipe === 'bricks') attemptCraft('bricks');
    if (recipe === 'stoneBrick') attemptCraft('stoneBrick');
    if (recipe === 'glass') attemptCraft('glass');
  });
});

function tick() {
  renderWorld();
  requestAnimationFrame(tick);
}

initWorld();
renderInventory();
updateSelectedBlock();
requestAnimationFrame(tick);
