# Keputusan 0005: Dashboard API base default ke port 3456

## Status

Diterima.

## Konteks

Dashboard adalah client-side admin UI dan butuh stable API base untuk reach backend selama local development. Backend listen di `3456`, namun UI sebelumnya default ke port berbeda.

## Keputusan

Default dashboard API base ke `http://127.0.0.1:3456` dan tetap allow `NEXT_PUBLIC_API_BASE` atau `NEXT_PUBLIC_API_BASE_URL` untuk override.

## Alasan

- Cocok dengan backend development port yang sebenarnya.
- Menghilangkan kebutuhan manual environment setup untuk local use.
- Remote atau deployed environments tetap bisa configure.

## Konsekuensi

- Local dashboard access bekerja tanpa extra config ketika API jalan di `3456`.
- Misconfigured override bisa masih break UI, jadi health card tetap penting.
- Jika backend port berubah di masa depan, default harus diupdate di dashboard.

## Trigger Pembalikan

Jika backend development port berubah atau repository adop same-origin proxy, revisit default dan override strategy.

---

**Diperbarui**: Mei 2026

