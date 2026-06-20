# src/repos - Repository Layer

**Purpose:** Data access layer using Repository pattern over SQLite. Each repo encapsulates table access and business logic for a domain entity.

## STRUCTURE
```
repos/
â”œâ”€â”€ accountsRepo.ts       # Account CRUD + credential storage
â”œâ”€â”€ campaignsRepo.ts      # Campaign + campaign_post management
â”œâ”€â”€ jobsRepo.ts           # Job queue persistence
â”œâ”€â”€ leadsRepo.ts          # Lead capture from link clicks
â”œâ”€â”€ linkClicksRepo.ts     # Click tracking per post
â”œâ”€â”€ postsRepo.ts          # Post scheduling + status
â”œâ”€â”€ runtimeSettingsRepo.ts # Encrypted runtime config
â””â”€â”€ templatesRepo.ts      # Content templates
```

## CONVENTIONS

- Each repo class lazily initializes its DB handle via `getDb()`
- Constructor accepts optional `DB` parameter for test injection
- Types exported alongside the repo class in the same file
- UUID primary keys (`randomUUID()`)
- Repos use getter pattern for lazy DB init (see accounts.ts for canonical example)

## KEY TYPES

| Repo | Main Type(s) |
|------|-------------|
| `accountsRepo` | `Account` â€” id, name, platform, credentials (encrypted) |
| `campaignsRepo` | `Campaign`, `CampaignPost` â€” id, name, content, platforms[], status |
| `jobsRepo` | `QueuedJob` â€” id, type, payload, status, attempts |
| `postsRepo` | `Post` â€” id, account_id, content, status, scheduled_at |
| `templatesRepo` | `Template` â€” id, name, content, category |
| `leadsRepo` | `Lead` â€” id, source, metadata, created_at |
| `linkClicksRepo` | `LinkClick` â€” id, post_id, clicked_at, ip |
| `runtimeSettingsRepo` | key-value pairs (values AES-256-GCM encrypted) |

## NOTES

- DB is `better-sqlite3` (synchronous) â€” repos run in the same process
- `runtimeSettingsRepo` encrypts values at rest using JWT_SECRET-derived key
- Test files use separate test DB via vitest setup
