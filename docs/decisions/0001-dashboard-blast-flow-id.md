# Keputusan 0001: Pertahankan blast flow di satu dashboard page

## Status

Diterima.

## Konteks

Dashboard aslinya menampilkan section statis untuk akun, templates, dan jobs. Ini membuat UI terlihat lengkap namun form-form tidak benar-benar terhubung ke backend.

## Keputusan

Pertahankan dashboard sebagai single admin page dan wire visible sections langsung ke API:

- Simpan integration tokens.
- Buat akun.
- Buat templates.
- Set recipient.
- Trigger atau schedule blast jobs.

## Alasan

Single page membuat blast workflow pendek dan mengurangi coupling antara form state dan backend API calls. Juga memudahkan verifikasi full path dalam satu browser session.

## Konsekuensi

- Dashboard tetap sederhana untuk dioperasikan.
- Blast flow eksplisit dan visible.
- Page harus tetap sinkron dengan backend route changes.

---

**Diperbarui**: Mei 2026
