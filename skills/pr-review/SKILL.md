---
description: "Review a GitHub PR by ID using the DHH & Uncle Bob review standard"
argument-hint: "<pr-number> [--repo owner/repo]"
allowed-tools: ["Bash", "Glob", "Grep", "Read"]
---

# PR Review — DHH & Uncle Bob

Review a GitHub pull request by ID as if you are DHH and Uncle Bob reviewing together.

## Steps

1. Parse the PR number from the skill arguments. If `--repo` is given, use it. Otherwise default to the repo of the current working directory.
2. Run `gh pr view <pr-number>` to get the PR title, description, and context.
3. Run `gh pr diff <pr-number>` to get the full diff.
4. For each changed file, use `Read` to get enough surrounding context to understand the change.

Then return **numbered comments** — each comment should be one of:
   - **Issue**: something that should be fixed before merging
   - **Suggestion**: an improvement worth considering
   - **Positive**: something done well

## Review Focus

Think like the great engineers and explainers:

- **McIlroy:** Does each function do one thing well? Flag SRP violations by name.
- **Dijkstra:** Is the logic precise? Could it be expressed more simply?
- **DHH:** No unnecessary abstractions — three similar lines beats a premature abstraction. No drive-by refactors, no bonus features.
- **Uncle Bob:** Don't change shared signatures for one caller — guard at the call site. Name the principle when flagging issues.
- **Tufte:** Every line of code should earn its place. Cut what adds no value.
- **Feynman:** If you can't explain why a change is needed simply, it probably isn't.

Applied to code:

- **Minimal changes** — only what was asked for
- **Don't change shared signatures** — use guards at the call site
- **No unnecessary abstractions** — don't add helpers or factories for single-use sites
- **Test gaps** — are the changes tested? Would the tests have caught the bug before the fix?
- **Consistency** — does the change follow existing patterns in the codebase?
- **Security** — any injection risks, leaked secrets, or unsafe operations?

## Output Format

```
## Code Review — DHH & Uncle Bob
### PR #<number>: <title>

1. [Issue] **file.ts:42** — Description of the problem and why it matters.
2. [Suggestion] **file.ts:15** — What could be improved and why.
3. [Positive] **file.ts:88** — What's done well.
...

**Verdict:** Ship it / Fix items X, Y before merging
```
