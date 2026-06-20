# ðŸ“‹ CHEATSHEET â€” 4x-blast-engine (Panduan Cepat)

## ðŸš€ Quick Start (3 Langkah)

```bash
# 1ï¸âƒ£ Install dependencies
npm install

# 2ï¸âƒ£ Inisialisasi database
npm run db:init

# 3ï¸âƒ£ Start backend (Terminal 1)
npm run dev:api

# Start dashboard (Terminal 2)
cd dashboard && npm install && npm run dev
```

**Buka**: http://localhost:3001

---

## ðŸ“ Commands Paling Sering Dipakai

| Perintah | Kegunaan | Catatan |
|----------|----------|---------|
| `npm run db:init` | Inisialisasi/refresh database | Jalankan pertama kali |
| `npm run dev:api` | Start backend API (development) | Server di port 3456 |
| `npm test` | Run semua test | 112 tests passing |
| `npm run validate:config` | Validasi konfigurasi | Check .env values |
| `cd dashboard && npm run dev` | Start dashboard UI | Port 3001 |
| `cd dashboard && npm run build` | Build untuk production | Creates .next folder |

---

## ðŸ”§ .env Required Variables

```bash
# Wajib
DATABASE_PATH=data/app.db
API_PORT=3456
API_HOST=127.0.0.1
DASHBOARD_PORT=3001
JWT_SECRET=rahasia_yang_panjang_dan_acak
LOG_LEVEL=info

# WhatsApp (WAHA)
WAHA_BASE_URL=http://localhost:3001
WAHA_SESSION=default

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456:ABC-def...

# Instagram Cookie
# (Masukkan via dashboard, tidak perlu di .env)

# Twitter Cookie
# (Masukkan via dashboard)

# Threads Token
# (Masukkan via dashboard)
```

---

## ðŸŽ¯ Flow Paling Umum

### 1. Tambah Akun Platform

**Via Dashboard** â†’ Accounts â†’ Add Account

**Via API**:

```bash
# WhatsApp (WAHA)
curl -X POST http://127.0.0.1:3456/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "whatsapp",
    "username": "WA Saya",
    "credentials": ""
  }'

# Facebook dengan cookie
curl -X POST http://127.0.0.1:3456/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "facebook",
    "username": "FB Page Saya",
    "credentials": "c_user=123; xs=abc; datr=xyz"
  }'
```

### 2. Buat Kampanye

**Via Dashboard** â†’ Campaigns â†’ New Campaign

**Via API**:

```bash
curl -X POST http://127.0.0.1:3456/v1/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Promo Ramadhan",
    "content": "Halo! Diskon 50% hanya hari ini!",
    "cta_link": "https://wa.me/628123456789",
    "platforms": ["facebook", "instagram"]
  }'
```

### 3. Blast (Kirim) Kampanye

**Via Dashboard** â†’ Campaigns â†’ Pilih kampanye â†’ Blast Campaign

**Via API**:

```bash
curl -X POST http://127.0.0.1:3456/v1/campaigns/{campaign_id}/blast \
  -H "Content-Type: application/json" \
  -d '{
    "account_ids": {
      "facebook": "{account_id_facebook}",
      "instagram": "{account_id_instagram}"
    }
  }'
```

### 4. Cek Statistik Klik

```bash
# Stats untuk campaign tertentu
curl http://127.0.0.1:3456/v1/track/stats/{campaign_id}

# Tracking link (dibuka di browser)
# http://127.0.0.1:3456/v1/track/{token}
```

---

## ðŸ› ï¸ Troubleshooting Cepat

| Problem | Periksa Ini | Solusi |
|---------|-------------|--------|
| **Dashboard tidak connect ke API** | API_URL/port | Cek `NEXT_PUBLIC_API_BASE` environment, default 127.0.0.1:3456 |
| **Database locked** | File `data/app.db` used by other process | Pastikan hanya satu instance yang akses DB |
| **Facebook Auth Expired** | Cookie invalid | Login ulang Facebook, copy cookie baru via DevTools |
| **Rate Limit** | Terlalu banyak request | Tunggu 1-2 menit, sistem auto-retry |
| **WhatsApp tidak kirim** | WAHA not running | Start WAHA: `docker run -p 3001:3000 devlikeapro/waha` |
| **Telegram errors** | Bot token invalid | Cek token di @BotFather, pastikan bot aktif |

---

## ðŸ“Š Endpoints Paling Penting

| Method | Endpoint | Tujuan |
|--------|----------|--------|
| GET | `/v1/health` | Check API health |
| GET | `/v1/campaigns` | List semua kampanye |
| POST | `/v1/campaigns` | Buat kampanye baru |
| POST | `/v1/campaigns/:id/blast` | Picu blast kampanye |
| GET | `/v1/accounts` | List akun platform |
| POST | `/v1/accounts` | Tambah akun platform |
| GET | `/v1/jobs` | List pekerjaan (jobs) |
| GET | `/v1/track/:token` | Redirect tracking link |
| GET | `/v1/track/stats/:id` | Statistik klik |
| POST | `/v1/webhooks/waha` | Inbound WhatsApp (webhook) |
| POST | `/v1/webhooks/telegram` | Inbound Telegram (webhook) |
| GET | `/v1/webhooks/leads` | List leads (prospek) |

---

## ðŸ” Keamanan Cepat

- **JANGAN** commit `.env` ke git (sudah ada di `.gitignore`)
- **YA** gunakan `JWT_SECRET` yang random dan panjang
- **YA** enkripsi credentials di dashboard (automatic)
- **JANGAN** share cookie strings dengan siapa pun
- **YA** gunakan dedicated Facebook/Instagram accounts untuk blast (bukan personal)

---

## ðŸ› Error Codes Umum

| Code | Arti | Tindakan |
|------|------|----------|
| `AUTH_EXPIRED` | Cookie/session kadaluarsa | Re-login, ambil cookie baru |
| `RATE_LIMIT_EXCEEDED` | Terlalu banyak post | Tunggu, spread waktu blast |
| `INVALID_CREDENTIALS` | Kredensial salah | Cek format credential input |
| `NETWORK_ERROR` | Koneksi gagal | Cek internet, ulangi |
| `NOT_FOUND` | Resource tidak ada | Cek ID/parameter yang dikirim |

---

## ðŸ“ž Support & Bantuan

- **Dokumen Lengkap**: `README.md`
- **Penjelasan Sederhana**: `penjelasan.md`
- **Panduan Facebook**: `docs/FACEBOOK_PAGES_BLAST.md`
- **Arsitektur**: `docs/architecture.md`
- **Decision Records**: `docs/decisions/`

---

**Versi**: 1.0  
**Last Update**: Mei 2026

