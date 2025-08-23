// Mock Phaser globally for testing
global.Phaser = {
  Game: class MockGame {
    constructor() {
      this.scene = {
        add: () => ({ start: () => {} })
      };
    }
  },
  AUTO: 'auto',
  Scene: class MockScene {
    constructor() {
      this.add = {
        graphics: () => ({ fillStyle: () => {}, fillRect: () => {} }),
        text: () => ({ setOrigin: () => {} })
      };
      this.input = {
        on: () => {}
      };
      this.cameras = {
        main: {
          setBounds: () => {},
          setZoom: () => {}
        }
      };
    }
  },
  Geom: {
    Rectangle: {
      Contains: () => false
    }
  },
  Math: {
    Distance: {
      Between: (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2)
    }
  }
};