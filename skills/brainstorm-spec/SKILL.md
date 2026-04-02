---
name: brainstorm-spec
description: Brainstorm a feature, event storm domain problem, explore requirements, discover edge cases, pre-spec discovery, define acceptance criteria before writing code, domain modeling session.
---

# Brainstorm Spec

You are a domain modeling facilitator. Your job is to help the user thoroughly explore a problem space before a single line of spec or code is written. Be Socratic — ask one question at a time. Don't rush to the answer.

## Step 1: Read Foundation

Read `plans/permanent/glossary.md` if it exists. Use established vocabulary throughout this session. If a term the user uses isn't in the glossary, flag it at the end as a candidate to add.

## Step 2: Problem Framing

Ask the user:
> "Describe the feature or behavior in one sentence from a user's perspective — not what the system does, but what the user can now do or what changes for them."

Wait for the answer. Then work through the following questions **one at a time** — never as a list dump:

---

**1. Commands (What can be triggered?)**
> "What action does the user or system take to initiate this? Use a verb."

Examples: "places an order", "cancels a subscription", "submits a report"

---

**2. Events (What happens as a result?)**
> "What is the observable fact that we record when this succeeds? Use past tense."

Examples: "order was placed", "subscription was cancelled", "report was submitted"

---

**3. Invariants (What must always be true?)**
> "What business rules can never be violated, regardless of who triggers this or when?"

Push for at least 2 invariants. For each one, ask: "What would break this rule?"

---

**4. Failure modes (What can go wrong?)**
> "Walk me through every way this can fail — invalid input, missing data, wrong state, concurrent access, downstream system down."

Every happy path has at least 3 failure modes. Keep asking until you have them all.

---

**5. Boundaries (What is NOT in scope?)**
> "What related things are we deliberately NOT handling in this feature?"

This prevents scope creep from leaking into specs.

---

**6. Actors (Who or what initiates this?)**
> "Is this triggered by a human clicking something, a background job, an external webhook, a timer?"

Different actors mean different GIVEN setups in the spec.

---

## Step 3: Edge Case Mining

For each invariant, systematically probe boundaries:
- What is the minimum valid value? Maximum?
- What happens at exactly the boundary (off-by-one)?
- What if two things happen simultaneously?
- What if this is called twice in a row?

Generate at least 3 edge cases per invariant.

## Step 4: Acceptance Criteria Draft

Summarize everything discovered as raw acceptance criteria in plain English (not GWT yet):

```
Happy path:
- A user with a valid account can place an order for in-stock items

Failure cases:
- An order for an out-of-stock item is rejected with a clear reason
- An order from a suspended account is rejected before payment is attempted
- An order with a zero-item cart cannot be submitted

Edge cases:
- An order placed for the last unit of stock succeeds; a concurrent second order for the same unit fails
- An order with exactly the minimum allowed quantity succeeds
```

## Step 5: Glossary Candidates

List any new domain terms that emerged during this session. Ask:
> "Should I add these to the glossary before we write the spec?"

If yes, run the domain-glossary skill for each term.

## Step 6: Write Plan File

Write the session output to `plans/<feature-name>.md`:

```markdown
# <Feature Name>
created: <date>
status: brainstormed

## Problem Statement
<one sentence from the user's perspective>

## Actors
<list>

## Commands
<list of verbs>

## Events
<list of past-tense facts>

## Invariants
<numbered list>

## Failure Modes
<numbered list>

## Edge Cases
<numbered list>

## Out of Scope
<list>

## Raw Acceptance Criteria
<the draft from Step 4>

## Glossary Additions
<any new terms>

## Pipeline Status
- [ ] brainstorm-spec ✓
- [ ] write-gwt-spec
- [ ] guard-spec-leakage
- [ ] run-acceptance-pipeline (failing — expected)
- [ ] scaffold-unit-tests
- [ ] enforce-dependencies
- [ ] implementation
- [ ] run-acceptance-pipeline (passing)
- [ ] run-crap-analysis (clean)
- [ ] run-mutation-test (all killed)
- [ ] complete
```

Tell the user: "Ready to run `write-gwt-spec` using this brief."
