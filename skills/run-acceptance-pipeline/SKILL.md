---
name: run-acceptance-pipeline
description: Run acceptance tests, execute GWT pipeline, parse acceptance test txt files, generate Jest specs from acceptance tests, run acceptance test pipeline, acceptance test execution.
---

# Run Acceptance Pipeline

Executes the three-stage acceptance test pipeline:

```
.txt → parse-gwt.js → .json → generate-jest.js → .spec.js → Jest
```

This mirrors Uncle Bob's empire-2025 pipeline, adapted for Node/Jest.

## Prerequisites Check

Verify these exist before starting:
- `acceptanceTests/` directory with at least one `.txt` file
- `.claude/skills/run-acceptance-pipeline/scripts/parse-gwt.js`
- `.claude/skills/run-acceptance-pipeline/scripts/generate-jest.js`
- Jest installed (`npx jest --version` works)

If `acceptanceTests/json/` and `generated-acceptance-specs/` are not in `.gitignore`, add them now.

## Step 1: Staleness Check

For each `.txt` file in `acceptanceTests/`:
```bash
ls -la acceptanceTests/*.txt acceptanceTests/json/*.json 2>/dev/null
```
If the `.json` is older than the `.txt`, or missing → mark for re-parse.

For each `.json` in `acceptanceTests/json/`:
```bash
ls -la acceptanceTests/json/*.json generated-acceptance-specs/*.spec.js 2>/dev/null
```
If the `.spec.js` is older than the `.json`, or missing → mark for re-generate.

## Step 2: Parse Stage

For each file marked for re-parse:
```bash
node .claude/skills/run-acceptance-pipeline/scripts/parse-gwt.js acceptanceTests/<name>.txt
```
Output: `acceptanceTests/json/<name>.json`

Report any parse errors immediately — do not proceed to generate if parse failed.

## Step 3: Generate Stage

For each file marked for re-generate:
```bash
node .claude/skills/run-acceptance-pipeline/scripts/generate-jest.js acceptanceTests/json/<name>.json
```
Output: `generated-acceptance-specs/<name>.spec.js`

**Critical:** Never manually edit generated spec files. If they need changes, fix the `.txt` source and regenerate.

## Step 4: Run Stage

```bash
npx jest generated-acceptance-specs/ --no-coverage
```

## Step 5: Report Results

**On failure (expected early in the pipeline):**
- Report which test failed
- Map it back to the source `.txt` file and line number of the `GIVEN` that started the test
- Show what was expected vs. what actually happened
- State clearly: "This is a failing acceptance test — implement the behavior to make it pass"

**On unexpected error (not a test failure, but a runtime crash):**
- Show the error
- Identify whether it's a test setup issue or missing module

**On full pass:**
```
✓ Acceptance pipeline: 12/12 tests passing
Source: acceptanceTests/order.txt, user.txt
```

Update `plans/<feature-name>.md` Pipeline Status accordingly.

## Shorthand to Run Everything

```bash
node .claude/skills/run-acceptance-pipeline/scripts/parse-gwt.js acceptanceTests/<name>.txt \
  && node .claude/skills/run-acceptance-pipeline/scripts/generate-jest.js acceptanceTests/json/<name>.json \
  && npx jest generated-acceptance-specs/ --no-coverage
```
