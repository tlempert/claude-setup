# Claude Code Setup

My personal Claude Code configuration — skills, MCPs, plugins, methodology, and key bindings.
Designed to be shared across projects and team members.

---

## Methodology: ATDD Pipeline

The workflow is built around **Acceptance Test-Driven Development** with a 5-pillar pipeline:

```
brainstorm-spec → write-gwt-spec → run-acceptance-pipeline → architecture-planning → scaffold-unit-tests → implementation → run-crap-analysis → run-mutation-test → enforce-dependencies
```

Core principles:
- **Ceiling first**: acceptance tests define observable behavior before any code
- **Floor next**: unit test stubs scaffold what must be proved
- **Guard dog**: mutation tests verify assertions, not just coverage
- **Walls**: dependency rules prevent layer tangling
- **Commit body is source of truth** — no MD files as design docs in the repo
- **Code review standard**: DHH + Uncle Bob lens before every commit
- **Test regressions**: prove old code fails first, then prove new code passes
- **Don't change shared method signatures** to accommodate one caller — use guards at call site
- **Keep changes minimal** — no abstractions for single-use sites

---

## Skills

Located in `~/.claude/skills/`. Invoked via the `Skill` tool in Claude Code.

### Git / PR

| Skill | Trigger | Description |
|-------|---------|-------------|
| `describe` | `/describe` | Generate a structured commit message body from current changes |
| `pr` | `/pr` | Create a PR with structured description from current branch |
| `pr-review` | `/pr-review` | Review a GitHub PR by ID using the DHH & Uncle Bob review standard |
| `review` | `/review` | Quick opinionated code review as DHH and Uncle Bob |

### ATDD Workflow

| Skill | Trigger | Description |
|-------|---------|-------------|
| `brainstorm-spec` | `/brainstorm-spec` | Brainstorm a feature, event storm domain problem, explore requirements, discover edge cases before writing code |
| `write-gwt-spec` | `/write-gwt-spec` | Write acceptance tests in GWT (Given/When/Then) plain-text format |
| `guard-spec-leakage` | `/guard-spec-leakage` | Audit acceptance tests for implementation details leaking into specs |
| `run-acceptance-pipeline` | `/run-acceptance-pipeline` | Execute `.txt → parse-gwt.js → .json → generate-jest.js → .spec.js → Jest` pipeline |
| `scaffold-unit-tests` | `/scaffold-unit-tests` | Generate failing Jest test stubs before implementation (TDD bootstrap) |
| `architecture-planning` | `/architecture-planning` | Design review / technical spike — agree on approach before writing code |
| `run-atdd-cycle` | `/run-atdd-cycle` | Orchestrate the full ATDD pipeline for a feature — tells you exactly what to run next |
| `plans-manager` | `/plans-manager` | Manage feature lifecycle, track pipeline status, know what pillar is next |

### Quality Gates

| Skill | Trigger | Description |
|-------|---------|-------------|
| `run-crap-analysis` | `/run-crap-analysis` | Compute CRAP scores (Change Risk Anti-Patterns) — flags complex untested functions |
| `run-mutation-test` | `/run-mutation-test` | Run Stryker mutation tests — proves tests are asserting, not just executing |
| `enforce-dependencies` | `/enforce-dependencies` | Check layer boundaries and detect forbidden imports (architecture walls) |
| `enforce-test-naming` | `/enforce-test-naming` | Audit Jest test names — must describe behavior, not implementation |

### Architecture / Context

| Skill | Trigger | Description |
|-------|---------|-------------|
| `index-codebase` | `/index-codebase` | Scan project structure, map source files, discover layers — run first on any new project |
| `load-context` | `/load-context` | Assemble minimum file set for a task (token-efficient) |
| `update-claude-md` | `/update-claude-md` | Maintain `CLAUDE.md` — layer rules, coding constraints, design decisions |
| `domain-glossary` | `/domain-glossary` | Manage `plans/permanent/glossary.md` — ubiquitous language for specs, tests, and code |
| `guide-refactor` | `/guide-refactor` | Propose function decomposition / complexity reduction without changing behavior |

### Teaching / Misc

| Skill | Trigger | Description |
|-------|---------|-------------|
| `teach` | `/teach` | Feynman-style deep explanation of any topic, codebase, or review |
| `rlm` | `/rlm` | Run a prompt through GitHub Models (gpt-4.1) via RLM pipeline using GitHub Copilot key |

---

## MCP Servers

Configured in `~/.claude/settings.json` under `mcpServers`.

### sequential-thinking
```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
}
```
Adds structured multi-step reasoning to complex tasks.

### coralogix-server
```json
{
  "command": "npx",
  "args": [
    "mcp-remote",
    "https://api.us2.coralogix.com/mgmt/api/v1/mcp",
    "--header",
    "Authorization:${CORALOGIX_API_KEY}"
  ],
  "env": { "CORALOGIX_API_KEY": "<your-key>" }
}
```
Query logs, traces, incidents, and alerts directly in Claude via Dataprime.

**Usage rules:**
- Always call `read_dataprime_intro_docs` before any query
- Always call `get_datetime` before any time-bounded query
- Query syntax: `source logs | filter $l.subsystemname == 'my-service'`
- Field prefixes: `$d` = user data, `$l` = labels, `$m` = metadata

### Connected via claude.ai (OAuth MCP plugins)

| MCP | Purpose |
|-----|---------|
| `claude_ai_Atlassian` | Jira issues, Confluence pages — search, create, transition, comment |
| `claude_ai_Gmail` | Gmail access |
| `claude_ai_Google_Calendar` | Calendar access |
| `claude_ai_Grain` | Meeting recordings |
| `claude_ai_Linear` | Linear issue tracking |
| `claude_ai_Notion` | Notion pages, databases, comments |
| `claude_ai_Slack` | Slack messages |

---

## Plugins

Configured in `~/.claude/settings.json` under `enabledPlugins`.

| Plugin | Purpose |
|--------|---------|
| `superpowers@claude-plugins-official` | Core superpowers: brainstorming, TDD, debugging, code review workflows |
| `context7@claude-plugins-official` | Auto-fetches current library/framework docs before answering |
| `code-simplifier@claude-plugins-official` | Reviews changed code for reuse, quality, and efficiency |
| `claude-mem@thedotmack` | Persistent cross-session memory — remembers patterns and decisions |

### Superpowers skills (from plugin)

| Skill | Description |
|-------|-------------|
| `superpowers:brainstorming` | Required before any creative or feature work |
| `superpowers:test-driven-development` | TDD cycle — must run before writing implementation |
| `superpowers:systematic-debugging` | Structured debugging before proposing fixes |
| `superpowers:requesting-code-review` | Verify work meets requirements before merging |
| `superpowers:receiving-code-review` | Process review feedback methodically |
| `superpowers:writing-plans` | Write implementation plans for multi-step tasks |
| `superpowers:executing-plans` | Execute written plans with review checkpoints |
| `superpowers:finishing-a-development-branch` | Guide branch completion and integration |
| `superpowers:using-git-worktrees` | Isolate feature work in git worktrees |
| `superpowers:dispatching-parallel-agents` | Parallelize independent tasks across subagents |
| `superpowers:verification-before-completion` | Run verification before claiming work is done |

---

## Hooks

Configured in `~/.claude/settings.json` under `hooks`.

### PreToolUse: rtk-rewrite
Rewrites all `Bash` commands through RTK (Rust Token Killer) for 60-90% token savings.
```json
{
  "matcher": "Bash",
  "hooks": [{ "type": "command", "command": "/Users/<you>/.claude/hooks/rtk-rewrite.sh" }]
}
```
> Note: `~` is not expanded in `settings.json` — use the full absolute path.

### PreToolUse: backslash-mcp-guard
Security guard on all MCP tool calls.
```json
{
  "matcher": "mcp__.*",
  "hooks": [{ "type": "command", "command": "~/.backslash/hooks/backslash-mcp-guard.sh" }]
}
```

### PreToolUse + UserPromptSubmit: ccstatusline
Updates the status line in Claude Code UI on skill invocations and prompt submissions.
```json
{ "type": "command", "command": "npx -y ccstatusline@latest --hook" }
```

### RTK (Rust Token Killer)
`rtk` transparently proxies all CLI commands through a token-efficient filter.
```bash
rtk gain              # Show savings analytics
rtk gain --history    # Per-command usage history
rtk discover          # Find missed optimization opportunities
```

---

## Status Line

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccstatusline@latest",
    "padding": 0
  }
}
```

---

## Key Bindings (Custom)

Location: `~/.claude/keybindings.json`

| Key | Action |
|-----|--------|
| `ctrl+t` | Toggle todos panel |
| `ctrl+o` | Toggle transcript |
| `ctrl+r` | History search |
| `ctrl+s` | Stash current message |
| `ctrl+g` | Open external editor |
| `meta+p` | Model picker |
| `meta+t` | Toggle thinking mode |

---

## Allowed Permissions

Key `Bash` permissions pre-approved in `settings.json`:
- `git *`, `gh *`, `npm *`, `npx *`, `node *`
- `python3 *`, `jq *`, `curl *`
- Standard file ops: `ls`, `cat`, `head`, `tail`, `grep`, `rg`, `find`, `sed`, `awk`
- `Skill(*)` — all skills allowed

---

## Installation Notes

1. Install Claude Code CLI
2. Copy `~/.claude/CLAUDE.md` with your project's workflow rules
3. Add skills to `~/.claude/skills/` (each in its own folder with `SKILL.md`)
4. Configure `~/.claude/settings.json` with MCPs, plugins, hooks
5. Install RTK: `brew install rtk` (or follow install instructions from your team — run `rtk --version` to verify)
6. Install `ccstatusline`: `npx -y ccstatusline@latest --help` (or pin a version; hooks already use `npx -y ccstatusline@latest`)
