// Jest setup file for global mocks and configuration

// Ensure jest globals are available
import { jest } from '@jest/globals';

// Mock global objects that may not be available in Node.js test environment
global.performance = global.performance || {
  now: () => Date.now()
};

// Mock window object for AI event emission tests
global.window = global.window || {
  game: {
    events: {
      emit: jest.fn(),
      on: jest.fn()
    }
  }
};

// Mock console methods to avoid noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

// Reset console mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});