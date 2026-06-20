# src/blast - Blast Orchestrator

**Purpose:** Sequential multi-platform blast execution â€” loads targets, picks actions, runs them via adapters with delays.

## STRUCTURE
```
blast/
â”œâ”€â”€ blast-runner.ts       # Main orchestrator (sequential, single platform per run)
â”œâ”€â”€ action-picker.ts      # Random action selection (70% comment / 30% DM)
â”œâ”€â”€ delay.ts              # Random delay generation (20-40s comment, 35-60s DM)
â”œâ”€â”€ types.ts              # BlastConfig, BlastResult, BlastTarget, etc.
â”œâ”€â”€ finders/              # Platform-specific target finders
â”‚   â”œâ”€â”€ instagram-finder.ts
â”‚   â”œâ”€â”€ threads-finder.ts
â”‚   â””â”€â”€ twitter-finder.ts
â”œâ”€â”€ actions/              # Platform action wrappers
â”‚   â””â”€â”€ instagram-dm.ts
â””â”€â”€ test files (alongside)
```

## KEY FILES

| File | Purpose |
|------|---------|
| `blast-runner.ts` | Orchestrator: loads creds â†’ finds targets â†’ loops (max 30 actions) â†’ logs results |
| `action-picker.ts` | Weighted random selection: 70% comment, 30% chat/DM |
| `delay.ts` | Async delay with random jitter per action type |
| `types.ts` | `BlastConfig`, `BlastResult`, `BlastAction`, `BlastPlatform`, etc. |
| `finders/instagram-finder.ts` | Find IG targets from a seed URL |
| `finders/threads-finder.ts` | Find Threads targets |
| `finders/twitter-finder.ts` | Find Twitter targets from a seed URL |
| `actions/instagram-dm.ts` | IG DM sending via adapter |

## RULES (per blast run)

- Only ONE platform per run (single provider mode)
- Sequential execution â€” no parallel, no multi-thread
- Max 30 actions per run (hard cap)
- On failure: log and skip â€” do NOT stop
- Random delay between actions: 20-40s (comment), 35-60s (DM)

## NOTES

- See ADR-0007 for blast runner architecture decisions
- `api/blast.ts` route triggers a blast run via the runner
