import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { startServer } from '../src/api/server';
import { initDatabase, closeDatabase } from '../src/db/sqlite';
import { getConfig } from '../src/config/secrets';
import path from 'path';
import fs from 'fs';

describe('Integration Tests (API & Workflow)', () => {
    let server: any;
    let token: string;
    const testDbPath = path.join(process.cwd(), 'data', 'integration-test.db');

    beforeAll(async () => {
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
        initDatabase(testDbPath);
        server = await startServer();
        
        // Generate test token
        token = jwt.sign({ sub: 'test-user' }, 'test-secret-must-be-at-least-32-chars-long', { algorithm: 'HS256' });
    });

    afterAll(async () => {
        closeDatabase();
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
        // Note: server close might require extra logic depending on implementation
    });

    it('API: should return health status ok', async () => {
        const response = await request('http://localhost:3000').get('/v1/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
    });

    it('API: should list accounts (empty initially)', async () => {
        const response = await request('http://localhost:3000')
            .get('/v1/accounts')
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
});
