# MyHoMM - Game Design Document

## Overview
MyHoMM is a 2D grid-based strategy game inspired by Heroes of Might and Magic. Players control castles that automatically generate units over time and can send armies to conquer other castles through tactical combat.

## Core Concept
- **Genre**: Real-time strategy
- **Platform**: Cross-platform HTML5 (desktop and mobile)
- **Technology**: JavaScript with HTML5 Canvas
- **Map**: 2D grid-based world (20x15)
- **Starting Setup**: 3 castles controlled by 1 human player and 2 AI players

## Game Mechanics

### Castle System
- **Base Functionality**: Each castle serves as a production center and stronghold
- **Unit Generation**: Castles automatically produce multiple unit types continuously
  - **Infantry**: 3 gold cost, 1 second production time (basic units)
  - **Archers**: 4 gold cost, 2 second production time (ranged units)
  - **Cavalry**: 6 gold cost, 3 second production time (fast units)
  - Production rates can be upgraded through castle improvements
- **Gold Production**: Each castle generates 2 gold per second for its owner
- **Upgrade System**: Castles can be upgraded to improve production, defense, and capacity
  - **Production Upgrade**: Increases unit production speed by 20% per level
  - **Defense Upgrade**: Adds 10% defensive bonus per level
  - **Capacity Upgrade**: Increases maximum unit storage by 100 per level

### Army & Unit Management
- **Army System**: Armies contain mixed unit types with different capabilities
  - **Unit Composition**: Each army tracks infantry, archers, and cavalry separately
  - **Combat Effectiveness**: Unit types affect overall army combat power
  - **Experience System**: Armies gain experience and veteran levels through battles
  - **Morale & Supply**: Army effectiveness affected by morale and supply levels
- **Movement**: Armies move smoothly across the grid with interpolated animation
- **Combat Resolution**: Enhanced combat system with multiple factors
  - Base unit strength modified by morale, experience, and unit composition
  - Defensive bonuses for castles and terrain
  - Winners gain experience, losers may be eliminated or retreat

### AI Player System
- **Multiple Difficulties**: Easy, Medium, and Hard AI opponents
- **Personality Types**: Each AI has distinct behavior patterns
  - **Aggressive AI**: High aggressiveness (90%), low economic focus (20%)
  - **Defensive AI**: Low aggressiveness (30%), high economic focus (60%)
  - **Economic AI**: Focuses on resource accumulation and castle upgrades
- **Strategic Decision Making**: AI evaluates threats, opportunities, and resource management
- **Adaptive Behavior**: AI changes strategies based on game situation

### Resource Management
- **Gold Economy**: Primary resource for unit production and upgrades
  - Players start with 100 gold
  - Castles generate 2 gold per second
  - Units cost gold to produce (3-6 gold per unit)
  - Upgrades require increasing amounts of gold
- **Player Elimination**: When a player loses all castles, their armies are automatically removed

### Map & Movement
- **Grid System**: 2D tile-based map (20x15 tiles)
- **Movement Rules**: 
  - Armies move smoothly with animated interpolation
  - Real-time movement system with progress tracking
  - Multiple armies can occupy the same tile briefly during movement

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