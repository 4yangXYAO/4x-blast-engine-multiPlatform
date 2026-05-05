# KNOWLEDGE BASE PROYEK

**Dibuat:** 5 Mei 2026  
**Commit:** [TIDAK TERSEDIA]  
**Branch:** [TIDAK TERDETEKSI]

---

## GAMBARAN UMUM

Mesin blast production-focused Node.js/TypeScript dengan dashboard Next.js, persistensi SQLite, dan adaptor platform untuk WhatsApp, Telegram, Instagram, Twitter/X, Threads, dan Facebook Pages.

---

## STRUKTUR

```
root/
├ src/                    # Backend API, queue, workers, repos
│ ├ api/                  # Server entry point
│ ├ routes/               # Express endpoints
│ ├ repos/                # Data access layer
│ ├ queue/                # Job queue (bullmq-based)
│ ├ scheduler/            # Cron scheduling
│ ├ blast/                # Core blast engine
│ ├ workers/              # Background job workers
│ └ db/                   # SQLite configuration
├ dashboard/              # Next.js UI (port 3001)
└ tests/                  # Integration & unit tests
```

---

## DI MANA MENCOBA

| Tugas | Lokasi | Catatan |
|------|--------|---------|
| API endpoints | `src/routes/*.ts` | REST API under `/v1/*` |
| Database models | `src/repos/*.ts` | SQLite via better-sqlite3 |
| Job queue | `src/queue/job-queue.ts` | BullMQ-based |
| Blast engine | `src/blast/blast-runner.ts` | Core posting logic (473 lines) |
| Dashboard | `dashboard/app/page.tsx` | Next.js SPA |

---

## KONVENSI

- **Runtime**: Node.js `20.20.x` (required untuk better-sqlite3)
- **Testing**: Vitest in `src/routes/*.test.ts`
- **Auth**: JWT-based, secrets via `.env` + SQLite
- **Credentials**: Cookie-based posting didukung (FB/Insta/Threads/Twitter)
- **Encryption**: AES-256-GCM untuk stored credentials

---

## COMMANDS

```bash
npm run db:init        # Initialize SQLite + migrations
npm run dev:api        # Start API (ts-node)
npm test               # Run Vitest suite
npm run validate:config # Config validation
```

---

## CATATAN

- Dashboard berjalan di `http://localhost:3001`
- Job execution resolve adapters dari stored accounts
- WAHA adalah pilihan WhatsApp path
- Facebook menggunakan cookie-based auth (tidak perlu Page Access Token)

---

**Terakhir update**: Mei 2026
