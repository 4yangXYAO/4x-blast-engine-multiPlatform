# src/adapters - Platform Adapter Layer

**Purpose:** Bridge between the blast engine and social media platforms via `IAdapter` interface.

## STRUCTURE
```
adapters/
â”œâ”€â”€ IAdapter.ts          # Interface: connect, sendMessage, disconnect, getRateLimitStatus
â”œâ”€â”€ facebook.ts          # Re-export of FacebookAdapter (cookie-based)
â””â”€â”€ providers/
    â”œâ”€â”€ base.ts          # Shared provider utilities
    â”œâ”€â”€ meta/
    â”‚   â”œâ”€â”€ facebook/    # Facebook Pages (cookie + Playwright)
    â”‚   â”œâ”€â”€ instagram/   # Instagram (cookie-based)
    â”‚   â”œâ”€â”€ threads/     # Threads (cookie-based)
    â”‚   â””â”€â”€ Whatsapp/    # WhatsApp (WAHA)
    â”œâ”€â”€ telegram/        # Telegram (MTProto + bot)
    â””â”€â”€ twitter/         # Twitter/X (cookie-based)
```

## CONVENTIONS

- Each provider lives under `providers/{platform}/`
- Every provider exports a class implementing `IAdapter`
- Cookie-based providers share `*-cookie.ts` for session handling
- Tests live alongside source as `*.test.ts`

## KEY FILES

| File | Purpose |
|------|---------|
| `IAdapter.ts` | `connect()`, `sendMessage()`, `disconnect()`, `getRateLimitStatus()` |
| `providers/base.ts` | Shared base class / utilities for all providers |
| `providers/meta/facebook/facebook.ts` | Main Facebook Pages adapter (replaced Graph API) |
| `providers/meta/facebook/facebook-playwright.ts` | Playwright stealth automation for FB |
| `providers/meta/facebook/facebook-cookies.ts` | Cookie parsing + validation |
| `providers/meta/facebook/chat.ts` | Send private messages via FB |
| `providers/meta/facebook/comment.ts` | Post comments via FB |
| `providers/meta/facebook/facebook-finder.ts` | Find targets on Facebook |
| `providers/meta/facebook/facebook-notif.ts` | Notification scraping |
| `providers/telegram/telegram.ts` | Bot API adapter |
| `providers/telegram/telegram-mtproto.ts` | MTProto (user session) adapter |
| `providers/twitter/twitter.ts` | Twitter/X main adapter |
| `providers/twitter/dm.ts` | Direct message sending |
| `providers/meta/instagram/instagram.ts` | Instagram adapter |
| `providers/meta/threads/threads.ts` | Threads adapter |
| `providers/meta/Whatsapp/whatsapp.ts` | WhatsApp (WAHA backend) |

## NOTES

- Facebook migrated from Graph API to cookie-based auth (ADR-0006)
- `facebook.ts` re-exports `FacebookAdapter` as default
- All cookie-based adapters parse browser session cookies (c_user, xs, datr, sb)
