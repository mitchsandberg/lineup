---
name: test-runner
description: Run all tests, diagnose failures, and self-heal broken tests without masking real bugs. Use when the user says "run tests", "check tests", "fix tests", or "self-heal".
---

# Test Runner & Self-Healing

Run the full test suite, classify every failure, fix test bugs, and leave real bugs failing.

## Step 1 — Run All Tests

Run both suites in parallel:

```bash
# App tests
cd tv-guide-app && npx jest --no-coverage --verbose 2>&1

# Server tests
cd tv-guide-app/server && npx jest --no-coverage --verbose 2>&1
```

If all tests pass, report results and stop.

## Step 2 — Classify Each Failure

For every failing test, determine the category:

| Category | Symptoms | Action |
|----------|----------|--------|
| **Stale test** | Assertion expects old behavior that was intentionally changed | Update the assertion to match new correct behavior |
| **Real bug** | Code change introduced a regression | Fix the source code, not the test |
| **Flaky test** | Non-deterministic failure (timing, network) | Make deterministic with mocks/fixed data |
| **Missing mock** | Test hits real network/filesystem | Add appropriate mocks per testing-standards rule |

### Decision process

1. Read the failing assertion
2. Read the source code being tested
3. Determine if the test expectation or the source code is wrong
4. Never change both test and source in the same step without explaining which was wrong

## Step 3 — Fix and Re-run

After fixes:

```bash
cd tv-guide-app && npx jest --no-coverage --verbose
cd tv-guide-app/server && npx jest --no-coverage --verbose
```

Repeat Steps 2-3 until:
- All remaining failures are confirmed source bugs (leave them red)
- Or all tests pass

## Step 4 — Report

```
## Test Results
- App: X passing, Y failing
- Server: X passing, Y failing

## Test Bugs Fixed
- [test name]: was expecting X, code now does Y — updated assertion

## Source Bugs Found (left failing)
- [module]: expected X but got Y — needs source fix

## Status
[All green / N confirmed bugs remaining]
```

## Guardrails

- Never weaken an assertion to make it pass
- Never delete a failing test without a replacement
- Never skip a test with `.skip` to hide a failure
- If a hardcoded count changes, verify the new count against actual data
- Always run the full suite after any fix to catch cascading failures
