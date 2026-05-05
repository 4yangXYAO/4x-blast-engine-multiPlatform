# ADR-0007: Blast Runner — Sequential Multi-Platform Orchestrator

## Status

**Diterima** — 1 Mei 2026

## Konteks

Sistem sudah memiliki individual cookie-based adapters untuk Facebook, Instagram, Twitter, Threads, dan WhatsApp, plus job queue dan worker untuk memproses jobs individual. Namun tidak ada orchestration layer untuk batch-eksekusi actions across targets dengan natural delays, action randomization, dan execution limits.

## Keputusan

### Why simple sequential loop daripada queue-based blast?

Existing job queue (`JobQueue`) memproses jobs individually dan didesain untuk isolated, retryable tasks. Sebuah blast run adalah coordinated sequence of actions yang:

- Harus run one at a time (anti-spam)
- Perlu random delays antar actions (20–40s untuk comments, 35–60s untuk DMs)
- Randomisasi action types (70% comment / 30% chat)
- Memiliki hard cap di 30 actions per run
- Harus complete sebagai single unit of work

Menggunakan queue akan fragment coordination ini — delays perlu encode sebagai job metadata, action randomization perlu terjadi di enqueue time, dan 30-action cap perlu track state across multiple queue consumers.

Simple sequential loop lebih sederhana, lebih predictable, dan lebih mudah di-debug.

### Global lock

Hanya satu blast bisa jalan pada satu waktu (global `isRunning` flag). Ini prevent cross-platform collision dan ensures controlled resource usage.

### Delay strategy

| Action | Delay Range | Alasan |
|--------|-------------|--------|
| Comment | 20–40 detik | Mimics human browsing + commenting cadence |
| Chat/DM | 35–60 detik | DMs lebih dimonitor; longer delays reduce detection risk |

### Action randomization

70% comment / 30% chat dipilih untuk:

- Maximize visible engagement (comments are public)
- Supplement dengan DMs untuk higher-value outreach
- Avoid predictable patterns yang platforms bisa detect

## Konsekuensi

- Blast runs adalah blocking operations (satu pada satu waktu)
- Real-time progress di-log ke console (`[blast] 10/30`)
- API return full `BlastResult` setelah completion (synchronous)
- Platform finders fragile (internal APIs) dan mungkin perlu maintenance ketika platforms change endpoints.

---

**Diperbarui**: 1 Mei 2026
