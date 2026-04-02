---
name: run-atdd-cycle
description: Run the ATDD development cycle, orchestrate feature development, advance pipeline stage, what's next, continue development, feature progress, development workflow orchestrator.
---

# Run ATDD Cycle

The orchestrator. Manages the full Acceptance Test-Driven Development pipeline for a feature. Reads plan status, runs the next required skill, validates output, advances the stage.

## Pipeline Sequence

Every feature passes through all stages in order:

```
 0. [bootstrap]              ← index-codebase + load-context (per-task)
 1. brainstorm-spec          ← domain discovery, acceptance criteria
 2. write-gwt-spec           ← create acceptanceTests/<feature>.txt
 3. guard-spec-leakage       ← audit spec for implementation language
 4. run-acceptance-pipeline  ← generate tests, assert FAILING (no code yet)
 5. scaffold-unit-tests      ← create failing unit stubs
 6. enforce-dependencies     ← verify no layer violations
 7. [architecture-planning]  ← research solution, discuss approach together
 8. [implementation]         ← developer writes the code
 9. run-acceptance-pipeline  ← re-run, assert PASSING
10. run-crap-analysis        ← CC≤5, CRAP≤30
11. run-mutation-test        ← mutation score ≥80%
12. complete                 ← move to plans/complete/
```

Skipping is not permitted. Each stage has a validation gate.

---

## Commands

### `status` — Show all active features and their current stage

Read all `.md` files in `plans/` (excluding `plans/permanent/` and `plans/complete/`).

Output:
```
ACTIVE FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  server-label.md           →  stage 7: architecture-planning
  audit-logging.md          →  stage 8: implementation
  payment-flow.md           →  stage 10: run-crap-analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Completed: plans/complete/ (3 features)
```

### `start <feature>` — Begin a new feature

1. Create `plans/<feature>.md` with the pipeline status block
2. Run `index-codebase` if `plans/permanent/codebase-index.md` doesn't exist
3. Report: "Feature <name> created. Run `run-atdd-cycle next <feature>` to begin brainstorming."

### `next <feature>` — Run the next stage

1. Read `plans/<feature>.md`
2. Find the first unchecked stage
3. Run the corresponding skill
4. Validate the output (see Validation Gates below)
5. If validation passes, check off the stage and report the next step
6. If validation fails, report what needs to be fixed

### `gate <feature>` — Run all quality gates without advancing

Runs CRAP analysis, mutation testing, and dependency check in sequence. Reports all issues without modifying the plan.

---

## Stage Details

### Stage 0: Bootstrap (automatic)

**Before any feature work:**
- If `plans/permanent/codebase-index.md` is missing → run `index-codebase`
- Run `load-context` to select relevant files for the task

### Stage 1: brainstorm-spec

**Invoke:** `brainstorm-spec`

**What happens:**
- Socratic exploration of the domain problem
- Discover commands, events, invariants, failure modes, boundaries
- Output raw acceptance criteria

**Validation:** User confirms criteria are complete

**Advance when:** User says "criteria complete" or similar

### Stage 2: write-gwt-spec

**Invoke:** `write-gwt-spec`

**What happens:**
- Convert acceptance criteria to Given-When-Then format
- Write to `acceptanceTests/<feature>.txt`
- Use only glossary terms — no implementation language

**Validation:** File exists and is non-empty

### Stage 3: guard-spec-leakage

**Invoke:** `guard-spec-leakage`

**What happens:**
- Scan spec for HTTP verbs, status codes, class names, DB operations
- Flag any implementation language that leaked in

**Validation:** Zero leakage findings

**If fails:** Fix the spec, re-run

### Stage 4: run-acceptance-pipeline (failing)

**Invoke:** `run-acceptance-pipeline`

**What happens:**
- Generate Jest tests from `.txt` spec
- Run them — they should **FAIL** (no implementation yet)

**Validation:** Tests exist AND exit code is non-zero (failing)

**If tests pass:** Something is wrong — the tests aren't testing the new behavior

### Stage 5: scaffold-unit-tests

**Invoke:** `scaffold-unit-tests`

**What happens:**
- Create failing unit test stubs mirroring source structure
- TDD bootstrap — stubs describe expected behavior

**Validation:** Test files created

### Stage 6: enforce-dependencies

**Invoke:** `enforce-dependencies`

**What happens:**
- Check layer boundaries (domain → adapters forbidden)
- Run dependency-cruiser or manual import scan

**Validation:** Zero violations

**If fails:** Fix architecture before proceeding

### Stage 7: architecture-planning ⭐

**This is a collaborative stage — not automated.**

**What happens:**
1. Review the acceptance criteria and failing tests together
2. Research potential solutions:
   - Check existing patterns in the codebase (`load-context`)
   - Identify which layers will be touched
   - Consider edge cases and failure modes
3. Discuss the approach:
   - Which modules need changes?
   - Any new modules needed?
   - How does data flow?
   - What interfaces need to change?
4. Document the agreed approach in `plans/<feature>.md` under `## Technical Approach`

**Validation:** User confirms "approach agreed" or similar

**Output template to add to plan:**
```markdown
## Technical Approach
agreed: <date>

### Changes Required
- [ ] src/security/security.manager.ts — add buildServerLabel() method
- [ ] src/connection/connection.manager.ts — expose getActualServerVersion()
- [ ] src/proxies/proxy.ts — capture version at initialization

### Data Flow
1. ConnectionManager.connect() → MCP client handshake
2. Proxy.initialize() → read version from connection
3. SecurityManager → use version in event labels

### Edge Cases
- Backend reports no version → use server name only
- Version changes mid-session → captured once at connect time
```

**Advance when:** User confirms approach is agreed

### Stage 8: implementation

**This is a developer stage.**

**Prompt:**
> "The architecture is agreed. Write the implementation, then run `run-atdd-cycle next <feature>` to validate."

**Validation:** None — advance manually when user says "implementation done"

### Stage 9: run-acceptance-pipeline (passing)

**Invoke:** `run-acceptance-pipeline`

**What happens:**
- Re-run the generated tests
- They should now **PASS**

**Validation:** Exit code is zero (passing)

**If fails:** Implementation is incomplete or incorrect

### Stage 10: run-crap-analysis

**Invoke:** `run-crap-analysis`

**What happens:**
- Compute CRAP scores for changed files
- Flag functions with CC > 5 or CRAP > 30

**Validation:** No critical violations

**If fails:** Run `guide-refactor` on flagged functions, then re-run

### Stage 11: run-mutation-test

**Invoke:** `run-mutation-test`

**What happens:**
- Run Stryker on changed modules
- Each surviving mutant = untested behavior

**Validation:** Mutation score ≥ 80%

**If fails:** Kill surviving mutants by adding assertions, then re-run

### Stage 12: complete

**What happens:**
1. Verify all previous stages are checked
2. Move `plans/<feature>.md` → `plans/complete/<feature>.md`
3. Update `plans/permanent/codebase-index.md` if new modules were added
4. Update `plans/permanent/glossary.md` if new terms were introduced

**Report:** "Feature <name> is complete."

---

## Plan File Template

```markdown
# <Feature Name>
created: <ISO date>
status: in-progress

## Problem Statement
[filled by brainstorm-spec]

## Acceptance Criteria
[filled by brainstorm-spec]

## Technical Approach
agreed: <date>
[filled during architecture-planning]

## Pipeline Status
- [ ] brainstorm-spec
- [ ] write-gwt-spec
- [ ] guard-spec-leakage
- [ ] run-acceptance-pipeline (failing)
- [ ] scaffold-unit-tests
- [ ] enforce-dependencies
- [ ] architecture-planning
- [ ] implementation
- [ ] run-acceptance-pipeline (passing)
- [ ] run-crap-analysis
- [ ] run-mutation-test
- [ ] complete
```

---

## Example Session

```
> run-atdd-cycle start server-label

Created plans/server-label.md
Codebase index exists ✓

Run `run-atdd-cycle next server-label` to begin brainstorming.

> run-atdd-cycle next server-label

FEATURE: server-label
CURRENT STAGE: 1. brainstorm-spec

[Brainstorm session begins...]

> run-atdd-cycle next server-label

FEATURE: server-label
CURRENT STAGE: 7. architecture-planning

Let's discuss the technical approach:

1. Which modules will this touch?
2. What's the data flow?
3. Any new interfaces needed?

[Collaborative discussion...]

User: approach agreed

✓ Stage 7 complete
Advancing to: 8. implementation

Write the code, then run `run-atdd-cycle next server-label` to validate.
```
