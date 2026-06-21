# [Target Hunter / Scraper] Integration

The current backend engine already possesses robust "finders" (scrapers) for finding target IDs (Posts, Users) across Facebook, Instagram, Twitter, and Threads. However, these are currently only used as a pre-step in the Blast Runner. This plan aims to expose these capabilities as a standalone "Target Hunter" tool in the dashboard.

## User Review Required

> [!IMPORTANT]
> **Scraping Limits**: Intensive scraping can lead to account temporary bans. The system will use **multi-account rotation** and **stealth behaviors** (randomized scrolling/jitter) to mimic human activity.
> **Intent-Based Targeting**: Scraper will prioritize "Buying Intent" keywords (e.g., "rekomendasi", "butuh", "info") and viral posts to maximize blast quality.

## Proposed Changes

### Backend API & Core

#### [NEW] [DiscoveryService](file:///d:/fork/4x-blast-engine-multiPlatform/src/blast/discovery-service.ts)
- Implement `findTargets` with **Strategies**:
    - `AD_ENGAGEMENT`: Find high-engagement posts for commenting.
    - `BUSINESS_PROSPECT`: Find profiles/pages in specific niches (e.g., UMKM).
    - `INTENT_DETECTION`: Scan comments for question marks and purchase signals.
- **Stealth Layer**: Randomized delays, headless fingerprint masquerading, and scrolling simulation.
- **Keyword Analyzer**: Auto-expand keywords and filter by "Negative Keywords".

#### [NEW] [discovery.ts](file:///d:/fork/4x-blast-engine-multiPlatform/src/routes/discovery.ts)
- `POST /v1/discovery/search`: Params: `platform`, `strategy`, `keyword`, `accountId`, `limit`.
- `POST /v1/discovery/save`: Bulk append unique IDs to `targets.txt`.

#### [MODIFY] [cron-scheduler.ts](file:///d:/fork/4x-blast-engine-multiPlatform/src/scheduler/cron-scheduler.ts)
- Update [runSchedulerTick](file:///d:/fork/4x-blast-engine-multiPlatform/src/scheduler/cron-scheduler.ts#189-218) to support automated discovery cycles using a "Targeting Strategy".

#### [MODIFY] [sqlite.ts](file:///d:/fork/4x-blast-engine-multiPlatform/src/db/sqlite.ts)
- Add `search_query` and `max_actions` to `schedules`.

### Dashboard UI

#### [MODIFY] [hooks.ts](file:///d:/fork/4x-blast-engine-multiPlatform/dashboard/lib/hooks.ts)
Add `useDiscovery` and `useSaveTargets` hooks to interface with the new endpoints.

#### [NEW] [page.tsx](file:///d:/fork/4x-blast-engine-multiPlatform/dashboard/app/discovery/page.tsx)
Create "Target Hunter" page:
- **Strategy Selector**: Switch between "Post Engagement", "Business Search", and "Intent Discovery".
- **Real-time Log**: Show scraping progress (scrolling, scanning, filtering).
- **Target Table**: List IDs with checkboxes and "Relevance Score" (based on keyword analysis).
- **Control Bar**: Save selected to global targets or Add to existing Schedule.

#### [MODIFY] [CreateScheduleModal.tsx](file:///d:/fork/4x-blast-engine-multiPlatform/dashboard/components/modals/CreateScheduleModal.tsx)
- Add "Search Query (Automated Discovery)" input field.
- Add "Max Actions" per run input.

#### [MODIFY] [Sidebar.tsx](file:///d:/fork/4x-blast-engine-multiPlatform/dashboard/components/layout/Sidebar.tsx)
Add "Target Hunter" link to the Sidebar.

## Verification Plan

### Automated Tests
- Test `/v1/discovery/search` with a mock cookie to verify object return.
- Verify [data/targets.txt](file:///d:/fork/4x-blast-engine-multiPlatform/data/targets.txt) is updated correctly after `/v1/discovery/save`.

### Manual Verification
- Run a search for "crypto" on Facebook via the dashboard and verify IDs are displayed.
- Save results and check if they appear in the /comment-random page or [data/targets.txt](file:///d:/fork/4x-blast-engine-multiPlatform/data/targets.txt).
