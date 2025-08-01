export const BUILDING_CONFIGS = {
    // Unit production
    barracks: { 
        cost: { gold: 500, wood: 100 }, 
        produces: ['swordsman', 'warrior'],
        baseRate: 60000  // 1 unit per minute
    },
    archeryRange: { 
        cost: { gold: 750, wood: 150 }, 
        produces: ['archer'],
        baseRate: 90000
    },
    stables: { 
        cost: { gold: 1500, wood: 200, stone: 100 }, 
        produces: ['knight', 'wolfRider'],
        baseRate: 120000
    },
    magicTower: { 
        cost: { gold: 2000, stone: 200, crystal: 50 }, 
        produces: ['wizard', 'shaman'],
        baseRate: 150000
    },
    
    // Resource generation
    goldMine: { 
        cost: { gold: 1000, stone: 100 }, 
        generates: { gold: 30 }  // per minute bonus
    },
    manaWell: { 
        cost: { gold: 1000, crystal: 50 }, 
        generates: { mana: 30 }
    },
    
    // Defense
    walls: { 
        cost: { gold: 2000, stone: 500 }, 
        defenseBonus: 1.5,
        hitPoints: 1000
    },
    watchtower: { 
        cost: { gold: 500, wood: 200 }, 
        visionRange: 10,
        defenseBonus: 1.2
    }
};