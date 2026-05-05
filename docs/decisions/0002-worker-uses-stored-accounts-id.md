# Keputusan 0002: Resolve adapters dari stored accounts

## Status

Diterima.

## Konteks

Queue worker sebelumnya menggunakan dummy adapter factory, yang berarti jobs tidak bisa dieksekusi dengan real account credentials.

## Keputusan

Worker sekarang load stored account, decrypt credentials, lalu construct appropriate adapter untuk platform.

## Alasan

Ini membuat job execution real daripada simulated dan keep credentials centralized di SQLite rather than di UI state atau hardcoded logic.

## Konsekuensi

- Account creation sekarang bagian dari blast path.
- Platform-specific credentials bisa disimpan once dan reused.
- Worker startup depend pada account repository dan encryption helpers.

---

**Diperbarui**: Mei 2026
