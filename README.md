# 🚀 4x-blast-engine

Welcome! This is the **4x-blast-engine** repository. This page provides a simple entry point to navigate the project and get started quickly.

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

## 🏗 System Architecture

```mermaid
flowchart TD
	U[Admin / Operator] --> DASH[Dashboard UI / Next.js]
	DASH --> API[HTTP API Routes]

	API --> SET[Runtime Settings API]
	API --> ACC[Accounts API]
	API --> TMP[Templates API]
	API --> JOB[Jobs API]
	API --> CAM[Campaigns API]

	SET --> RSR[RuntimeSettingsRepo]
	ACC --> ARR[AccountsRepo]
	TMP --> TPR[TemplatesRepo]
	JOB --> JPR[JobsRepo]
	CAM --> CPR[CampaignsRepo]

	RSR --> DB[(SQLite / sql.js fallback)]
	ARR --> DB
	TPR --> DB
	JPR --> DB
	CPR --> DB

	API --> Q[Job Queue]
	Q --> W[Worker / Job Executor]

	W --> SEL{Job Type}
	SEL -->|CommentJob| CMT[Facebook Comment Action]
	SEL -->|ChatJob| CHAT[Facebook Chat Action]
	SEL -->|PostJob| PST[Facebook / Platform Post Action]
	SEL -->|Campaign Job| CMP[Campaign Orchestrator]

	CMT --> FB1[Facebook comment.ts]
	CHAT --> FB2[Facebook chat.ts]
	PST --> FB3[FacebookAdapter / facebook.ts]
	CMP --> Q

	FB1 --> HTTP[HTTP Client + Cookies Parser]
	FB2 --> HTTP
	FB3 --> HTTP

	HTTP --> FB[Facebook Internal Endpoints]

	FB1 --> LOG[Logging / logs table]
	FB2 --> LOG
	FB3 --> LOG
	W --> LOG
	LOG --> DB

	DASH --> HEALTH[API Health / Status Card]
	HEALTH --> API

	DASH --> CFG[Integration Tokens]
	CFG --> RSR

	DASH --> ACT[Create Account / Template / Job]
	ACT --> ARR
	ACT --> TPR
	ACT --> JPR

	FB1 -. uses .-> AUTH[Cookie Session + CSRF Tokens]
	FB2 -. uses .-> AUTH
	FB3 -. uses .-> AUTH
	AUTH -. stored in .-> ARR

	subgraph Core[Root Backend]
		API
		RSR
		ARR
		TPR
		JPR
		CPR
		Q
		W
		LOG
	end

	subgraph Surface[Dashboard Surface]
		DASH
		HEALTH
		CFG
		ACT
	end
```

---

## 📂 Documentation Index

### Design & Architecture
- [Architecture Overview](docs/design/architecture.md)
- [Data Flow Analysis](docs/design/data-flow.md)
- [System Scaling](docs/design/scaling.md)
- [Security & Stealth](docs/design/security.md)

### Guides & Decision Records
- [ADR Index](docs/decisions/AGENTS.md)
- [Facebook Cookie Adapter Guide](docs/facebook-cookie-adapter-guide.md)
- [Development Workflow](docs/planning/GUIDE.md)

---

## 🎥 Product Walkthrough

The **4x-blast-engine** is a production-ready social media automation suite. 

### 🎥 Live Facebook Blast
![Facebook Blast Walkthrough](docs/assets/facebook_blast_walkthrough.webp)
*Visualizing automated target identification and multi-action engagement.*

### 📊 Real-time Analytics Dashboard
![Dashboard Overview](docs/assets/dashboard_overview.png)
*Track CTR, success rates, and lead conversion funnels across all platforms.*

### 📋 Detailed Execution Logging
![Dashboard Jobs](docs/assets/dashboard_jobs.png)
*Monitor every automated action with full error persistence and trace visibility.*

---

For more details, visit the corresponding sections in the `docs/` folder.

© 2026 **4yangXYAO Automation**. All Rights Reserved.
