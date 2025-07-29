# Castle System Documentation

## Castle Overview

Castles serve as the primary strategic hubs for each player, functioning as production centers, defensive strongholds, and territorial control points. Each castle represents a player's power base and losing all castles results in elimination.

## Core Castle Properties

### Basic Castle Attributes
- **Castle Level**: Determines building capacity and defensive strength (1-5)
- **Defensive Value**: Base defense points from walls and fortifications, and increase garrison's defensive power by x % per level 
- **Garrison Capacity**: Can house exactly 1 army for defense
- **Building Slots**: Limited slots for construction (5-20 based on level)

### Castle Positioning
- **Strategic Placement**: Castles cannot be built on top of each other, they are pre-placed on the map, player starts with 1 castle and can occupy more castles by capturing enemy castles or neutral castles
- **Minimum Distance**: 10 tiles between player castle and neutral castles, 20 tiles between player castles

## Army Management

### Stationed Army System
```javascript
Castle.garrison = {
    army: Army | null,           // Single army stationed
    defensiveBonus: x          // Percentage bonus to army power
}
```

### Army Deployment
- **Send to Open World**: Deploy garrison army to map
- **Army Composition**: Mixed units optimized for different strategies
- **Return Command**: Armies can return to castle for reinforcement

### Garrison Benefits
- **Defensive Bonus**: +x% effective power when defending castle, x is based on castle level and defensive buildings
- **Castle Protection**: Prevents immediate capture by weak armies
- **Strategic Reserve**: Ready force for immediate deployment

## Building System

### Building Categories

#### Core Infrastructure
- **Castle Keep** (Required)
  - Health: 200 Power * castle level 
  - Defensive Value: 100
  - Garrison Bonus: +5% garrison army power per level
  - Gold Generation: +60 gold per minute
  - Mana Generation: +60 mana per minute
  - Upgrade Levels: 1-5

- **Castle Walls** (Defensive)
  - Defensive Value: +5% garrison army power per level
  - Siege Resistance: Reduces siege weapon effectiveness
  - Upgrade: Stone availabe at castle level 1 → Iron availabe at castle level 3 → Magical walls availabe at castle level 5

#### Unit Production Buildings

##### Military Structures
- **Barracks** (Infantry Production)
  - Production Rate: 1 unit per 1 second
  - Upgrade Effects: Faster production
  - Cost: 200 Wood, 100 Stone

- **Archery Range** (Ranged Units)
  - Production Rate: 1 unit per 2 seconds
  - Upgrade Effects: Faster production
  - Requirements: Barracks built first
  - Cost: 150 Wood, 100 Gold

- **Stables** (Cavalry Production)
  - Production Rate: 1 unit per 3 seconds
  - Upgrade Effects: Faster production
  - Requirements: Castle Level 2
  - Cost: 300 Wood, 200 Gold

- **Magic Tower** (Spell Casters)
  - Production Rate: 1 unit per 3 seconds
  - Mana Efficiency: Reduces spell costs
  - Requirements: 50 Mercury, 25 Crystal
  - Cost: 500 Gold, 100 Stone

#### Resource Generation Buildings

##### Economic Structures
- **Treasury** (Gold Generation)
  - Base Rate: +20 gold per minute
  - Upgrade Multiplier: +20 gold per level
  - Cost: 500 Wood, 100 Stone
  - Max Level: 5

- **Mana Sanctuary** (Mana Generation)
  - Base Rate: +20 mana per minute
  - Upgrade Multiplier: +20 mana per level
  - Cost: 200 Gold, 25 Crystal
  - Max Level: 5

- **Marketplace** (Resource Trading)
  - Exchange Rate: 2:1 ratio between resources
  - Trade Volume: 100 minimum per trade 
  - Faction Bonus: Humans get better rates at 1.5:1 ratio
  - Cost: 200 Gold, 100 Wood

##### Material Production
- **Sawmill** (Wood Generation)
  - Base Rate: 20 wood per minute
  - Upgrade: +20 wood per minute per level
  - Cost: 100 Gold
  - Max Level: 3

- **Quarry** (Stone Generation)
  - Base Rate: 10 stone per minute
  - Upgrade: +10 stone per minute per level
  - Cost: 150 Gold, 50 Wood
  - Max Level: 3

## Castle Upgrade System

### Castle Level Progression
```javascript
CastleLevels = {
    1: { buildingSlots: 5,  defenseValue: 100, garrisonBonus: 5, cost: 0 },
    2: { buildingSlots: 8,  defenseValue: 200, garrisonBonus: 10, cost: 500 },
    3: { buildingSlots: 12, defenseValue: 350, garrisonBonus: 15, cost: 1000 },
    4: { buildingSlots: 16, defenseValue: 550, garrisonBonus: 20, cost: 2000 },
    5: { buildingSlots: 20, defenseValue: 800, garrisonBonus: 25, cost: 4000 }
}
```

## Resource Generation Mechanics

### Automatic Resource Production
```javascript
ResourceGeneration = {
    baseRates: {
        gold: 60,    // per minute
        mana: 60,     // per minute
        wood: 20,     // requires sawmill
        stone: 10     // requires quarry
    },
    
    upgrades: {
        treasury: { multiplier: 2, maxLevel: 5 },
        sanctuary: { multiplier: 2, maxLevel: 5 },
        sawmill: { multiplier: 2, maxLevel: 3 },
        quarry: { multiplier: 2, maxLevel: 3 }
    }
}
```

### Territory Bonuses
- **Faction Synergy**: Human mana bonus, Orc gold bonus
- **Building Combinations**: Openworld Map wood mill +x/minute to wood production

## Castle Defense Mechanics

### Defensive Calculations
```javascript
CastleDefense = {
    basePower: castle.level * 100,
    garrisonPower: army.power * 1.4,    // assuming 40% defensive bonus. 25% from castle level 5 and 15% from wall level 3
    buildingDefense: basePower + garrisonPower
}
```

### Siege Warfare
- **Siege Requirements**: Armies need siege weapons to attack castles

## Special Castle Features

### Faction-Specific Buildings

#### Human Faction
- **Cathedral**: +100% mana generation, adds extra spell slots
- **Royal Academy**: Unlocks advanced units and technologies

#### Orc Faction
- **War Totem**: +10% unit power
- **Beast Pit**: Produces special creature units

### Magical Enhancements
- **Scrying Tower**: Extended map vision and enemy detection
- **Teleportation Circle**: Instant army transport between castles
- **Ward Stones**: Protection from enemy magic spells

## Castle Management Interface

### Construction Management
- **Building Prerequisites**: Tech tree requirements
- **Construction Time**: Buildings complete instantly
- **Resource Planning**: Forecast resource needs for expansion
- **Upgrade Scheduling**: Add buildings or upgrades to queue and once resources are available, they are built automatically