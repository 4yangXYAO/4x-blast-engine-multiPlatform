# joki-blast-engine

Mesin blast produksi berfokus Node.js/TypeScript dengan dashboard Next.js, persistensi SQLite, dan adaptor platform untuk WhatsApp, Telegram, Instagram, Twitter/X, Threads, dan Facebook Pages.

## Runtime

- Node.js `20.20.x` adalah versi yang didukung untuk pengembangan lokal di ruang kerja ini.
- Jika modul native seperti `better-sqlite3` terinstal di bawah versi Node lain, instal ulang dependensi setelah beralih Node.

## Apa yang sudah berfungsi

- **Manajemen Kampanye**: Buat kampanye pemasaran menargetkan banyak platform sosial (Twitter, Threads, Instagram, Facebook).
- **Pelacakan Tautan**: Buat token pelacakan deterministik per kampanye/platform dan catat statistik klik.
- **Tautan Tujuan**: Alihkan lalu lintas dengan benar ke WhatsApp, Telegram, atau tujuan toko.
- **Balas Otomatis Masuk**: Terima pesan di WhatsApp/Telegram dan kirim pesan sambutan deterministik, lalu serahkan ke tim penjualan.
- **Mesin Blast**: Posting konten ke banyak platform secara bersamaan dengan *exponential backoff retry* dan *rate limiting* spesifik per platform.
- **Halaman Facebook**: Publikasi *post* halaman melalui Graph API v19.0 resmi dengan *Page access token*.
- Pemeriksaan kesehatan dan pengaturan runtime dari dashboard.
- Buat akun, templat, dan tugas dari UI dashboard.
- Picu blast langsung dari UI dashboard.
- Jadwalkan tugas melalui API.
- Simpan token integrasi dan kredensial terenkripsi di SQLite.
- WAHA adalah jalur WhatsApp pilihan di ruang kerja ini.

## Blast Facebook

- Blast Facebook menggunakan **otentikasi berbasis cookie** melalui *endpoint* seluler `m.facebook.com`.
- Kredensial: *string* sesi cookie browser mentah (misal `c_user=...; xs=...; datr=...`).
- Tidak perlu *app* pengembang, tidak perlu *Page Access Token*.
- Cookie disimpan terenkripsi di SQLite (AES-256-GCM).
- Galat batas laju dipetakan ke kode `RATE_LIMIT_EXCEEDED`.
- Galat cookie kedaluwarsa dipetakan ke kode `AUTH_EXPIRED`.

Lihat [FACEBOOK_PAGES_BLAST.md](docs/FACEBOOK_PAGES_BLAST-id.md) untuk panduan langkah demi langkah lengkap cara:

- Mendapatkan cookie sesi Facebook dari browser yang sedang login
- Membuat akun Facebook di dashboard
- Membuat dan meluncurkan kampanye ke Facebook
- Menangani galat dan pemecahan masalah

## Alur Kampanye

### 1. Buat Kampanye

1. Buka dashboard di `http://localhost:3001`
2. Buka bagian **Kampanye**
3. Isi detail kampanye:
   - **Nama Kampanye**: Judul deskriptif (misal "Penjualan Musim Panas 2024")
   - **Konten Kampanye**: Pesan yang akan diposting ke platform
   - **Tautan CTA**: URL tujuan (WhatsApp, Telegram, toko, dll.)
   - **Platform**: Pilih platform target (Twitter, Threads, Instagram, Facebook)
4. Klik **Buat Kampanye**

### 2. Luncurkan ke Platform

1. Setelah kampanye dibuat, klik **Luncurkan Kampanye**
2. Sistem mengantrekan satu PostJob per platform yang dipilih
3. Setiap tugas menyertakan tautan pelacakan unik per platform
4. Tugas diproses dengan *exponential backoff retry* (Facebook menggunakan hingga 50 percobaan)

### 3. Lacak Klik Tautan

- Saat pengguna mengklik tautan pelacakan, sistem mencatat metadata klik (stempel waktu, platform)
- Pengguna dialihkan (302) ke URL tujuan CTA
- Lihat statistik dengan: `GET /v1/track/stats/:campaignId`

### 4. Balas Otomatis Masuk

- Saat pengguna mengirim pesan di WhatsApp/Telegram, sistem:
  1. Membuat catatan prospek dengan info kontak
  2. Mengirim pesan sambutan deterministik ("Halo! Terima kasih sudah menghubungi kami...")
  3. Menandai prospek sebagai `awaiting_handoff` untuk negosiasi manual penjualan
  4. Mencegah pesan sambutan duplikat melalui penyimpanan idempoten

### 5. Blast Komentar Massal Facebook

Komentar diposting ke ID posting Facebook acak yang dimuat dari `data/targets.txt`.

**Siapkan `data/targets.txt`:**

```
# Satu ID posting Facebook per baris (format: idPengguna_idPostingan  ATAU  hanya idPostingan)
561234567890_123456789012345
100012345678901_987654321
```

**Picu blast komentar massal:**

```http
POST /v1/jobs/comment-random
Content-Type: application/json

{
  "message": "Produk bagus! DM kami untuk info harga 📩",
  "accountId": "id-akun-facebook-anda",
  "count": 50
}
```

Respon:

```json
{ "enqueued": 50, "job_ids": ["job-...", "..."], "targets_found": 50 }
```

### 6. Pesan Langsung (DM) Facebook

Kirim pesan Messenger langsung melalui antrean tugas:

```http
POST /v1/jobs/trigger
Content-Type: application/json

{
  "template_id": "...",
  "account_id": "id-akun-facebook-anda",
  "platform": "facebook",
  "message": "Halo! Ada penawaran spesial untuk kamu 🎉"
}
```

Untuk tugas DM, gunakan tipe `ChatJob` yang memanggil `sendPrivateMessage(userId, message, cookie)` pada adaptor `facebook`. Kolom `to` pada muatan tugas harus berupa ID Facebook numerik target.

## Memulai

Langkah cepat untuk pengaturan dan pengujian lokal.

1. Kloning repo dan instal dependensi root:

```bash
git clone <url-repo>
cd joki-blast-engine
npm install
```

2. Instal dan jalankan dashboard (di terminal terpisah):

```bash
cd dashboard
npm install
npm run dev        # menjalankan dashboard Next.js dalam mode dev (port diatur di dashboard/package.json)
```

3. Inisialisasi database (membuat SQLite lokal dan menjalankan migrasi):

```bash
npm run db:init
```

4. Jalankan API backend dalam mode pengembangan:

```bash
npm run dev:api
```

Titik masuk API menggunakan `src/api/server`. Skrip `dev:api` memulai server dengan `ts-node` dan `dotenv`.

5. Build dashboard untuk produksi (opsional):

```bash
npm --prefix dashboard run build
```

6. Jalankan pengujian dan validasi:

```bash
npm test                      # jalankan pengujian backend (Vitest)
npm run validate:config       # jalankan pemeriksaan validasi konfigurasi
```

7. Lingkungan dan runtime

- Buat berkas `.env` di root repo untuk rahasia lokal (lihat `Environment` di bawah).
- API akan membaca pengaturan runtime dan kredensial dari variabel lingkungan dan dari SQLite.

8. Referensi skrip berguna (root `package.json`):

- `npm run db:init` — inisialisasi DB + migrasi
- `npm run dev:api` — jalankan API dalam mode dev (ts-node)
- `npm test` — jalankan suite pengujian (Vitest)

Buka dashboard di browser (port default diatur di `dashboard/package.json`), misalnya:

```
http://localhost:3001
```

## Lingkungan

Variabel inti yang diperlukan:

- `DATABASE_PATH`
- `API_PORT`
- `API_HOST`
- `DASHBOARD_PORT`
- `JWT_SECRET`
- `LOG_LEVEL`

Variabel integrasi yang berguna:

- `WAHA_BASE_URL`
- `WAHA_API_KEY`
- `WAHA_SESSION`
- `WHATSAPP_CLOUD_API_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `THREADS_ACCESS_TOKEN`
- `TWITTER_BEARER_TOKEN`
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `INSTAGRAM_ACCESS_TOKEN`
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`
- `INSTAGRAM_ALLOW_PRIVATE_API`
- `WHATSAPP_WEBJS_API_KEY`

## Adaptor berbasis cookie (jalur cookie Facebook/Instagram/Threads/Twitter)

- Beberapa adaptor mendukung posting menggunakan *session cookie* browser alih-alih token resmi platform. Ini adalah perilaku "lanjutan" dan memerlukan *session cookie* browser yang valid (misal `c_user=...; xs=...; datr=...;`) atau larik JSON cookie yang diekspor.
- Untuk posting cookie Facebook, adaptor akan mengekstrak `fb_dtsg`, `lst`, dan `c_user` dari situs seluler (`https://m.facebook.com/`) dan mengirimkan *endpoint* formulir seluler. Jika Facebook mengalihkan ke login, adaptor akan melaporkan galat `AUTH_EXPIRED`.
- Menyimpan cookie di bagian **Akun** dashboard diizinkan; kredensial dienkripsi diam-diam. Gunakan cookie secara bertanggung jawab dan pastikan mematuhi Ketentuan Layanan platform.

## Rute API

- `GET /v1/health`
- `GET/POST/PUT/DELETE /v1/accounts`
- `GET/POST/PUT/DELETE /v1/templates`
- `POST /v1/jobs/trigger`
- `POST /v1/jobs/schedule`
- `GET/PUT /v1/settings/integrations`

## Alur Dashboard

1. Periksa kesehatan API.
2. Simpan token integrasi jika diperlukan.
3. Buat akun.
4. Buat templat.
5. Masukkan penerima/target.
6. Klik `Luncurkan sekarang` atau jadwalkan tugas.

## Verifikasi

- Pengujian backend: `npm test`
- Build dashboard: `npm --prefix dashboard run build`
- Validasi konfigurasi: `npm run validate:config`

## Daftar Periksa Validasi

- Kampanye dapat dibuat dan dipicu dari UI.
- Tautan diarahkan dengan benar ke WhatsApp, Telegram, atau tujuan toko.
- Sambutan otomatis terkirim pada pesan masuk WhatsApp/Telegram.
- Serahterima manual terlihat di status sistem.
- Pengujian backend dan build dashboard sukses.

## Catatan

- Halaman dashboard adalah permukaan admin satu-halaman di `dashboard/app/page.tsx`.
- Eksekusi tugas kini menyelesaikan adaptor dari akun yang disimpan dan mendekripsi kredensialnya.
- WAHA adalah jalur WhatsApp pilihan di ruang kerja ini.
