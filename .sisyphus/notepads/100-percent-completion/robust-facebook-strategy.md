# Strategy for Robust Facebook Automation (100% Feature Completeness)

## The Core Problem
Facebook actively fights automation. They have three lines of defense:
1. **Session Invalidations:** Rapidly expiring `fb_dtsg` and `lsd` tokens.
2. **Behavioral Analysis:** If an account sends 50 DMs in 10 seconds, it gets flagged.
3. **Fingerprinting & Headers:** Detecting headless browsers or bad headers.
4. **Protocol Splitting:**
   - Actions like Like/Comment/Share are standard GraphQL.
   - DMs (Messenger) run on MQTT WebSockets (Comet), not just HTTP POSTs.

## The Hybrid Approach (The "Bulletproof" Method)
To get 100% features (DM, Groups, Like, Comment, Repost, Share, Search), we cannot rely on just ONE method. We need a **Tri-State Adapter Architecture**:

### 1. HTTP/GraphQL + Scraping (Fastest, Lightest)
*Used for:* Search, Reading Notifications, Fetching Group Posts, simple Likes/Comments.
*Why:* Very fast. Low resource usage. We proved this works well today.
*Risk:* Frequent changes in GraphQL payloads.

### 2. MQTT Websocket Emulation (Required for DMs)
*Used for:* DMs, Read Receipts, Typing Indicators, Real-time Chat.
*Why:* Facebook Messenger is a separate beast. To handle DMs reliably, we must emulate the `facebook-chat-api` (fca) pattern which connects to `wss://edge-chat.facebook.com`. HTTP POSTing to `/messages/send` is heavily rate-limited and often fails on modern FB.

### 3. Headless Browser (Playwright + Stealth) (The Fallback/Heavy Lifter)
*Used for:* Complex actions (Group Join, Share to Group, Repost), handling Checkpoints/CAPTCHAs, and bypassing new anti-bot measures.
*Why:* When GraphQL fails, a real browser driving the UI never fails.
*Risk:* Slow, heavy on RAM/CPU. Should be the *fallback*, not the primary.

## Recommended Stack for Joki-Blast
1. `playwright-extra` + `puppeteer-extra-plugin-stealth` (For UI-driven fallbacks).
2. A custom MQTT/FCA port for DMs (based on the community's `fb-chat-api` forks).
3. A Request Queue (BullMQ or simple JS queue) to pace requests to human-like speeds (e.g., random delay of 3-10 seconds between actions).

