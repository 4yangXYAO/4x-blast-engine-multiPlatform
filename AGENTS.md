# Project Knowledge Base

**Project:** 4x-blast-engine
**Maintainer:** 4yangXYAO
**Stack:** TypeScript, Express, SQLite, Next.js (dashboard)

## Overview
Social media automation engine for 4yangXYAO â€” schedule posts, engagement automation, and content planning across WhatsApp, Telegram, Instagram, Twitter/X, Threads, and Facebook Pages.

## Structure
```
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ adapters/         # Platform adapters (IAdapter interface + providers)
â”‚   â”œâ”€â”€ api/              # Express server + middleware
â”‚   â”œâ”€â”€ blast/            # Blast orchestrator (multi-platform actions)
â”‚   â”œâ”€â”€ config/           # Secrets, runtime settings
â”‚   â”œâ”€â”€ db/               # SQLite init, migrations
â”‚   â”œâ”€â”€ repos/            # Repository pattern (accounts, campaigns, jobs, etc.)
â”‚   â”œâ”€â”€ routes/           # Express routers under /v1/*
â”‚   â”œâ”€â”€ scheduler/        # Cron + Facebook scheduler
â”‚   â”œâ”€â”€ types/            # Shared TypeScript types
â”‚   â”œâ”€â”€ utils/            # Crypto, HTTP client, logger, tracking
â”‚   â””â”€â”€ workers/          # Background job processing
â”œâ”€â”€ dashboard/            # Next.js dashboard (app router)
â”œâ”€â”€ docs/                 # ADRs, design docs, planning (Indonesian + English)
â”œâ”€â”€ scripts/              # DB init, FB scraping, debug tools
â”œâ”€â”€ data/                 # Targets list, test DB
â””â”€â”€ migrations/           # SQL schema migrations
```

## Key Facts
- 109+ TypeScript source files, ~30 test files
- SQLite via `better-sqlite3` (native) with `sql.js` (WASM) fallback
- Job queue: in-memory EventEmitter-based + optional BullMQ (Redis)
- Auth: JWT middleware on API routes (`src/middleware/auth.ts`)
- Response format: `{ data: ..., error?: ... }`
- Facebook/Instagram: cookie-based auth (no OAuth token required)
- Each platform adapter implements `IAdapter` (`connect`, `sendMessage`, `disconnect`, `getRateLimitStatus`)

## Status
- **Branding Migration**: Complete (renamed to 4x-blast-engine)
- **Repository Setup**: Initialized for 4yangXYAO/4x-blast-engine-multiPlatform
- **Core Functionality**: Multi-platform blast routing and engagement engine fully operational.

## Commands
```bash
# Dev API
npm run dev:api

# DB init
npm run db:init

# Test
npm test
```

## Notes
- Distributed as part of the 4yangXYAO multi-platform suite.
- Optimized for high-throughput social automation and stealth engagement.
