# 🚀 4x-blast-engine

Social media automation engine for 4yangXYAO — schedule posts, engagement automation, and content planning across WhatsApp, Telegram, Instagram, Twitter/X, Threads, and Facebook Pages.

## 🚀 Features
- **Multi-Platform Blast**: WhatsApp, Telegram, Instagram, Twitter/X, Threads, and Facebook Pages.
- **Sniper Discovery (Target Hunter)**: Advanced stealth scraping engine using Playwright Stealth to find high-intent leads.
- **Intent Scoring Engine**: Local rule-based scoring (Regex) to identify "Hot Leads" without AI costs.
- **Humanized Behavioral Simulation**: Randomized scrolling, jitter, and delays to mimic human behavior.
- **Stealth Architecture**: Bypasses modern bot detection via `playwright-extra` and `stealth` plugins.
- **Smart Scheduler**: Persistent SQLite-based cron jobs with rate-limit awareness.

## 🏗️ Architecture

```mermaid
graph TD
    Dashboard[Next.js Dashboard] -->|API| Runner[Blast Runner]
    Dashboard -->|API| Hunter[Target Hunter / Discovery]
    
    subgraph "The Sniper Discovery Engine"
        Hunter --> PWS[Playwright Stealth]
        PWS -->|Scrape| Socials[FB / IG / X / Threads]
        Socials -->|Content| Intent[Intent Scoring Engine]
        Intent -->|Scored Leads| Targets[(targets.txt)]
    end
    
    Runner -->|Consume| Targets
    Runner -->|Execute| Adapters[Platform Adapters]
    Adapters -->|Post/Chat| Socials
```

---

## 🚀 Quick Start

To launch the project, use the following commands:

- **On Linux/MacOS**:
  ```bash
  ./start.sh
  ```

- **On Windows**:
  ```powershell
  .\start.ps1
  ```

---

## 📂 Documentation Index

### Design & Architecture
- [Architecture Overview](docs/design/architecture.md)
- [Sniper Discovery (Scraping)](docs/planning/archive/scraping.md)
- [Security & Stealth](docs/design/security.md)

### Guides & Decision Records
- [ADR Index](docs/decisions/AGENTS.md)
- [Facebook Cookie Adapter Guide](docs/facebook-cookie-adapter-guide.md)
- [Development Workflow](docs/planning/GUIDE.md)

---

© 2026 **4yangXYAO Automation**. All Rights Reserved.
