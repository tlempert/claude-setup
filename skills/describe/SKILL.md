---
description: "Generate a structured commit message body from current changes"
allowed-tools: ["Bash", "Glob", "Grep", "Read"]
---

# Describe — Structured Commit Message

Generate a commit message body for the current changes. The commit message is the source of truth — portable across any git hosting platform.

## Steps

1. Run `git diff --cached` to see staged changes. If nothing staged, run `git diff HEAD` for all uncommitted changes. If nothing uncommitted, run `git diff main...HEAD` for the full branch.
2. Read enough context in changed files to understand the *why*, not just the *what*
3. Look for ticket IDs in the branch name (`git branch --show-current`) — extract patterns like `BAC-XXXXX`, `PROJ-123`, etc.

## Output Format

Output the raw commit message text — the user will paste it into their editor via `git commit`.

```
<type>: <short summary> (<ticket IDs>)

<What was broken or missing — one or two sentences, user-facing language.
No jargon. If the reader removes this paragraph, would the rest still
make sense? Then this paragraph is doing its job as context.>

Why it happened:
<The technical explanation. Use a flow diagram if the bug involves
a pipeline or chain of calls:>

```
step A → step B (fails here) → step C
```

Fix:
- <Each bullet is one logical change>
- <Say what and why, not how — the diff shows how>

Out of scope:
- <Only if there's genuine tech debt. Name the principle violated
  (SRP, DRY, etc). Omit this section entirely if nothing.>
```

## Writing Style

Write like the great explainers — subtract to clarify, never add to impress:

- **Feynman:** If you can't explain it simply, you don't understand it. Start concrete, then generalize.
- **Shannon:** Strip to essential bits. Every word is signal or noise — cut the noise.
- **Orwell:** Never use a long word where a short one will do. Cut any word you can cut.
- **Tufte:** Maximize data-ink ratio. Every line must earn its place.
- **Dijkstra:** Precise, elegant reasoning. Every word carries weight.
- **McIlroy:** Do one thing well. If the message tries to explain two things, split them.
- **Buffett/Munger:** Write for the person who joins next quarter. No insider jargon.
- **Bezos:** Start with the customer (the reader). Every paragraph stands alone.
- **Uncle Bob/DHH:** Name the principle. "SRP violation" teaches; "needs refactoring" doesn't.
- **Paul Graham:** Write like you're thinking out loud. No decoration.

Applied:

- **Every sentence must earn its place.** If removing it loses nothing, remove it.
- **Don't repeat what the diff already shows.** The commit message explains *why*, the diff shows *how*.
- **No redundant explanations.** If the fix bullet already implies the root cause, don't restate it.
- **Use "Why it happened" not "Root cause."** Ask why, don't use jargon headers.
- **One paragraph per idea.** If a section needs subsections, it's too long.
- **Flow diagrams over prose** for multi-step bugs — worth a thousand words.

## Rules

- **Type** is one of: `fix`, `feat`, `refactor`, `test`, `chore`, `docs`
- **First line** under 72 characters
- **Flow diagrams** for multi-step bugs — worth a thousand words of prose
- **Out of scope** only if there's genuine tech debt noted (TODOs, known smells). Omit entirely if nothing.
- Don't pad the message — if the change is simple, the message should be short
