# Game Concept Document
## HoMM3 + Red Alert Inspired RTS

### Core Game Concept

**Genre**: Real-Time Strategy with Turn-Based Elements  
**Theme**: Fantasy warfare combining Heroes of Might and Magic depth with Command & Conquer pacing  
**Target Platform**: HTML5 Web Browser (Phaser 3)  
**Players**: 1-8 players (Human + AI)

### Faction System

#### Human Faction
- **Philosophy**: Order, technology, defensive strategies
- **Strengths**: Superior castle defenses, advanced magic research
- **Unique Buildings**: Cathedral (mana bonus), Academy (extra spell allowance)
- **Signature Units**: Paladins (higher unit power, increase level x unit power by y %), Wizards (spell cost x less mana and do y % more damage)
- **Resource Bonus**: +25% mana generation from all castles

#### Orc Faction
- **Philosophy**: Chaos, aggression, rapid expansion
- **Strengths**: Faster unit production, powerful offensive units
- **Unique Buildings**: War Hut (unit production bonus), Shaman Circle (choose 1 extra spell when choosing spells)
- **Signature Units**: Berserkers (higher unit power, increase level x unit power by y %), Ogres (siege specialists, add % power vs castles)
- **Resource Bonus**: +25% gold generation from conquered territories

### Open World Map System

#### Map Structure
- **Variable Size**: Configurable from 32x32 to 256x256 tiles
- **Tile Types**: 
  - Grassland (normal movement)
  - Mountains (impassable, strategic chokepoints)
  - Forest (slow movement, power increase bonus)
  - Water (impassable except bridges)
  - Roads (fast movement corridors)
  - Desert (slow movement, visibility penalty)
  - Plains (normal movement, strategic objectives)
  - Swamp (slow movement, power increase bonus)
  - Snow (slow movement, visibility penalty)
  - Lake (slow movement, vulnerable with power reduction penalty)

#### Strategic Elements
- **Resource Nodes**: Scattered mines and magical sources
- **Neutral Buildings**: Temples, trading posts, monster lairs
- **Tactical Features**: Bridges, mountain passes, defensive positions which increase power by x %
- **Exploration**: Fog of war reveals map as armies scout, once scouted, visibility is permanent

### Castle System

#### Castle Core Functions
- **Capital Status**: Each player starts with one main castle
- **Expansion**: Additional castles can be captured
- **Garrison**: One army can be stationed for defense
- **Production Hub**: Generates units, resources, and mana

#### Building Categories

##### Unit Production Buildings
- **Barracks**: Infantry units (Swordsmen, Orc Warriors)
- **Archery Range**: Ranged units (Archers, Crossbowmen)
- **Stables**: Cavalry units (Knights, Wolf Riders)
- **Magic Tower**: Spell casters (Wizards, Shamans)
- **Siege Workshop**: Heavy units (Catapults, Siege Towers)

##### Resource Generation Buildings
- **Gold Mine**: Primary economic building
- **Mana Well**: Magical energy source
- **Sawmill**: Wood production for construction
- **Quarry**: Stone for advanced buildings
- **Alchemist Lab**: Rare resources (Mercury, Sulfur, Crystal)

##### Support Buildings
- **Castle Walls**: Defensive structures with hit points
- **Watchtower**: Extended vision range
- **Market**: Resource trading and conversion
- **University**: Research speed bonuses

### Army and Unit System

#### Army Composition
- **Mixed Units**: Each army contains multiple unit types
- **Army Power**: Sum of all individual unit power values
- **Army Speed**: Average speed of all units in the army

#### Unit Categories

##### Basic Units
- **Infantry**: Swordsmen (Power: 5, Speed: 10), Orc Warriors (Power: 6, Speed: 10)
- **Archers**: Bowmen (Power: 8, Ranged, Speed: 5), Orc Archers (Power: 9, Ranged, Speed: 5)

##### Advanced Units 
- **Cavalry**: Knights (Power: 20, Speed: 100), Wolf Riders (Power: 15, Speed: 120)
- **Magic Users**: Wizards (Power: 15, Allow Spell casting Damage/Buff/Debuff, Speed: 10), Shamans (Power: 14, Allow Spell casting Damage/Buff/Debuff, Speed: 10)

##### Elite Units
- **Champions**: Paladins (Power: 50, Speed: 80), Berserkers (Power: 55, Berserker rage, Speed: 75)
- **Siege**: Catapults (Power: 25, Anti-Castle bonus, Speed: 15), Ogres (Power: 30, Anti-Castle bonus, Speed: 15)

### Resource System

#### Primary Resources
- **Gold**: Universal currency for units and basic buildings
- **Mana**: Required to purchase magic spells

#### Construction Materials
- **Wood**: Basic building construction
- **Stone**: Advanced fortifications and defensive structures

#### Rare Resources
- **Mercury**: Magical research and advanced spells
- **Sulfur**: Explosive units and siege weapons
- **Crystal**: High-tier magical buildings and artifacts

#### Resource Generation Rates
- **Base Castle**: 60 gold/minute, 60 mana/minute
- **With Buildings**: add x gold/minute, y mana/minute
- **Territory Bonus**: Additional resources from controlled openworld map buildings

### Victory Conditions

#### Primary Victory
- **Castle Elimination**: Defeat achieved when player loses all castles
- **Economic**: Accumulate 10,000 gold and 1,000 of all rare resources

### Game Progression

#### Early Game (0-15 minutes)
- Castle development and basic unit production
- Map exploration and resource node control
- Initial army formation and scouting

#### Mid Game (15-30 minutes)
- Military expansion and territorial control
- Advanced building construction
- First major army conflicts

#### Late Game (30+ minutes)
- Elite unit deployment
- Siege warfare and castle assaults
- Magic system fully utilized for strategic advantage

### Unique Features

#### Magic Rogue-like System
- **Periodic Selection**: Every 3 minutes, choose from 3 random spells, no need to research, buildings and traits can increase spell pool and rarity, or even extra selection opportunities
- **Spell Categories**: Combat, Economic, Utility, Faction-specific
- **Strategic Depth**: Build spell library over course of game, add spells to army to enhance army power.

#### Dynamic Terrain
- **Seasonal Changes**: Map conditions change over time
- **Weather Effects**: Rain affects movement, snow reduces visibility