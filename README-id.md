# joki-blast-engine

Mesin blast produksi fokus pada Node.js/TypeScript dengan dashboard Next.js, persistensi SQLite, dan adaptor platform untuk WhatsApp, Telegram, Instagram, Twitter/X, Threads, dan Facebook Pages.

## Runtime

- Node.js `20.20.x` adalah versi yang didukung untuk pengembangan lokal di workspace ini.
- Jika modul native seperti `better-sqlite3` terinstall di bawah Node versi berbeda, instal ulang dependencies setelah ganti Node.

## Yang Sudah Bekerja

- **Manajemen Kampanye**: Buat kampanye pemasaran yang menargetkan beberapa platform sosial media (Twitter, Threads, Instagram, Facebook).
- **Pelacakan Tautan**: Buat token pelacakan deterministik per kampanye/platform dan catat statistik klik.
- **Tautan Tujuan**: Resolusi traffic dengan benar ke WhatsApp, Telegram, atau toko online.
- **Auto-Reply Masuk**: Terima pesan di WhatsApp/Telegram dan kirim pesan welcome deterministik, lalu serahkan ke tim sales.
- **Blast Engine**: posting konten ke beberapa platform secara simultan dengan exponential backoff retry dan rate limiting khusus platform.
- **Facebook Pages**: Publikasi page posts melalui Graph API v19.0 dengan Page access tokens.
- Health check dan runtime settings dari dashboard.
- Buat akun, template, dan jobs dari dashboard UI.
- Picu blast segera dari dashboard UI.
- Jadwalkan jobs melalui API.
- Simpan integration tokens dan credentials terenkripsi di SQLite.
- WhatsApp via WAHA dikonfigurasi melalui runtime settings atau `.env`.

## Facebook Blast

- Facebook blast menggunakan **cookie-based auth** via endpoint mobile `m.facebook.com`.
- Kredensial: raw browser session cookie string (`c_user=...; xs=...; datr=...`).
- Tidak perlu developer app, tidak perlu Page Access Token.
- Cookie disimpan terenkripsi di SQLite (AES-256-GCM).
- Error rate limit memetakan ke kode `RATE_LIMIT_EXCEEDED`.
- Error cookie expired memetakan ke kode `AUTH_EXPIRED`.

**Lihat `docs/FACEBOOK_PAGES_BLAST.md` untuk panduan langkah-demi-langkah lengkap tentang cara:**

- Mengambil Facebook session cookie dari browser yang sudah login
- Membuat akun Facebook di dashboard
- Membuat dan blast kampanye ke Facebook
- Menangani error dan troubleshooting

## Alur Kerja Kampanye

### 1. Buat Kampanye

1. Buka dashboard di `http://localhost:3001`
2. Navigasi ke section **Kampanye**
3. Isi detail kampanye:
   - **Nama Kampanye**: Judul deskriptif (contoh: "Summer Sale 2024")
   - **Konten Kampanye**: Pesan yang akan diposting di platform
   - **CTA Link**: URL tujuan (WhatsApp, Telegram, toko online, dsb)
   - **Platform**: Pilih platform target (Twitter, Threads, Instagram, Facebook)
4. Klik **Buat Kampanye**

### 2. Blast ke Platform

1. Setelah kampanye dibuat, klik **Blast Kampanye**
2. Sistem mengantri satu PostJob per platform yang dipilih
3. Setiap job include tracking link unik per platform
4. Jobs diproses dengan exponential backoff retry (Facebook menggunakan hingga 50 retry)

### 3. Lacak Klik Tautan

- Ketika user klik tracking link, sistem catat metadata klik (timestamp, platform)
- User di-302-redirect ke CTA link tujuan
- Lihat statistik dengan: `GET /v1/track/stats/:campaignId`

### 4. Auto-Reply Inbound

- Ketika user kirim pesan di WhatsApp atau Telegram, sistem:
  1. Buat record lead dengan info kontak
  2. Kirim pesan welcome deterministik ("Halo! Terima kasih sudah menghubungi Kami...")
  3. Tandai lead sebagai "menunggu_handoff" untuk negosiasi manual sales
  4. Cegah duplicate welcome messages via idempotent lead storage

### 5. Facebook Mass Comment Blast

Komentar diposting ke random Facebook post IDs yang dimuat dari `data/targets.txt`.

**Setup `data/targets.txt`:**

```
# Satu Facebook post ID per baris (format: userId_postId  ATAU  hanya postId)
561234567890_123456789012345
100012345678901_987654321
```

**Trigger mass comment blast:**

```http
POST /v1/jobs/comment-random
Content-Type: application/json

{
  "message": "Produk bagus! DM kami untuk info harga 📩",
  "accountId": "your-facebook-account-id",
  "count": 50
}
```

Response:

```json
{ "enqueued": 50, "job_ids": ["job-...", "..."], "targets_found": 50 }
```

### 6. Facebook Private Message (DM)

Kirim direct Messenger messages via job queue:

```http
POST /v1/jobs/trigger
Content-Type: application/json

{
  "template_id": "...",
  "account_id": "your-facebook-account-id",
  "platform": "facebook",
  "message": "Halo! Ada penawaran spesial untuk kamu 🎉"
}
```

Untuk DM jobs, gunakan tipe `ChatJob` yang memanggil `sendPrivateMessage(userId, message, cookie)` pada adaptor `facebook`. Field `to` di job payload seharusnya numeric Facebook ID user target.

## Memulai

Langkah-langkah ini menunjukkan setup lokal cepat untuk development dan testing.

1. Clone repo dan install root dependencies:

```bash
git clone <repo-url>
cd joki-blast-engine
npm install
```

2. Install dan jalankan dashboard (di terminal terpisah):

```bash
cd dashboard
npm install
npm run dev        # jalankan Next.js dashboard dalam dev mode (port dikonfigurasi di dashboard/package.json)
```

3. Inisialisasi database (bikin local SQLite DB dan jalankan migrations):

```bash
npm run db:init
```

4. Start backend API dalam development mode:

```bash
npm run dev:api
```

API entrypoint menggunakan `src/api/server`. Script `dev:api` start server dengan `ts-node` dan `dotenv`.

5. Build dashboard untuk production (opsional):

```bash
npm --prefix dashboard run build
```

6. Jalankan tests dan validasi:

```bash
npm test                      # jalankan backend tests (Vitest)
npm run validate:config       # jalankan config validation checks
```

7. Environment dan runtime

- Buat file `.env` di root repo untuk local secrets (lihat `Environment` di bawah).
- API akan read runtime settings dan credentials dari environment variables dan dari SQLite database.

8. Referensi script yang berguna (root `package.json`):

- `npm run db:init` — inisialisasi DB + jalankan migrations
- `npm run dev:api` — jalankan API dalam dev (ts-node)
- `npm test` — jalankan test suite (Vitest)

Buka dashboard di browser Anda (default port dikonfigurasi di `dashboard/package.json`), contoh:

```
http://localhost:3001
```

## Environment

Required core variables:

- `DATABASE_PATH`
- `API_PORT`
- `API_HOST`
- `DASHBOARD_PORT`
- `JWT_SECRET`
- `LOG_LEVEL`

Useful integration variables:

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

## Cookie-based adapters (Facebook/Instagram/Threads/Twitter cookie paths)

- Beberapa adapters support posting menggunakan browser session cookies alih-alih official platform tokens. Ini perilaku "advanced" dan memerlukan valid browser session cookie string (e.g., `c_user=...; xs=...; datr=...`) atau exported cookie JSON array.
- Untuk Facebook cookie posting, adapter akan extract `fb_dtsg`, `lst`, dan `c_user` dari mobile site (`https://m.facebook.com/`) dan submit mobile form endpoint. Jika Facebook redirect ke login, adapter akan report `AUTH_EXPIRED` error.
- Menyimpan cookies di dashboard section `Accounts` diizinkan; credentials terenkripsi di rest. Gunakan cookies secara bertanggung jawab dan pastikan Anda comply dengan platform Terms of Service.

## API routes

- `GET /v1/health`
- `GET/POST/PUT/DELETE /v1/accounts`
- `GET/POST/PUT/DELETE /v1/templates`
- `POST /v1/jobs/trigger`
- `POST /v1/jobs/schedule`
- `GET/PUT /v1/settings/integrations`

## Dashboard flow

1. Check API health.
2. Save integration tokens jika diperlukan.
3. Buat akun.
4. Buat template.
5. Masukkan recipient/target.
6. Klik `Blast now` atau schedule job.

## Verification

- Backend tests: `npm test`
- Dashboard build: `npm --prefix dashboard run build`
- Config validation: `npm run validate:config`

## Validation Checklist

- Campaign bisa dibuat dan di-blast dari UI.
- Link resolve dengan benar ke WhatsApp, Telegram, atau webshop destinations.
- Auto-reply welcome terkirim saat inbound WhatsApp/Telegram messages.
- Manual negotiation handoff terlihat di system state.
- Backend tests dan dashboard build harus hijau.

## Notes

- Dashboard page adalah single-page admin surface di `dashboard/app/page.tsx`.
- Job execution sekarang resolve adapters dari stored accounts dan decrypt credentials.
- WAHA adalah pilihan WhatsApp path di workspace ini.
