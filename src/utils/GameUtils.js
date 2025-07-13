/**
 * GameUtils provides general utility functions for game logic
 */
class GameUtils {
    /**
     * Generate unique ID for game objects
     * @param {string} prefix - Prefix for the ID
     * @returns {string} Unique identifier
     */
    static generateId(prefix = 'obj') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * Linear interpolation between two values
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    static lerp(start, end, t) {
        return start + (end - start) * this.clamp(t, 0, 1);
    }
    
    /**
     * Format time in milliseconds to readable string
     * @param {number} milliseconds - Time in milliseconds
     * @returns {string} Formatted time string
     */
    static formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    /**
     * Format large numbers with appropriate suffixes
     * @param {number} number - Number to format
     * @returns {string} Formatted number string
     */
    static formatNumber(number) {
        if (number >= 1000000) {
            return (number / 1000000).toFixed(1) + 'M';
        } else if (number >= 1000) {
            return (number / 1000).toFixed(1) + 'K';
        } else {
            return number.toString();
        }
    }
    
    /**
     * Calculate percentage with specified decimal places
     * @param {number} value - Current value
     * @param {number} total - Total value
     * @param {number} decimals - Number of decimal places
     * @returns {number} Percentage value
     */
    static calculatePercentage(value, total, decimals = 1) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
    
    /**
     * Get random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Get random float between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random float
     */
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * Choose random element from array
     * @param {Array} array - Array to choose from
     * @returns {*} Random element or null if array is empty
     */
    static randomChoice(array) {
        if (array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * Shuffle array in place using Fisher-Yates algorithm
     * @param {Array} array - Array to shuffle
     * @returns {Array} The same array, shuffled
     */
    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    /**
     * Deep clone an object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
    }
    
    /**
     * Check if two objects are equal (shallow comparison)
     * @param {Object} obj1 - First object
     * @param {Object} obj2 - Second object
     * @returns {boolean} True if objects are equal
     */
    static shallowEqual(obj1, obj2) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        
        if (keys1.length !== keys2.length) return false;
        
        for (let key of keys1) {
            if (obj1[key] !== obj2[key]) return false;
        }
        
        return true;
    }
    
    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }
    
    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, delay) {
        let timeoutId;
        
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    /**
     * Color utility functions
     */
    static colorUtils = {
        /**
         * Convert hex color to RGB
         * @param {string} hex - Hex color string
         * @returns {Object} RGB values {r, g, b}
         */
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },
        
        /**
         * Convert RGB to hex color
         * @param {number} r - Red value (0-255)
         * @param {number} g - Green value (0-255)
         * @param {number} b - Blue value (0-255)
         * @returns {string} Hex color string
         */
        rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },
        
        /**
         * Lighten a hex color
         * @param {string} hex - Hex color string
         * @param {number} percent - Percent to lighten (0-100)
         * @returns {string} Lightened hex color
         */
        lightenColor(hex, percent) {
            const rgb = this.hexToRgb(hex);
            if (!rgb) return hex;
            
            const factor = 1 + (percent / 100);
            return this.rgbToHex(
                Math.min(255, Math.round(rgb.r * factor)),
                Math.min(255, Math.round(rgb.g * factor)),
                Math.min(255, Math.round(rgb.b * factor))
            );
        },
        
        /**
         * Darken a hex color
         * @param {string} hex - Hex color string
         * @param {number} percent - Percent to darken (0-100)
         * @returns {string} Darkened hex color
         */
        darkenColor(hex, percent) {
            const rgb = this.hexToRgb(hex);
            if (!rgb) return hex;
            
            const factor = 1 - (percent / 100);
            return this.rgbToHex(
                Math.max(0, Math.round(rgb.r * factor)),
                Math.max(0, Math.round(rgb.g * factor)),
                Math.max(0, Math.round(rgb.b * factor))
            );
        }
    };
    
    /**
     * Local storage utilities
     */
    static storage = {
        /**
         * Save data to local storage
         * @param {string} key - Storage key
         * @param {*} data - Data to save
         * @returns {boolean} True if save successful
         */
        save(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Failed to save to localStorage:', error);
                return false;
            }
        },
        
        /**
         * Load data from local storage
         * @param {string} key - Storage key
         * @param {*} defaultValue - Default value if key not found
         * @returns {*} Loaded data or default value
         */
        load(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Failed to load from localStorage:', error);
                return defaultValue;
            }
        },
        
        /**
         * Remove item from local storage
         * @param {string} key - Storage key
         */
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('Failed to remove from localStorage:', error);
            }
        },
        
        /**
         * Clear all local storage
         */
        clear() {
            try {
                localStorage.clear();
            } catch (error) {
                console.error('Failed to clear localStorage:', error);
            }
        }
    };
    
    /**
     * Performance monitoring utilities
     */
    static performance = {
        /**
         * Measure function execution time
         * @param {Function} func - Function to measure
         * @param {...*} args - Arguments for the function
         * @returns {Object} Result and execution time
         */
        measure(func, ...args) {
            const start = performance.now();
            const result = func(...args);
            const end = performance.now();
            
            return {
                result: result,
                executionTime: end - start
            };
        },
        
        /**
         * Create a performance timer
         * @param {string} name - Timer name
         * @returns {Object} Timer object with start/stop methods
         */
        createTimer(name) {
            let startTime = null;
            
            return {
                start() {
                    startTime = performance.now();
                },
                
                stop() {
                    if (startTime === null) return 0;
                    const elapsed = performance.now() - startTime;
                    console.log(`${name}: ${elapsed.toFixed(2)}ms`);
                    return elapsed;
                }
            };
        }
    };
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameUtils;
}