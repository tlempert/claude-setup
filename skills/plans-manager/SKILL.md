---
name: plans-manager
description: Manage plans, track feature lifecycle, move plan to complete, check pipeline status, what pillar is next, orchestrate development workflow, feature progress, what should I work on next.
---

# Plans Manager

The conductor. Tracks every feature through the 5-pillar pipeline. Tells you exactly what to run next and blocks you from skipping steps.

## Pipeline Sequence (Non-Negotiable)

Every feature must pass through all stages in order:

```
1. brainstorm-spec          → plan file created in plans/
2. write-gwt-spec           → acceptanceTests/<name>.txt written
3. guard-spec-leakage       → spec is clean (no impl details)
4. run-acceptance-pipeline  → tests generated and FAILING (expected)
5. scaffold-unit-tests      → unit stubs created and FAILING (expected)
6. enforce-dependencies     → no layer violations
7. [implementation]         → developer writes the code
8. run-acceptance-pipeline  → acceptance tests now PASSING
9. run-crap-analysis        → all functions within CC≤5, CRAP acceptable
10. run-mutation-test        → mutation score ≥ 80%, all survivors killed
11. complete                 → plan moved to plans/complete/
```

Skipping is not permitted. If a step is blocked by a previous step's output, fix the previous step.

---

## Commands

### `status` — Show all active features and their current stage

Read all `.md` files in `plans/` (excluding `plans/permanent/` and `plans/complete/`). For each, find the first unchecked item in the Pipeline Status block.

Output:
```
ACTIVE FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  user-registration.md    →  next: write-gwt-spec
  payment-flow.md         →  next: run-crap-analysis
  audit-logging.md        →  next: [implementation]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Completed: plans/complete/ (3 features)
```

### `next <feature>` — What do I run next for this feature?

Read `plans/<feature>.md`. Find the first unchecked item in the Pipeline Status block. Return:
- The exact skill to run
- Any relevant file paths
- A one-line reminder of what the step does

Example:
```
Feature: payment-flow
Next step: run-crap-analysis

Run: npx jest --coverage --coverageReporters=json --silent
     then: node .claude/skills/run-crap-analysis/scripts/crap-report.js

Purpose: Ensure no function exceeds CC=5 and CRAP scores are acceptable
         before mutation testing.
```

### `complete <feature>` — Mark a feature as done

1. Read `plans/<feature>.md`
2. Verify ALL Pipeline Status items are checked
3. If any are unchecked: refuse and report which stages are incomplete
4. If all are checked:
   - Move `plans/<feature>.md` → `plans/complete/<feature>.md`
   - Update `plans/permanent/codebase-index.md` if new modules were added
   - Report: "Feature <name> is complete. Moved to plans/complete/."

### `new <feature>` — Start tracking a new feature

1. Create `plans/<feature-name>.md` with the pipeline status block template
2. Report: "Created plans/<feature-name>.md. Run brainstorm-spec to begin."

Template:
```markdown
# <Feature Name>
created: <ISO date>
status: in-progress

## Problem Statement
[to be filled by brainstorm-spec]

## Pipeline Status
- [ ] brainstorm-spec
- [ ] write-gwt-spec
- [ ] guard-spec-leakage
- [ ] run-acceptance-pipeline (failing — expected)
- [ ] scaffold-unit-tests
- [ ] enforce-dependencies
- [ ] [implementation]
- [ ] run-acceptance-pipeline (passing)
- [ ] run-crap-analysis (clean)
- [ ] run-mutation-test (score ≥ 80%)
- [ ] complete
```

### `check <feature> <stage>` — Mark a stage complete

Update the Pipeline Status block in `plans/<feature>.md`, checking off the specified stage.

Example: `check payment-flow guard-spec-leakage`

Only check off a stage after the user confirms it passed — never auto-check.

### `blocked` — Show features stuck at the same stage

Scan plan files for stages that have been unchecked across multiple sessions (heuristic: look for notes like "BLOCKED:" or repeated same next-step in successive sessions). Report them with the blocking reason if visible.

---

## What "Complete" Means

A feature is complete only when:
- Acceptance tests pass
- Unit tests pass
- CC ≤ 5 for all functions in the feature's modules
- CRAP scores in acceptable range
- Mutation score ≥ 80%
- No surviving non-equivalent mutants

This is Uncle Bob's definition. Not "it works in the browser."
