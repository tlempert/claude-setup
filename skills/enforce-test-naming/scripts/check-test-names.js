#!/usr/bin/env node
/**
 * check-test-names.js
 * Audits Jest/Vitest test files for method-centric or implementation-detail test names.
 * Tests should describe observable behavior in domain language.
 *
 * Usage:
 *   node check-test-names.js [directory-or-file]
 *   node check-test-names.js spec/
 *   node check-test-names.js spec/domain/order.spec.js
 *
 * Exit codes:
 *   0 — all test names describe behavior
 *   1 — violations found
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────
const TARGET = process.argv[2] || detectTestRoot();

/**
 * Patterns that indicate a test name is describing implementation, not behavior.
 * Each entry: { regex, reason, hint }
 */
const VIOLATION_PATTERNS = [
  {
    regex: /should\s+call\s+\w+/i,
    reason: 'Names an internal method call — implementation detail',
    hint:   'Describe what the user or system observes as a result',
  },
  {
    regex: /should\s+invoke\s+\w+/i,
    reason: 'Names a method invocation — implementation detail',
    hint:   'Describe the observable outcome instead',
  },
  {
    regex: /should\s+instantiate\s+\w+/i,
    reason: 'Names object construction — implementation detail',
    hint:   'Describe the behavior the constructed object enables',
  },
  {
    regex: /should\s+return\s+(true|false|null|undefined|void|0|-1|NaN)\b/i,
    reason: 'Asserts a raw primitive return value, not domain behavior',
    hint:   'Describe what the primitive means in domain terms (e.g., "should reject" instead of "should return false")',
  },
  {
    regex: /^test_/i,
    reason: 'Uses test_ prefix — method-centric naming convention',
    hint:   'Rename using "should <behavior> when <condition>" format',
  },
  {
    regex: /\b[a-z][a-zA-Z0-9]+\([^)]*\)/,
    reason: 'Contains a function call syntax in the test name — implementation detail',
    hint:   'Remove the parentheses; describe the behavior, not the function',
  },
  {
    regex: /^[a-z_]+_[a-z_]+_[a-z_]+/,
    reason: 'Uses snake_case naming — implementation/unit-test style',
    hint:   'Use plain English: "should <behavior> when <condition>"',
  },
  {
    regex: /\bthrows?\b.*(error|exception)\b/i,
    reason: '"throws an error" is a technical outcome, not a domain behavior',
    hint:   'Describe why it throws in domain terms (e.g., "should reject an order when the cart is empty")',
  },
];

// Matches: it('...'), it("..."), it(`...`), test('...'), test("..."), test(`...`)
const TEST_DECL_REGEX = /^\s*(?:it|test)\s*\(\s*(['"`])(.*?)\1/;

// ─── Main ─────────────────────────────────────────────────────────────────────
let totalFiles      = 0;
let totalViolations = 0;
let hasViolations   = false;

if (fs.existsSync(TARGET) && fs.statSync(TARGET).isDirectory()) {
  walkDir(TARGET, processFile);
} else if (fs.existsSync(TARGET)) {
  processFile(TARGET);
} else {
  console.error(`ERROR: Path not found: ${TARGET}`);
  process.exit(1);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Files checked:      ${totalFiles}`);
console.log(`Total violations:   ${totalViolations}`);

if (!hasViolations) {
  console.log('');
  console.log('✓ All test names describe observable behavior correctly.');
}

process.exit(hasViolations ? 1 : 0);

// ─── Functions ────────────────────────────────────────────────────────────────

function processFile(filePath) {
  totalFiles++;
  const violations = checkFile(filePath);

  if (violations.length === 0) return;

  hasViolations = true;
  totalViolations += violations.length;

  console.log('');
  console.log(`NAMING VIOLATIONS: ${filePath}`);
  console.log('━'.repeat(50));
  console.log(`Found: ${violations.length} violation${violations.length !== 1 ? 's' : ''}`);

  for (const v of violations) {
    console.log('');
    console.log(`  Line ${v.line}  — it('${truncate(v.name, 70)}')`);
    console.log(`    ✗ ${v.reason}`);
    console.log(`    ✓ ${v.hint}`);
  }
}

function checkFile(filePath) {
  const content    = fs.readFileSync(filePath, 'utf8');
  const lines      = content.split('\n');
  const violations = [];

  lines.forEach((line, index) => {
    const match = line.match(TEST_DECL_REGEX);
    if (!match) return;

    const testName = match[2];

    for (const pattern of VIOLATION_PATTERNS) {
      if (pattern.regex.test(testName)) {
        violations.push({
          line:   index + 1,
          name:   testName,
          reason: pattern.reason,
          hint:   pattern.hint,
        });
        break; // Report first match per line only
      }
    }
  });

  return violations;
}

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      walkDir(fullPath, callback);
    } else if (entry.isFile() && /\.(spec|test)\.(js|ts|jsx|tsx|mjs)$/.test(entry.name)) {
      callback(fullPath);
    }
  }
}

function detectTestRoot() {
  for (const dir of ['spec', '__tests__', 'test']) {
    if (fs.existsSync(dir)) return dir;
  }
  return 'spec'; // fallback
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}
