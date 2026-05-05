# 100% Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task

**Goal:** Bring joki-blast-engine to production-ready state: type safety (no `any`), full adapter contracts, rate limiting with circuit breaker, security hardening, 100% test coverage

**Architecture:** 5-wave execution with parallel batches. Wave 1 fixes types (foundation for all). Wave 2 enforces adapter contracts. Wave 3 adds rate limiting. Wave 4 hardening. Wave 5 tests + build + docs.

**Tech Stack:** TypeScript, Vitest, better-sqlite3, Express, Helmet

---

## Wave 1: Type Safety (Foundation)

### Task 1: Fix DB types in sqlite.ts

**Files:**
- Modify: `src/db/sqlite.ts:7` — `export type DB = any`
- Modify: `src/db/sqlite.ts:16` — `BetterSqlite3 = require(...)`

- [ ] **Step 1: Read current sqlite.ts to see exact context**

Run: `cat src/db/sqlite.ts | head -30`

- [ ] **Step 2: Fix DB type**

```typescript
// Replace line 7: export type DB = any
// With:
import Database from 'better-sqlite3'
export type DB = Database

// Or for sql.js fallback, create union:
export type DB = Database | SqlJsDatabase
```

- [ ] **Step 3: Fix require typing**

Replace `BetterSqlite3 = require('better-sqlite3')` with proper import:
```typescript
import Database from 'better-sqlite3'
const BetterSqlite3 = { default: Database }
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit src/db/sqlite.ts`

- [ ] **Step 5: Test DB init**

Run: `npm run db:init`

---

### Task 2-6: Fix types in repos/, blast/, routes/, workers/, dashboard/

Similar pattern - use `grep -n "as any" src/` to find exact lines, replace with proper types.

### Task 7: Validate DB migrations

- [ ] **Step 1: Run migrations**

Run: `npm run db:init`

- [ ] **Step 2: Verify tables exist**

Run: `sqlite3 data/app.db ".tables"`

---

## Wave 2: Adapter Contracts

### Task 8-13: Enforce BaseAdapter on each adapter

Pattern per adapter:
1. Read adapter file
2. Check it implements all BaseAdapter methods
3. Add `throw new NotImplementedError()` for missing
4. Test

### Task 14: Add NotImplementedError

```typescript
export class NotImplementedError extends Error {
  constructor(method: string) {
    super(`${method} not implemented`)
    this.name = 'NotImplementedError'
  }
}
```

---

## Wave 3: Rate Limiting

### Task 15-16: Exponential backoff + circuit breaker

- [ ] **Step 1: Read rate-limiter.ts**

Run: `cat src/queue/rate-limiter.ts`

- [ ] **Step 2: Add exponential backoff**

In `retryAfter` method:
```typescript
const delay = Math.min(base * Math.pow(2, attempt), maxDelay)
```

- [ ] **Step 3: Add circuit breaker**

```typescript
enum CircuitState { CLOSED, OPEN, HALF_OPEN }
let circuit = CircuitState.CLOSED
let failureCount = 0
```

### Task 17-20: Update adapters, tests, policies

---

## Wave 4: Security

### Task 21: Harden encryption

- [ ] **Step 1: Read runtime-secret-store.ts**

Run: `cat src/config/runtime-secret-store.ts`

- [ ] **Step 2: Check key derivation**

Update to use PBKDF2:
```typescript
crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha512')
```

### Task 22: Auth-expiry handling

- [ ] **Step 1: Search for AUTH_EXPIRED handling**

Run: `grep -rn "AUTH_EXPIRED" src/adapters/`

- [ ] **Step 2: Add to cookie adapters**

In facebook-cookie.ts, instagram-cookie.ts, threads-cookie.ts, twitter-cookie.ts:
```typescript
if (response.status === 401 || error.includes('login')) {
  return { success: false, code: 'AUTH_EXPIRED' }
}
```

---

## Wave 5: Tests, Build, Docs

### Task 27-28: Add tests, achieve 100% coverage

- [ ] **Step 1: Run coverage**

Run: `npm test -- --coverage`

- [ ] **Step 2: Identify gaps**

Look for uncovered lines in report

- [ ] **Step 3: Add tests**

Add tests to cover missing branches

### Task 29: Dashboard build

- [ ] **Step 1: Build dashboard**

Run: `cd dashboard && npm run build`

- [ ] **Step 2: Fix errors**

Fix any TypeScript errors

### Task 31-32: Update docs

---

## Execution Summary

| Wave | Tasks | Est. Time | Priority |
|------|-------|----------|---------|
| 1 | 1-7 | 6-8 hrs | HIGH |
| 2 | 8-14 | 4-6 hrs | HIGH |
| 3 | 15-20 | 3-4 hrs | MEDIUM |
| 4 | 21-26 | 3-4 hrs | MEDIUM |
| 5 | 27-32 | 4-6 hrs | MEDIUM |
| FINAL | F1-F4 | 2 hrs | REQUIRED |

**Total: 20-30 hours**

---

**Plan version**: 2.0  
**Created**: 2026-05-05  
**Status**: READY FOR EXECUTION