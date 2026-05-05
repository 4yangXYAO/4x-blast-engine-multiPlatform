# Skalabilitas (Scaling)

## Perilaku Saat Ini

- Worker memproses jobs melalui queue processor yang ada.
- Facebook posts adalah satu API call per post job.
- Rate limits dilacak per adapter instance.

## Risiko Skalabilitas

- High-frequency blast jobs bisa hit Page rate limits.
- Token expiry bisa membuat retry backlog jika tidak diperbaiki cepat.
- Link-heavy posts bisa increase campaign support load jika destination pages tidak stabil.

## Panduan Skalabilitas

- Jaga blast jobs kecil dan platform-specific.
- Sebar campaigns over time, bukan burst besar sekaligus.
- Retry hanya setelah operator fix credential issue ketika code `190` muncul.
- Stop retry segera ketika rate limit code `4` dikembalikan.

---

**Diperbarui**: Mei 2026
