---
name: update-claude-md
description: Update CLAUDE.md, add architecture rules, record layer constraints, update coding guidelines, add project rules, maintain architecture document, record design decisions, project constitution.
---

# Update CLAUDE.md

`CLAUDE.md` is the project constitution — the living document every Claude session reads before touching any code. It contains layer rules, coding constraints, workflow sequences, and mutation playbooks. This skill maintains it.

## Step 1: Read Current State

1. Read `CLAUDE.md` if it exists
2. Read `plans/permanent/codebase-index.md` for current layer information

If `CLAUDE.md` doesn't exist, create it from the template in Step 3.

## Step 2: Determine Operation

The user wants to add or update one of:

| Operation | Triggered by |
|-----------|-------------|
| **A. Layer Rules** | New layer discovered, layer renamed, new boundary identified |
| **B. Coding Constraints** | CC limit change, module size limit, naming rules |
| **C. Mutation Playbook** | Per-module mutation testing workflow defined |
| **D. Dev Commands** | New npm scripts, pipeline commands, tool invocations |
| **E. Permissions** | What Claude is allowed to run without asking |
| **F. Architecture Decision** | A specific rule derived from a design choice |
| **G. Forbidden Imports** | A specific violation that must never recur |

## Step 3: CLAUDE.md Template

Maintain this exact structure. Sections must stay in this order:

```markdown
# CLAUDE.md
project: <name>
last_updated: <ISO date>

## Permissions
<!-- What Claude may execute without asking first -->
allow: git, npm, npx, node, and standard unix tools

## Architecture

### Source Structure
<!-- Populated from codebase-index.md — keep in sync -->
| folder | role | notes |
|--------|------|-------|
| src/domain/ | domain | pure business logic, zero framework imports |
| src/application/ | application | use cases, imports from domain only |
| src/adapters/ | adapters | HTTP, DB, external APIs |
| src/ui/ | ui | Next.js pages and components |

### Layer Import Rules
<!-- Strict — violations must be fixed, not worked around -->
- domain     → imports nothing from within this project
- application → domain only
- adapters    → application, domain
- ui          → adapters, application (never domain directly)

### Forbidden Imports
<!-- Specific violations that were caught and must not recur -->
<!-- Format: src/layer/file.js must not import from src/other-layer/ -->

## Coding Constraints
- Max cyclomatic complexity per function: 5
- Max module size before splitting: 250 lines
- Test names must describe behavior, not method names
- Unused arguments must be removed or prefixed with _
- No console.log in source files (use a logger adapter)

## Development Commands
- Run tests:              npx jest
- Run with coverage:      npx jest --coverage
- Parse acceptance tests: node .claude/skills/run-acceptance-pipeline/scripts/parse-gwt.js <file>
- Generate Jest specs:    node .claude/skills/run-acceptance-pipeline/scripts/generate-jest.js <file>
- Run acceptance suite:   npx jest generated-acceptance-specs/
- Run mutation tests:     npx stryker run
- Check dependencies:     npx depcruise src
- CRAP analysis:          npx jest --coverage --json --silent && node .claude/skills/run-crap-analysis/scripts/crap-report.js

## Mutation Workflow
1. Check module size — if over 250 lines, split first; do not run mutation tests until after the split
2. Run mutation tests for the module: bash .claude/skills/run-mutation-test/scripts/mutate-module.sh <path>
3. Check plans/permanent/equivalent-mutations.md before flagging survivors
4. Add tests to cover uncovered functions
5. Kill surviving mutants by writing new assertions — not by weakening the mutant

## Plans
- Active plans:    plans/
- Completed plans: plans/complete/
- Permanent docs:  plans/permanent/
  - codebase-index.md       ← layer map, tool inventory, module sizes
  - glossary.md             ← ubiquitous language
  - equivalent-mutations.md ← known-equivalent mutants (do not write tests for these)

## Local Rules
<!-- Per-module overrides — add when a specific module has special constraints -->
<!-- Format: module path → rule description -->
```

## Step 4: Apply the Update

When adding a new rule:
- Add it to the correct section
- Be specific — "no imports from adapters in domain" not "keep layers clean"
- Include the rationale as a comment if it's non-obvious

When updating an existing rule:
- Only strengthen, never weaken without explicit user instruction
- Preserve the existing wording unless the user explicitly asks to change it

## Step 5: Confirm

Show the user the diff of what changed and ask them to confirm before saving.

**Critical rule:** You may only add or strengthen constraints. Never silently remove or soften a constraint.
