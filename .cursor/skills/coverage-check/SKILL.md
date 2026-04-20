# Coverage Check Skill

Run test coverage analysis, identify gaps, and report results.

## When to Use

- After implementing new features or fixing bugs
- Before opening or reviewing a pull request
- When the user asks "what's our coverage?" or "are there gaps?"
- Periodically as a health check

## Steps

### 1. Run Coverage Reports

Run both suites with coverage enabled:

```bash
cd tv-guide-app && npx jest --coverage 2>&1 | tail -30
cd tv-guide-app/server && npx jest --coverage 2>&1 | tail -20
```

### 2. Parse the Coverage Table

Extract per-file coverage from the Jest output. For each file, note:
- **% Stmts** — statement coverage
- **% Branch** — branch coverage  
- **% Funcs** — function coverage
- **% Lines** — line coverage
- **Uncovered Line #s** — specific gaps

### 3. Identify Gaps

Flag any file where:
- Lines < 99% → needs attention
- Branches < 94% → needs attention
- Functions < 100% → untested exports
- Any new uncovered lines introduced by recent changes

### 4. Categorize Gaps

For each gap, determine the root cause:
- **Missing test file** — no test exists for the module
- **Untested branch** — an if/else or switch case not exercised
- **Error path not covered** — catch blocks, fallback logic
- **Dead code** — unreachable code that can be removed
- **Platform-specific** — code that only runs on iOS/Android/TV (acceptable gap)
- **Build-time constant** — `__DEV__`, `process.env.NODE_ENV` (acceptable gap)

### 5. Report to User

Present a summary table:

```
| Area    | Stmts  | Lines  | Funcs  | Branches | Status |
|---------|--------|--------|--------|----------|--------|
| App     | XX.X%  | XX.X%  | XX.X%  | XX.X%    | ✓/⚠/✗  |
| Server  | XX.X%  | XX.X%  | XX.X%  | XX.X%    | ✓/⚠/✗  |
```

Then list the top gaps by impact (biggest coverage lift first).

### 6. Fix Gaps (if requested)

For each gap:
1. Read the source file to understand what's uncovered
2. Determine the correct test tier (unit/integration/E2E)
3. Write tests following the `testing-standards` rule
4. Re-run coverage to verify the gap closed
5. Ensure no existing tests broke

## Thresholds

Current enforced thresholds (in jest configs):

**App** (global):
- Lines: 99%, Statements: 99%, Functions: 100%, Branches: 94%

**Server** (global):
- Lines: 99%, Statements: 98%, Functions: 94%, Branches: 97%

### Known Uncoverable Lines
- `api.ts` L9: `__DEV__` ternary (build-time constant)
- `api.ts` L147-156: Sort short-circuit branches
- `use-preferences.ts` L20, L48: `??` fallback branches
- `index.ts` L127-128: `app.listen` guard (skipped in test env)

### Coverage Exclusions
- `.web.ts` files excluded from app coverage
- `.tsx` files excluded (require renderer, not instrumentable in Node)

## Guardrails

- Never lower thresholds to make coverage pass — write tests instead
- Exception: platform-specific code (iOS/Android/TV) that can't run in Node
- Exception: dead code — flag it for removal instead of testing it
- If coverage drops after a change, the CI build should fail
- Always re-run the full suite after adding tests to catch regressions
