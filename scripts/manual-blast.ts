import { AccountsRepo } from '../src/repos/accountsRepo';
import { encrypt } from '../src/utils/crypto';
import { runBlast } from '../src/blast/blast-runner';
import { loadConfig } from '../src/config/secrets';
import { initDatabase } from '../src/db/sqlite';
import * as fs from 'fs';
import * as path from 'path';

async function executeManualBlast() {
  loadConfig();
  initDatabase('data/app.db');

  const repo = new AccountsRepo();
  const cookies = `ps_l=1;datr=NrvzacAynjyB5GMOeDCNyf9r;fr=1vLlyhR6mgojso9lF.AWfZrzwGRKyKUOyKi5GKL-WH-edB_5xfodBlxj890mNR_fV41Lo.BqN4Oy..AAA.0.0.BqN4Oy.AWesS5j0mGX835bJzuB3F5pBqLY;vpd=v1%3B896x414x2;xs=2%3A7rFjQM72n9PzhQ%3A2%3A1781962621%3A-1%3A-1%3A%3AAcygQWxF616RdDcIHHsKmUBv9luO6wJRNDDf9BhBTg;c_user=61563735636155;presence=C%7B%22t3%22%3A%5B%5D%2C%22utc3%22%3A1782027421181%2C%22v%22%3A1%7D;pas=61563735636155%3AwPHrOR5Boc;ps_n=1;sb=QbvzaXYS8D0jWq0ur4hglNmX;wd=1366x633;wl_cbv=v2%3Bclient_version%3A3156%3Btimestamp%3A1777682961`;

  // 1. Create temporary account
  const account = repo.create({
    platform: 'facebook',
    display_name: '61563735636155-manual',
    credentials_encrypted: encrypt(cookies)
  });

  const accountId = account.id;
  console.log(`[ManualBlast] Temporary account created: ${accountId}`);

  // 2. Prepare targets.txt (ensure it has at least 2 targets)
  const dataDir = path.join(process.cwd(), 'data');
  const targetsFile = path.join(dataDir, 'targets.txt');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  
  // Checking existing targets
  const existingTargets = fs.existsSync(targetsFile) ? fs.readFileSync(targetsFile, 'utf8') : '';
  const cleanTargets = existingTargets.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
  
  if (cleanTargets.length < 2) {
     console.log("[ManualBlast] Using built-in Sniper Discovery to find real targets first...");
     // Instead of placeholders, we use the discovery service we just built!
     const { discoveryService } = require('../src/blast/discovery-service');
     const targets = await discoveryService.findTargets(cookies, {
        platform: 'facebook',
        keyword: 'umkm', // User requested keyword
        limit: 10,
        strategy: 'AD_ENGAGEMENT'
     });
     
     if (targets.length > 0) {
        const ids = targets.map(t => t.id).join('\n');
        fs.appendFileSync(targetsFile, '\n' + ids + '\n');
        console.log(`[ManualBlast] Discovered and added ${targets.length} real targets to targets.txt`);
     } else {
        console.log("[ManualBlast] Discovery found nothing. Falling back to placeholders.");
        fs.writeFileSync(targetsFile, "123456789_987654321\n234567890_876543210", 'utf8');
     }
  }

  // 3. Execute Blast
  console.log("[ManualBlast] Starting blast: 2 comments, text 'halo'");
  
  try {
    const result = await runBlast({
      platform: 'facebook',
      accountId: accountId,
      message: 'halo',
      maxActions: 2
    });
    console.log("[ManualBlast] Result Detail:", JSON.stringify(result, null, 2));
    console.log("[ManualBlast] Finished sequence.");
  } catch (err) {
    console.error("[ManualBlast] Failed:", err);
  }
}

executeManualBlast().catch(console.error);
