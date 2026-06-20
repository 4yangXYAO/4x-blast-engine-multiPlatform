# Risiko

## Risiko Akses Dashboard

- Jika dashboard menunjuk ke port API yang salah, health checks dan form submissions gagal meskipun backend sehat.
- Jika `NEXT_PUBLIC_API_BASE` diset incorrectly, UI bisa tampak offline sampai env value dikoreksi.
- Jika backend port berubah tanpa update UI yang sesuai, akses lokal kembali broken.

## Mitigasi

- Jaga dashboard default tetap selaras dengan backend dev port.
- Izinkan env override eksplisit untuk deployment non-local.
- Verifikasi health endpoint dalam tests dan selama manual smoke checks.

## Risiko Teknis

- Token expiry bisa stop posting sampai Page access token baru disimpan.
- Rate limit bisa throttling repeated blast jobs.
- Graph API contract changes bisa requiere version updates.
- Posts dengan link bisa gagal jika destination tidak reachable atau tidak diizinkan.

## Risiko Operasional

- Page harus memiliki correct task dan permission set.
- Operators perlu manage tokens di dashboard dengan benar.
- Jika Page dihapus atau permissions dicabut, blast jobs gagal.

## Mitigasi

- Gunakan error codes eksplisit untuk rate limit dan token expiration.
- Jaga adapter terisolasi dan terbiasa covered oleh tests.
- Pin Graph API version di code.
- Dokumentasikan Page access token requirements di README.

---

**Last updated**: May 2026

