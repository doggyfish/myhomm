# MyHoMM - Game Design Document

## Overview
MyHoMM is a 2D grid-based strategy game inspired by Heroes of Might and Magic. Players control castles that automatically generate units over time and can send armies to conquer other castles through tactical combat.

## Core Concept
- **Genre**: Real-time strategy
- **Platform**: Cross-platform (Windows, Linux, macOS)
- **Technology**: C# with cross-platform framework
- **Map**: 2D grid-based world
- **Starting Setup**: 3 castles on the map

## Game Mechanics

### Castle System
- **Base Functionality**: Each castle serves as a production center and stronghold
- **Unit Generation**: Castles automatically produce units continuously while the game runs
  - Base production rate: 1 unit per second (configurable)
  - Unit count increases automatically based on real-time, not turns
  - Production can be upgraded through castle improvements
  - Different castle types may produce different unit types

### Unit Management
- **Unit Count**: Each army has a numerical strength value
- **Movement**: Units move across the grid from castle to castle
- **Combat Resolution**: Simple numerical comparison
  - Attacking army vs Defending army
  - Higher number wins
  - Winner keeps (Winner Count - Loser Count) units
  - Loser is eliminated

### Map & Movement
- **Grid System**: 2D tile-based map
- **Movement Rules**: 
  - Units move one tile at a time
  - Movement takes real-time (e.g., 1 second per tile)
  - Only one army per tile (or allow stacking)

## Technical Architecture

### Platform Requirements
- **Primary Language**: C#
- **Framework Options**:
  - Unity (recommended for cross-platform 2D)
  - MonoGame
  - Avalonia UI
  - .NET MAUI

### Core Systems Needed
1. **Map System**
   - Grid representation
   - Tile management
   - Pathfinding

2. **Castle System**
   - Unit production logic
   - Upgrade system
   - Resource management

3. **Unit System**
   - Army representation
   - Movement logic
   - Combat calculations

4. **Game State Management**
   - Real-time progression system
   - Save/load functionality
   - Player input handling

5. **Rendering System**
   - 2D sprite rendering
   - UI for castle/unit information
   - Map visualization

## Initial Implementation Plan

### Phase 1: Core Foundation
- [ ] Set up cross-platform C# project
- [ ] Implement basic grid map system
- [ ] Create simple castle representation
- [ ] Basic unit spawning mechanism

### Phase 2: Basic Gameplay
- [ ] Unit movement system
- [ ] Simple combat resolution
- [ ] Time-based unit production
- [ ] Win/lose conditions

### Phase 3: Enhanced Features
- [ ] Multiple unit types
- [ ] Castle upgrades
- [ ] Improved UI/UX
- [ ] Sound and visual effects

## Game Flow Example

1. **Game Start**: 3 castles placed on grid map, each starts producing units immediately
2. **Continuous Production**: All castles generate units automatically in real-time
3. **Player Commands**: Player can issue commands at any time (no waiting for turns)
4. **Real-time Movement**: Units travel across grid in real-time to destinations
5. **Instant Combat**: When armies meet, combat resolves immediately
6. **Continuous Gameplay**: All actions happen simultaneously and continuously

## Victory Conditions
- **Conquest**: Control all castles on the map
- **Elimination**: Destroy all enemy units and castles
- **Time-based**: Highest score after set duration

## Future Expansion Ideas
- Hero units with special abilities
- Different terrain types affecting movement
- Resource gathering and management
- Multiplayer support
- Larger maps with more castles
- Technology/research trees

## Technical Considerations
- **Performance**: Efficient grid operations for larger maps
- **Scalability**: Design for easy addition of new features
- **Cross-platform**: Ensure consistent experience across platforms
- **Save System**: Robust game state persistence
- **Networking**: Architecture should support future multiplayer