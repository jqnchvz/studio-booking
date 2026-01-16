import { expect, beforeAll, afterAll, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Set test environment variables
beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
  process.env.SESSION_SECRET = 'test-session-secret-for-testing-only';
  (process.env as any).NODE_ENV = 'test';
});

// Clean up after each test
afterEach(() => {
  // Reset any mocks or state between tests
});

// Clean up after all tests
afterAll(() => {
  // Cleanup any persistent connections or resources
});
