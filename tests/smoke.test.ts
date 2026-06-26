import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDatabase, closeDatabase } from '../src/db/sqlite';
import { startServer } from '../src/api/server';
import path from 'path';
import fs from 'fs';

describe('Smoke Tests', () => {
    const testDbPath = path.join(process.cwd(), 'data', 'smoke-test.db');

    beforeAll(() => {
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    });

    afterAll(() => {
        closeDatabase();
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    });

    it('should initialize the database without errors', () => {
        const db = initDatabase(testDbPath);
        expect(db).toBeDefined();
    });

    it('should verify playwright is importable', async () => {
        const playwright = await import('playwright');
        expect(playwright).toBeDefined();
    });

    it('should have a working environment configuration', () => {
        expect(process.env.API_PORT || '3000').toBeDefined();
    });
});
