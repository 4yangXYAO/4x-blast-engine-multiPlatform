import { describe, it, expect } from 'vitest';
import { discoveryService } from '../src/blast/discovery-service';
import { AccountsRepo } from '../src/repos/accountsRepo';
import { initDatabase, closeDatabase } from '../src/db/sqlite';
import path from 'path';
import fs from 'fs';

describe('Functional Tests', () => {
    const testDbPath = path.join(process.cwd(), 'data', 'functional-test.db');

    it('scoreIntent: should correctly score high-intent keywords', () => {
        const score = discoveryService.scoreIntent('Berapa harganya mas? Mau beli buat UMKM');
        expect(score).toBeGreaterThanOrEqual(50);
    });

    it('scoreIntent: should filter out negative keywords', () => {
        const score = discoveryService.scoreIntent('Bagi-bagi gratis promo free');
        expect(score).toBe(0); // Assuming negative keywords drop it to 0 or negative
    });

    it('AccountsRepo: should persist and retrieve accounts', () => {
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
        initDatabase(testDbPath);
        const repo = new AccountsRepo();
        
        const account = repo.create({
            platform: 'facebook',
            display_name: 'Test Account',
            credentials_encrypted: 'mock-cookies'
        });

        const retrieved = repo.findById(account.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.platform).toBe('facebook');
        
        closeDatabase();
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    });
});
