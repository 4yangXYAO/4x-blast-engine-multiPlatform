# src/adapters/providers/meta/facebook - Facebook Pages Adapter

**Purpose:** Cookie-based Facebook Pages posting, commenting, messaging, and notification scraping.

## KEY FILES

| File | Lines | Purpose |
|------|-------|---------|
| `facebook.ts` | â€” | Main adapter class (replaces Graph API as of 2026-04-30) |
| `facebook-playwright.ts` | â€” | Playwright stealth browser automation |
| `facebook-cookies.ts` | â€” | Cookie parsing, validation, session refresh |
| `facebook-finder.ts` | â€” | Find user profiles/pages for targeting |
| `facebook-notif.ts` | â€” | Notification center scraping |
| `chat.ts` | â€” | Send private messages via m.facebook.com |
| `comment.ts` | â€” | Post comments on public pages/groups |
| `comment.test.ts` | â€” | Tests |
| `facebook-cookies.test.ts` | â€” | Cookie validation tests |

## How it works

1. Parse cookies via `parseCookies()` (supports plain string or JSON array)
2. GET `m.facebook.com` to extract `fb_dtsg` and `c_user`
3. POST to `/a/home.php` with `xhpc_message_text` for posting
4. Use Playwright for stealth browser automation when needed

## CONVENTIONS

- Uses mobile endpoint (`m.facebook.com`) â€” not Graph API
- Cookie format: `c_user=12345; xs=abc; datr=xyz; sb=...`
- See ADR-0006 for migration rationale from token-based to cookie-based

## NOTES

- Credentials stored in `accounts` table as raw browser session cookie string
- Playwright used for initial page load to extract tokens; subsequent requests via fetch
- Rate limiting handled via `getRateLimitStatus()` returning epoch ms reset time
