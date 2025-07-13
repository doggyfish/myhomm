# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyHoMM is a 2D grid-based real-time strategy game inspired by Heroes of Might and Magic, built in Unity with C#. The game features:

- Real-time unit production at castles (1 unit/second)
- Grid-based army movement with instant positioning
- Simple numerical combat system (higher number wins)
- Cross-platform target with iOS as primary focus

## Development Commands

### Unity Project
- **Build**: File → Build Settings → Build (or Ctrl+Shift+B)
- **Play/Test**: Unity Editor Play button or Ctrl+P
- **iOS Build**: Switch to iOS platform, then build to Xcode project

### Project Structure
```
Assets/
├── Scripts/ - Main game logic (GameManager, Castle, Army, etc.)
├── HalfSLG/ - Existing complex turn-based strategy framework
├── 3rd/ - Third-party libraries (LitJson)
├── Audio/ - Sound effects and music
├── Resources/ - Runtime loadable assets
└── Scenes/ - Unity scene files
```

## Architecture

### Core Game Systems

**GameManager** (`Assets/Scripts/GameManager.cs`)
- Central controller managing game state
- Handles time-based unit production (Update loop)
- Processes touch/mouse input for iOS compatibility
- Manages collections of castles and armies

**GridManager** (`Assets/Scripts/GridManager.cs`) 
- Manages Unity Tilemap system for grid positioning
- Converts between world/grid coordinates
- Validates movement positions

**Castle** (`Assets/Scripts/Castle.cs`)
- Produces units automatically over time
- Handles combat when armies attack
- Manages ownership and visual representation

**Army** (`Assets/Scripts/Army.cs`)
- Mobile entities containing unit counts
- Instant grid-based movement
- Combat resolution with castles/other armies

### Key Design Patterns

- **Time-based Production**: Only unit generation uses real-time, movement is instant
- **Grid Positioning**: All game objects use Vector3Int for tile positions
- **Component Architecture**: Unity MonoBehaviour pattern with inspector-exposed fields

## iOS Considerations

- Touch input automatically converted from mouse input by Unity
- Target minimum iOS 12.0
- Uses Unity's built-in cross-platform deployment
- 2D grid system scales well across iPhone/iPad screens

## Existing Codebase

The project contains an existing complex turn-based strategy framework (`HalfSLG/`) with:
- AI systems with decision trees and state machines
- Battle management with skills, buffs, and teams
- UI framework with view management
- Resource management and asset bundling

**Note**: The new MyHoMM implementation in `Assets/Scripts/` is separate from this existing framework and follows a simpler real-time design pattern.

## Development Setup

1. Requires Unity 2022.3 LTS or newer
2. iOS development requires macOS with Xcode
3. Follow `UNITY_SETUP_GUIDE.md` for detailed setup instructions
4. Game design documented in `GAME_DESIGN.md`