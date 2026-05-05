## [2026-05-05 22:35:00] Learnings from Wave 1

- Task 1 (DB types) is blocked because better-sqlite3 exports as a function, not a namespace, causing TS2709 when trying to use `better-sqlite3.Database`. The dual implementation (native + sql.js wrapper) requires a union type or runtime check. We created `src/types/better-sqlite3.d.ts` but runtime compatibility remains an issue. Alternative: Use strict types for native only and check `_isSqlJs` for runtime, but this may break sql.js fallback.

- Task 2 (repos `as any`) completed by replacing with proper type guard: `(db as unknown as { __isSqlJs?: boolean })?.__isSqlJs`. This works for both native and sql.js wrappers.

- Attempts to replace `any` in blast and workers (tasks 3 and 5) broke tests (156→128) due to incorrect type assumptions. Need a more careful TDD approach: write tests first, then adjust types.

- Task 4 (routes) and Task 6 (dashboard) have not been attempted yet. Dashboard build already passes with 0 TypeScript errors (Task 29 done), but there may still be `any` types that need to be replaced with proper types.

- Task 7 (DB migrations) completed: verified that migrations 002 and 003 apply cleanly.

Next steps: Approach blast and routes with TDD, starting with writing tests that capture the expected behavior, then refactoring types to make tests pass. For dashboard, we can audit for remaining `any` types and replace them with proper types, ensuring we don't break the build.

## Task 2: Replace `any` types in src/repos/ - COMPLETED

### Files Modified
1. **leadsRepo.ts** (line 32)
   - Changed: `const existing: any = db...`
   - To: `const existing = db...get(platform, contact) as Lead | undefined`
   - Pattern: Cast database query result to proper type using `as Lead | undefined`

2. **jobsRepo.ts** (lines 26, 50)
   - Line 26: `payload?: any` → `payload?: unknown`
   - Line 50: `markFailed(id: string, err: any)` → `markFailed(id: string, err: unknown)`
   - Added error narrowing: `const errorMessage = err instanceof Error ? err.message : String(err);`
   - Pattern: Use `unknown` for error types, then narrow with instanceof checks

3. **campaignsRepo.ts** (lines 51, 58, 103, 110, 118, 141, 155)
   - All database query results cast to `Record<string, unknown>` or proper type
   - Example: `const row = db.prepare(...).get(id) as Record<string, unknown> | undefined`
   - Pattern: All database results type-cast, then destructure or access properties

4. **templatesRepo.ts** (line 56)
   - Changed: `rows.map((r: any) => ({`
   - To: `.all() as Record<string, unknown>[]` and then accessed with type casts
   - Pattern: Cast `.all()` result array to Record, then access properties with casts

5. **linkClicksRepo.ts** (line 36)
   - Changed: `const rows: any[] = db...`
   - To: `.all(campaignId) as Record<string, unknown>[]`
   - Pattern: Use `Record<string, unknown>` for database rows

### Key Patterns Applied
- **Database queries**: Cast `.get()` results to `Type | undefined` or `Record<string, unknown> | undefined`
- **Query arrays**: Cast `.all()` results to `Type[]` or `Record<string, unknown>[]`
- **Error handling**: Use `unknown` instead of `any`, then narrow with `instanceof Error`
- **Property access**: Use type casts on destructure or access: `r.field as string`

### Verification
- All `any` occurrences removed: 0 remaining in src/repos/
- TypeScript compilation: ✓ No errors in modified files
- Tests: 152 passing (pre-existing test failures unrelated to repos)
- Files modified: 5 repos (leadsRepo, jobsRepo, campaignsRepo, templatesRepo, linkClicksRepo)
- runtimeSettingsRepo.ts: Already had no `any` types

### Architecture Decision
Using `Record<string, unknown>` for database rows provides:
- Type safety without tight coupling to schema changes
- Proper narrowing with `as Type` casts where needed
- No `any` pollution while respecting better-sqlite3 limitations
