---
name: test-generator
description: Generate tests for new or modified code following project testing standards. Use when the user says "generate tests", "write tests", "add tests", or "test this".
---

# Test Generator

Generate unit, integration, or E2E tests for Lineup code following the `testing-standards` rule.

## Step 1 — Identify What Changed

Determine what needs tests:

- If the user specified files/modules, use those
- Otherwise, check recent git changes: `git diff --name-only HEAD~1`
- Classify each file: app source (`src/`), server source (`server/`), or component (`src/components/`)

## Step 2 — Determine Test Tier

| Source location | Primary tier | Test location |
|----------------|-------------|---------------|
| `src/lib/*.ts` | Unit | `src/__tests__/<module>.test.ts` |
| `src/data/*.ts` | Unit | `src/__tests__/<module>.test.ts` |
| `src/hooks/*.ts` | Unit | `src/__tests__/<hook>.test.ts` |
| `src/components/*.tsx` | Unit (logic) | `src/__tests__/<component>.test.ts` |
| `server/*.ts` (utilities) | Unit | `server/__tests__/<module>.test.ts` |
| `server/index.ts` (routes) | Integration | `server/__tests__/integration/<name>.test.ts` |
| Full user flows | E2E | `e2e/<flow>.spec.ts` |

## Step 3 — Analyze the Source

For each module, identify:

- Exported functions and their signatures
- Input types and constraints (required fields, enums, ranges)
- Return types and possible values
- Error conditions and edge cases
- Dependencies that need mocking

## Step 4 — Generate Tests

Follow the `testing-standards` rule for all conventions. Cover:

### For utility functions:
- Happy path with typical input
- Edge cases (empty arrays, null/undefined, boundary values)
- Error conditions (invalid input → expected error)
- Return shape validation

### For API routes (integration):
- Successful request → correct status and body shape
- Missing/invalid parameters → 400 with error message
- Rate limit → 429 after threshold
- API key enforcement → 401 without key
- Use supertest against the real Express app

### For data modules:
- No duplicate IDs
- All required fields present
- Cross-references are valid (e.g., channel IDs exist in channel map)

### For E2E flows:
- Navigation between screens
- User interactions (tap, scroll, select)
- Data appears correctly after API response
- State persists across navigation

## Step 5 — Verify

Run the new tests:

```bash
# App tests
cd tv-guide-app && npx jest --no-coverage --verbose <test-file>

# Server tests
cd tv-guide-app/server && npx jest --no-coverage --verbose <test-file>
```

Fix any failures in the tests themselves. Then run the full suite to confirm no regressions.

## Step 6 — Report Coverage

```
## Tests Generated
- Files: X new test files, Y updated
- Tests: N total test cases

## Coverage by Category
- Happy path: N tests
- Edge cases: N tests
- Error handling: N tests
- Data integrity: N tests

## Modules Covered
- [module]: [brief description of what's tested]
```
