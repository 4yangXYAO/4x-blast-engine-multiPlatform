# Panduan: Cara Pertama Kali Menjalankan 4x-blast-engine

Panduan langkah demi langkah ini akan memandu Anda menjalankan 4x-blast-engine untuk pertama kalinya.

## Prasyarat

- **Node.js** versi 20.20.x atau lebih baru
- **Docker** (opsional, untuk WhatsApp via WAHA)
- **Git**

## Langkah 1: Kloning Repo

```bash
git clone <url-repo>
cd 4x-blast-engine
```

## Langkah 2: Instal Dependensi

```bash
npm install
```

## Langkah 3: Siapkan Lingkungan

Buat berkas `.env` di root projek:

```bash
cp .env.example .env
```

Edit `.env` dan atur:
- `API_PORT=3000`
- `DASHBOARD_PORT=3001`  
- `JWT_SECRET=rahasi-anda-yang-kuat`
- `DATABASE_PATH=data/app.db`

## Langkah 4: Instal dan Jalankan Dashboard

Buka terminal baru dan jalankan:

```bash
cd dashboard
npm install
npm run dev
```

Dashboard akan tersedia di `http://localhost:3001`.

## Langkah 5: Inisialisasi Database

Di terminal utama (folder projek):

```bash
npm run db:init
```

Ini akan membuat database SQLite dan menjalankan migrasi.

## Langkah 6: Jalankan API Backend

```bash
npm run dev:api
```

API akan berjalan di `http://localhost:3000`.

## Langkah 7: Tambahkan Akun Platform

1. Buka dashboard di `http://localhost:3001`
2. Klik **Akun** di sidebar
3. Klik **Tambah Akun**
4. Isi:
   - **Platform**: Pilih (Twitter, Facebook, Instagram, Threads, WhatsApp, Telegram)
   - **Username**: Nama pengguna
   - **Kredensial**: 
     - Untuk Facebook/Instagram/Threads: Masukkan string kuki (contoh: `c_user=123; xs=abc; datr=xyz`)
     - Untuk Telegram: Masukkan token bot
     - Untuk WhatsApp: Kosongkan (gunakan WAHA)
5. Klik **Simpan**

## Langkah 8: Buat Templat Pesan

1. Klik **Templat** di sidebar
2. Klik **Templat Baru**
3. Isi:
   - **Nama**: Contoh "Promo Produk"
   - **Konten**: Isi pesan Anda (bisa gunakan `{{nama}}` untuk variabel)
   - **Tipe**: Pilih tipe templat
4. Klik **Simpan**

## Langkah 9: Buat Kampanye

1. Klik **Kampanye** di sidebar  
2. Klik **Kampanye Baru**
3. Isi:
   - **Nama Kampanye**: Contoh "Promo Musim Panas 2024"
   - **Konten**: Pesan yang akan dikirim
   - **Tautan CTA**: URL tujuan (WhatsApp, Telegram, toko, dll.)
   - **Platform**: Pilih platform target
4. Klik **Buat Kampanye**

## Langkah 10: Luncurkan Blast

1. Di halaman kampanye, klik **Luncurkan Kampanye**
2. Sistem akan mengantrekan tugas untuk setiap platform yang dipilih
3. Pantau status di halaman **Tugas**

## Langkah 11: Jalankan WAHA (Opsional, untuk WhatsApp)

Jika Anda ingin menggunakan WhatsApp:

```bash
docker run -p 3001:3000 devlikeapro/waha
```

Lalu atur di `.env`:
```
WAHA_BASE_URL=http://localhost:3001
WAHA_API_KEY=your-api-key
```

## Langkah 12: Uji Coba

```bash
# Jalankan tes backend
npm test

# Build dashboard (opsional)
npm --prefix dashboard run build
```

## Pemecahan Masalah

### Tidak Bisa Koneksi ke Database
- Pastikan `DATABASE_PATH` benar
- Jalankan `npm run db:init`

### API Tidak Bisa Diakses  
- Pastikan `npm run dev:api` sedang berjalan
- Cek port di `.env` tidak bentrok

### Dashboard Tidak Muncul
- Pastikan `npm run dev` di folder `dashboard` sedang berjalan
- Cek `DASHBOARD_PORT` di `.env`

### Blast Gagal
- Pastikan akun sudah ditambahkan
- Periksa status kuki (jika menggunakan Facebook/Instagram/Threads)
- Lihat log di terminal API

## Tips untuk Pemula

1. **Mulai dengan Satu Platform**: Jangan langsung gunakan semua platform sekaligus
2. **Gunakan Target File**: Isi `data/targets.txt` dengan ID target (satu per baris)
3. **Pantau Log**: Lihat terminal API untuk melihat galat
4. **Uji dengan Sedikit Target**: Mulai dengan `maxActions=5` untuk uji coba

## Dukungan

Jika Anda mengalami masalah, periksa:
- `README-id.md` untuk dokumentasi lengkap
- `docs/` untuk panduan teknis
- `GLOSSARY.md` untuk istilah teknis

