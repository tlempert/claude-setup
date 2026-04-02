#!/usr/bin/env node
/**
 * generate-jest.js
 * Generates Jest spec files from parsed GWT JSON intermediate representation.
 * Generated files are stubs — each test throws "Not implemented" until the
 * developer wires up real assertions against the actual domain modules.
 *
 * Usage:  node generate-jest.js <intermediate.json>
 *         node generate-jest.js acceptanceTests/json/order.json
 * Output: generated-acceptance-specs/<basename>.spec.js
 *
 * IMPORTANT: Never manually edit generated files.
 *            Fix the .txt source and re-run this script.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── CLI ──────────────────────────────────────────────────────────────────────
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node generate-jest.js <intermediate.json>');
  process.exit(1);
}
if (!fs.existsSync(inputFile)) {
  console.error(`ERROR: File not found: ${inputFile}`);
  process.exit(1);
}

// ─── Load intermediate ────────────────────────────────────────────────────────
let intermediate;
try {
  intermediate = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
} catch (e) {
  console.error(`ERROR: Could not parse JSON from ${inputFile}: ${e.message}`);
  process.exit(1);
}

const outputDir  = 'generated-acceptance-specs';
const outputFile = path.join(outputDir, `${intermediate.basename}.spec.js`);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ─── Code generation ──────────────────────────────────────────────────────────
const lines = [
  `// ╔══════════════════════════════════════════════════════════════════╗`,
  `// ║  AUTO-GENERATED — DO NOT EDIT                                    ║`,
  `// ║  Source : ${intermediate.source.padEnd(54)}║`,
  `// ║  Generated: ${new Date().toISOString().padEnd(51)}║`,
  `// ║  Regenerate: node .claude/skills/run-acceptance-pipeline/scripts/generate-jest.js ${path.relative(process.cwd(), inputFile).padEnd(0)}`,
  `// ╚══════════════════════════════════════════════════════════════════╝`,
  ``,
  `/**`,
  ` * Wire up your domain modules here.`,
  ` * Replace the TODO imports with real ones, then implement each test body.`,
  ` * The test description is your spec — read it, then assert it.`,
  ` */`,
  `// TODO: import { yourFunction } from '../src/domain/yourModule';`,
  ``,
  `describe('Acceptance: ${escapeString(intermediate.basename)}', () => {`,
  ``,
];

for (let i = 0; i < intermediate.tests.length; i++) {
  const test = intermediate.tests[i];
  const description = buildDescription(test);
  const sourceRef   = `${test.sourceFile}:${test.sourceLine}`;

  lines.push(`  // ── Test ${i + 1} of ${intermediate.tests.length} ─────────────────────────────────────────`);
  lines.push(`  // Source: ${sourceRef}`);
  lines.push(`  it('${escapeString(description)}', async () => {`);

  // Emit GIVEN block as comments
  lines.push(`    // GIVEN`);
  for (const g of test.given) {
    lines.push(`    //   ${g}`);
  }
  lines.push(`    //`);

  // Emit WHEN block as comments
  lines.push(`    // WHEN`);
  for (const w of test.when) {
    lines.push(`    //   ${w}`);
  }
  lines.push(`    //`);

  // Emit THEN block as comments
  lines.push(`    // THEN`);
  for (const t of test.then) {
    lines.push(`    //   ${t}`);
  }
  lines.push(`    //`);

  lines.push(`    // TODO: Arrange — set up the state described in GIVEN`);
  lines.push(`    // TODO: Act    — perform the action described in WHEN`);
  lines.push(`    // TODO: Assert — verify the outcome described in THEN`);
  lines.push(`    throw new Error('Not implemented: ${escapeString(description)}');`);
  lines.push(`  });`);
  lines.push(``);
}

lines.push(`});`);
lines.push(``);

// ─── Write output ─────────────────────────────────────────────────────────────
fs.writeFileSync(outputFile, lines.join('\n'));
console.log(`✓ Generated ${intermediate.tests.length} test stub(s) for ${intermediate.basename}`);
console.log(`  → ${outputFile}`);
console.log(`  Next: implement test bodies, then run: npx jest generated-acceptance-specs/`);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a readable test description from GIVEN/WHEN/THEN arrays.
 * Format: "given <first given>, when <first when>, then <first then>"
 */
function buildDescription(test) {
  const given = test.given[0] || '';
  const when  = test.when[0]  || '';
  const then  = test.then[0]  || '';
  return `given ${given}, when ${when}, then ${then}`;
}

/**
 * Escape single quotes and newlines for use inside a JS string literal.
 */
function escapeString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
}
