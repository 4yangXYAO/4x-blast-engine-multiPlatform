# Keputusan 0003: Pertahankan sql.js sebagai fallback

## Status

Diterima.

## Konteks

Native `better-sqlite3` binding bisa gagal di Windows ketika Node ABI berubah.

## Keputusan

Pertahankan `sql.js` sebagai fallback path untuk database initialization dan testing.

## Alasan

Ini preserves working system di environments dimana native binding unavailable atau butuh rebuild.

## Konsekuensi

- Development tetap portable.
- Tests bisa jalan meski native binding broken.
- Code harus handle both native dan sql.js database behaviors.

---

**Diperbarui**: Mei 2026
