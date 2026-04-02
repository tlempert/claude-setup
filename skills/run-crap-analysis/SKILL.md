---
name: run-crap-analysis
description: Run CRAP analysis, compute complexity score, check cyclomatic complexity, analyze code quality metrics, CRAP score report, find complex untested functions, code quality gate.
---

# Run CRAP Analysis

Computes the **C**hange **R**isk **A**nti-**P**atterns (CRAP) score for every function in the codebase.

```
CRAP(f) = CC(f)² × (1 − coverage(f))³ + CC(f)
```

A function with CC=5 and 0% coverage → CRAP=30. Same function at 100% coverage → CRAP=5. High CRAP = high risk of introducing bugs during changes.

**Thresholds (Uncle Bob's rules):**
- CC > 5 → Flag regardless of coverage. Split the function.
- CRAP > 30 → Critical. High complexity, untested. Must address.
- CRAP 15–30 → Warning. Needs attention.
- CRAP ≤ 15 → Acceptable.

## Step 1: Generate Coverage Data

```bash
npx jest --coverage --coverageReporters=json --coverageReporters=text --silent
```

This writes `coverage/coverage-final.json`. If it fails, fix test errors first — CRAP analysis requires a green (or at least runnable) test suite.

## Step 2: Run CRAP Report

```bash
# Whole src/ directory (default)
node .claude/skills/run-crap-analysis/scripts/crap-report.js

# Specific subdirectory
node .claude/skills/run-crap-analysis/scripts/crap-report.js --src=src/path/to/module

# Only files staged in git (what you're about to commit)
node .claude/skills/run-crap-analysis/scripts/crap-report.js --staged

# All locally modified files — staged + unstaged (everything in your working tree)
node .claude/skills/run-crap-analysis/scripts/crap-report.js --changed
```

The script deletes `coverage/` after printing the report. Pass `--keep-coverage` if you need the raw data for another tool.

**Pre-commit gate** — run `--staged` as a local hook or manually before every `git commit`. Run `--changed` during active development to check the whole diff before staging.

## Step 3: Interpret the Output

The script prints a ranked table. For each flagged function, determine the action:

| Situation | Action |
|-----------|--------|
| Module > 250 lines | Run `guide-refactor` to split first — before anything else |
| CC > 5 | Run `guide-refactor` to decompose the function |
| CC ≤ 5, low coverage | Run `scaffold-unit-tests` to add missing tests |
| CC ≤ 5, coverage ok | Run `run-mutation-test` to verify test quality |

## Step 3b: Verify Cleanup

The script deletes `coverage/` automatically. Confirm it's gone:

```bash
ls coverage/ 2>/dev/null && echo "WARNING: coverage/ still present" || echo "clean"
```

If `coverage/` is still there (e.g., the script was run from the wrong directory), delete it manually:

```bash
rm -rf coverage/
```

Check every project root where `npx jest --coverage` was run, not just the current one. In a monorepo with sub-packages, each sub-package that ran coverage will have its own `coverage/` directory.

## Step 4: Produce Action Plan

For the top offenders, produce a prioritized list:

```
CRAP ACTION PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CRITICAL
  1. src/application/checkout.js:processCheckout [CC:14, cov:0%, CRAP:196]
     → Module is 312 lines. Split first, then address CC and coverage.

  2. src/domain/pricing.js:applyDiscountRules [CC:8, cov:20%, CRAP:55]
     → Run guide-refactor to decompose (CC > 5 limit)

🟡 WARNING
  3. src/adapters/paymentGateway.js:retryPayment [CC:4, cov:30%, CRAP:22]
     → Add tests for retry and failure paths (CC ok, coverage low)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run next: guide-refactor on checkout.js
```

Update `plans/<feature-name>.md` Pipeline Status once all functions are in the acceptable range.
