* { box-sizing: border-box; }

:root {
  --bg: #0f172a;
  --panel: rgba(15, 23, 42, 0.82);
  --panel-border: rgba(148, 163, 184, 0.35);
  --accent: #22c55e;
  --accent-2: #fbbf24;
  --text: #e2e8f0;
  --muted: #94a3b8;
}

html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #0b1321 0%, #0f172a 100%);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
}

body {
  position: relative;
}

#gameCanvas {
  display: block;
  width: 100vw;
  height: 100vh;
  image-rendering: pixelated;
  background: linear-gradient(#7dd3fc 0%, #dbeafe 30%, #86efac 100%);
  cursor: crosshair;
}

.hud {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  background: var(--panel);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.20);
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--accent-2);
}

.info-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.9rem;
  color: var(--muted);
}

.inventory-panel,
.crafting-panel {
  position: absolute;
  right: 20px;
  z-index: 10;
  width: 260px;
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.20);
}

.inventory-panel {
  top: 90px;
}

.crafting-panel {
  bottom: 20px;
}

.inventory-panel h3,
.crafting-panel h3 {
  margin: 0 0 12px;
  color: var(--accent);
}

#inventory {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 0.9rem;
}

.inventory-item {
  padding: 6px 8px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.75);
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.recipe-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.recipe {
  flex: 1;
  padding: 10px 10px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  background: rgba(16, 185, 129, 0.15);
  color: var(--text);
  cursor: pointer;
  font-weight: bold;
}

.recipe:hover {
  background: rgba(16, 185, 129, 0.25);
}
