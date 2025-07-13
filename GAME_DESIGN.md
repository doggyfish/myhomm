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

### Army & Unit Management
- **Army System**: An army is a single entity that moves on the map and contains multiple units
- **Unit Count**: Each army has a numerical strength value representing the number of units it contains
- **Movement**: Armies move across the grid from castle to castle (not individual units)
- **Combat Resolution**: Simple numerical comparison
  - Attacking army vs Defending army
  - Higher number wins
  - Winner keeps (Winner Count - Loser Count) units
  - Loser is eliminated

### Map & Movement
- **Grid System**: 2D tile-based map
- **Movement Rules**: 
  - Armies move one tile at a time on player command
  - Movement is instant/immediate when commanded
  - Only one army per tile (or allow stacking)

## Technical Implementation Plan

### Framework Recommendation: **Unity**
**Why Unity is ideal for this project:**
- **C# Native**: Built specifically for C# development
- **Cross-Platform**: Deploy to Windows, macOS, Linux, mobile, web with single codebase
- **2D Optimized**: Excellent 2D rendering pipeline and tools
- **Grid Systems**: Built-in Tilemap and Grid components
- **Real-time Updates**: Perfect for time-based unit production
- **Networking**: Unity Netcode for GameObjects (multiplayer ready)
- **UI System**: Robust UI toolkit for game interfaces
- **Asset Pipeline**: Easy sprite and asset management

### Alternative Options (if Unity not preferred):
1. **MonoGame**: Pure C#, full control, requires more manual work
2. **Godot with C#**: Good 2D support, C# scripting available
3. **Avalonia**: Desktop-focused, would need custom game loop

### Platform Support Strategy
```
Target Platforms (iOS Primary):
1. iOS (Primary target)
2. Android 
3. Windows/macOS/Linux (Desktop)
4. Future: Web (WebGL)
```

**iOS-Specific Considerations:**
- **Touch Controls**: Grid-based gameplay is perfect for touch (tap to select, tap to move)
- **Performance**: Unity optimizes well for iOS hardware
- **App Store**: Unity games are common and accepted on iOS App Store
- **Screen Sizes**: 2D grid scales well across iPhone/iPad screens
- **Real-time Gameplay**: Works excellently on mobile (no complex controls needed)

### Multiplayer Architecture Plan
- **Client-Server Model**: Authoritative server for game state
- **Unity Netcode for GameObjects**: Handle networking layer
- **Real-time Sync**: Server manages unit production timers
- **Command Validation**: Server validates all army movements
- **State Synchronization**: Regular game state updates to clients

### Core Systems Architecture

#### 1. **Game Manager (MonoBehaviour)**
```csharp
public class GameManager : MonoBehaviour
{
    public float unitProductionInterval = 1.0f; // 1 unit per second
    public List<Castle> castles;
    public List<Army> armies;
    
    void Update()
    {
        HandleUnitProduction();
        HandleInput();
    }
}
```

#### 2. **Grid System (Unity Tilemap)**
```csharp
public class GridManager : MonoBehaviour
{
    public Tilemap tilemap;
    public Vector3Int GetGridPosition(Vector3 worldPos);
    public Vector3 GetWorldPosition(Vector3Int gridPos);
    public bool IsValidPosition(Vector3Int gridPos);
}
```

#### 3. **Castle System**
```csharp
public class Castle : MonoBehaviour
{
    public int unitCount;
    public float lastProductionTime;
    public Player owner;
    
    public void ProduceUnit()
    {
        unitCount++;
        // Update UI display
    }
}
```

#### 4. **Army System**
```csharp
public class Army : MonoBehaviour
{
    public int unitCount;
    public Vector3Int currentGridPosition;
    public Player owner;
    
    public void MoveTo(Vector3Int targetPosition)
    {
        // Instant movement
        currentGridPosition = targetPosition;
        transform.position = GridManager.GetWorldPosition(targetPosition);
    }
    
    public void AttackTarget(Castle castle)
    {
        // Combat resolution
    }
}
```

#### 5. **Networking Layer (Multiplayer)**
```csharp
public class NetworkGameManager : NetworkBehaviour
{
    [ServerRpc]
    public void MoveArmyServerRpc(int armyId, Vector3Int targetPos);
    
    [ClientRpc]
    public void UpdateGameStateClientRpc(GameStateData data);
}
```

## Initial Implementation Plan

### Phase 1: Core Foundation
- [ ] Set up cross-platform C# project
- [ ] Implement basic grid map system
- [ ] Create simple castle representation
- [ ] Basic unit spawning mechanism

### Phase 2: Basic Gameplay
- [ ] Army movement system
- [ ] Simple combat resolution
- [ ] Time-based unit production
- [ ] Win/lose conditions

### Phase 3: Enhanced Features
- [ ] Multiple army/unit types
- [ ] Castle upgrades
- [ ] Improved UI/UX
- [ ] Sound and visual effects

## Game Flow Example

1. **Game Start**: 3 castles placed on grid map, each starts producing units immediately
2. **Continuous Production**: All castles generate units automatically in real-time
3. **Player Commands**: Player can issue commands at any time (no waiting for turns)
4. **Army Movement**: Player commands armies to move instantly between tiles
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