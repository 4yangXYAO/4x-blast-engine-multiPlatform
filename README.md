# ðŸš€ 4x-blast-engine

High-performance, multi-platform social media blast engine built for **4yangXYAO**. Designed for stealth, high throughput, and persistent engagement.

---

## ðŸ›  Features

- **Multi-Platform Support**: WhatsApp, Telegram, Instagram, Twitter/X, Threads, and Facebook Pages.
- **Stealth Architecture**: Advanced fingerprinting and cookie-based authentication (no API tokens required for most platforms).
- **Hybrid Adapters**: Seamlessly switch between high-speed HTTP/GraphQL and high-fidelity Browser (Playwright) execution.
- **Robust Orchestration**: Queue-based processing with automatic retries and sophisticated rate limiting.
- **Full Observability**: Real-time dashboard with CTR tracking, success rates, and live lead conversion funnels.

---

## ðŸš€ Quick Start

Ensure you have [Node.js](https://nodejs.org/) (v18+) and [SQLite](https://www.sqlite.org/) installed.

### Installation
```bash
npm install
npm run db:init
```

### Run the Engine
- **Linux/MacOS**:
  ```bash
  ./start.sh
  ```
- **Windows**:
  ```powershell
  .\start.ps1
  ```

### Dashboard Access
The Next.js dashboard runs at `http://localhost:3000` by default.
```bash
npm run dev:dashboard
```

---

## ðŸ“‚ Project Structure

```
â”œâ”€â”€ src/                  # Core execution engine (TypeScript)
â”‚   â”œâ”€â”€ adapters/         # Platform-specific adapters (FB, IG, TW, etc.)
â”‚   â”œâ”€â”€ blast/            # Multi-platform action orchestrator
â”‚   â”œâ”€â”€ queue/            # Job queueing & rate limiting
â”‚   â””â”€â”€ workers/          # Background processing
â”œâ”€â”€ dashboard/            # Next.js admin dashboard
â”œâ”€â”€ docs/                 # Detailed technical documentation
â””â”€â”€ scripts/              # Utility and testing scripts
```

---

## ðŸ“˜ Documentation

For deep dives into the architecture and setup, check the `docs/` directory:
- [Architecture Overview](docs/design/architecture.md)
- [Multi-Platform Strategies](docs/design/data-flow.md)
- [Security & Stealth Guide](docs/design/security.md)
- [ADR Index (Decisions)](AGENTS.md)

---

## âš¡ Monitoring & Logs
The engine persists every action. You can monitor progress via:
1. **Live Dashboard**: Visual tracking of ongoing campaigns.
2. **SQLite Database**: Full execution history and error traces.
3. **Internal Tracking**: Detailed job-level status updates.

---

Â© 2026 **4yangXYAO Automation**. All Rights Reserved.
