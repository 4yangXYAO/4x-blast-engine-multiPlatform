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

### 2. Dashboard (Next.js + React)

```
dashboard/
â”œâ”€ app/
â”‚  â”œâ”€ page.tsx              â† Overview / Dashboard home
â”‚  â”œâ”€ campaigns/            â† Campaign management pages
â”‚  â”œâ”€ accounts/             â† Platform accounts management
â”‚  â”œâ”€ templates/            â† Message templates
â”‚  â”œâ”€ blast-runner/         â† Manual blast execution
â”‚  â”œâ”€ jobs/                 â† Job queue monitoring
â”‚  â”œâ”€ leads/                â† Lead management (inbound)
â”‚  â”œâ”€ settings/             â† Settings & integrations
â”‚  â””â”€ analytics/            â† Statistics & reports
â””â”€ components/
   â”œâ”€ ui/                   â† Reusable UI components
   â””â”€ layout/               â† Layout components (Header, Sidebar)
```

### 3. Database (SQLite via better-sqlite3)

**Tables:**
- `accounts` â€” Platform accounts (credentials encrypted)
- `campaigns` â€” Campaign definitions
- `templates` â€” Message templates (optional)
- `posts` â€” Individual post records (result of blast)
- `jobs` â€” Job queue (pending, running, completed, failed)
- `leads` â€” Inbound leads from WhatsApp/Telegram
- `link_clicks` â€” Tracking link click records
- `runtime_settings` â€” Key-value store for tokens/config

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
    â†“ HTTP (REST)
[Backend API Routes]
    â†“ (create jobs)
[Job Queue (Redis/BullMQ)]
    â†“ (workers consume)
[Worker Pool] 
    â†“ (load credentials)
[Adapter Factory] 
    â†“ (platform-specific)
[Platform Adapter] 
    â†“ (HTTP request)
[Social Media Platform]
    â†“ (webhook callback)
[Inbound Webhook Handler]
    â†“ (store lead)
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
**Maintainers**: 4yangXYAO Team

