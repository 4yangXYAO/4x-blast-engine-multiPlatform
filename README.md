# 🚀 4x-blast-engine

High-performance, multi-platform social media blast engine built for **4yangXYAO**. Designed for stealth, high throughput, and persistent engagement.

---

## 🛠 Features

- **Multi-Platform Support**: WhatsApp, Telegram, Instagram, Twitter/X, Threads, and Facebook Pages.
- **Stealth Architecture**: Advanced fingerprinting and cookie-based authentication (no API tokens required for most platforms).
- **Hybrid Adapters**: Seamlessly switch between high-speed HTTP/GraphQL and high-fidelity Browser (Playwright) execution.
- **Robust Orchestration**: Queue-based processing with automatic retries and sophisticated rate limiting.
- **Full Observability**: Real-time dashboard with CTR tracking, success rates, and live lead conversion funnels.

---

## 🎥 Product Walkthrough

The **4x-blast-engine** is a production-ready social media automation suite. Below is the feature set for our Facebook implementation:

### 🚀 Live Facebook Blast
![Facebook Blast Walkthrough](docs/assets/facebook_blast_walkthrough.webp)
*Visualizing automated target identification and multi-action engagement.*

### 📊 Real-time Analytics Dashboard
![Dashboard Overview](docs/assets/dashboard_overview.png)
*Track CTR, success rates, and lead conversion funnels across all platforms.*

### 📋 Detailed Execution Logging
![Dashboard Jobs](docs/assets/dashboard_jobs.png)
*Monitor every automated action with full error persistence and trace visibility.*

---

## 🚀 Quick Start

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

## 📂 Project Structure

```
├── src/                  # Core execution engine (TypeScript)
│   ├── adapters/         # Platform-specific adapters (FB, IG, TW, etc.)
│   ├── blast/            # Multi-platform action orchestrator
│   ├── queue/            # Job queueing & rate limiting
│   └── workers/          # Background processing
├── dashboard/            # Next.js admin dashboard
├── docs/                 # Detailed technical documentation
└── scripts/              # Utility and testing scripts
```

---

## 📘 Documentation

For deep dives into the architecture and setup, check the `docs/` directory:
- [Architecture Overview](docs/design/architecture.md)
- [Multi-Platform Strategies](docs/design/data-flow.md)
- [Security & Stealth Guide](docs/design/security.md)
- [ADR Index (Decisions)](AGENTS.md)

---

© 2026 **4yangXYAO Automation**. All Rights Reserved.
