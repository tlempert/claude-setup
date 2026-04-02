---
name: enforce-dependencies
description: Enforce dependency rules, check layer boundaries, detect forbidden imports, audit architecture violations, run dependency cruiser, check import rules, architecture boundary check.
---

# Enforce Dependencies

Checks that no module imports from a layer it is not permitted to access, according to the rules in `CLAUDE.md`. This is the "Walls" pillar — it prevents AI from tangling layers for a quick fix.

## Step 1: Read the Rules

1. Read `CLAUDE.md` → Layer Import Rules section
2. Read `plans/permanent/codebase-index.md` → Layers table
3. Note any Forbidden Imports already recorded

## Step 2: Choose Execution Mode

**If `dependency-cruiser` is installed:**
```bash
bash .claude/skills/enforce-dependencies/scripts/check-deps.sh
```

**If NOT installed:**
Run a manual import scan using bash:
```bash
grep -rn "require\|import " src/domain/ | grep -v "node_modules" | grep "from"
```
Then review each import to check if it crosses a layer boundary.

Offer to install dependency-cruiser:
```bash
npm install --save-dev dependency-cruiser
npx depcruise --init
```

## Step 3: Report Violations

For each violation found:

```
VIOLATION: src/domain/orderValidator.js
  imports from: src/adapters/database.js
  rule broken:  domain → imports nothing from within this project
  severity:     CRITICAL — domain layer must be framework-free
  fix:          Extract the data access into src/adapters/, inject it via
                src/application/ using dependency inversion. The domain
                function should accept the data as a parameter, not fetch it.
```

## Step 4: Suggest Fixes — Never Auto-Fix

For each violation, describe the correct architectural remedy. Do not make the fix automatically — architecture changes affect test coverage and behavior. The developer must understand the change.

Common remedies:
- **Domain imports adapter**: Extract data access to adapter, inject as parameter (dependency inversion)
- **Domain imports application**: The logic belongs in application, not domain
- **UI imports domain directly**: Route through application layer
- **Circular import**: Identify which direction is correct, the other direction needs extraction

## Step 5: Update Forbidden Imports

After violations are fixed, add the specific import path to the Forbidden Imports section of `CLAUDE.md` so it can never silently recur:
```
src/domain/orderValidator.js must not import from src/adapters/
```

## Pre-commit Hook

Recommend adding this as a pre-commit hook to block violations before they're committed:

```bash
#!/bin/bash
# .git/hooks/pre-commit
bash .claude/skills/enforce-dependencies/scripts/check-deps.sh || exit 1
```

Or via lint-staged in `package.json`:
```json
{
  "lint-staged": {
    "src/**/*.{js,ts}": ["bash .claude/skills/enforce-dependencies/scripts/check-deps.sh"]
  }
}
```
