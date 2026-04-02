---
name: write-gwt-spec
description: Write GWT spec, write acceptance tests, create Given When Then test file, write txt acceptance test, BDD spec, acceptance test authoring. Converts a problem brief into plain-text GWT format following Uncle Bob's style.
---

# Write GWT Spec

You are writing plain-text acceptance tests in Uncle Bob's GWT format. These are **the ceiling** — they define observable behavior before any implementation exists. They are the contract between the domain and everyone building on top of it.

## Step 1: Read Foundation

1. Read `plans/permanent/glossary.md` — use ONLY these terms in the specs
2. Read the feature's plan at `plans/<feature-name>.md` — this is your source material
3. If any existing `acceptanceTests/*.txt` file exists, read one to calibrate the style

## Step 2: The Rules

**Format rules:**
- `GIVEN`, `WHEN`, `THEN`, `AND` always ALL CAPS, always on their own line
- One behavior per test — never bundle two outcomes into one `THEN`
- Multiple `AND` lines can extend any directive
- Separate tests with a blank line
- Use `;` for section comment headers

**Content rules — DO:**
- Describe what a user or external observer can see, hear, or receive
- Use terms from the glossary exclusively
- Write failure cases and edge cases as separate, explicit tests
- Make the `GIVEN` state fully self-contained (reader shouldn't need context from previous test)

**Content rules — DO NOT:**
- Name classes, functions, methods, or variables
- Use HTTP verbs (GET, POST, PUT, DELETE, PATCH)
- Use database operations (INSERT, SELECT, UPDATE)
- Use status codes (200, 404, 422)
- Name frameworks (React, Express, Next.js, Prisma)
- Write more than one `WHEN` per test
- Use `{`, `}`, `[`, `]` in `THEN` lines for data structures
- Reference internal config keys or constant names

## Step 3: Structure

```
; ===============================================================
; <Group: describe the behavior category>
; ===============================================================
GIVEN <initial domain state in plain language>
AND <additional state if needed>

WHEN <the user/system action in domain language>

THEN <the observable outcome in domain language>
AND <additional observable outcome if needed>
```

## Step 4: Writing Order

Write tests in this sequence:
1. The single happy path (nominal case)
2. Each failure mode from the plan brief
3. Each edge case from the plan brief
4. Any state transition scenarios

## Step 5: Self-Audit Before Submitting

Before writing the file, mentally scan every `THEN` line:
- Does it describe what an observer sees, or what code does?
- Could a non-developer read this and understand the expected outcome?
- Does it use only glossary terms?

Fix any violations before writing the file.

## Step 6: Write the File

Output to `acceptanceTests/<domain-name>.txt`. Example:

```
; ===============================================================
; Placing a valid order
; ===============================================================
GIVEN a registered user with an active account
AND a shopping cart containing two in-stock items

WHEN the user places the order

THEN the order is confirmed
AND the user receives an order reference number

; ===============================================================
; Rejecting an order from a suspended account
; ===============================================================
GIVEN a user whose account has been suspended

WHEN the user attempts to place an order

THEN the order is rejected
AND the user is informed their account is not eligible to place orders

; ===============================================================
; Rejecting an order for an out-of-stock item
; ===============================================================
GIVEN a registered user with an active account
AND a shopping cart containing an item with no remaining stock

WHEN the user places the order

THEN the order is rejected
AND the user is informed which item is unavailable
```

## Step 7: Report

Tell the user:
- How many tests were written
- Which scenarios are covered
- Which items from the plan brief are NOT yet specced (and why — out of scope, needs more brainstorming, etc.)
- The file path

Then update `plans/<feature-name>.md`: check off `write-gwt-spec` in the Pipeline Status block and check off `guard-spec-leakage` as the next step to run.
