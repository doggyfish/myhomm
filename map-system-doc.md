# Map System Documentation

## Map Overview

The map system provides the spatial foundation for the game, utilizing a tile-based grid that supports strategic movement, terrain variety, and scalable world sizes. The system is designed to handle maps from small skirmishes (32x32) to epic campaigns (256x256).

## Map Configuration

### Map Size System
```javascript
MapSizes = {
    SMALL:    { size: 32,  description: "Quick battles, 2-4 players" },
    MEDIUM:   { size: 64,  description: "Standard games, 4-6 players" },
    LARGE:    { size: 128, description: "Long campaigns, 6-8 players" },
    EPIC:     { size: 256, description: "Maximum scope, 8+ players" }
}

// Dynamic map size variable
let MAP_SIZE = 64; // Default medium size
let TILE_SIZE = 32; // Pixels per tile
let WORLD_WIDTH = MAP_SIZE * TILE_SIZE;
let WORLD_HEIGHT = MAP_SIZE * TILE_SIZE;
```

### Map Generation Parameters
- **Seed Value**: Deterministic map generation for reproducible layouts
- **Terrain Distribution**: Percentage of each terrain type
- **Resource Density**: Number and distribution of resource nodes
- **Strategic Features**: Chokepoints, defensive positions, water bodies, resource buildings and nodes

## Tile System

### Tile Structure
```javascript
Tile = {
    x: number,              // Grid X coordinate
    y: number,              // Grid Y coordinate
    type: TileType,         // Terrain type enum
    movementCost: number,   // Reduces army average speed make army moves slower
    defensiveBonus: number, // Combat defense modifier, increase army power by x%
    visibility: boolean,    // Fog of war state
    occupant: Army | null,  // Current army on tile
    building: Building | null, // Structure on tile
    resources: ResourceNode | null, // Resource generation
    explored: boolean       // Has been visited by player
}
```

### Terrain Types

#### Movement Cost Types
normal: no army speed penalty
slow: reduce army speed by 25%
very slow: reduce army speed by 50%
fast: increase army speed by 50%

#### Basic Terrain
- **Grassland**
  - Movement Cost: 1 (normal)
  - Defensive Bonus: 0%
  - Description: Open terrain suitable for all unit types
  - Color: #4CAF50 (green)

- **Forest**
  - Movement Cost: 2 (slow)
  - Defensive Bonus: +25%
  - Description: Dense woods providing cover
  - Color: #2E7D32 (dark green)

- **Mountains**
  - Movement Cost: ∞ (impassable)
  - Defensive Bonus: N/A
  - Description: Impassable high terrain
  - Color: #795548 (brown)

#### Water Features
- **Water/Ocean**
  - Movement Cost: ∞ (impassable)
  - Defensive Bonus: N/A
  - Description: Deep water requiring boats/bridges
  - Color: #2196F3 (blue)

- **Shallow Water**
  - Movement Cost: 3 (very slow)
  - Defensive Bonus: -25% (vulnerable)
  - Description: Wadeable water with penalties
  - Color: #64B5F6 (light blue)

#### Special Terrain
- **Roads**
  - Movement Cost: 0.5 (fast)
  - Defensive Bonus: 0%
  - Description: Paved pathways for rapid movement
  - Color: #8D6E63 (tan)
  - Special: Connect cities and strategic points

- **Desert**
  - Movement Cost: 2 (slow)
  - Defensive Bonus: 0%
  - Description: Sandy terrain with visibility penalties
  - Color: #FFEB3B (yellow)
  - Special: Reduced vision range

- **Swamp**
  - Movement Cost: 3 (very slow)
  - Defensive Bonus: +15%
  - Description: Boggy terrain difficult to traverse
  - Color: #4E342E (mud brown)
  - Special: Spell casting penalties, reduce spell damage by x%

## Movement System

### Pathfinding Algorithm
```javascript
// A* pathfinding
function findPath(startTile, endTile, armyType) {
    const openList = [];
    const closedList = [];
    
    startTile.g = 0;
    startTile.h = calculateHeuristic(startTile, endTile);
    startTile.f = startTile.g + startTile.h;
    
    openList.push(startTile);
    
    while (openList.length > 0) {
        // Find lowest f cost tile
        const currentTile = openList.reduce((min, tile) => 
            tile.f < min.f ? tile : min);
        
        if (currentTile === endTile) {
            return reconstructPath(currentTile);
        }
        
        // Process adjacent tiles
        const neighbors = getAdjacentTiles(currentTile);
        for (const neighbor of neighbors) {
            if (closedList.includes(neighbor) || !isPassable(neighbor, armyType)) {
                continue;
            }
            
            const tentativeG = currentTile.g
            
            if (!openList.includes(neighbor) || tentativeG < neighbor.g) {
                neighbor.parent = currentTile;
                neighbor.g = tentativeG;
                neighbor.h = calculateHeuristic(neighbor, endTile);
                neighbor.f = neighbor.g + neighbor.h;
                
                if (!openList.includes(neighbor)) {
                    openList.push(neighbor);
                }
            }
        }
        
        closedList.push(currentTile);
        openList.splice(openList.indexOf(currentTile), 1);
    }
    
    return null; // No path found
}
```

### Movement Rules
- **Army Movement**: Armies move along calculated paths tile by tile, Army can bypass own Armies, Army destination is own army will merge two armies. Army destination is enemy Army will attack enemy Armies when met.
- **Army Movement Speed**: Each army has an average speed, which is reduced by terrain costs
- **Terrain Costs**: Different terrain types affects amry's movement speed
- **Stacking**: Multiple armies cannot occupy the same tile
- **Zone of Control**: Enemy armies block adjacent movement, but can be attacked into.

### Movement Visualization
- **Path Preview**: Show intended route before confirming move
- **Waypoints**: Allow complex multi-point movement commands

## Map Content

### Castle Placement
- **Starting Positions**: Balanced placement for fair starts
- **Expansion Sites**: Predetermined locations for additional castles
- **Minimum Distance**: Prevents overcrowding of castles
- **Strategic Value**: Placement affects resource access and defense

### Open World Buildings

#### Neutral Structures
- **Ancient Temples**
  - Purpose: Provide temporary stat bonuses
  - Occupancy: Can be claimed by armies
  - Defense: 50 power, neutral guards
  - Benefit: +10% army power while occupied

- **Trading Posts**
  - Purpose: Resource conversion 
  - Mechanics: Convert resources at favorable rates
  - Benefit: Better trade rate

- **Monster Lairs**
  - Purpose: Challenge encounters with rewards
  - Guardians: Neutral creatures defending treasure
  - Difficulty: Scales with map size and location
  - Rewards: Resources, artifacts, elite units

#### Resource Nodes
- **Gold Mines**
  - Generation: 20 gold per minute when controlled
  - Defense: 25 power neutral guards
  - Capture: Requires defeating guards

- **Magical Sources**
  - Types: Mercury Wells, Sulfur Pits, Crystal Caves
  - Generation: 5 rare resources per minute
  - Rarity: Limited number per map but enough to be generally accessible
  - Strategic Value: Required for advanced units

### Environmental Features

#### Strategic Chokepoints
- **Mountain Passes**: Narrow passages through mountain ranges
- **Bridge Crossings**: Limited water crossing points
- **Valley Entrances**: Defensive positions controlling access
- **River Fords**: Shallow crossing points in rivers

#### Defensive Positions
- **Hilltops**: +20% defensive bonus, extended vision
- **Cliff Edges**: One-way terrain advantage
- **Fortress Ruins**: Pre-built defensive structures
- **Sacred Groves**: Magical protection zones

## Fog of War System

### Visibility Mechanics
```javascript
VisibilitySystem = {
    fogLevel: {
        UNEXPLORED: 0,    // Black, no information
        EXPLORED: 1,      // Grayed out, terrain visible
        VISIBLE: 2        // Full color, current state
    },
    
    visionRange: {
        ARMY: 3,          // 3-tile radius
        CASTLE: 5,        // 5-tile radius
        WATCHTOWER: 7     // 7-tile radius
    },
    
    updateVisibility: function(playerArmies, playerCastles) {
        // Reset all tiles to explored state
        map.tiles.forEach(tile => {
            if (tile.visibility === 2) tile.visibility = 1;
        });
        
        // Update visibility around armies
        playerArmies.forEach(army => {
            const visibleTiles = getTilesInRadius(army.position, this.visionRange.ARMY);
            visibleTiles.forEach(tile => {
                tile.visibility = 2;
                tile.explored = true;
            });
        });
        
        // Update visibility around castles
        playerCastles.forEach(castle => {
            const visibleTiles = getTilesInRadius(castle.position, this.visionRange.CASTLE);
            visibleTiles.forEach(tile => {
                tile.visibility = 2;
                tile.explored = true;
            });
        });
    }
}
```

### Exploration Benefits
- **Resource Discovery**: Find resource nodes and neutral buildings
- **Strategic Intelligence**: Observe enemy army movements
- **Tactical Advantage**: Plan attacks based on known information
- **Safe Movement**: Avoid dangerous neutral creatures

## Map Rendering System

### Efficient Rendering
```javascript
MapRenderer = {
    viewport: {
        x: 0, y: 0,           // Camera position
        width: 1920,          // Screen width
        height: 1080,         // Screen height
        zoom: 1.0             // Zoom level
    },
    
    renderMap: function() {
        // Calculate visible tile range
        const startX = Math.floor(this.viewport.x / TILE_SIZE);
        const startY = Math.floor(this.viewport.y / TILE_SIZE);
        const endX = Math.min(MAP_SIZE, startX + Math.ceil(this.viewport.width / TILE_SIZE) + 1);
        const endY = Math.min(MAP_SIZE, startY + Math.ceil(this.viewport.height / TILE_SIZE) + 1);
        
        // Render only visible tiles
        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                const tile = map.getTile(x, y);
                this.renderTile(tile);
            }
        }
        
        // Render entities on visible tiles
        this.renderArmies();
        this.renderBuildings();
        this.renderEffects();
    },
    
    renderTile: function(tile) {
        const sprite = this.getTileSprite(tile.type);
        const screenX = tile.x * TILE_SIZE - this.viewport.x;
        const screenY = tile.y * TILE_SIZE - this.viewport.y;
        
        // Apply fog of war
        if (tile.visibility === 0) return; // Don't render unexplored
        if (tile.visibility === 1) sprite.tint = 0x808080; // Gray out explored
        
        sprite.x = screenX;
        sprite.y = screenY;
        this.stage.addChild(sprite);
    }
}
```

### Performance Optimization
- **Viewport Culling**: Only render tiles within camera view
- **Sprite Pooling**: Reuse tile sprites to minimize object creation
- **Level of Detail**: Simplified rendering at extreme zoom levels
- **Batch Rendering**: Group similar tiles for efficient GPU processing

## Minimap System

### Minimap Features
- **Full Map View**: Complete map overview in small UI panel
- **Army Indicators**: Colored dots representing army positions
- **Castle Markers**: Distinctive icons for player castles
- **Fog of War**: Minimap respects player's exploration state
- **Click Navigation**: Click to center main camera on location

### Strategic Information
- **Territory Control**: Color-coded regions showing player influence
- **Resource Locations**: Mark important resource nodes
- **Threat Assessment**: Highlight areas with enemy activity
- **Movement Tracking**: Show army movement history trails