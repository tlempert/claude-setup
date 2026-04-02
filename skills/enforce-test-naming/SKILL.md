---
name: enforce-test-naming
description: Enforce test naming, audit test names, check test descriptions, validate behavior-driven test names, flag method-centric test names, test name linter.
---

# Enforce Test Naming

Audits Jest test files to ensure every test name describes observable behavior, not implementation. Tests are documentation — their names must be readable by a domain expert, not just a developer.

## Process

Run the checker against the test directory from the codebase index (default: `spec/` or `__tests__/`):

```bash
node .claude/skills/enforce-test-naming/scripts/check-test-names.js [path]
```

If a specific file or directory is requested, pass it as the argument.

## What the Script Checks

A test name is a violation if it:

| Pattern | Example violation | Why it's wrong |
|---------|------------------|----------------|
| Names a method | `should call validateEmail` | Names internal method, not behavior |
| Names a method invocation | `should invoke processOrder` | Same — implementation detail |
| Names a constructor | `should instantiate UserService` | Tests behavior, not construction |
| Returns a primitive | `should return true` | `true` is not a behavior |
| Returns `null`/`undefined` | `should return null when not found` | Use domain language instead |
| Uses `test_` prefix | `test_calculateDiscount` | Method-centric naming |
| Uses snake_case | `create_order_when_valid` | Implementation style name |
| Contains `()` syntax | `when processPayment() succeeds` | Function call in test name |

## Report Format

```
NAMING VIOLATIONS: spec/domain/order.spec.js
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Found: 2 violations

  Line 8  — it('should call validateCart')
    ✗ Names an internal method — implementation detail
    ✓ Rename to describe what a user observes:
      e.g., 'should reject an order when the cart contains no items'

  Line 24 — it('should return false when stock is zero')
    ✗ 'return false' is a return value, not a domain behavior
    ✓ Rename to describe the domain outcome:
      e.g., 'should mark an item as unavailable when stock reaches zero'
```

If clean:
```
✓ spec/domain/order.spec.js — all test names describe behavior correctly.
```

## After the Report

For each violation, suggest a domain-language replacement using terms from `plans/permanent/glossary.md`. Ask the user to approve each rename before applying it — test names are documentation and should be deliberate.
