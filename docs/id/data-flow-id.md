# Alur Data (Data Flow)

Dokumen ini menjelaskan aliran data melalui sistem 4x-blast-engine untuk berbagai mode operasi.

---

## Alur Blast Runner (Multi-Platform)

### Spoiler: Single-platform blast (masih experimental)

1. **Client** memanggil `POST /v1/blast/run` dengan payload: `{ platform, accountId, message }`.
2. **Sistem validasi**: cek apakah blast lain sedang berjalan (single-platform mode only). Tolak jika ada blast aktif.
3. **Ambil kredensial** akun dari tabel `accounts` (didekripsi).
4. **Platform finder** cari target (posts/users) via internal APIs:
   - **Facebook**: GraphQL search â†’ postIds + userIds (fallback: `data/targets.txt`)
   - **Instagram**: Hashtag/explore API â†’ postIds + userIds
   - **Twitter**: GraphQL search â†’ tweetIds + userIds
   - **Threads**: Internal search API â†’ postIds + userIds
   - **WhatsApp**: Terima phone number list langsung (tidak perlu finder)
5. **Target di-shuffle** secara acak.
6. **Loop berurutan** (max 30 aksi):
   - **Pilih aksi**: 70% comment, 30% chat (DM)
   - **Eksekusi** via platform adapter (cookie-based)
   - **Log hasil** dengan progress (misal `[blast] 10/30`)
   - **Delay acak**: 20-40 detik (comment), 35-60 detik (DM)
   - **Jika gagal**: log error, skip ke target berikutnya (tidak berhenti)
7. Return `BlastResult` dengan total/success/failed counts dan full log.

**Catatan**: Mode ini masih **eksperimental** dan tidak digunakan untuk production campaigns. Production menggunakan job queue (Wave 2).

---

## Alur Facebook Pages Blast (Production)

### FlowProduction (recommended):

1. **Operator membuat/update akun Facebook** di dashboard.
2. Kredensial akun menyimpan JSON payload dengan `pageId` dan `accessToken`.
3. **Operator membuat kampanye** dan pilih `facebook` di daftar platform.
4. Dashboard panggil `POST /v1/campaigns/:id/blast`.
5. **Campaign route** enqueue `PostJob` untuk platform Facebook.
6. **Worker** baca akun credential dari database, decrypt, lalu instantiate `FacebookAdapter`.
7. `FacebookAdapter` posting via GraphQL ke `www.facebook.com`.
8. Adapter return success atau structured error code.
9. **Repo** simpan record campaign post untuk traceability.

---

## Alur Error Handling

### Mapping Error Codes

| Graph API Code | Error Code System | Meaning | Action |
|----------------|------------------|---------|--------|
| 4 | `RATE_LIMIT_EXCEEDED` | Rate limit tercapai | Tunggu, retry dengan backoff |
| 190 | `TOKEN_EXPIRED` / `AUTH_EXPIRED` | Token/session kadaluarsa | Re-login, dapatkan credential baru |
| Other | `FB_POST_ERROR` | Errorlainnya | Cek log detail, perbaiki koneksi/credentials |

### Retry Strategy

- **Facebook**: hingga 50 retry dengan exponential backoff
- **Other platforms**: default 3-5 retries
- **Blast runner**: gagal di-action tidak stop blast, skip ke target berikutnya

---

## Storage Flow

```
Campaign Created â†’ INSERT INTO campaigns
Account Created â†’ INSERT INTO accounts (credentials encrypted)
Job Enqueued â†’ INSERT INTO jobs (status=pending)
Worker Picks Job â†’ UPDATE jobs SET status=running
Adapter Post Success â†’ INSERT INTO posts + UPDATE jobs status=completed
Adapter Post Failed â†’ UPDATE jobs status=failed + log error
Link Clicked â†’ INSERT INTO link_clicks
Inbound Message â†’ INSERT INTO leads + trigger welcome auto-reply
```

---

## Tracking Flow

1. User klik tracking link: `GET /v1/track/:token`
2. Server decrypt token â†’ ambil `campaignId` dan `platform`
3. `INSERT INTO link_clicks (campaign_id, platform, clicked_at)`
4. Redirect (302) ke `cta_link` yang disimpan di campaign

---

## Inbound Auto-Reply Flow

```
[WAHA/Telegram Webhook] 
    â†“ POST /v1/webhooks/waha|telegram
[Parse inbound message] 
    â†“ extract sender phone/chat_id
[Check lead exists?] 
    â†“ if new: INSERT INTO leads (status=awaiting_handoff)
[Generate welcome message] 
    â†“ (deterministic template based on campaign)
[Send via adapter] 
    â†“ WhatsApp/Telegram API
[Log result] 
    â†“ Mark lead as contacted
```

**Idempotency**: Lead masuk hanya once per phone number (unique constraint).

---

**Related files**:  
- `src/blast/blast-runner.ts` â€” Core orchestration  
- `src/workers/job-worker.ts` â€” Background worker  
- `src/queue/job-queue.ts` â€” Queue management  
- `src/adapters/providers/*` â€” Platform-specific adapters

