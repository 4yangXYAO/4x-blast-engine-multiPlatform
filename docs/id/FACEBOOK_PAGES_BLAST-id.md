# Facebook Blast — Panduan Cookie

**Metode auth:** Browser session cookie via `m.facebook.com`  
**Adapter:** `FacebookAdapter` di `src/adapters/providers/meta/facebook/facebook.ts`

---

## Cara Kerja

1. Anda tempel cookie sesi Facebook ke dashboard
2. Adapter mengambil `m.facebook.com` untuk ekstrak `fb_dtsg` (CSRF token) dan `c_user`
3. Adapter POST pesan Anda ke `/a/home.php` menggunakan endpoint mobile
4. Postingan muncul di feed/timeline Facebook Anda

---

## Panduan Langkah-demi-Langkah

### 1. Ambil Facebook Session Cookie

Anda perlu copy cookie dari sesi Facebook yang sedang aktif di browser.

**Menggunakan Chrome / Edge:**

1. Login ke [facebook.com](https://www.facebook.com) di browser Anda
2. Buka **DevTools** → tekan `F12`
3. Pergi ke tab **Application** → **Cookies** → `https://www.facebook.com`
4. Copy nilai-nilai yang diperlukan (atau gunakan extension untuk export cookie)

**Cookie penting yang dibutuhkan:**

| Cookie | Fungsi |
|--------|--------|
| `c_user` | User ID Facebook Anda |
| `xs` | Session token |
| `datr` | Browser fingerprint |
| `sb` | Browser identifier |

**Format untuk ditempkan:**
```
c_user=12345678; xs=AbCdEf; datr=XyZaBc; sb=defGHI
```

> **Catatan:** Anda juga bisa pakai extension browser seperti "EditThisCookie" atau "Cookie-Editor" untuk export cookies dalam format `key=value; key2=value2`.

---

### 2. Buat Akun Facebook di Dashboard

1. Buka dashboard di `http://localhost:3001`
2. Navigasi ke **Buat Akun** (atau **Accounts** → **Add Account**)
3. Pilih platform: `facebook`
4. Masukkan username (label bebas, contoh: "Akun FB Saya")
5. Di textarea **Facebook Session Cookie**, tempel cookie string Anda
6. Klik **Simpan**
7. Copy Account ID yang muncul

Cookie akan disimpan **terenkripsi** di SQLite menggunakan AES-256-GCM.

---

### 3. Buat Kampanye

```
Nama Kampanye:    Promo Saya
Konten Kampanye: Cek ini! Klik link di bawah.
CTA Link:         https://wa.me/628123456789
Platform:         facebook
```

→ Klik **Buat Kampanye Facebook**

---

### 4. Blast

→ Pilih akun Facebook Anda dari dropdown  
→ Klik **Blast Kampanye Facebook**  
→ Postingan akan muncul di akun Facebook Anda

---

## Referensi API

### Buat Akun Facebook
```http
POST /v1/accounts
Content-Type: application/json

{
  "platform": "facebook",
  "username": "Akun FB Saya",
  "credentials": "c_user=12345; xs=abc; datr=xyz"
}
```

### Buat Kampanye
```http
POST /v1/campaigns
Content-Type: application/json

{
  "name": "Promo Saya",
  "content": "Cek ini!",
  "cta_link": "https://wa.me/628123456789",
  "platforms": ["facebook"]
}
```

### Blast Kampanye
```http
POST /v1/campaigns/{campaign_id}/blast
Content-Type: application/json

{
  "account_ids": {
    "facebook": "{account_id}"
  }
}
```

---

## Kode Error

| Kode | Arti | Perbaikan |
|------|------|-----------|
| `AUTH_EXPIRED` | Cookie kadaluarsa atau akun logout | Login ulang Facebook, copy cookie baru |
| `RATE_LIMIT_EXCEEDED` | Terlalu banyak post (>30/menit) | Tunggu sejenak, sistem auto-retry |
| `FB_POST_FAILED` | Post diterima tapi response kosong | Cek validitas cookie |
| `FB_POST_ERROR` | Network atau HTTP error | Cek koneksi internet |

---

## Troubleshooting

**Posting tidak muncul:**
- Cek apakah cookie `c_user` dan `xs` ada di string Anda
- Pastikan Anda masih login di Facebook di browser
- Cookie mungkin sudah expired — export ulang dari browser

**AUTH_EXPIRED langsung:**
- Sesi Facebook Anda sudah kadaluarsa atau logout
- Login lagi di facebook.com lalu copy cookies kembali

**Rate limit tercapai:**
- Adapter mengizinkan maksimal 30 post per menit
- Pecah blast di waktu berbeda jika posting ke multiple akun

---

## Catatan Keamanan

- **Cookie disimpan terenkripsi** (AES-256-GCM) di `data/app.db`
- **Jangan pernah bagikan cookie string** — ini seperti password
- Cookie kadaluarsa saat Anda logout dari Facebook di browser tersebut
- **Gunakan akun dedicated untuk blast**, bukan akun personal Anda

⚠️ **Warning**: Pemakaian cookie untuk otomatisasi posts harus accordance dengan Facebook Terms of Service. Gunakan dengan risiko sendiri.

---

**Butuh bantuan?** Cek file `docs/architecture.md` untuk arsitektur lengkap, atau buka issue di repository.
