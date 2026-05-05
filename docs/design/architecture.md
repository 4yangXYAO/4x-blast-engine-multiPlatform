# Arsitektur - Joki Blast Engine

Dokumen ini menjelaskan arsitektur sistem Joki Blast Engine pada level tinggi.

## Komponen Utama

### 1. Backend API (Node.js + Express)

```
src/api/server.ts           ← Entry point
src/routes/*.ts             ← REST API endpoints
src/repos/*.ts              ← Data access layer (SQLite)
src/queue/job-queue.ts      ← BullMQ queue manager
src/workers/*.ts            ← Background job workers
src/blast/blast-runner.ts   ← Core blast engine
src/adapters/*.ts           ← Platform adapters (Facebook, Twitter, IG, etc)
src/utils/*.ts              ← Helper utilities (crypto, logger, tracking)
src/db/sqlite.ts            ← Database connection & migrations
src/config/*.ts             ← Configuration & secrets management
```