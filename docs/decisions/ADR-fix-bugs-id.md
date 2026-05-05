# ADR-001: Perbaiki cookie-based adapters, DB locking, dan worker observability

**Tanggal:** 30 April 2026

## Status

Diterima

## Konteks

Beberapa issue terlihat saat menjalankan sistem end-to-end dan di unit tests:

- Cookie-based adapters untuk Meta platforms butuh robust page parsing (fb_dtsg, lst, c_user).
- SQLite layer tidak set busy timeout yang bisa cause transient `SQLITE_BUSY` errors under contention.
- Worker failures tidak persisted ke database logs table, making diagnosis harder.
- Dashboard kurang auto-refresh membuat observing job state lebih lambat durante development.

## Keputusan

1. Implement dedicated `FacebookAdapter` (cookie-based) yang:
   - Accepts cookies (plain string atau JSON array) via stored credentials.
   - Fetches `https://m.facebook.com/` dengan mobile User-Agent dan extracts `fb_dtsg`, `lst`, dan `c_user` dimana available.
   - Posts menggunakan `POST /a/home.php` dengan `av`, `lst`, `fb_dtsg`, dan `xhpc_message_text` form fields.
   - Throws `AuthError` ketika authentication appears expired (login redirect).

2. Update SQLite initialization (`initDatabase`) untuk set:
   - `journal_mode = WAL` (already present)
   - `busy_timeout = 30000` untuk kurangi `SQLITE_BUSY` races

3. Persist worker/adapter failures ke table `logs` dengan job_id, level, message, dan meta JSON.

4. Ensure adapters expose realistic `getRateLimitStatus()` dan locally decrement quotas (`maybeDrainRate`) untuk prevent fast-fire retries.

5. Tambah small dashboard auto-refresh (`refreshCollections`) yang execute setiap 10 detik.

6. Tambah minimal compatibility export untuk legacy tests referencing Facebook-named cookie adapter.

## Konsekuensi

- Better observability: worker failures tercatat ke DB logs table.
- Reduced transient DB locking issues thanks to busy timeout.
- Cookie-based Facebook posting bisa bekerja dimana Graph API tidak diinginkan, tapi butuh valid browser session cookies dan mungkin break jika Facebook ubah UI.
- Unit tests disesuaikan/di-support sehingga suite tetap hijau.

## Reversal

Jika cookie-based posting proves brittle atau jadi maintenance burden, revert dan prefer Graph API-only path untuk Facebook Pages. Rollback plan: revert adapter file, restore tests, update docs accordingly.

---

**Diperbarui**: 30 April 2026
