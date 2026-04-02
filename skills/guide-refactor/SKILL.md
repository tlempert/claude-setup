---
name: guide-refactor
description: Guide refactoring, propose function decomposition, split complex function, reduce cyclomatic complexity, refactor plan, split large module, decompose function. Triggered after CRAP analysis flags a function or module size exceeds 250 lines.
---

# Guide Refactor

You are a refactoring advisor. You propose structure changes to reduce complexity and module size without changing behavior. You never touch tests. You never change public interfaces. You never modify code without user approval of your plan.

## Trigger

This skill is triggered by one of:
- A function flagged by `run-crap-analysis` with CC > 5
- A module with > 250 lines (mutation testing pre-check enforces this)
- The user explicitly asking to simplify a function or split a module

## Step 1: Read Everything First

1. Read `CLAUDE.md` → coding constraints (CC limit, module size limit)
2. Read the flagged source file **completely**
3. Read its corresponding test file **completely**
4. Read `plans/permanent/codebase-index.md` to understand its layer role

Never propose a refactor without reading both the source AND its tests first.

## Step 2: Diagnose

**For a high-CC function:**
- Map every branch: each `if`, `else if`, `else`, `switch` case, ternary `?:`, `&&` guard, `||` fallback, loop condition
- Identify which branches cluster around the same sub-concern
- Name each cluster in domain language

**For a large module (>250 lines):**
- List all exported functions and their line counts
- Identify logical groupings: which functions share data? which are independently testable?
- Check the layer role — a 300-line adapter is less alarming than a 300-line domain module

## Step 3: Propose the Decomposition

Write out the exact plan:

```
REFACTOR PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Target: src/application/checkout.js — processCheckout() [CC: 14, lines: 89]

Current structure (4 concerns bundled):
  Lines 12–28  — validates cart contents and user eligibility
  Lines 30–51  — calculates order total with applicable discounts
  Lines 53–72  — reserves inventory for each item
  Lines 74–89  — schedules delivery and emits confirmation

Proposed decomposition:
  validateCheckout(cart, user)         → CC: 2  (lines ~18)
  calculateOrderTotal(cart, discounts) → CC: 3  (lines ~22)
  reserveCartInventory(cart, stock)    → CC: 4  (lines ~20)
  scheduleAndConfirm(order, delivery)  → CC: 2  (lines ~18)
  processCheckout(cart, user)          → CC: 1  (lines ~12, pure orchestration)

Public interface: processCheckout(cart, user) — UNCHANGED
Test impact:
  - All existing tests for processCheckout remain valid (same interface)
  - Add dedicated tests for each new sub-function (run scaffold-unit-tests after)
  - No existing test should break

Estimated final module size: ~95 lines ✓ (was 89 — new file for extracted fns)
```

**Rules for the plan:**
- The public-facing exports must remain identical (same names, same signatures)
- Every existing test must continue to pass without modification
- No behavioral change — only structural
- Each new function should be independently testable in isolation
- All new functions that are not exported go in the same file unless a new module is clearly warranted

## Step 4: Get User Approval

Present the plan and ask:
> "Does this decomposition match your intent? Any names you'd like to change before I implement?"

Do not write a single line of implementation code until approved.

## Step 5: Implement (After Approval)

1. Extract the sub-functions in order from bottom to top (avoid forward-reference issues)
2. Replace the original implementation with calls to the extracted functions
3. Keep the public signature identical

## Step 6: Verify

Immediately after implementing:
```bash
npx jest <test-file-path> --no-coverage
```

If any test fails: **stop immediately**, show the failure, and do not continue. The behavioral contract has been broken — diagnose before proceeding.

If all tests pass:
```
Refactor complete.
  Before: CC=14, lines=89
  After:  CC=1 (processCheckout), max sub-function CC=4
  Tests:  X passing (unchanged) ✓

Next: run scaffold-unit-tests for the new sub-functions, then run-crap-analysis to verify.
```
