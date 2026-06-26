import { beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { initSqlJsDatabase, closeDatabase, runMigrations } from './src/db/sqlite';

// Provide a Jest-compatible alias for legacy tests.
(globalThis as any).jest = vi;

// Set default environment variables for tests
process.env.DATABASE_PATH = process.env.DATABASE_PATH || 'data/test.db';
process.env.API_PORT = process.env.API_PORT || '3000';
process.env.API_HOST = process.env.API_HOST || 'localhost';
process.env.DASHBOARD_PORT = process.env.DASHBOARD_PORT || '3001';
process.env.JWT_SECRET = 'test-secret-must-be-at-least-32-chars-long';
process.env.ENCRYPTION_KEY = 'test-encryption-key-must-be-32-chars';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';

vi.mock('axios', () => {
  const instance = {
    post: vi.fn().mockResolvedValue({ data: { status: 'ok' }, status: 200 }),
    get: vi.fn().mockResolvedValue({ data: {}, status: 200 }),
    put: vi.fn().mockResolvedValue({ data: { status: 'ok' }, status: 200 }),
    patch: vi.fn().mockResolvedValue({ data: { status: 'ok' }, status: 200 }),
    delete: vi.fn().mockResolvedValue({ data: {}, status: 200 }),
    request: vi.fn().mockResolvedValue({ data: { status: 'ok' }, status: 200 }),
    interceptors: { request: { use: vi.fn(), eject: vi.fn() }, response: { use: vi.fn(), eject: vi.fn() } },
    defaults: {},
    create: vi.fn(() => instance),
  }
  return {
    __esModule: true,
    default: instance,
    create: vi.fn(() => instance),
  }
});

let tempDbPath = path.resolve(process.cwd(), 'data', 'test.db');

beforeEach(async () => {
  try { fs.unlinkSync(tempDbPath); } catch { /* file may not exist in non-DB tests */ }
  await initSqlJsDatabase(tempDbPath);
  runMigrations(path.resolve(process.cwd(), 'migrations'));
});

afterEach(() => {
  try { closeDatabase(); } catch (e) {}
  try { fs.unlinkSync(tempDbPath); } catch { /* file may not exist in non-DB tests */ }
});

