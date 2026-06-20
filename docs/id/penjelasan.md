# Penjelasan Super Sederhana: 4x-blast-engine

Dokumen ini ditulis dengan bahasa yang sangat mudah dipahami.
Tujuan: agar Anda langsung paham, langsung jalan, dan langsung lihat hasil.

## 1) Program ini untuk apa?

Program ini membantu **promosi otomatis** di media sosial:

- Anda buat 1 **kampanye pemasaran** (campaign).
- Sistem kirim konten ke beberapa platform sekaligus (Twitter, Threads, Instagram, Facebook Pages).
- Link di konten diarahkan ke WhatsApp / Telegram / Toko Online.
- Kalau ada chat masuk dari WhatsApp atau Telegram, sistem kirim **pesan welcome otomatis**.
- Setelah itu, negosiasi dilanjutkan manual oleh admin/sales.

**Singkatnya**: Otomatis di awal, manual di tahap closing (negosiasi).

## 2) Bagian utama sistem

Ada 2 bagian besar:

### 2.1 Backend API (otak sistem)

- Mengatur: kampanye, antrian pekerjaan (job queue), pelacakan klik, webhook inbound, auto-reply.

### 2.2 Dashboard (UI admin)

- Tempat isi data, buat kampanye, pilih platform, dan picu blast.

## 3) Alur kerja paling gampang dipahami

Urutan normal:

1. **Admin buat kampanye** di dashboard.
2. **Admin pilih platform** target (Twitter, FB, IG, Threads).
3. **Admin isi CTA link** (contoh: link WhatsApp atau toko online).
4. **Admin klik "Blast"**.
5. Sistem buat **job posting** per platform.
6. **User klik link** dari posting yang sudah dikirim.
7. Sistem **catat klik link** (tracking).
8. **Kalau user chat** via WhatsApp/Telegram, sistem kirim **welcome otomatis** (hanya 1 kali).
9. Lead masuk ke status **"menunggu_handoff"** untuk ditangani manusia (sales).

## 4) Cara menjalankan project (lokal)

Jalankan perintah berikut dalam terminal:

```bash
# Step 1: Install dependencies
npm install

# Step 2: Inisialisasi database (SQLite)
npm run db:init

# Step 3: Start backend API (development mode)
npm run dev:api
```

Di **terminal lain**:

```bash
# Start dashboard Next.js
cd dashboard
npm install
npm run dev
```

Lalu buka dashboard di browser:

- **Dashboard**: http://localhost:3001
- **API**: http://localhost:3456

## 5) Cara test cepat dari dashboard

Ikuti langkah ini satu per satu:

1. Buka halaman **Kampanye** di dashboard.
2. Isi form:
   - Nama Kampanye
   - Konten Kampanye (pesan yang ingin diposting)
   - CTA Link (contoh: https://wa.me/628123456789)
   - Pilih platform (minimal 1)
3. Klik **"Buat Kampanye"**.
4. Setelah kampanye terbuat, klik **"Blast Kampanye"**.
5. Perhatikan status:harus muncul "Berhasil" atau "Sedang berjalan".

## 6) Cara cek 3 poin penting (validasi akhir)

Tiga poin ini adalah inti apakah sistem bekerja dengan baik.

### 6.A. Link resolve ke WhatsApp / Telegram / Toko Online

Yang perlu dicek:

- Tracking link bisa dibuka di browser.
- Setelah dibuka, otomatis redirect ke CTA link tujuan.
- Klik tercatat di database (bisa lihat di stats).

**Endpoint yang dipakai**:
- `GET /v1/track/:token` (redirect)
- `GET /v1/track/stats/:campaignId` (statistik)

**Hasil yang diharapkan**:
- Redirect berjalan lancar.
- Data klik tersimpan.

### 6.B. Auto-reply welcome terkirim saat ada inbound WhatsApp/Telegram

Yang perlu dicek:

- Ada pesan masuk ke webhook WAHA atau Telegram.
- Sistem kirim welcome message otomatis (hanya 1 kali per nomor).
- Welcome message sesuai format yang diharapkan.

**Endpoint webhook**:
- `POST /v1/webhooks/waha` (WhatsApp)
- `POST /v1/webhooks/telegram` (Telegram)

**Hasil yang diharapkan**:
- Record lead dibuat di database.
- Welcome terkirim ke nomor tujuan.
- Tidak ada spam ( Welcome tidak terkirim dua kali untuk nomor yang sama).

### 6.C. Handoff manual terlihat di state sistem

Yang perlu dicek:

- Setelah welcome terkirim, lead status berubah ke `"menunggu_handoff"` atau `"awaiting_handoff"`.
- Admin/sales bisa lihat leads ini di dashboard untuk proses manual.

**Endpoint cek leads**:
- `GET /v1/webhooks/leads` (atau via dashboard UI)

**Hasil yang diharapkan**:
- Status lead jelas terlihat.
- Bisa difilter berdasarkan status.

## 7) Checklist akhir (production readiness)

Sebelum menyatakan sistem siap dipakai, pastikan:

- [ ] Campaign bisa dibuat dan di-blast dari dashboard.
- [ ] Link tracking redirect dengan benar ke WhatsApp/Telegram/webshop.
- [ ] Auto-reply welcome terkirim saat ada inbound WhatsApp/Telegram message.
- [ ] Manual negotiation handoff terlihat di system state.
- [ ] Backend tests dan dashboard build **hijau** (no errors).
- [ ] Database `data/app.db` sudah diinisialisasi.
- [ ] Semua platform credentials sudah dikonfigurasi dengan benar.

**Yang tetap perlu uji di dunia nyata**:

- Uji live dengan kredensial platform asli (Facebook cookie, Instagram session, dll).
- Browser validation end-to-end dengan skenario nyata (buat campaign â†’ blast â†’ klik â†’ chat â†’ lead).

## 8) Daftar endpoint penting (ringkas)

### Kampanye (Campaigns)
```
POST   /v1/campaigns          Buat kampanye baru
GET    /v1/campaigns          List semua kampanye
GET    /v1/campaigns/:id      Detail kampanye
POST   /v1/campaigns/:id/blast  Picu blast ke platform
```

### Pelacakan (Tracking)
```
GET   /v1/track/:token          Redirect ke CTA + catat klik
GET   /v1/track/stats/:id       Statistik klik per kampanye
```

### Webhook Inbound (Pesan Masuk)
```
POST   /v1/webhooks/waha       WhatsApp WAHA webhook
POST   /v1/webhooks/telegram    Telegram bot webhook
GET    /v1/webhooks/leads      List leads (untuk admin)
```

### Akun & Jobs
```
GET/POST/PUT/DELETE /v1/accounts    CRUD akun platform
POST   /v1/jobs/trigger             Picu job manual
POST   /v1/jobs/schedule            Jadwalkan job
GET    /v1/jobs                     List semua jobs
```

### Settings
```
GET/PUT /v1/settings/integrations   Simpan token integrasi
```

## 9) Jika ada error, cek ini dulu

**Urutan troubleshooting**:

1. Pastikan **backend API** hidup (terminal `npm run dev:api` masih running?).
2. Pastikan **dashboard** hidup (terminal `npm run dev` di folder dashboard?).
3. Pastikan **database sudah di-init**: file `data/app.db` ada.
4. Pastikan **environment variables** (`.env` atau di terminal) sudah di-set dengan benar.
5. Cek **log backend** quando klik blast atau ada webhook â€” biasanya ada error message jelas.
6. Cek **log dashboard** (browser console) jika UI error.

**Error umum & solusi**:

| Error | Kemungkinan Penyebab | Solusi |
|-------|---------------------|--------|
| `Auth expired` (Facebook) | Cookie Facebook kadaluarsa | Login ulang Facebook, ambil cookie baru |
| `Rate limit exceeded` | Terlalu banyak request dalam waktu singkat | Tunggu beberapa menit, sistem auto-retry |
| `Network error` | API server down | Restart `npm run dev:api` |
| `Database locked` | SQLite conflict | Pastikan hanya satu instance yang akses DB |

## 10) Kesimpulan super singkat

**Fokus alur**: blast â†’ tracking â†’ auto-reply â†’ handoff manual.

Tujuan akhir: memastikan 3 poin validasi (link berjalan, auto-reply bekerja, handoff terlihat) berjalan dengan akun platform asli dan uji browser end-to-end skenario nyata.

## 11) Detail teknis: bagaimana "blast" bekerja (ringkas)

### 11.1 Autentikasi / Kredensial
Untuk beberapa platform (khususnya Facebook), sistem menggunakan **browser session cookie** yang disimpan terenkripsi di tabel `accounts`. Adapter Facebook mengemulasi request web (scrape halaman untuk `fb_dtsg`/`lsd` lalu POST ke `/api/graphql/`). Lihat adapter: `src/adapters/providers/meta/facebook/facebook.ts`

### 11.2 Pembuatan Job
Saat admin klik **"Blast"** di dashboard, dipanggil endpoint `POST /v1/campaigns/:id/blast`. Endpoint ini membuat **job per platform** (satu job = satu kiriman/post/komentar/chat) dan masukkan ke **queue internal** (BullMQ).

### 11.3 Worker & Eksekusi
Ada **worker** (job worker) yang ambil job dari queue, buat adapter sesuai platform (factory pattern), lalu panggil method adapter seperti `sendMessage` atau `postComment`. Kalau adapter gagal, worker catat log dan ikuti mekanisme **retry / error handling**.

### 11.4 Targeting (siapa yang dikirimi?)

Beberapa cara targeting saat blast:
- **Langsung ke `account_id`** yang diberikan saat trigger (post ke timeline sendiri).
- **Batch komentar**: route `POST /v1/jobs/comment-random` baca `data/targets.txt` dan acak target, lalu enqueue CommentJob per postId.
- **Target otomatis** (eksperimental): beberapa helper di `repos/` mencoba ambil posting dari feed akun yang login (scraping GraphQL), tapi ini tidak stabil dan bukan fitur pencarian umum.

**Tidak ada fitur "search user/post" global**: kode saat ini tidak sediakan endpoint pencarian arbitrary user atau posts di Facebook (mis. search API). Untuk itu perlu implementasi tambahan (scrape/GraphQL query + UI + rate-limiting).

### 11.5 Rate Limit
Adapter/worker mengandung batasan sederhana. Contoh: 30 kiriman/menit untuk Facebook di beberapa implementasi. Sistem juga tolak enqueued jobs jika kredensial tidak valid.

### 11.6 Keamanan & Operasi
- **Cookie disimpan terenkripsi**; jangan pernah beri cookie akun produksi bersama tim.
- **Gunakan akun dedicated untuk blast** (jika memungkinkan) karena sesi/cookie adalah kredensial setara login.
- **Test end-to-end** pada akun nyata untuk memastikan `doc_id`/GraphQL yang dipakai masih valid.

Dengan penjelasan ini Anda pahami di mana menambahkan fitur pencarian target, atau mengubah mekanisme target agar lebih otomatis (mis. crawler, integrasi API resmi bila tersedia).

---

**4x-blast-engine** dibuat untuk membantu pemasaran otomatis di media sosial dengan **keamanan, keandalan, dan kemudahan penggunaan** sebagai prioritas.

