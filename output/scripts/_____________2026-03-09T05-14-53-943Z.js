/**
 * AI Architect - Generated Script
 * Prompt: 生成一个守望先锋的漓江塔
 * Session: 1773033069248
 * Generated: 2026-03-09T05:14:53.943Z
 */



```javascript
// 1. Tower Heights
const TOWER_LAYERS = 7;
const BASE_SIZE = 12;
const BASE_SCREEN_HEIGHT = 2;

// 2. Build Tower
function buildTower(b) {
  // Set global priority for walls
  b.setPriority(50);
  
  // Base platform
  b.fill(0, 0, 0, BASE_SIZE-1, BASE_SCREEN_HEIGHT, BASE_SIZE, 'FLOOR_CONCRETE');
  
  // Base floor
  for (let y=0; y<BOTTOM_SCREEN_HEIGHT-1; y++) {
    b.fill(2, y, 0, BASE_SIZE-2, y*2, 0, 'WALL_YELLOW');
    b.fill(2, y, 1, BASE_SIZE-2, y*2, 1, 'FLOOR_STONE');
  }
  
  // Tower structure
  b.setPriority(60);
  for (let layer=0; layer<TOWER_LAYERS && layer<TOWER_LAYERS-1; layer++) {
    const WIDTH = BASE_SIZE - layer * 2;
    const HEIGHT = 2;
    
    // Tower frames
    b.fill(0, 0, 0, WIDTH-1, HEIGHT, 0, 'WALL_RED');
    b.fill(0, HEIGHT+1, 0, WIDTH-1, HEIGHT+1, 0, 'WALL_STONE');
    
    // Windows
    b.fill(1, 3, 0, WIDTH-2, 5, 0, 'WINDOW');
    
    // Roof gables
    if (layer > 0) {
      b.drawRoofBounds(-1, -1, 0, WIDTH+1, HEIGHT, 2, 'straight', 'ROOF_BLUE', { gable: 'WALL_WHITE' });
    }
    
    // Balcony
    if (layer < 5) {
      b.fill(WIDTH-2, 1, 0, WIDTH-1, 1, 0, 'AIR');
      b.set(WIDTH-2, 1, 0, 'WALL_RED');
      b.set(WIDTH-1, 1, 0, 'AIR');
      b.set(WIDTH-1, 2, 0, 'AIR');
    }
  }
  
  // Top spire
  b.setPriority(95);
  b.fill(5, 0, 5, 6, 10, 6, 'AIR');
  for (let i=0; i<3; i++) {
    b.fill(5, i, 5, 6, i, 6, 'ROOF_GOLD');
  }
  
  b.line(5, 10, 5, 5, 10+10, 6, 'ROOF_GOLD');
}

// 3. Define Building Components
builder.defineComponent('tower_segment', (b, params) => {
  const { width, height, layer } = params;
  
  b.fill(0, 0, 0, width, height, 0, 'WALL_STONE');
  b.fill(1, 3, 0, width-2, 5, 0, 'WINDOW');
  if (layer > 0) {
    b.drawRoofBounds(-1, -1, 0, width+1, height, 2, 'straight', 'ROOF_BLUE', { gable: 'WALL_WHITE' });
  }
});

// 4. Debug Info
const dims = {
  baseWidth: BASE_SIZE,
  towerLayers: TOWER_LAYERS,
  baseHeight: BASE_SCREEN_HEIGHT,
  colors: { 'WALL_RED': '#D81313', 'WALL_STONE': '#787878', 'ROOF_BLUE': '#2E2A36' }
};

// 5. Build Final Structure
builder.beginGroup('tower', { priority: 50 });
for (let y=0; y<TOWER_LAYERS; y++) {
  builder.placeComponent('tower_segment', 0, y*2, 0, {
    width: BASE_SIZE - y*2,
    height: 2,
    layer: y
  });
}
builder.endGroup();
builder.setDoor(5, BASE_SCREEN_HEIGHT-1, 0, 'oak_door?facing=north');
```
