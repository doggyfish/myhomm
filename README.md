# MyHoMM - My Heroes of Might and Magic

A modern web-based strategy game inspired by the classic Heroes of Might and Magic series, built with JavaScript and HTML5 Canvas.

## 🎮 Game Overview

MyHoMM is a turn-based strategy game featuring castle management, army building, resource management, and tactical combat. Players control castles that produce different types of units, manage gold resources, and compete against intelligent AI opponents with distinct personalities.

## ✨ Current Features (Phase 2 Complete)

### 🤖 **Advanced AI System**
- **Multi-Difficulty Opponents**: Easy, Medium, and Hard AI with different reaction times and strategies
- **AI Personalities**: Aggressive, Defensive, Economic, and Balanced archetypes with unique behaviors
- **Strategic Decision Making**: AI evaluates threats, opportunities, and resource allocation
- **Intelligent Upgrades**: Personality-based castle upgrade prioritization

### 💰 **Resource Management**
- **Gold Economy**: Starting gold (100) with castle-based income generation (2 gold/second)
- **Production Costs**: Units require gold payment (Infantry: 3g, Archers: 4g, Cavalry: 6g)
- **Strategic Choices**: Balance between unit production and castle upgrades
- **Economic Constraints**: Limited resources create meaningful decisions

### ⚔️ **Multiple Unit Types**
- **Infantry**: Basic melee fighters (3 gold, 1s production, power 1)
- **Archers**: Ranged combat specialists (4 gold, 2s production, power 2)  
- **Cavalry**: Fast mounted warriors (6 gold, 3s production, power 3)
- **Mixed Armies**: Armies contain multiple unit types for tactical variety

### 🏰 **Castle System**
- **Production Management**: Multiple unit types produced simultaneously
- **Upgrade System**: Production, Defense, and Capacity upgrades with escalating costs
- **Gold Generation**: Automatic income generation from owned castles
- **Strategic Positioning**: Map-based tactical advantages

### 🎯 **Gameplay Mechanics**
- **Player Elimination**: Armies automatically removed when losing all castles
- **Win Conditions**: Victory by controlling all castles or eliminating opponents
- **Army Management**: Send armies between castles with percentage-based deployment
- **Combat Resolution**: Strength-based battles with defensive bonuses

## 🛠️ Technical Architecture

### **Object-Oriented Design**
- **Modular Systems**: Separate classes for AI, Combat, Movement, and Production
- **Entity Management**: Clean Player, Castle, and Army class hierarchy  
- **System Integration**: Coordinated game loop with state management

### **Performance Optimized**
- **Efficient Updates**: System-based updates with proper timing intervals
- **Memory Management**: Proper cleanup of eliminated entities
- **Scalable Design**: Support for multiple AI players and complex calculations

## 📁 Project Structure

```
myhomm/
├── src/
│   ├── core/
│   │   └── Game.js              # Main game controller
│   ├── entities/
│   │   ├── Player.js            # Player management and resources
│   │   ├── Castle.js            # Castle production and upgrades
│   │   └── Army.js              # Army movement and composition
│   ├── systems/
│   │   ├── AISystem.js          # AI personalities and decisions
│   │   ├── CombatSystem.js      # Battle resolution
│   │   ├── MovementSystem.js    # Army pathfinding
│   │   └── ProductionSystem.js  # Unit production management
│   └── ui/
│       ├── InputHandler.js      # User input processing
│       └── Renderer.js          # Game visualization
├── tests/
│   └── phase2-tests.js          # Comprehensive test suite
├── PHASE2_PLAN.md               # Phase 2 planning document
├── PHASE3_PLAN.md               # Phase 3 planning document
└── test-phase2.html             # Browser-based test runner
```

## 🧪 Testing

### **Comprehensive Test Suite**
Run tests using the browser-based test runner:

```bash
# Open in browser
open test-phase2.html
```

**Test Categories:**
- **AI Personality System**: Behavior verification and decision-making
- **Resource Management**: Gold production, spending, and constraints
- **Unit Production**: Multiple types, costs, and timing
- **Player Elimination**: Army cleanup and win conditions
- **Castle Upgrades**: Cost calculation and effect application
- **System Integration**: Coordinated system functionality

### **Verification Script**
```bash
node verify-phase2.js
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd myhomm
   ```

2. **Open the game**
   ```bash
   # Open index.html in your browser
   open index.html
   ```

3. **Run tests**
   ```bash
   # Open test runner in browser  
   open test-phase2.html
   ```

## 🎯 Game Controls

- **Left Click**: Select castle or army
- **Right Click**: Send army to target location
- **Double Click**: Select all units at location
- **Keyboard Shortcuts**: Various game commands (see in-game help)

## 📈 Development Roadmap

### ✅ **Phase 1: Foundation** (Complete)
- OOP architecture transformation
- Basic game mechanics
- Canvas rendering system

### ✅ **Phase 2: Advanced Gameplay** (Complete)  
- AI opponents with personalities
- Resource management and economy
- Multiple unit types and production
- Castle upgrades and progression
- Player elimination mechanics

### 🔄 **Phase 3: Combat & UI Enhancement** (Planned)
- Power-based combat system
- Enhanced army visualization  
- Specialized castle types
- Advanced tactical mechanics

### 🔮 **Phase 4: Polish & Features** (Future)
- Multiplayer support
- Campaign mode
- Save/load system
- Advanced graphics and effects

## 💻 Technical Requirements

- **Modern Browser**: Chrome, Firefox, Safari, or Edge
- **JavaScript**: ES6+ support required
- **HTML5**: Canvas API support
- **No Dependencies**: Pure JavaScript implementation

## 🤝 Contributing

This is a personal learning project, but feedback and suggestions are welcome! 

## 📄 License

This project is for educational purposes. Classic Heroes of Might and Magic is owned by Ubisoft.

---

**🎮 MyHoMM Phase 2: Complete strategic gameplay with intelligent AI opponents, resource management, and tactical depth!**
