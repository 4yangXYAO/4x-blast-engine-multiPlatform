# Perbandingan (Comparison)

## Dashboard API Base Resolution

| Opsi | Apa yang dilakukannya | Kekuatan | Kelemahan |
|------|----------------------|----------|-----------|
| Local default `http://127.0.0.1:3456` | Dashboard menunjuk ke backend yang berjalan by default | Langsung jalan dengan backend port yang ada | Perlu code update jika backend port berubah |
| `NEXT_PUBLIC_API_BASE` override | Dashboard baca API base dari env | Fleksibel across environments | Gagal jika env var tidak terset/salah |
| Same-origin proxy | UI call relative paths, proxy routing | Tidak hardcoded host/port di UI | Perlu deployment plumbing yang belum ada |

## Keputusan

Gunakan local default `3456` dan pertahankan env override untuk non-local deployments.

---

## Opsi Dibandingkan: Facebook Publishing

| Pendekatan | Kelebihan | Kekurangan | Risiko | Skor |
|------------|-----------|------------|--------|------|
| Pages Graph API v19.0 | Resmi, stabil, mudah test, pakai access token | Butuh Page access token & permission, hanya Pages | Medium | 9/10 |
| Browser automation cookies | Bisa mimic human browser | Fragile selectors, login挑战, hard to test | High | 2/10 |
| Manual-assisted posting | Aman, sederhana, tidak fully auto | Operator kerja lebih | Low | 6/10 |

## Keputusan

Gunakan **Facebook Pages Graph API** untuk posting otomatis. Group/forum posting tetap manual-assisted jika diperlukan.

---

**Diperbarui**: Mei 2026
