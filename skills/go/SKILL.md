---
description: "Ship a change: verify end-to-end, simplify, then open a PR. Use when the user says /go or asks to finish/ship/wrap up a change."
argument-hint: "[optional context about the change]"
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Edit", "Write"]
---

# /go — Verify, Simplify, Ship

One trigger that turns verification into the default. Inspired by Boris (Claude Code team): give Claude a way to verify its work — it's a 2–3× multiplier, and more important than ever with recent model upgrades.

This skill composes existing skills. It does not reimplement them.

Argument (if provided): `$ARGUMENTS` — short context about the change. Pass it through to `/describe` and `/pr`.

## When to Use

Invoke when the user asks to **finish**, **ship**, **wrap up**, or literally says `/go`. Also appropriate after a long autonomous session where the user needs to trust the work asynchronously.

**Do not** invoke mid-implementation. `/go` is a finishing move.

## Hard Rules

- **No PR without passing verification.** If verify fails, stop. Report. Do not run `/simplify`. Do not push.
- **Never commit or open a PR without explicit user approval.** Verification and simplification run autonomously; the commit and PR steps require a clear "yes" from the user. Present the proposed commit message and PR body, then wait.
- **Show actual output.** "Tests pass" is not enough — quote the summary line.
- **If verification is impossible** (no test suite, no runnable service), say so explicitly and ask the user whether to proceed. Don't pretend.
- **Compose, don't duplicate.** Call `/simplify`, `/describe`, `/pr`, `superpowers:verification-before-completion`, and ATDD skills — don't reimplement them.
- **Re-verify after simplify.** Simplification can break things. Run the verify step again before opening the PR.

## Process

### 1. Pre-flight

```bash
git status --porcelain
git branch --show-current
git log --oneline -5
```

- If there are no changes (no commits ahead of base, no uncommitted files), stop: nothing to ship.
- If on `main`/`master`, stop: create a branch first.

### 2. Detect project shape

Look for fingerprints (one Glob each; stop at the first hit per category):

| Category | Fingerprints |
|----------|--------------|
| Node/JS | `package.json` |
| Python | `pyproject.toml`, `requirements.txt`, `setup.py` |
| Rust | `Cargo.toml` |
| Go | `go.mod` |
| Ruby | `Gemfile` |
| ATDD | `**/*.gwt`, `acceptance/**/*.txt`, `features/**/*.feature` |
| Web frontend | `next.config.*`, `vite.config.*`, `nuxt.config.*`, `svelte.config.*` |
| Backend service | `Procfile`, `Dockerfile`, `**/server.{js,ts,py}`, express/fastify/django/flask in deps |
| Desktop | `electron.*`, `tauri.conf.*`, `src-tauri/` |

### 3. Verify (the whole point)

Run **every** applicable check. Stop at the first failure — don't paper over.

**Always:**
- Lint (if configured): `npm run lint` / `ruff` / `cargo clippy` / `go vet`
- Unit tests: project's standard test command
- Build (if it has one): `npm run build` / `cargo build` / `go build`

**If ATDD artifacts exist** — invoke in order:
1. `/run-acceptance-pipeline`
2. `/run-crap-analysis`
3. `/enforce-dependencies`
4. `/enforce-test-naming`

**If backend service:**
- Locate the start command (`package.json` scripts, `Procfile`, `Makefile`).
- Start it in the background (`run_in_background: true`).
- Hit a health endpoint if one exists; otherwise tail the log until it reports "listening" / "ready".
- Exercise the changed path if feasible (curl / httpie / the repo's own CLI).
- Stop the background process when done.

**If web frontend:**
- Run any e2e tests (`playwright`, `cypress`) if present.
- Otherwise: tell the user to verify via the Claude Chromium extension. Offer the specific URL(s) to check. Do not open the PR until they confirm or explicitly defer.

**If desktop:**
- Run any smoke tests.
- Otherwise: ask the user to verify via computer use or local launch. Don't proceed without confirmation.

**If nothing is runnable:**
- Say so explicitly: "No verification available for this repo. Proceed anyway? (y/n)"
- Require explicit user approval to continue.

**Use `superpowers:verification-before-completion`** as the reporting template:

```
## Verification Results
- Tests: [X passing, Y failing, Z skipped]
- Lint: [clean / N issues]
- Build: [success / failure]
- E2E / service: [what was proven]
- Issues found: [list or "none"]
- Verdict: [ready / not ready — and why]
```

### 4. Gate

If **any** check failed: STOP. Report the failure. Ask the user how to proceed. Do not continue to simplify or PR.

### 5. Simplify

Invoke `/simplify` on the changed files. Accept its edits (user can override).

Then **re-run step 3's verification** — at minimum tests + lint + build. Simplification can regress behavior; you must prove it didn't.

### 6. Commit if needed — **requires explicit approval**

If there are uncommitted changes after simplify:
- Invoke `/describe` to draft the commit body.
- Show the drafted commit message to the user.
- Show which files will be staged.
- **Wait for explicit approval** (e.g., "yes", "ship it", "go ahead"). Silence is not approval.
- On approval: stage the specific files (never `git add .`) and commit.
- If the user asks for edits, apply them and re-confirm before committing.

### 7. Open the PR — **requires explicit approval**

- Invoke `/pr` to draft the title and body (pass through `$ARGUMENTS` as context if provided).
- Show the drafted title and body to the user.
- Show the base branch and target repo.
- **Wait for explicit approval** before running `gh pr create`. Silence is not approval.
- On approval: push (if needed) and create the PR.
- Return the PR URL to the user.

## Failure Modes to Avoid

- **"Tests probably pass"** — run them.
- **Running `/simplify` before verifying** — you might simplify broken code into differently-broken code.
- **Skipping re-verify after simplify** — the whole reason to re-run is that simplify changes things.
- **Opening a PR while a background server is still running** — clean up.
- **Ignoring lint/type errors because "tests pass"** — lint failures block the PR too.
- **Claiming "verified" when you only ran unit tests on a service that needs an end-to-end check** — if the change touches a request path, exercise that path.

## One-liner for the user

> `/go` = verify → simplify → re-verify → **ask before commit** → **ask before PR**. Stops at the first red light, and never ships without your sign-off.
