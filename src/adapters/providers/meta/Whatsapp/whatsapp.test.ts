// Unit tests for WhatsAppAdapter (WAHA-only)
import { describe, test, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { WhatsAppAdapter } from './whatsapp';

describe('WhatsAppAdapter', () => {
  beforeAll(() => {
    // Provide required config via environment variable for loader
    process.env.DATABASE_PATH = '/tmp/db.sqlite';
    process.env.API_PORT = '3000';
    process.env.API_HOST = 'localhost';
    process.env.DASHBOARD_PORT = '4000';
    process.env.JWT_SECRET = 'test-secret-must-be-at-least-32-chars-long';
    process.env.ENCRYPTION_KEY = 'test-encryption-key-must-be-32-chars';
    process.env.LOG_LEVEL = 'info';
    process.env.WAHA_BASE_URL = 'http://localhost:3001';
    process.env.WAHA_API_KEY = 'test-key';
    process.env.WAHA_SESSION = 'test-session';
  });

  test('initializes with WAHA config and reports rate limit status', async () => {
    const adapter = new WhatsAppAdapter();
    const status = await adapter.getRateLimitStatus();
    expect(status).toBeDefined();
    expect(typeof status?.limit).toBe('number');
    expect(typeof status?.remaining).toBe('number');
    expect(typeof status?.reset).toBe('number');
  });

  test('constructor accepts explicit options', () => {
    const adapter = new WhatsAppAdapter({
      baseUrl: 'http://waha.local',
      apiKey: 'my-key',
      session: 'custom-session',
    });
    // Adapter created without error
    expect(adapter).toBeDefined();
  });
});