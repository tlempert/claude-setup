# Global CLAUDE.md

## Workflow
- Review code as "DHH and Uncle Bob" before committing
- Don't change shared method signatures to accommodate one caller — use guards at the call site
- Test regressions: prove old code fails first, then prove new code passes
- Documentation: commit body is source of truth, PR description mirrors it, no MD files in repo
- Keep changes minimal — don't add abstractions for single-use sites

## Methodology: ATDD Pipeline

The workflow is built around **Acceptance Test-Driven Development** with this pipeline:

```
brainstorm-spec → write-gwt-spec → run-acceptance-pipeline → architecture-planning → scaffold-unit-tests → implementation → run-crap-analysis → enforce-dependencies
```

- **Ceiling first**: acceptance tests define observable behavior before any code
- **Floor next**: unit test stubs scaffold what must be proved
- **Walls**: dependency rules prevent layer tangling

Use `/run-atdd-cycle` to orchestrate the pipeline — it tells you what pillar is next.

## Skills

Skills live in `~/.claude/skills/`. **Do not read SKILL.md before invoking** — they are lazy-loaded on invocation via the Skill tool.

### Git / PR
- `/describe` — structured commit message body from current changes
- `/pr` — create PR with structured description
- `/pr-review <id>` — review a GitHub PR (DHH & Uncle Bob standard)
- `/review` — quick opinionated code review

### ATDD Workflow
- `/brainstorm-spec` — event storm, explore requirements, discover edge cases
- `/write-gwt-spec` — write acceptance tests in Given/When/Then plain-text format
- `/guard-spec-leakage` — audit specs for implementation details
- `/run-acceptance-pipeline` — execute `.txt → parse → .json → generate → .spec.js → Jest`
- `/scaffold-unit-tests` — generate failing Jest stubs (TDD bootstrap)
- `/architecture-planning` — design review / technical spike
- `/run-atdd-cycle` — orchestrate full ATDD pipeline for a feature
- `/plans-manager` — track feature lifecycle and pipeline status

### Quality Gates
- `/run-crap-analysis` — CRAP scores (flags complex untested functions)
- `/run-mutation-test` — Stryker mutation tests (proves tests assert, not just execute)
- `/enforce-dependencies` — check layer boundaries, detect forbidden imports
- `/enforce-test-naming` — audit Jest test names (must describe behavior)

### Architecture / Context
- `/index-codebase` — scan project structure, discover layers (run first on new projects)
- `/load-context` — assemble minimum file set for a task (token-efficient)
- `/update-claude-md` — maintain CLAUDE.md rules and constraints
- `/domain-glossary` — manage ubiquitous language glossary
- `/guide-refactor` — propose decomposition / complexity reduction

### Teaching / Misc
- `/teach` — Feynman-style deep explanation
- `/rlm` — run prompt through GitHub Models (gpt-4.1)

## Superpowers Plugin Skills

- `superpowers:brainstorming` — required before any creative or feature work
- `superpowers:test-driven-development` — TDD cycle, must run before writing implementation
- `superpowers:systematic-debugging` — structured debugging before proposing fixes
- `superpowers:requesting-code-review` — verify work meets requirements before merging
- `superpowers:receiving-code-review` — process review feedback methodically
- `superpowers:writing-plans` — write implementation plans for multi-step tasks
- `superpowers:executing-plans` — execute written plans with review checkpoints
- `superpowers:finishing-a-development-branch` — guide branch completion and integration
- `superpowers:using-git-worktrees` — isolate feature work in git worktrees
- `superpowers:dispatching-parallel-agents` — parallelize independent tasks across subagents
- `superpowers:verification-before-completion` — run verification before claiming work is done

## Connected MCPs (via claude.ai OAuth)

| MCP | Purpose |
|-----|---------|
| `claude_ai_Atlassian` | Jira issues, Confluence pages |
| `claude_ai_Gmail` | Gmail access |
| `claude_ai_Google_Calendar` | Calendar access |
| `claude_ai_Grain` | Meeting recordings |
| `claude_ai_Linear` | Linear issue tracking |
| `claude_ai_Notion` | Notion pages, databases, comments |
| `claude_ai_Slack` | Slack messages |

## Communication
- Teach me CLI commands rather than running them silently — I want to learn

## Coralogix MCP
Tools are available via the `mcp__coralogix__*` namespace.

**Before querying logs or traces, always call `read_dataprime_intro_docs` first** — it's mandatory, not optional. Skip it and queries will be wrong.

**Always get the current time first:** call `get_datetime` before any time-bounded query.

**Query syntax (Dataprime):**
- Pipelines start with `source logs` or `source spans`, then pipe commands
- Field prefixes: `$d` = user data, `$l` = labels, `$m` = metadata
- String literals use single quotes: `'value'`
- Equality: `==` / `!=` (not `=`)
- Severity values are unquoted keywords: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- Filter by subsystem: `filter $l.subsystemname == 'scan-orchestrator'`
- Filter by severity: `filter $m.severity == 'Error'`
- Full-text search across body fields: `filter $d.body ~ 'keyword'`

**Data shape (backslash-production):**
- `$l.applicationname` → e.g. `backslash-production`
- `$l.subsystemname` → e.g. `scan-orchestrator`, `sca-scanner`, `manager`
- `$m.severity` → `Info`, `Error`, `Warning`
- `$d.body` → main log message (sometimes empty — real data may be in `$d.error`, `$d.extra`)
- `$d.error.message` / `$d.error.stack` → error details
- `$d.extra.*` → contextual fields (jobId, queueName, app_id, etc.)
- AWS ECS context lives in `$d.resource.attributes` (cluster, task ARN, image, etc.)

**Operational patterns:**
1. Start broad if unsure when logs exist — query a 24–48h window, then narrow
2. If a query returns 0 results, widen the time range before changing the filter
3. For job/queue failures, search by queue name (e.g. `sca-deps`) across subsystems — job IDs are often not indexed as top-level fields
4. Error logs often have empty `body` — always inspect raw `user_data` / `$d.error` / `$d.extra`
5. Large result sets get saved to a file — use `python3` + `ast.literal_eval` (not `json.loads`) to parse them, since the format is a Python dict literal
6. The `scan-orchestrator` and `sca-scanner` subsystems handle dependency scanning; `manager` handles IDE MCP agent startup

**Key tools:**
- `get_logs` — query logs with Dataprime
- `get_traces` — query spans
- `get_schemas` — inspect available field names before writing complex queries
- `list_incidents` / `get_incident_details` / `get_alert_event_details` — for triggered alerts
- `list_alert_definitions` — for monitoring rules
@RTK.md
