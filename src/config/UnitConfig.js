// Unit configurations with speed values representing tiles per second at base speed
export const UNIT_CONFIGS = {
    human: {
        // Speed values: tiles per second (higher = faster)
        swordsman: { power: 5, speed: 10, cost: { gold: 50 } },  // 10 tiles/sec = 0.1 sec per tile
        archer: { power: 8, speed: 5, cost: { gold: 75 }, isRanged: true },  // 5 tiles/sec = 0.2 sec per tile
        knight: { power: 20, speed: 100, cost: { gold: 200 } },  // 100 tiles/sec = 0.01 sec per tile (very fast)
        wizard: { power: 15, speed: 10, cost: { gold: 150, mana: 50 }, canCastSpells: true },
        paladin: { power: 50, speed: 80, cost: { gold: 500 }, ability: 'powerBoost' }
    },
    orc: {
        warrior: { power: 6, speed: 10, cost: { gold: 50 } },
        archer: { power: 9, speed: 5, cost: { gold: 75 }, isRanged: true },
        wolfRider: { power: 15, speed: 120, cost: { gold: 180 } },  // Fastest unit
        shaman: { power: 14, speed: 10, cost: { gold: 140, mana: 40 }, canCastSpells: true },
        berserker: { power: 55, speed: 75, cost: { gold: 550 }, ability: 'rage' },
        ogre: { power: 30, speed: 15, cost: { gold: 300 }, antiCastle: 1.5 }  // Slow but powerful
    }
};