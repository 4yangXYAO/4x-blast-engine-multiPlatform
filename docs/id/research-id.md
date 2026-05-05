# Research

## Pertanyaan

Bagaimana dashboard harus resolve API base agar local access bekerja tanpa konfigurasi manual?

## Opsi

| Pendekatan | Baik | Buruk | Risiko | Skor |
|------------|------|-------|--------|------|
| A. Hardcoded local default ke 3456 | Works out of the box dengan backend port yang ada | Perlu code change jika local API port berubah | Low | 9/10 |
| B. Public env var override | Flexible untuk berbeda environments | Perlu env configuration sebelum UI bisa dipakai | Medium | 8/10 |
| C. Relative proxy through same origin | Tidak ada port mismatch jika reverse proxy | Perlu deployment/runtime proxy yang belum ada | Medium | 6/10 |

## Prior Art

- Backend sudah listen di `3456` di local development.
- Next.js client components hanya bisa baca `NEXT_PUBLIC_*` values di build time.
- Dashboards umumnya keep local default dan allow env overrides untuk non-local deployments.

## Ringkasan Research

Gunakan local default `http://127.0.0.1:3456` dan pertahankan `NEXT_PUBLIC_API_BASE` sebagai override untuk environments lain.

---

## Pertanyaan (Bagian 2)

Bagaimana `joki-blast-engine` harus publish ke Facebook agar stabil, production-friendly, dan bisa di-test?

## Opsi

| Pendekatan | Baik | Buruk | Risiko | Skor |
|------------|------|-------|--------|------|
| A. Facebook Pages Graph API v19.0 | Resmi, stable contracts, mudah test, work dengan access tokens | Perlu Page access token dan permission, Pages only | Medium | 9/10 |
| B. Browser automation dengan cookies | Bisa mimic manual browser actions | Fragile selectors, login challenges, high breakage, susah di-test deterministic | High | 2/10 |
| C. Manual-assisted publishing | Aman, simple, tidak ada platform automation risk | Tidak fully automatic, lebih banyak operator work | Low | 6/10 |

## Prior Art

- Official Meta Graph API Page publishing support posting ke `/page-id/feed` dengan Page access token.
- Meta documen rate limits dan page permissions untuk Pages API.
- Browser automation/cookie workflows biasanya brittle dan hard to maintain di production.

## Ringkasan Research

Path paling reliable adalah **official Pages Graph API**. Ini jaga blast flow inside supported Meta surface dan match repo's adapter pattern.

---

**Tanggal**: April 2026
