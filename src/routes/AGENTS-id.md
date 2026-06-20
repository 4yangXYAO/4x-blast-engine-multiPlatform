# src/routes - API Endpoints

**Tujuan**: Express REST API endpoints under `/v1/*`

## FILE UTAMA

| File | Baris | Deskripsi |
|------|-------|-----------|
| `accounts.ts` | ~100 | Account CRUD + credential management |
| `campaigns.ts` | ~127 | Campaign management |
| `blast.ts` | ~82 | Trigger blast operations |
| `jobs.ts` | ~160 | Job queue management |
| `posts.ts` | ~82 | Post creation |
| `templates.ts` | ~119 | Template management |
| `webhooks.ts` | ~115 | Inbound webhook handlers |
| `track.ts` | ~61 | Link tracking & stats |

## TEST FILES

- `campaigns.test.ts`, `campaigns.integration.test.ts`
- `blast.test.ts`, `e2e.test.ts`
- `jobs.test.ts`, `accounts.test.ts`

## KONVENSI

- Semua routes diawali `/v1`
- Auth via JWT middleware
- Response format: `{ data: ..., error?: ... }`
- Error codes: `RATE_LIMIT_EXCEEDED`, `AUTH_EXPIRED`

## CATATAN

- Job queue menggunakan BullMQ dengan exponential backoff
- Facebook/Instagram menggunakan cookie-based auth (tidak perlu token)

---

**Diperbarui**: Mei 2026

