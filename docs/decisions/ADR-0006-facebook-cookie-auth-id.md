# ADR-0006: Facebook Blast — Cookie-Based Auth over Graph API

**Tanggal:** 30 April 2026  
**Status:** Diterima  
**Pengambil Keputusan:** Pemilik project

---

## WHY — Masalah

Graph API v19.0 path membutuhkan:

- Facebook developer app (perlu approval)
- Page Access Token (expires, butuh refresh)
- Permission `pages_manage_posts` (granted per app)

Ini membuat friction untuk operator yang hanya ingin post dari existing personal/business account tanpa manage developer app credentials.

## WHAT ELSE — Opsi yang Dipertimbangkan

| Opsi | Kelebihan | Kekurangan | Skor |
|------|-----------|------------|------|
| **A. Tetap Graph API** | Resmi, stabil, token revocation jelas | Perlu dev app approval, token expires, extra setup | 5/10 |
| **B. Cookie-based via m.facebook.com** | Bekerja dengan FB session apa pun, tidak perlu app | Fragile to HTML changes, cookie expires silently | 8/10 |
| **C. facebook-scraper library** | Higher-level API | Unmaintained, heavier dependency | 3/10 |

## WHY THIS — Bukti

- Cookie-based adapter sudah implemented di `providers/meta/facebook/facebook.ts`
- Tests sudah written dan passing di `facebook-cookies.test.ts`
- Dashboard sudah diupdate dengan cookie textarea input
- Pattern konsisten dengan other cookie adapters (Instagram, Twitter, Threads)
- `fb_dtsg` + `c_user` extraction dari `m.facebook.com` stabil across sessions

## WHEN WRONG — Trigger Pembalikan

Revert ke Graph API jika:

- Meta ubah endpoint `m.facebook.com/a/home.php` signature
- Cookie lifetime jadi terlalu pendek (< 7 hari)
- Enterprise clients butuh API token audit trail

Rollback: `git revert` commit yang mengganti `src/adapters/facebook.ts`.

---

## Apa yang Berubah

| File | Perubahan |
|------|-----------|
| `src/adapters/facebook.ts` | Ganti Graph API impl dengan re-export `providers/meta/facebook/facebook.ts` |
| `dashboard/app/page.tsx` | Fixed description text: Page ID/AccessToken → session cookie |
| `README.md` | Hapus Graph API references dari Facebook section |
| `agents.md` | Update Facebook blast path description |
| `docs/FACEBOOK_PAGES_BLAST.md` | Ganti Graph API guide dengan cookie guide |

---

## Format Kredensial

**Sebelum:**

```json
{ "pageId": "123456789", "accessToken": "EAABxxxxx..." }
```

**Sesudah:**

```
c_user=12345678; xs=AbCdEf...; datr=XyZ...; sb=...
```

*(raw browser session cookie string, stored encrypted di SQLite)*

---

**Diperbarui**: 30 April 2026
