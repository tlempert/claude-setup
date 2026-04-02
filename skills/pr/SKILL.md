---
description: "Create a PR with structured description from current branch"
allowed-tools: ["Bash", "Glob", "Grep", "Read"]
---

# PR — Create Pull Request with Structured Description

Create a GitHub pull request from the current branch with a structured description.

## Steps

1. Run `git branch --show-current` to get the branch name
2. Determine the base branch — default to `main`, check if `master` exists if `main` doesn't
3. Run `git log <base>..HEAD --oneline` to see all commits on this branch
4. Run `git diff <base>...HEAD` to see the full diff
5. Extract ticket IDs from branch name (patterns like `BAC-XXXXX`, `PROJ-123`)
6. Check if remote branch exists: `git ls-remote --heads origin <branch>`
7. If not pushed, push with: `git push -u origin <branch>`
8. Create the PR via `gh pr create`

## PR Title

- Under 70 characters
- Format: `<type>: <short summary> (<ticket IDs>)`
- Type is one of: `fix`, `feat`, `refactor`, `test`, `chore`, `docs`

## PR Body Format

```markdown
## Problem

<What was broken or missing — one or two sentences, user-facing language.
No jargon. Buffett: write for the person who joins next quarter.>

## Why it happened

<The technical explanation. Use a flow diagram if the bug involves
a pipeline or chain of calls:>

```
step A → step B (fails here) → step C
```

## Fix

- <Each bullet is one logical change>
- <Say what and why, not how — the diff shows how>

## Test plan

- <What specifically was proven, not just "tests pass">
- <Manual verification steps>

## Out of scope

- <Only if there's genuine tech debt. Name the principle violated
  (SRP, DRY, etc). Omit entirely if nothing.>
```

## Writing Style

Write like the great explainers — subtract to clarify, never add to impress:

- **Feynman:** Start concrete, then generalize. If you can't explain it simply, you don't understand it.
- **Shannon:** Strip to essential bits. Every word is signal or noise — cut the noise.
- **Orwell:** Never use a long word where a short one will do. Cut any word you can cut.
- **Tufte:** Maximize data-ink ratio. Every line must earn its place.
- **Dijkstra:** Precise, elegant reasoning. Every word carries weight.
- **McIlroy:** Do one thing well. If a section explains two things, split them.
- **Buffett/Munger:** Write for the person who joins next quarter.
- **Bezos:** Start with the customer (the reader). Every paragraph stands alone.
- **Uncle Bob/DHH:** Name the principle. "SRP violation" teaches; "needs refactoring" doesn't.
- **Paul Graham:** Write like you're thinking out loud. No decoration.

## Rules

- The PR description should mirror the commit body — commit is the source of truth
- Don't repeat what the diff already shows — explain the *why*
- Flow diagrams over prose for multi-step bugs
- Test plan should describe what was *proven*, not just "tests pass"
- Ask the user to confirm before running `gh pr create`
