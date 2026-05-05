# Rencana: Auto Blast Marketing

## Tujuan

Buat simple dan production-ready auto blast flow:

1. Buat satu marketing post.
2. Publikasikan ke social channels terpilih.
3. Route traffic ke WA/Telegram/webshop links.
4. Kirim auto-reply welcome message saat inbound chat.
5. Lanjutkan negosasi manual.

## Ruang Lingkup (MVP)

- Platform outbound:
  - Twitter
  - Threads
  - Instagram
  - Facebook Pages
- Tujuan link:
  - WhatsApp
  - Telegram
  - Webshop (hosted on Vercel)
- Auto-reply target:
  - WhatsApp dan Telegram inbound messages

## Alur Fungsional

1. Operator buat campaign content dan CTA link.
2. System publikasikan post ke platforms terpilih.
3. Setiap post berisi destination link (WA/Tele/webshop).
4. User klik link dan mulai chat atau buka webshop.
5. System kirim welcome auto-reply untuk inbound chat.
6. Conversation di-handoff ke human untuk manual negotiation.

## Aturan Arsitektur

- Gunakan SOLID principles.
- Implementasi KISS (tidak overengineering).
- Reuse existing modules dulu (jobs, adapters, dashboard, repos).
- Jangan tambah fitur unrelated.
- Facebook integration fokus ke Pages posting dulu (tidak Ads di MVP).
- Group/forum posting hanya dimana account punya valid permission.

## Fase Implementasi

1. **Fase 1**: Campaign payload + post blast consistency
   - Standardize payload untuk post text, CTA link, platform targets, metadata.
   - Reuse existing job/worker flow.

2. **Fase 2**: Link tracking
   - Tambah minimal link tracking (campaign_id, platform, click timestamp).
   - Keep tracking simple dan auditable.

3. **Fase 3**: Inbound auto-reply + manual handoff
   - Implement inbound handlers untuk WA/Telegram.
   - Kirim deterministic welcome template.
   - Tandai lead status sebagai handed off untuk manual follow-up.

4. **Fase 4**: Facebook Pages posting
   - Tambah Facebook Pages adapter path untuk publishing post content.
   - Keep API/auth flow isolated dan simple.

5. **Fase 5**: Dashboard completion
   - Compose campaign, pilih platforms, set destination link, trigger blast.
   - Show post status, click stats, inbound status, handoff state.

## Testing Required

Jalankan dan pass semua:

- Integration test
- Smoke test
- Functional test
- E2E test
- Happy path flow test

## Validasi Checklist

- [ ] Campaign bisa dibuat dan di-trigger dari UI.
- [ ] Post dipublikasikan pada social channels terpilih.
- [ ] Links resolve dengan benar ke WA/Telegram/webshop.
- [ ] Auto-reply welcome terkirim pada inbound WA/Telegram message.
- [ ] Manual negotiation handoff terlihat di system state.
- [ ] Dashboard build dan backend tests hijau.

## Bukan Goals (untuk saat ini)

- Facebook Ads campaign management
- AI-generated conversation negotiation
- Multi-tenant user roles
- Complex attribution modeling

---

**Tanggal**: April 2026  
**Status**: MVP Plan
