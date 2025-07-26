/**
 * Renderer handles all visual rendering for the game
 * Provides drawing utilities and rendering management
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.isEnabled = true;
        
        // Rendering settings
        this.settings = {
            gridSize: 40,
            showGrid: true,
            backgroundColor: '#1a1a2e',
            gridColor: '#333',
            highlightColor: '#ff6b35',
            selectedColor: '#4CAF50'
        };
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFrameTime = Date.now();
        this.fps = 0;
        
        // Render states
        this.needsRedraw = true;
        this.lastRenderTime = 0;
        
        this.initialize();
    }
    
    /**
     * Initialize the renderer
     */
    initialize() {
        if (!this.canvas || !this.ctx) {
            console.warn('Renderer: No canvas or context provided, rendering will not work');
            return;
        }
        
        // Set up canvas properties
        this.setupCanvas();
        
        // Initial render
        this.requestRedraw();
        
        console.log('Renderer initialized successfully');
    }
    
    /**
     * Set up canvas properties
     */
    setupCanvas() {
        if (!this.ctx) return;
        
        // Set canvas size if not already set
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            this.canvas.width = 800;
            this.canvas.height = 600;
        }
        
        // Set up rendering context
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = '12px Arial';
    }
    
    /**
     * Request a redraw on the next frame
     */
    requestRedraw() {
        this.needsRedraw = true;
    }
    
    /**
     * Main render function
     */
    render(gameState) {
        if (!this.isEnabled || !this.ctx || !this.needsRedraw) {
            return;
        }
        
        const currentTime = Date.now();
        this.updateFPS(currentTime);
        
        // Clear canvas
        this.clear();
        
        // Render game elements
        if (gameState) {
            this.renderBackground();
            this.renderGrid();
            this.renderCastles(gameState.castles || []);
            this.renderArmies(gameState.armies || []);
            this.renderUI(gameState);
        } else {
            // Render placeholder when no game state
            this.renderPlaceholder();
        }
        
        this.needsRedraw = false;
        this.lastRenderTime = currentTime;
    }
    
    /**
     * Update FPS calculation
     */
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFrameTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFrameTime));
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
        }
    }
    
    /**
     * Clear the canvas
     */
    clear() {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = this.settings.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Render background
     */
    renderBackground() {
        if (!this.ctx) return;
        
        // Background is already rendered in clear()
        // This method can be extended for more complex backgrounds
    }
    
    /**
     * Render grid
     */
    renderGrid() {
        if (!this.ctx || !this.settings.showGrid) return;
        
        const { gridSize } = this.settings;
        
        this.ctx.strokeStyle = this.settings.gridColor;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        
        // Vertical lines
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + 0.5, 0);
            this.ctx.lineTo(x + 0.5, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y + 0.5);
            this.ctx.lineTo(this.canvas.width, y + 0.5);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    /**
     * Render castles
     */
    renderCastles(castles) {
        if (!this.ctx) return;
        
        castles.forEach(castle => {
            this.renderCastle(castle);
        });
    }
    
    /**
     * Render a single castle
     */
    renderCastle(castle) {
        if (!this.ctx) return;
        
        const x = castle.x * this.settings.gridSize;
        const y = castle.y * this.settings.gridSize;
        const size = this.settings.gridSize - 4;
        
        // Castle background
        this.ctx.fillStyle = castle.selected ? this.settings.selectedColor : castle.owner?.color || '#666';
        this.ctx.fillRect(x + 2, y + 2, size, size);
        
        // Castle border
        this.ctx.strokeStyle = castle.selected ? this.settings.highlightColor : '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + 2, y + 2, size, size);
        
        // Castle unit count
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(castle.unitCount.toString(), x + this.settings.gridSize / 2, y + this.settings.gridSize / 2);
        
        // Owner name (if space allows)
        if (castle.owner && this.settings.gridSize > 30) {
            this.ctx.font = '10px Arial';
            this.ctx.fillText(castle.owner.name.substring(0, 8), x + this.settings.gridSize / 2, y + this.settings.gridSize - 8);
        }
    }
    
    /**
     * Render armies
     */
    renderArmies(armies) {
        if (!this.ctx) return;
        
        armies.forEach(army => {
            this.renderArmy(army);
        });
    }
    
    /**
     * Render a single army
     */
    renderArmy(army) {
        if (!this.ctx) return;
        
        // Get render position (interpolated if moving)
        const pos = army.getRenderPosition ? army.getRenderPosition() : { x: army.x, y: army.y };
        const x = pos.x * this.settings.gridSize;
        const y = pos.y * this.settings.gridSize;
        const size = this.settings.gridSize / 2;
        
        // Army circle
        this.ctx.fillStyle = army.owner?.color || '#999';
        this.ctx.beginPath();
        this.ctx.arc(x + this.settings.gridSize / 2, y + this.settings.gridSize / 2, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Army border
        this.ctx.strokeStyle = army.selected ? this.settings.highlightColor : '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x + this.settings.gridSize / 2, y + this.settings.gridSize / 2, size / 2, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Army unit count
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText(army.unitCount.toString(), x + this.settings.gridSize / 2, y + this.settings.gridSize / 2);
        
        // Movement indicator
        if (!army.isStationary && army.targetX !== undefined && army.targetY !== undefined) {
            this.renderMovementLine(x + this.settings.gridSize / 2, y + this.settings.gridSize / 2,
                                  army.targetX * this.settings.gridSize + this.settings.gridSize / 2,
                                  army.targetY * this.settings.gridSize + this.settings.gridSize / 2);
        }
    }
    
    /**
     * Render movement line
     */
    renderMovementLine(startX, startY, endX, endY) {
        if (!this.ctx) return;
        
        this.ctx.strokeStyle = this.settings.highlightColor;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = 10;
        
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - arrowLength * Math.cos(angle - Math.PI / 6), endY - arrowLength * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - arrowLength * Math.cos(angle + Math.PI / 6), endY - arrowLength * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    /**
     * Render UI elements
     */
    renderUI(gameState) {
        if (!this.ctx) return;
        
        // FPS counter
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
        
        // Player info
        if (gameState.players && gameState.players.length > 0) {
            let y = 40;
            gameState.players.forEach((player, index) => {
                this.ctx.fillStyle = player.color || '#fff';
                this.ctx.fillText(`${player.name}: ${player.statistics?.totalUnits || 0} units`, 10, y);
                y += 20;
            });
        }
        
        // Selected entity info
        if (gameState.selectedCastle) {
            this.renderSelectedInfo(gameState.selectedCastle, 'Castle');
        } else if (gameState.selectedArmy) {
            this.renderSelectedInfo(gameState.selectedArmy, 'Army');
        }
        
        this.ctx.textAlign = 'center'; // Reset text alignment
    }
    
    /**
     * Render selected entity information
     */
    renderSelectedInfo(entity, type) {
        if (!this.ctx) return;
        
        const x = this.canvas.width - 200;
        const y = 20;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - 10, y - 10, 190, 100);
        
        // Title
        this.ctx.fillStyle = this.settings.highlightColor;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Selected ${type}`, x, y + 10);
        
        // Entity info
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Owner: ${entity.owner?.name || 'Unknown'}`, x, y + 30);
        this.ctx.fillText(`Units: ${entity.unitCount}`, x, y + 50);
        
        if (entity.x !== undefined && entity.y !== undefined) {
            this.ctx.fillText(`Position: (${entity.x}, ${entity.y})`, x, y + 70);
        }
    }
    
    /**
     * Render placeholder when no game state
     */
    renderPlaceholder() {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#666';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('No Game State', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('Initialize game to see rendering', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
    
    /**
     * Convert pixel coordinates to grid coordinates
     */
    pixelToGrid(pixelX, pixelY) {
        return {
            x: Math.floor(pixelX / this.settings.gridSize),
            y: Math.floor(pixelY / this.settings.gridSize)
        };
    }
    
    /**
     * Convert grid coordinates to pixel coordinates
     */
    gridToPixel(gridX, gridY) {
        return {
            x: gridX * this.settings.gridSize,
            y: gridY * this.settings.gridSize
        };
    }
    
    /**
     * Update renderer settings
     */
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        this.requestRedraw();
    }
    
    /**
     * Enable/disable rendering
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (enabled) {
            this.requestRedraw();
        }
    }
    
    /**
     * Get renderer debug information
     */
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            fps: this.fps,
            frameCount: this.frameCount,
            needsRedraw: this.needsRedraw,
            canvasSize: this.canvas ? { width: this.canvas.width, height: this.canvas.height } : null,
            settings: { ...this.settings },
            lastRenderTime: this.lastRenderTime
        };
    }
    
    /**
     * Resize canvas and request redraw
     */
    resize(width, height) {
        if (!this.canvas) return;
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.setupCanvas();
        this.requestRedraw();
    }
    
    /**
     * Take a screenshot of the current canvas
     */
    screenshot(format = 'image/png') {
        if (!this.canvas) return null;
        return this.canvas.toDataURL(format);
    }
    
    /**
     * Clean up renderer resources
     */
    destroy() {
        this.isEnabled = false;
        this.needsRedraw = false;
        
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        console.log('Renderer destroyed');
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}