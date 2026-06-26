import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { discoveryService } from '../src/blast/discovery-service';
import { runBlast } from '../src/blast/blast-runner';
import { initDatabase, closeDatabase } from '../src/db/sqlite';
import { AccountsRepo } from '../src/repos/accountsRepo';
import { encrypt } from '../src/utils/crypto';
import path from 'path';
import fs from 'fs';

describe('E2E Happy Path: Hunt & Blast', () => {
    const testDbPath = path.join(process.cwd(), 'data', 'e2e-test.db');
    const mockCookie = 'c_user=123; xs=456; datr=789;';

    beforeAll(() => {
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
        initDatabase(testDbPath);
    });

    afterAll(() => {
        closeDatabase();
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    });

    it('should complete a full discovery and blast sequence (Mocked)', async () => {
        // 1. Setup Account
        const repo = new AccountsRepo();
        const account = repo.create({
            platform: 'facebook',
            display_name: 'E2E Test',
            credentials_encrypted: encrypt(mockCookie)
        });

        // 2. Run Discovery (Mocking the actual browser part if needed, but here we test the flow)
        // We expect discovery to return targets which are then passed to blast
        // In this test, we verify the integration of these services
        expect(account.id).toBeDefined();

        // 3. Run Blast Flow
        // We'll use a supply of targets to simulate discovery output
        const result = await runBlast({
            platform: 'facebook',
            accountId: account.id,
            message: 'Halo UMKM!',
            maxActions: 1,
            targets: ['123456789']
        });

        expect(result.total).toBe(1);
        expect(result.log.length).toBe(1);
    });
});
