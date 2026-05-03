# 100% Completion Plan for Joki Blast Engine

## TL;DR
> **Summary**: Bring the entire joki-blast-engine codebase to production-ready state across 10 critical dimensions: type safety (eliminate all `any`), centralized configuration & secret hygiene, DB migrations validation, BaseAdapter contract enforcement, SDD comment blocks, robust rate-limit handling with exponential backoff, circular dependency elimination, security hardening (AES-256-GCM everywhere, CSP, auth-expiry), 100% test coverage for modified code, zero-error dashboard build, and up-to-date documentation.
>
> **Deliverables**:
> - Fully typed codebase (`npx tsc --noEmit` clean)
> - All secrets encrypted at rest; no hard-coded tokens
> - DB migrations validated and tested (002 + 003)
> - Every adapter overrides all BaseAdapter methods; missing methods throw `NotImplementedError`
> - SDD comment blocks on all source files
> - Per-platform rate-limiter with exponential backoff & circuit breaker
> - Zero circular dependencies (`madge --circular src/` clean)
> - Security: CSP headers, encrypted credential storage, auth-expiry handling
> - Test suite: 100% coverage on new/modified code, all tests green
> - Dashboard: `cd dashboard && npm run build` succeeds with 0 TypeScript errors/warnings
> - Documentation: README, API docs, usage examples updated
>
> **Effort**: XL (est. 20-30 hours)
> **Parallel Execution**: YES — 5 waves, 5-8 tasks per wave
> **Critical Path**: Type Safety → Secrets → DB Migrations → Adapters → Rate Limiting → Security → Tests → Dashboard Build → Docs

---

## Context

### Original Request
User requested a comprehensive "100% completion" plan to bring joki-blast-engine to production-ready state.

### Current State (from codebase analysis)
- **Type Safety**: 231 `any` usages across 53 files (src + dashboard)
- **Secrets**: Hard-coded fallbacks in `src/config/secrets.ts` (`fallback-secret-for-development-only`), credentials stored encrypted but encryption key derived from `JWT_SECRET` with weak fallback
- **DB Migrations**: `003_posts_table.sql` exists but untracked; `002_targets_table.sql` modified
- **Adapters**: `BaseAdapter` in `src/adapters/providers/base.ts` defines `connect()`, `sendMessage()`, `disconnect()`, `getRateLimitStatus()`, `maybeDrainRate()`, `createErrorResponse()`, `createSuccessResponse()`. Some adapters (telegram-mtproto, whatsapp) have additional methods not in base class.
- **Rate Limiting**: `src/queue/rate-limiter.ts` exists with token-bucket algorithm. `src/queue/retry.ts` handles retryable errors. Adapters return `RATE_LIMIT_EXCEEDED` code but some lack proper 429 handling.
- **Circular Dependencies**: Not yet checked with `madge`
- **Security**: CSP headers not present in API server; encryption uses SHA-256 derived key but fallback secret is weak
- **Test Coverage**: `vitest.setup.ts` exists; test suite exists but coverage not at 100%
- **Dashboard Build**: Modified files (`dashboard/app/*`, `dashboard/tsconfig.json`, etc.) but build not verified
- **Documentation**: README exists but API docs incomplete; no SDD comments

### Metis Review (Gap Analysis & Guardrails)
**Identified Gaps** (auto-resolved in this plan):
1. Type safety: 231 `any` usages → Systematic replacement with proper types
2. Secret hygiene: Hard-coded fallback secret → Remove fallback, require `JWT_SECRET` env var
3. DB migrations: Untracked 003 → Add, test, verify
4. Adapter contract: Inconsistent method signatures → Enforce uniform contract
5. Rate limiting: Some adapters lack proper retry → Implement centralized handler
6. Security: Weak CSP, auth-expiry → Add headers, handle token expiry
7. Test coverage: Not at 100% → Add missing tests
8. Dashboard: Build not verified → Run build, fix errors
9. Docs: Outdated → Update all docs

**Guardrails Applied**:
- MUST NOT introduce new `any` types
- MUST NOT commit hard-coded secrets
- MUST NOT modify DB schema without migration
- MUST NOT skip tests
- MUST NOT deploy without CSP headers

---

## Work Objectives

### Core Objective
Achieve production-ready state across type safety, security, test coverage, and operational robustness for the entire joki-blast-engine codebase.

### Concrete Deliverables
- [ ] `npx tsc --noEmit` in `src/` and `dashboard/` exits cleanly
- [ ] Zero hard-coded secrets in source code (grep confirms)
- [ ] `npm run db:migrate && npm test` succeeds
- [ ] All adapters implement full BaseAdapter contract; missing methods throw `NotImplementedError`
- [ ] SDD comment blocks (/** */ with @module, @description, @author, @since) on all .ts/.tsx files
- [ ] Rate limiter with exponential backoff & circuit breaker for all adapters
- [ ] `madge --circular src/` returns no output
- [ ] CSP header present on all API responses; all credentials encrypted with AES-256-GCM
- [ ] 100% test coverage on new/modified code (`vitest --coverage`)
- [ ] `cd dashboard && npm run build` succeeds with 0 TypeScript errors
- [ ] README, API.md, and usage examples updated

### Definition of Done
- [ ] All "Must Have" objectives above are met
- [ ] All tests pass: `npm test` → 100% passing, no skipped tests
- [ ] Dashboard builds: `cd dashboard && npm run build` → success, no warnings
- [ ] Security scan: `grep -r "fallback-secret" src/` → 0 matches
- [ ] Type check: `npx tsc --noEmit` in both `src/` and `dashboard/` → clean

### Must Have
- Replace all 231 `any` usages with proper TypeScript types
- Remove hard-coded secret fallbacks; require `JWT_SECRET` environment variable
- Validate and test all DB migrations (002 + 003)
- Enforce BaseAdapter contract across all 7 providers (twitter, facebook, instagram, threads, telegram, telegram-mtproto, whatsapp)
- Implement robust rate-limit handling: exponential backoff, circuit breaker, 429 retry
- Add CSP header to API server responses
- Achieve 100% test coverage for all modified code
- Build dashboard with zero TypeScript errors

### Must NOT Have (Guardrails)
- NO new `any` types introduced
- NO hard-coded API keys, tokens, or secrets in source code
- NO unencrypted credential storage
- NO skipping tests or ignoring TypeScript errors
- NO deployment without CSP headers and rate limiting
- NO modifying DB schema without corresponding migration file

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest for backend, Jest/Next.js for dashboard)
- **Automated tests**: TDD (RED → GREEN → REFACTOR)
- **Framework**: Vitest (backend), Jest (dashboard)
- **Coverage target**: 100% for new/modified code

### QA Policy
Every task MUST include agent-executed QA scenarios (see TODO template below).
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Backend/API**: Use Bash (curl) - Send requests, assert status + response fields
- **Dashboard/UI**: Use Playwright (playwright skill) - Navigate, interact, assert DOM, screenshot
- **Library/Module**: Use Bash (node REPL) - Import, call functions, compare output
- **Rate Limiting**: Mock 429 responses, verify retry logic with delayed assertions

---

## Execution Strategy

### Parallel Execution Waves

> Maximize throughput by grouping independent tasks into parallel waves.
> Each wave completes before the next begins.
> Target: 5-8 tasks per wave. Fewer than 3 per wave (except final) = under-splitting.

```
Wave 1 (Start Immediately - foundation):
├── Task 1: Replace all `any` types in src/ with proper types [deep]
├── Task 2: Replace all `any` types in dashboard/ with proper types [deep]
├── Task 3: Remove hard-coded secret fallbacks, require JWT_SECRET [quick]
├── Task 4: Add SDD comment blocks to all source files [quick]
├── Task 5: Validate DB migration 003, add to migration runner [quick]
├── Task 6: Run madge --circular, fix any circular deps [quick]
└── Task 7: Setup CSP header middleware in API server [quick]

Wave 2 (After Wave 1 - adapters & contracts):
├── Task 8: Enforce BaseAdapter contract on Twitter adapter [deep]
├── Task 9: Enforce BaseAdapter contract on Facebook adapter [deep]
├── Task 10: Enforce BaseAdapter contract on Instagram adapter [deep]
├── Task 11: Enforce BaseAdapter contract on Threads adapter [deep]
├── Task 12: Enforce BaseAdapter contract on Telegram adapters [deep]
├── Task 13: Enforce BaseAdapter contract on WhatsApp adapter [deep]
└── Task 14: Add NotImplementedError for missing adapter methods [quick]

Wave 3 (After Wave 2 - rate limiting & retry):
├── Task 15: Implement centralized rate-limit handler with exponential backoff [deep]
├── Task 16: Add circuit breaker pattern for persistent rate limits [unspecified-high]
├── Task 17: Update all adapters to use centralized rate limiter [unspecified-high]
├── Task 18: Add 429 response mocking to adapter tests [unspecified-high]
├── Task 19: Implement per-platform rate limit policies [unspecified-high]
└── Task 20: Update job-queue to respect rate limiter tokens [unspecified-high]

Wave 4 (After Wave 3 - security & encryption):
├── Task 21: Harden encryption key derivation (remove weak fallback) [quick]
├── Task 22: Add auth-expiry handling for all cookie-based adapters [deep]
├── Task 23: Verify all credentials encrypted before DB storage [unspecified-high]
├── Task 24: Add security tests for encryption/decryption [unspecified-high]
├── Task 25: Scan for remaining secret leaks, fix all [quick]
└── Task 26: Add Helmet/CSP middleware to API server [quick]

Wave 5 (After Wave 4 - tests & dashboard):
├── Task 27: Add missing unit tests for all modified modules [unspecified-high]
├── Task 28: Achieve 100% coverage on modified code (vitest --coverage) [unspecified-high]
├── Task 29: Build dashboard, fix all TypeScript errors [visual-engineering]
├── Task 30: Add E2E tests for critical user flows [unspecified-high]
├── Task 31: Update README with new features/config [writing]
└── Task 32: Generate API.md from route schemas [writing]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix (FULL)

| Task | Depends On | Blocks | Parallel Group |
|------|-----------|--------|----------------|
| 1 (any types src) | - | 8-14 | Wave 1 |
| 2 (any types dashboard) | - | 29 | Wave 1 |
| 3 (secret fallbacks) | - | 21, 25 | Wave 1 |
| 4 (SDD comments) | - | - | Wave 1 |
| 5 (migration 003) | - | - | Wave 1 |
| 6 (circular deps) | - | - | Wave 1 |
| 7 (CSP middleware) | - | 26 | Wave 1 |
| 8 (Twitter contract) | 1 | 15-20 | Wave 2 |
| 9 (Facebook contract) | 1 | 15-20 | Wave 2 |
| 10 (Instagram contract) | 1 | 15-20 | Wave 2 |
| 11 (Threads contract) | 1 | 15-20 | Wave 2 |
| 12 (Telegram contract) | 1 | 15-20 | Wave 2 |
| 13 (WhatsApp contract) | 1 | 15-20 | Wave 2 |
| 14 (NotImplementedError) | 8-13 | 15-20 | Wave 2 |
| 15 (rate-limit handler) | 14 | 16-20 | Wave 3 |
| 16 (circuit breaker) | 15 | 17-20 | Wave 3 |
| 17 (adapters use limiter) | 15, 16 | 18-20 | Wave 3 |
| 18 (429 mock tests) | 17 | - | Wave 3 |
| 19 (per-platform policies) | 15 | 17 | Wave 3 |
| 20 (job-queue respect) | 17 | - | Wave 3 |
| 21 (encryption key) | 3 | 22-24 | Wave 4 |
| 22 (auth-expiry) | 21 | - | Wave 4 |
| 23 (creds encrypted) | 21 | - | Wave 4 |
| 24 (security tests) | 22, 23 | - | Wave 4 |
| 25 (secret scan) | 3 | - | Wave 4 |
| 26 (Helmet/CSP) | 7 | - | Wave 4 |
| 27 (missing tests) | 8-14, 15-20 | 28, 30 | Wave 5 |
| 28 (100% coverage) | 27 | - | Wave 5 |
| 29 (dashboard build) | 2 | - | Wave 5 |
| 30 (E2E tests) | 27 | - | Wave 5 |
| 31 (README update) | 5, 8-14 | - | Wave 5 |
| 32 (API.md) | 8-14 | - | Wave 5 |

### Agent Dispatch Summary

- **Wave 1**: 7 tasks → 4 `deep` (1, 2), 3 `quick` (3, 4, 5, 6, 7), 1 `visual-engineering` (2)
- **Wave 2**: 7 tasks → 6 `deep` (8-13), 1 `quick` (14)
- **Wave 3**: 6 tasks → 1 `deep` (15), 5 `unspecified-high` (16-20)
- **Wave 4**: 6 tasks → 2 `quick` (21, 25), 2 `deep` (22), 2 `unspecified-high` (23, 24), 1 `quick` (26)
- **Wave 5**: 6 tasks → 3 `unspecified-high` (27, 28, 30), 1 `visual-engineering` (29), 2 `writing` (31, 32)
- **FINAL**: 4 tasks → 1 `oracle` (F1), 2 `unspecified-high` (F2, F3), 1 `deep` (F4)

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.
> **A task WITHOUT QA Scenarios is INCOMPLETE. No exceptions.**

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `vitest`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `refactor(types): replace all any types with proper typings`
- **Wave 2**: `refactor(adapters): enforce BaseAdapter contract across all providers`
- **Wave 3**: `feat(rate-limit): implement centralized rate limiter with exponential backoff`
- **Wave 4**: `security: harden encryption, add CSP headers, handle auth expiry`
- **Wave 5**: `test: achieve 100% coverage, build dashboard, update docs`
- **Final**: `chore: release v1.0.0 - production ready`

Each commit: `npm test` must pass, evidence in `.sisyphus/evidence/`.

---

## Success Criteria

### Verification Commands
```bash
cd /home/openclaw/projects/joki-blast-engine

# Type safety
npx tsc --noEmit                        # Expected: clean, no errors
cd dashboard && npx tsc --noEmit          # Expected: clean, no errors

# Secrets
grep -r "fallback-secret" src/            # Expected: 0 matches
grep -r "any" src/ --include="*.ts"     # Expected: 0 matches (after Task 1)

# DB migrations
npm run db:migrate                        # Expected: success
npm test                                  # Expected: all tests pass

# Circular deps
npx madge --circular src/                # Expected: no output

# Dashboard build
cd dashboard && npm run build             # Expected: success, no warnings

# Test coverage
npm test -- --coverage                    # Expected: 100% on modified files
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass (`npm test` → 100% passing)
- [ ] Dashboard builds with 0 TypeScript errors
- [ ] Security scan clean (no hard-coded secrets)
- [ ] CSP headers present on all API responses
- [ ] Documentation up-to-date
