---
name: domain-glossary
description: Add to glossary, update domain terms, define ubiquitous language, look up domain term, audit naming consistency, manage glossary. The shared vocabulary for specs, tests, and code.
---

# Domain Glossary

Manages `plans/permanent/glossary.md` — the single source of truth for your project's ubiquitous language. Every spec, test name, and variable in the domain layer should use these terms exclusively.

## Detect Mode

Determine what the user wants:
- **Query**: "what does X mean?" / "is X in the glossary?" → lookup mode
- **Add/Update**: "add term X" / "X means Y" → write mode
- **Audit**: "audit the glossary" / "check naming consistency" → audit mode
- **Initialize**: no glossary exists yet → create mode

---

## Query Mode

Look up the term in `plans/permanent/glossary.md`. Return:
- The definition
- Which layer owns it
- Usage examples
- Any aliases (these are naming inconsistencies to resolve)

If not found: "Term not in glossary. Want me to add it?"

---

## Add / Update Mode

1. Read the current `plans/permanent/glossary.md` (create from template below if missing)
2. Check for an existing entry — update rather than duplicate
3. Add or update with this structure:

```markdown
### <TermName>
- **definition**: One sentence. Domain language only. No class names, no HTTP, no DB terms.
- **layer**: domain | application | adapters | ui | shared
- **usage**: "Example sentence showing how this appears in a GWT spec or test name."
- **aliases**: Other names this concept appears under (empty list = consistent naming ✓)
```

**Rules for definitions:**
- Must be understandable by a domain expert who doesn't write code
- No camelCase, PascalCase, snake_case identifiers
- No framework names (React, Express, Prisma, etc.)
- No HTTP vocabulary (request, response, endpoint, payload)
- No database vocabulary (row, column, query, schema)

---

## Audit Mode

1. Read `plans/permanent/glossary.md`
2. Scan `acceptanceTests/*.txt` for capitalized noun phrases and recurring verbs
3. Scan `spec/` file names and `describe()` / `it()` strings for domain nouns
4. Report:
   - Terms used in specs/tests but NOT in the glossary → candidates to add
   - Glossary terms with aliases → naming inconsistencies to resolve
   - Same concept spelled differently across files → flag for standardization

---

## Glossary Template

```markdown
# Domain Glossary
project: <project name>
last_updated: <date>

---

## Terms

<!-- Add terms alphabetically -->

### <TermName>
- **definition**:
- **layer**:
- **usage**:
- **aliases**:
```

---

## Important

Never define a term using implementation language. The glossary is the contract between the domain expert and the developer. If a domain expert can't understand a definition, rewrite it.
