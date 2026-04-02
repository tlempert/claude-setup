---
name: load-context
description: Load minimal context for a task, assemble relevant files, token-efficient file selection, context loading before implementation. Run before any implementation, bug fix, or refactor task.
---

# Load Context

Assembles the minimum set of files needed for the current task without loading the entire codebase. Every token saved here is a token available for actual reasoning.

## Step 1: Verify Index Exists

Read `plans/permanent/codebase-index.md`. If missing, stop immediately:
> "The codebase index is missing. Run `index-codebase` first — it takes about 30 seconds and makes every subsequent task cheaper and more accurate."

## Step 2: Read Glossary

Read `plans/permanent/glossary.md` if it exists. Note any domain terms that appear in the user's task description — these are your search anchors.

## Step 3: Classify the Task

Determine what type of work this is:

| Task type | Layers likely touched | Files needed |
|-----------|----------------------|--------------|
| Bug fix | The layer where the bug lives + its test | 2–4 files |
| New feature | application + domain | 3–6 files |
| API endpoint | adapters + application | 3–5 files |
| UI component | ui + adapters | 2–4 files |
| Refactor | The flagged module only | 1–3 files |
| Spec writing | No source files needed | Glossary only |

## Step 4: Select Files

From the codebase index, select ONLY:
1. The source file(s) directly involved in the task
2. Their corresponding test files (`spec/` mirror or `__tests__/`)
3. Any interfaces/types they import from within the project
4. The relevant `acceptanceTests/*.txt` file if one covers this domain

**Hard limit: 8 files maximum** unless the task is explicitly a cross-module refactor.

**Never load:**
- `node_modules`
- Generated files (`generated-acceptance-specs/`, `coverage/`)
- Config files unless the task is about config
- Unrelated modules "just in case"

## Step 5: Report Selection

Before reading the files, tell the user:

```
CONTEXT PLAN for: <task description>

Loading:
  ✓ src/domain/user.js         (84 lines) — core module for this task
  ✓ spec/domain/user.spec.js   (62 lines) — existing tests
  ✓ acceptanceTests/user.txt   (48 lines) — acceptance spec

Excluding:
  ✗ src/adapters/userRouter.js — not directly involved in this domain logic
  ✗ src/ui/UserForm.jsx        — UI layer not needed for domain fix

Estimated context: ~600 tokens

Gaps found:
  ⚠ No test exists for src/domain/orderValidator.js — consider running scaffold-unit-tests
```

Then read the selected files.
