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

### 2. Dashboard (Next.js + React)

```
dashboard/
├─ app/
│  ├─ page.tsx              ← Overview / Dashboard home
│  ├─ campaigns/            ← Campaign management pages
│  ├─ accounts/             ← Platform accounts management
│  ├─ templates/            ← Message templates
│  ├─ blast-runner/         ← Manual blast execution
│  ├─ jobs/                 ← Job queue monitoring
│  ├─ leads/                ← Lead management (inbound)
│  ├─ settings/             ← Settings & integrations
│  └─ analytics/            ← Statistics & reports
└─ components/
   ├─ ui/                   ← Reusable UI components
   └─ layout/               ← Layout components (Header, Sidebar)
```

### 3. Database (SQLite via better-sqlite3)

**Tables:**
- `accounts` — Platform accounts (credentials encrypted)
- `campaigns` — Campaign definitions
- `templates` — Message templates (optional)
- `posts` — Individual post records (result of blast)
- `jobs` — Job queue (pending, running, completed, failed)
- `leads` — Inbound leads from WhatsApp/Telegram
- `link_clicks` — Tracking link click records
- `runtime_settings` — Key-value store for tokens/config

### 4. Queue System (BullMQ)

- Job types: `PostJob`, `CommentJob`, `ChatJob`, `BlastJob`
- Retry mechanism: exponential backoff per job
- Rate limiting: built-in per-adapter
- Worker processes: consume jobs, call adapters, log results

### 5. Platform Adapters

**Meta Platforms** (Facebook/Instagram/Threads):
- Cookie-based auth (session cookies) untuk posting
- Graph API untuk official integration (Facebook Pages)
- Mobile endpoint scraping untuk emulate browser

**Twitter/X**:
- Cookie-based auth atau Bearer token
- GraphQL queries untuk find targets

**Telegram**:
- Bot API (token-based)
- MTProto untuk user account (advanced)

**WhatsApp**:
- WAHA (self-hosted) preferred
- Cloud API optional

---

## Data Flow (High-Level)

```
[User Dashboard] 
    ↓ HTTP (REST)
[Backend API Routes]
    ↓ (create jobs)
[Job Queue (Redis/BullMQ)]
    ↓ (workers consume)
[Worker Pool] 
    ↓ (load credentials)
[Adapter Factory] 
    ↓ (platform-specific)
[Platform Adapter] 
    ↓ (HTTP request)
[Social Media Platform]
    ↓ (webhook callback)
[Inbound Webhook Handler]
    ↓ (store lead)
[Database]
```

## Security Architecture

- **Credentials**: AES-256-GCM encryption di database
- **JWT**: For dashboard admin authentication (optional, depends on setup)
- **Helmet**: HTTP security headers
- **Rate limiting**: Built-in per-platform, prevents spam/ban
- **Secrets**: Environment variables + runtime secret store

## Deployment Options

### Development (local)
```bash
npm run db:init && npm run dev:api   # Backend
cd dashboard && npm run dev          # Frontend
```

### Production (Docker)
```bash
docker-compose up -d
```

See `Dockerfile` dan `docker-compose.yml` untuk detail.

## Scalability Considerations

- **Queue**: BullMQ dengan Redis (production) atau in-memory (dev)
- **Database**: SQLite file-based; untuk scale tinggi, posisikan ke PostgreSQL
- **Workers**: Horizontal scaling dengan multiple worker instances
- **Rate limiting**: Already per-platform, bisa dikonfigurasi

## Error Handling Strategy

- **Adapter errors**: Map to structured error codes (`AUTH_EXPIRED`, `RATE_LIMIT_EXCEEDED`, etc)
- **Job failures**: Logged dengan full context, retry sesuai policy
- **API errors**: HTTP status codes + consistent JSON error format
- **Validation**: Zod schemas untuk input validation

## Observability

- Winston logger (file + console)
- Health endpoint (`/v1/health`)
- Job metrics (completed/failed counts)
- Runtime settings diagnostics

## Extensibility

Untuk tambah platform baru:
1. Buat adapter class extends `BaseAdapter`
2. Implement `sendMessage()`, `postComment()`, dll
3. Register di adapter factory
4. Tambah route UI untuk credential input
5. Tambah finder jika butuh target searching

---

**Last updated**: May 2026  
**Maintainers**: BerkahKarya Team
