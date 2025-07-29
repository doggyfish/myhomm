# Game Mechanism Document
## Heroes of Might and Magic + Red Alert RTS

## Game Overview

I want to create a HTML5 game using Phaser 3 framework. It should combine Heroes of Might and Magic and Red Alert elements. It is a real time strategy game. It is NOT a turn based game. UI should follow Red Alert style, with panels to manage buildings units and resources. Tilemap for world map with castles, armies and units and buildings. Each player (human or AI) can have multiple castles. Each castle can have multiple armies and each army can have multiple units. When one player lose all castles, that player lose and game ends for that player.

## Overall Plan for Game Implementation with Phaser 3 Framework

### Core Architecture
- **Phaser 3 Scenes**: Menu, Game World, UI Overlay
- **Real-time Game Loop**: Continuous updates for RTS gameplay
- **Tilemap System**: Grid-based world map rendering
- **Entity Component System**: For armies, castles, and units
- **State Management**: Game state, player resources, unit tracking
- **UI System**: Red Alert style command panels and HUD

### Technical Implementation
- **Canvas Rendering**: Phaser 3 WebGL/Canvas renderer
- **Asset Management**: Sprite atlases, tilemaps, audio
- **Input Handling**: Mouse/touch controls for RTS commands
- **Pathfinding**: A* algorithm for army movement
- **Collision Detection**: Tile-based collision system
- **Audio System**: Sound effects and background music

## Game Concept Document

### Open World Map
- Large tilemap-based world for strategic gameplay
- Contains castles, armies, buildings, and resource nodes
- Real-time movement and interaction system
- Fog of war and exploration mechanics

### Factions
- **Human**: Defensive oriented, strong castle defenses
- **Orc**: Aggressive oriented, powerful offensive units

### Castle System
- Strategic strongholds for each player
- Resource generation centers
- Unit production facilities
- Defensive structures with garrison armies

### Castle Gold Generation Rate
- Base rate: 60 gold per minute per castle
- Upgradeable through economic buildings
- Affected by castle level and improvements

### Castle Mana Generation Rate  
- Base rate: 60 mana per minute per castle
- Enhanced by magical buildings
- Required for spell casting system

### Buildings
Two main categories of structures in the game world.

#### Building Types
- **Castle Building**: Structures built within castle walls
- **Open World Building**: Standalone structures on the world map

#### Building Purpose
- **Unit Production**: Generate military units over time
- **Resource Generation**: Produce gold, mana, and materials

#### Building Generation Rate
- Automatic production based on building type and level
- Adjustable frequency through upgrades
- Time-based generation system

#### Building Power
- Defensive value for combat calculations
- Contributes to overall castle defense rating
- Affects siege combat outcomes

### Army System
Mobile military forces that move across the world map.

#### Army Power
- Combined strength of all units in the army
- Determines combat effectiveness

### Unit System
Individual soldiers and creatures that comprise armies.

#### Unit Power
- Base combat strength value
- Varies by unit type
- Core component of army power calculation

### Resources
Strategic materials required for construction and unit production.

#### Resource Types
- **Gold**: Primary currency for most activities
- **Mana**: Required for magic spells and enchantments
- **Wood**: Basic construction material
- **Stone**: Advanced building construction
- **Mercury**: Rare magical component
- **Sulfur**: Alchemical and siege weapon material  
- **Crystal**: High-tier magical material

## Castle System Document

### Core Castle Mechanics
Castle can have 1 army stationed. Castle can send army to open world map. Castle can have multiple buildings.

### Unit Production
Castle's buildings generate units automatically based on time with adjustable frequency for its unit type. Generated units are added to castle's garrison army automatically.

### Resource Generation
Castle generates gold automatically based on time with adjustable frequency.

### Castle Functions
- **Garrison**: Houses one defensive army
- **Production**: Automated unit creation over time
- **Deployment**: Send armies to world map
- **Construction**: Build multiple specialized buildings
- **Economics**: Generate gold and resources continuously

## Map System Document

### Tilemap Structure
Tile map system for world representation.

### Map Size Control
Create a variable to control map size. When variable is set to x, then map size should be x by x. Maximum map size is 256 by 256.

### Tile Types
Tile has multiple types. Each tile type represents a different terrain or road.

### Army Movement
Army can move on map using pathfinding algorithms.

### Map Contents
Map contains castles and open world buildings distributed strategically.

## Combat System Document

### Combat Types
- **Army vs Army**: Mobile forces engaging in battlefield combat
- **Army vs Castle**: Siege warfare against fortified positions

### Combat Resolution
Result will be based on army power, higher power wins. Army power is combination of units power. Castle power is combination of stationed army power and castle building power number. One spell from each side will be triggered from spell queue per combat event. Spell queue is first in first out. Spell will be resolved first before normal combat resolution.

### Normal Combat Resolution
Army A with power x attacks army B with power Y, if x > y then army A wins and power of x - y will remain for A and army B will be eliminated. if x < y then army B wins and power of y - x will remain for B and army A will be eliminated. if x = y then both armies will be eliminated.

### Castle Combat
Castle defense includes garrison army strength plus defensive building bonuses.
Defending Amry's total power = (garrison army power + castle defense power number) * defense multiplier

## Magic System Document

### Rogue-like Spell Selection
Magic is chosen via rogue like system. Every x seconds, choose a magic from 3 options. Save the chosen option to a list and player can use chosen magic. Chosen magic will be added to spell library.

### Mana System
Mana will be generated by castle. Use mana to buy magic spells.

### Spell Categories

#### Damage Spells
Damage spells will be added to queue. Queued spell will cast when combat event triggers.

#### Buff Spells
Buff spells will be cast right away with duration and no need to put it in queue. Buff spells have multiple types:
- Buff economy
- Buff an unit  
- Buff an army
- Buff all units

#### Debuff Spells
Debuff spells will be implemented later on.

### Combat Integration
Damage calculation should consider buff spells.

### Simplified Magic System
Keep the magic system simple. A rogue-like system for player to choose spell, once chosen it is added to spell library. Once a spell is in library, then player can spend the mana to buy it. When buying a damage spell, putting it into a queue, the spells in queue will automatically trigger when combat event triggers. When buying a buff spell, it should cast right away with a duration and no need to put it in queue. Spell queue should be first in first out. There should be a UI for spell library and there should be a UI for spell queue.

## A notification system

### Major events should be notified on the UI. 
events include 
- army fights
- siege fights
- instant spell casted 
clicking fighting events should take view to where fight occured.

## A setting UI that controls game settings
settings include
- mapsize
- difficulty (easy, normal, hard)
- player number
- music on/off