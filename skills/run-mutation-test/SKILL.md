---
name: run-mutation-test
description: Run mutation tests, execute Stryker, kill surviving mutants, mutation testing, check test assertion quality, detect weak tests, verify test coverage quality.
---

# Run Mutation Tests

Runs Stryker.js mutation testing on a target module. Each surviving mutant is a behavior your tests don't actually assert — even if they hit the line. This is the "Guard Dog" pillar: it proves your tests are **asserting**, not just executing.

## Critical Pre-check: Module Size

**Before anything else**, measure the target module:
```bash
wc -l <target-file>
```

If over **250 lines**: **STOP**. Tell the user:
> "This module is [N] lines. Per `CLAUDE.md` coding constraints, modules over 250 lines must be split before mutation testing. Run `guide-refactor` first, then come back here."

Do not proceed until the module is under 250 lines.

## Step 1: Check Stryker Installation

```bash
npx stryker --version 2>/dev/null
```

If not installed:
```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
```

If `stryker.config.mjs` doesn't exist, create a base config:
```javascript
// stryker.config.mjs
export default {
  testRunner: 'jest',
  reporters: ['progress', 'clear-text', 'json'],
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  thresholds: { high: 80, low: 60, break: null },
  coverageAnalysis: 'perTest',
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
};
```

## Step 2: Run Mutation Tests

```bash
bash .claude/skills/run-mutation-test/scripts/mutate-module.sh <path-to-module>
```

Example:
```bash
bash .claude/skills/run-mutation-test/scripts/mutate-module.sh src/domain/pricing.js
```

This will take several minutes. Do not interrupt it.

## Step 3: Check Equivalent Mutations Registry

Before reporting any survivor, read `plans/permanent/equivalent-mutations.md`.

If the file doesn't exist, create it:
```markdown
# Equivalent Mutations Registry
project: <name>
last_updated: <date>

## Known Equivalent Mutations
<!-- Mutations that survive because they are semantically equivalent — not a test gap -->
<!-- Format: file:line — mutation description — reason it's equivalent -->
```

Cross-reference every surviving mutant against this registry. **Do not report known-equivalent survivors as action items.**

## Step 4: Interpret Each Survivor

For every non-equivalent surviving mutant, explain it in plain English:

```
SURVIVING MUTANT #1
  File:     src/domain/pricing.js:42
  Mutation: Changed > to >=
  Code:     if (quantity > 10) → if (quantity >= 10)

  Plain English:
    Your tests never assert behavior at the exact boundary of quantity=10.
    Stryker changed > to >= and your tests still passed — meaning you have
    no test for "exactly 10 items" behavior.

  Fix:
    Add: 'should apply bulk discount when order contains exactly 10 items'
    Add: 'should not apply bulk discount when order contains exactly 9 items'
```

## Step 5: Action Items

Produce a numbered list:
1. One new test per surviving mutant (with the test name written out)
2. Any mutants to add to `plans/permanent/equivalent-mutations.md`

Then update `plans/<feature-name>.md` Pipeline Status once all mutants are killed.

## Step 6: Cleanup

After every run — whether successful, failed, or interrupted — verify the project is clean:

```bash
# Remove the sandbox directory (the script's trap should have done this, but verify)
rm -rf .stryker-tmp

# Remove any orphaned temp configs left by interrupted runs
rm -f .stryker-temp-*.mjs

# Remove the JSON report — it's an intermediate artefact, not a source file
rm -rf reports/mutation
```

Run these commands in **every project root where Stryker was invoked**. In a monorepo, check all sub-packages, not just the one you targeted. Stryker sandboxes are full copies of the project and can be hundreds of MB.

## Mutation Score Targets

- **≥ 80%** — acceptable
- **60–79%** — needs improvement, address critical survivors first
- **< 60%** — tests are not asserting behavior; stop adding features until this is fixed
