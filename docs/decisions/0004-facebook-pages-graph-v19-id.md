# Keputusan 0004: Facebook Pages posting via Graph API v19.0

## Status

Diterima.

## Konteks

Repository butuh Facebook blast path yang stabil, testable, dan selaras dengan existing adapter design.

## Keputusan

Gunakan Facebook Pages Graph API v19.0 dengan Page access token disimpan di encrypted account credential payload.

## Alasan

- Ini official supported path untuk Pages posting.
- Ini keeps blast flow dalam existing `IAdapter` contract.
- Lebih mudah di-test daripada browser automation.
- Memungkinkan worker route Facebook jobs same way seperti platform lain.

## Konsekuensi

- Facebook blast terbatas ke Pages, bukan group/forum automation.
- Tokens harus disimpan dan di-rotate dengan hati-hati.
- Rate limit dan token-expired errors harus ditangani secara eksplisit.

## Trigger Pembalikan (Reversal Trigger)

Jika Meta remove required Pages permission atau Graph API path jadi unavailable untuk use case ini, revisit adapter strategy.

---

**Diperbarui**: April 2026
