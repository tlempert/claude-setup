---
name: index-codebase
description: Index the codebase, scan project structure, map source files, discover layers, initialize project index, set up plans/permanent directory. Run this first on any project before using any other skill in this suite.
---

# Index Codebase

You are performing a codebase indexing operation. Your output becomes the single source of truth that every other skill in this suite reads before acting. Do this thoroughly — a bad index produces bad downstream decisions.

## Phase 1: Detect Project State

Check if `src/` (or equivalent) exists and contains files.

**New/empty project:** Scaffold the standard structure first, then index it:
```
src/
  domain/       # pure business logic, zero framework dependencies
  application/  # use cases, orchestration
  adapters/     # HTTP, DB, external APIs, third-party integrations
  ui/           # Next.js pages, React components
```

**Existing project:** Proceed to Phase 2 without creating anything.

## Phase 2: Discover Source Root

Check for common source roots in this order: `src/`, `lib/`, `app/`, `packages/`. If a monorepo (`packages/` or `apps/`), index each workspace separately and note them in the index.

Run:
```bash
find src -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.mjs" \) | sort
```

## Phase 3: Infer Layer Roles

For each top-level folder under `src/`, read 2–3 files and classify its role:

| Role | Signs |
|------|-------|
| `domain` | Pure functions, business entities, no imports from `node_modules` frameworks or other src layers |
| `application` | Orchestrates domain objects, may import domain, no direct HTTP/DB |
| `adapters` | HTTP handlers, DB clients, API wrappers, imports from application |
| `ui` | React/Next.js components, pages, hooks |
| `shared` | Utilities, constants, types used across layers |
| `unknown` | Cannot determine — flag for user |

Mark `confirmed: false` for all inferred roles. The user must verify.

## Phase 4: Detect Test Setup

Check for:
- Test directories: `spec/`, `__tests__/`, `test/`
- Test file patterns: `*.spec.js`, `*.test.js`, `*.spec.ts`, `*.test.ts`
- Jest config: `jest.config.js`, `jest.config.mjs`, or `jest` key in `package.json`
- Coverage config: `collectCoverage`, `coverageDirectory`, `coverageReporters`

If no `spec/` directory exists and the project uses `__tests__/`, note this for `scaffold-unit-tests` to use.

## Phase 5: Detect Tooling

Read `package.json` devDependencies. Flag each as `installed` or `missing`:
- `@stryker-mutator/core` — mutation testing
- `dependency-cruiser` — architecture enforcement
- `eslint` — complexity analysis
- `jest` or `vitest` — unit tests

## Phase 6: Measure Module Sizes

For every source file, record line count. Flag any file over 250 lines — these are mutation testing risks.

```bash
find src -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) \
  -exec wc -l {} + | sort -rn | head -20
```

## Phase 7: Write the Index

Create `plans/permanent/` if it doesn't exist. Write `plans/permanent/codebase-index.md`:

```markdown
# Codebase Index
generated: <ISO date>
src_root: src/

## Layers
| folder | inferred_role | confirmed | notes |
|--------|--------------|-----------|-------|
| src/domain/ | domain | false | |
| src/application/ | application | false | |

## Test Setup
test_root: spec/
test_pattern: *.spec.js
jest_config: jest.config.js
coverage_dir: coverage/

## Tooling
| tool | status |
|------|--------|
| jest | installed |
| @stryker-mutator/core | missing |
| dependency-cruiser | missing |
| eslint | installed |

## Key Files
| file | lines | responsibility |
|------|-------|----------------|
| src/domain/user.js | 84 | User entity and validation rules |

## Oversize Modules (>250 lines) — Mutation Risk
| file | lines |
|------|-------|

## Import Graph Summary
- ui → adapters ✓
- adapters → application ✓
- application → domain ✓
- domain → [nothing] ✓
```

## Phase 8: Report to User

Tell the user:
- How many files were indexed
- Which layers were found and their `confirmed: false` status
- Any files over 250 lines
- Which tools are missing (offer exact install commands)
- **Ask them to review the `confirmed: false` rows** — wrong layer inference breaks all downstream skills

Do not proceed until layer roles are confirmed.
