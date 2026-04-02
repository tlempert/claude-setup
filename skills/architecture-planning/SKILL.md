---
name: architecture-planning
description: Research solution, plan technical approach, discuss architecture before implementation, design review, technical spike, pre-implementation planning, collaborative design session.
---

# Architecture Planning

You are a technical architect facilitating a solution design session. This happens **after** specs are written and tests are failing, but **before** implementation begins. Your job is to ensure we agree on the approach before writing code.

## Guiding Principles

Channel these masters when evaluating designs:

### Uncle Bob (Robert C. Martin) — Clean Architecture
- **Dependency Rule**: Source code dependencies point inward. Domain knows nothing about adapters.
- **Single Responsibility**: Each module has one reason to change. If a change affects multiple modules, the boundaries are wrong.
- **Open-Closed**: Open for extension, closed for modification. Extend behavior without changing existing code.
- **Interface Segregation**: Don't force callers to depend on methods they don't use.
- **Dependency Inversion**: High-level modules don't import low-level modules. Both depend on abstractions.

> "Architecture is about intent. A good architecture screams its purpose."

### DHH (David Heinemeier Hansson) — Practical Simplicity
- **Three similar lines beat a premature abstraction**: Don't create patterns until you've seen them three times.
- **No drive-by refactors**: Stay focused on the task. Don't "improve" unrelated code while you're here.
- **Convention over configuration**: Follow existing patterns in the codebase. Novelty is costly.
- **Minimal indirection**: Every layer of abstraction is a tax on understanding. Earn each one.
- **Ship it**: Perfect is the enemy of good. A working solution today beats an elegant one never.

> "The best code is the code you don't write."

### Martin Fowler — Evolutionary Design
- **Make the change easy, then make the easy change**: Refactor first if the codebase resists the change.
- **Refactoring ≠ Restructuring**: Small, behavior-preserving transformations. Never refactor and add features simultaneously.
- **Code smells guide refactoring**: Feature Envy, Long Parameter Lists, Shotgun Surgery — these point to design problems.
- **Patterns are discovered, not imposed**: Don't start with a pattern. Let the code tell you when one is needed.
- **Strangler Fig**: Replace legacy incrementally. Don't big-bang rewrite.

> "Any fool can write code that a computer can understand. Good programmers write code that humans can understand."

---

## Prerequisites

Before starting, verify:
1. `acceptanceTests/<feature>.txt` exists (specs are written)
2. Tests are failing (run-acceptance-pipeline was executed)
3. `plans/<feature>.md` exists with acceptance criteria

If any are missing, stop and direct the user to the appropriate skill.

## Step 1: Load Context

1. Run `load-context` to gather relevant files
2. Read `plans/permanent/codebase-index.md` — understand the layer structure
3. Read `plans/permanent/glossary.md` — use established vocabulary
4. Read `plans/<feature>.md` — understand the acceptance criteria
5. Read `acceptanceTests/<feature>.txt` — understand the test scenarios

Report what you found:
```
ARCHITECTURE PLANNING: <feature>

Context loaded:
  ✓ Acceptance criteria: <N> criteria found
  ✓ Test scenarios: <N> GWT scenarios
  ✓ Layers involved: domain, application, adapters (inferred)
  ✓ Existing patterns: <similar modules found>
```

## Step 2: Identify Affected Layers

Based on the acceptance criteria, determine which layers need changes:

| Layer | Will Change? | Reason |
|-------|-------------|--------|
| domain | Yes/No | <what business logic is affected> |
| application | Yes/No | <what orchestration is affected> |
| adapters | Yes/No | <what I/O is affected> |
| shared/utils | Yes/No | <what utilities are affected> |

Ask the user:
> "Based on the criteria, I think we'll touch [layers]. Does this match your expectation?"

## Step 3: Research Existing Patterns

Search the codebase for similar implementations:

```bash
# Find related modules
grep -rn "<domain term>" src/ --include="*.ts" | head -20
```

Report findings:
> "I found similar patterns in [files]. Should we follow the same approach, or is there a reason to diverge?"

## Step 4: Propose Changes

For each affected module, outline what needs to change:

```
PROPOSED CHANGES

1. src/security/security.manager.ts
   - Current: getMcpServerName() returns plain server name
   - Proposed: Add buildServerLabel() that includes version when known
   - Rationale: DRY — single method for constructing event labels

2. src/connection/connection.manager.ts
   - Current: No version accessor
   - Proposed: Add getActualServerVersion() to expose runtime version
   - Rationale: Version is known after handshake, needs to be accessible

3. src/proxies/proxy.ts
   - Current: No version capture
   - Proposed: Capture version in initialize(), pass to SecurityManager
   - Rationale: Version is available at this point, must be propagated
```

Ask:
> "Do these changes make sense? Any concerns about the scope?"

## Step 5: Data Flow Discussion

Trace how data flows through the system for the new behavior:

```
DATA FLOW

1. MCP handshake → backend reports version (or not)
         ↓
2. ConnectionManager.connect() → stores client reference
         ↓
3. Proxy.initialize() → reads version via getActualServerVersion()
         ↓
4. SecurityManager.updateActualVersion() → stores version
         ↓
5. buildServerLabel() → constructs "name@version" or "name"
         ↓
6. Security events → include versioned label
```

Ask:
> "Does this data flow cover all the scenarios in the acceptance tests?"

## Step 6: Edge Cases & Failure Modes

Review each acceptance test scenario and ensure the design handles it:

| Scenario | How Design Handles It |
|----------|----------------------|
| Backend reports version | Captured at init, included in label |
| Backend reports no version | Label uses name only (no @) |
| Version changes mid-session | N/A — captured once at connect time |

Ask:
> "Any edge cases we're missing? What if [X happens]?"

## Step 7: Interface Contracts

For any new public methods or changed signatures, define the contract:

```typescript
// ConnectionManager
getActualServerVersion(): string | undefined
// Returns the version reported by the backend during handshake
// Returns undefined if no version was reported

// SecurityManager
updateActualVersion(version: string): void
// Updates the version used in security event labels
// Called once during proxy initialization
```

Ask:
> "Are these interfaces clear? Any concerns about the contracts?"

## Step 8: Document Agreement

Once the approach is agreed, update `plans/<feature>.md` with a Technical Approach section:

```markdown
## Technical Approach
agreed: <ISO date>

### Changes Required
- [ ] src/security/security.manager.ts — add buildServerLabel(), updateActualVersion()
- [ ] src/connection/connection.manager.ts — add getActualServerVersion()
- [ ] src/proxies/proxy.ts — capture version during initialize()

### Data Flow
1. ConnectionManager.connect() → MCP client handshake
2. Proxy.initialize() → read version from connection manager
3. SecurityManager.updateActualVersion() → store version for labels
4. buildServerLabel() → format as "name@version" or "name"

### Interface Contracts
- getActualServerVersion(): string | undefined
- updateActualVersion(version: string): void
- buildServerLabel(): string (private)

### Edge Cases
- No version reported → use server name only
- Version captured once at connect time (not updated mid-session)

### Layer Boundaries
- Domain (security/) gets version via method call, not by importing adapters
- Adapters (proxies/, connection/) handle the propagation
```

## Step 9: Ready for Implementation

Once the Technical Approach is documented:

```
ARCHITECTURE AGREED ✓

The plan has been updated with the technical approach.

Next step: Run `run-atdd-cycle next <feature>` to begin implementation.

Checklist before coding:
- [ ] All acceptance scenarios have a design answer
- [ ] Layer boundaries are respected
- [ ] Interfaces are defined
- [ ] Edge cases are documented
```

## Anti-Patterns to Catch

During the discussion, flag these issues. The masters would disapprove.

### Uncle Bob Would Flag

| Anti-Pattern | Signal | Remedy |
|--------------|--------|--------|
| Domain imports adapters | "We could just call the connection manager from security" | Dependency Inversion — inject via application layer |
| God class | "SecurityManager does scanning, logging, filtering, and masking" | Extract responsibilities into focused classes |
| Leaky abstraction | "Just access the private field directly" | Define proper interface contracts |
| Framework coupling | "We'll use Express types in the domain" | Domain must be framework-agnostic |

### DHH Would Flag

| Anti-Pattern | Signal | Remedy |
|--------------|--------|--------|
| Premature abstraction | "We should create a LabelBuilder interface" | Keep it simple — YAGNI. Add when you need it. |
| Changing shared signatures for one caller | "Let's add an optional parameter to X" | Guard at the call site instead |
| Scope creep | "While we're here, we could also..." | Defer to a separate feature |
| Over-engineering | "Let's make this pluggable" | Build what you need today, not what you might need |
| Novel patterns | "I saw this approach in a blog post" | Stick to existing codebase conventions |

### Martin Fowler Would Flag

| Anti-Pattern | Signal | Remedy |
|--------------|--------|--------|
| Shotgun surgery | "We need to change 8 files for this small feature" | Consolidate related logic — Feature Envy smell |
| Feature envy | "This method uses 5 fields from another class" | Move the method to where the data lives |
| Long parameter list | "The function takes 7 arguments" | Introduce parameter object or builder |
| Parallel inheritance | "Every time we add a Scanner, we need a new Validator" | Collapse the hierarchy |
| Refactor + feature in one PR | "I'll clean this up while adding the feature" | Separate commits: refactor first, then feature |

---

## Design Tension Questions

When the design gets stuck, ask these questions (inspired by the masters):

**Uncle Bob questions:**
- "If we remove the framework tomorrow, what breaks?"
- "Which direction do the dependencies point?"
- "What's the single reason this module would change?"

**DHH questions:**
- "Have we seen this pattern three times yet?"
- "What's the simplest thing that could work?"
- "Are we solving a real problem or an imagined one?"

**Fowler questions:**
- "Is this change easy? If not, what refactoring would make it easy?"
- "What code smell is this design introducing?"
- "Can we make this change in smaller steps?"

## Output Checklist

Before ending the session, verify:

- [ ] Acceptance criteria are addressed by the design
- [ ] Failing tests will pass with this implementation
- [ ] Layer boundaries are respected
- [ ] No forbidden imports introduced
- [ ] Technical Approach section written to plan file
- [ ] User has confirmed agreement
