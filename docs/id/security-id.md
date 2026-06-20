# Keamanan

## Kredensial

- Facebook Page access tokens disimpan **terenkripsi** di SQLite.
- Dekripsi hanya terjadi ketika worker membangun adapter.
- Adapter menyimpan token di memory hanya untuk job aktif.

## Permukaan API (API Surface)

- Adapter menggunakan HTTPS Graph API calls.
- Graph API version **dipin** ke v19.0 di code.
- Tidak ada browser cookies yang disimpan untuk Facebook Pages posting dalam implementasi ini.

## Penanganan Gagal (Failure Handling)

- Rate limits return deterministic error code.
- Expired tokens return deterministic error code.
- Failed posts tidak leak credentials di response bodies.

## Catatan Operasional

- Rotate tokens melalui dashboard ketika permissions berubah.
- Revoke credentials jika Page tidak lagi dikelola.

---

**Diperbarui**: Mei 2026

