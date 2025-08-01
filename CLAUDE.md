# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **game design and documentation project** for creating an HTML5 real-time strategy game using **Phaser 3**. The project combines elements from Heroes of Might and Magic and Command & Conquer Red Alert.

**Important**: This repository currently contains **only design documents and specifications**. No actual game code has been implemented yet.

## Architecture & Technology Stack

### Target Technology
- **Framework**: Phaser 3 (HTML5 game engine)
- **Platform**: Web browser (HTML5/JavaScript)
- **Rendering**: Canvas/WebGL
- **Language**: JavaScript (planned)

### Game Architecture (Planned)
- **Scene System**: Menu, Game World, UI Overlay scenes
- **Entity Component System**: For armies, castles, and units
- **Tilemap System**: Grid-based world map (32x32 to 256x256 tiles)
- **Real-time Game Loop**: Continuous updates for RTS gameplay
- **State Management**: Game state, player resources, unit tracking

## Game Design Overview

### Core Concept
- **Genre**: Real-Time Strategy with fantasy elements
- **Players**: 1-8 players (Human + AI)
- **Factions**: Human (defensive, order) and Orc (aggressive, chaos)
- **Victory**: Eliminate all enemy castles

### Key Systems
1. **Castle System**: Strategic hubs with building construction, unit production, and resource generation
2. **Army System**: Mobile forces with mixed unit compositions and power calculations
3. **Magic System**: Rogue-like spell selection every 3 minutes with damage and economic spells
4. **Combat System**: Power-based resolution for army vs army and siege combat
5. **Resource System**: Gold, mana, wood, stone, and rare materials (mercury, sulfur, crystal)

## Development Commands

Since this is a design-only project, there are **no build, test, or lint commands** currently available. When implementing the game:

- Development will likely use standard web development tools
- Consider using a local HTTP server for testing (e.g., `npx http-server`)
- Package.json and build tools will need to be set up during implementation

## File Organization

### Current Specification Documents
The comprehensive game specifications are located in `.claude/specs/rts-game/`:

- **`.claude/specs/rts-game/design.md`** - Complete technical architecture and implementation details
  - High-level architecture diagrams
  - Scene management system 
  - Entity Component System design
  - Complete class implementations with code examples
  - Movement and speed system with concrete examples
  - Configuration management system
  - Pause system implementation
  - Performance optimization strategies

- **`.claude/specs/rts-game/requirements.md`** - Detailed requirements in user story format
  - All game features with acceptance criteria
  - Victory conditions and game flow
  - Faction system requirements
  - Combat and magic system specifications
  - UI and technical requirements
  - Configuration system requirements (no magic numbers)

- **`.claude/specs/rts-game/tasks.md`** - Complete implementation task breakdown
  - 38 detailed coding tasks across 12 phases
  - Test-driven development approach
  - Incremental build strategy
  - References to requirements and design documents

### Legacy Documentation (Historical)
The root directory contains older design documents that provided the foundation for the current specifications:
- `game-concept-doc.md`, `castle-system-doc.md`, `magic-system-doc.md`, etc.

**For implementation work, use the specifications in `.claude/specs/rts-game/` as they are the most current and comprehensive.**

## Key Implementation Considerations

### Configuration-Driven Design
- **All values must be configurable** - no magic numbers in code
- Uses ConfigurationManager system with get/set methods
- Movement calculations based on configurable speed values and terrain modifiers
- Example: `timePerTile = CONFIG.get('movement.baseTimePerTile') / (armySpeed * terrainModifier)`

### Movement and Speed System
- Army speed = average of unique unit type speeds (quantities don't affect speed)
- Movement time calculation: `baseTimePerTile / (armySpeed * terrainModifier)`
- Terrain modifiers: roads 2x faster, swamps 0.5x speed, etc.
- All values configurable in TERRAIN_CONFIG and UNIT_CONFIGS

### Combat Resolution
- Power-based combat with terrain and building modifiers
- Spells from queue trigger before normal combat
- Castle defense includes garrison + building defense with multipliers

### Pause System
- Complete game state freeze including resource generation, movement, combat
- Spell selection timers pause
- UI remains viewable but not interactive

## Implementation Approach

### Phase-Based Development
Follow the 12-phase implementation plan in `tasks.md`:
1. **Foundation**: Phaser 3 setup, configuration system, ECS
2. **Game State**: Player management, resource systems
3. **World Map**: Tilemap generation and rendering
4. **Castle System**: Buildings and unit production
5. **Army System**: Movement with speed/terrain calculations
6. **Combat System**: Power-based resolution
7. **Magic System**: Rogue-like spell selection
8. **UI System**: Red Alert-style interface
9. **AI System**: Computer opponents
10. **Game Flow**: Save/load, audio, victory
11. **Performance**: Optimization and culling
12. **Testing**: Comprehensive test suite

### Test-Driven Development
- Each task includes specific test requirements
- Focus on unit tests for core calculations (movement, combat, resources)
- Integration tests for full game flow
- Performance tests for large-scale scenarios

When beginning implementation, start with **Task 1** in `.claude/specs/rts-game/tasks.md` and follow the incremental build approach outlined in the specifications.