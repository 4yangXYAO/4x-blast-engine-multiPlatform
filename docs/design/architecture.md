# Arsitektur - 4x-blast-engine

Dokumen ini menjelaskan arsitektur sistem 4x-blast-engine pada level tinggi.

## Komponen Utama

### 1. Backend API (Node.js + Express)

```
src/api/server.ts           â† Entry point
src/routes/*.ts             â† REST API endpoints
src/repos/*.ts              â† Data access layer (SQLite)
src/queue/job-queue.ts      â† BullMQ queue manager
src/workers/*.ts            â† Background job workers
src/blast/blast-runner.ts   â† Core blast engine
src/adapters/*.ts           â† Platform adapters (Facebook, Twitter, IG, etc)
src/utils/*.ts              â† Helper utilities (crypto, logger, tracking)
src/db/sqlite.ts            â† Database connection & migrations
src/config/*.ts             â† Configuration & secrets management
```
