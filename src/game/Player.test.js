import { Player } from './Player.js';

// Mock ResourceManager
jest.mock('./ResourceManager.js', () => ({
    ResourceManager: jest.fn().mockImplementation(() => ({
        resources: { mana: 100 },
        hasResource: jest.fn()
    }))
}));

describe('Player', () => {
    let player;
    
    beforeEach(() => {
        player = new Player('player1', 'Test Player', 'human', false);
    });
    
    describe('constructor', () => {
        test('should create player with correct properties', () => {
            expect(player.id).toBe('player1');
            expect(player.name).toBe('Test Player');
            expect(player.faction).toBe('human');
            expect(player.isAI).toBe(false);
            expect(player.isAlive).toBe(true);
            expect(player.spellLibrary).toEqual([]);
            expect(player.resourceManager).toBeDefined();
            expect(player.color).toBeDefined();
        });
        
        test('should create AI player', () => {
            const aiPlayer = new Player('ai1', 'AI Player', 'orc', true);
            expect(aiPlayer.isAI).toBe(true);
        });
    });
    
    describe('color assignment', () => {
        test('should assign different colors to different players', () => {
            const player1 = new Player('player1', 'Player 1', 'human');
            const player2 = new Player('player2', 'Player 2', 'human');
            const player3 = new Player('player3', 'Player 3', 'human');
            
            expect(player1.color).not.toBe(player2.color);
            expect(player2.color).not.toBe(player3.color);
            expect(player1.color).not.toBe(player3.color);
        });
        
        test('should handle non-numeric player IDs', () => {
            const playerAlpha = new Player('alpha', 'Alpha', 'human');
            expect(playerAlpha.color).toBeDefined();
            expect(typeof playerAlpha.color).toBe('number');
        });
        
        test('should cycle colors for more than 8 players', () => {
            const player1 = new Player('player1', 'Player 1', 'human');
            const player9 = new Player('player9', 'Player 9', 'human');
            
            expect(player1.color).toBe(player9.color); // Should wrap around
        });
    });
    
    describe('spell management', () => {
        const mockSpell = { id: 'fireball', name: 'Fireball', manaCost: 30 };
        const mockSpell2 = { id: 'heal', name: 'Heal', manaCost: 20 };
        
        test('should add spell to library', () => {
            player.addSpell(mockSpell);
            
            expect(player.spellLibrary).toContain(mockSpell);
            expect(player.hasSpell('fireball')).toBe(true);
        });
        
        test('should not add duplicate spells', () => {
            player.addSpell(mockSpell);
            player.addSpell(mockSpell); // Try to add again
            
            expect(player.spellLibrary).toHaveLength(1);
        });
        
        test('should remove spell from library', () => {
            player.addSpell(mockSpell);
            player.addSpell(mockSpell2);
            
            const removed = player.removeSpell('fireball');
            
            expect(removed).toBe(true);
            expect(player.hasSpell('fireball')).toBe(false);
            expect(player.hasSpell('heal')).toBe(true);
        });
        
        test('should return false when removing non-existent spell', () => {
            const removed = player.removeSpell('nonexistent');
            expect(removed).toBe(false);
        });
        
        test('should get spell by ID', () => {
            player.addSpell(mockSpell);
            
            const retrievedSpell = player.getSpell('fireball');
            expect(retrievedSpell).toBe(mockSpell);
            
            const nonExistent = player.getSpell('nonexistent');
            expect(nonExistent).toBeUndefined();
        });
        
        test('should check if can cast spell', () => {
            player.addSpell(mockSpell);
            player.resourceManager.hasResource.mockReturnValue(true);
            
            expect(player.canCastSpell('fireball')).toBe(true);
            expect(player.resourceManager.hasResource).toHaveBeenCalledWith('mana', 30);
        });
        
        test('should return false for unknown spell when checking cast ability', () => {
            expect(player.canCastSpell('unknown')).toBe(false);
        });
        
        test('should return false when insufficient mana', () => {
            player.addSpell(mockSpell);
            player.resourceManager.hasResource.mockReturnValue(false);
            
            expect(player.canCastSpell('fireball')).toBe(false);
        });
    });
    
    describe('player state', () => {
        test('should eliminate player', () => {
            player.eliminate();
            expect(player.isAlive).toBe(false);
        });
        
        test('should revive player', () => {
            player.eliminate();
            player.revive();
            expect(player.isAlive).toBe(true);
        });
    });
    
    describe('faction configuration', () => {
        test('should get human faction bonus', () => {
            const humanPlayer = new Player('h1', 'Human', 'human');
            expect(humanPlayer.getFactionBonus('mana')).toBe(1.25);
            expect(humanPlayer.getFactionBonus('gold')).toBe(1.0);
        });
        
        test('should get orc faction bonus', () => {
            const orcPlayer = new Player('o1', 'Orc', 'orc');
            expect(orcPlayer.getFactionBonus('gold')).toBe(1.25);
            expect(orcPlayer.getFactionBonus('mana')).toBe(1.0);
        });
        
        test('should default to human faction for unknown faction', () => {
            const unknownPlayer = new Player('u1', 'Unknown', 'unknown');
            expect(unknownPlayer.getFactionBonus('mana')).toBe(1.25);
        });
        
        test('should get faction config', () => {
            const config = player.getFactionConfig();
            expect(config).toHaveProperty('resourceBonus');
            expect(config).toHaveProperty('unitProductionSpeed');
        });
    });
    
    describe('display methods', () => {
        test('should get display name for human player', () => {
            expect(player.getDisplayName()).toBe('Test Player');
        });
        
        test('should get display name for AI player', () => {
            const aiPlayer = new Player('ai1', 'AI Player', 'orc', true);
            expect(aiPlayer.getDisplayName()).toBe('AI Player (AI)');
        });
        
        test('should convert to string', () => {
            const str = player.toString();
            expect(str).toContain('player1');
            expect(str).toContain('Test Player');
            expect(str).toContain('human');
            expect(str).toContain('AI: false');
        });
        
        test('should convert to JSON', () => {
            player.addSpell({ id: 'spell1', name: 'Test Spell' });
            const json = player.toJSON();
            
            expect(json).toHaveProperty('id', 'player1');
            expect(json).toHaveProperty('name', 'Test Player');
            expect(json).toHaveProperty('faction', 'human');
            expect(json).toHaveProperty('isAI', false);
            expect(json).toHaveProperty('isAlive', true);
            expect(json).toHaveProperty('color');
            expect(json).toHaveProperty('resources');
            expect(json).toHaveProperty('spellLibrary', ['spell1']);
        });
    });
});