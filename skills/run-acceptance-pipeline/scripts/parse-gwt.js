#!/usr/bin/env node
/**
 * parse-gwt.js
 * Parses plain-text GWT acceptance test files into JSON intermediate representation.
 * Follows Uncle Bob's empire-2025 pipeline pattern, adapted for Node/Jest.
 *
 * Usage:  node parse-gwt.js <input.txt>
 *         node parse-gwt.js acceptanceTests/order.txt
 * Output: acceptanceTests/json/<basename>.json
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── CLI ──────────────────────────────────────────────────────────────────────
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node parse-gwt.js <input.txt>');
  process.exit(1);
}
if (!fs.existsSync(inputFile)) {
  console.error(`ERROR: File not found: ${inputFile}`);
  process.exit(1);
}

// ─── Setup output path ────────────────────────────────────────────────────────
const content  = fs.readFileSync(inputFile, 'utf8');
const lines    = content.split('\n');
const basename = path.basename(inputFile, '.txt');
const outputDir  = path.join(path.dirname(inputFile), 'json');
const outputFile = path.join(outputDir, `${basename}.json`);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ─── Parser ───────────────────────────────────────────────────────────────────
const tests = [];
let current         = null;
let currentDirective = null;
let lineNumber      = 0;
let parseErrors     = [];

/**
 * Start a new test block.
 */
function startTest(ln) {
  return { given: [], when: [], then: [], sourceLine: ln, sourceFile: inputFile };
}

/**
 * Validate and push a completed test.
 */
function pushTest(t, ln) {
  if (!t) return;
  if (t.given.length === 0) {
    parseErrors.push({ line: ln, message: 'Test block has no GIVEN' });
    return;
  }
  if (t.when.length === 0) {
    parseErrors.push({ line: ln, message: `Test starting at line ${t.sourceLine} has no WHEN` });
    return;
  }
  if (t.then.length === 0) {
    parseErrors.push({ line: ln, message: `Test starting at line ${t.sourceLine} has no THEN` });
    return;
  }
  tests.push(t);
}

for (const rawLine of lines) {
  lineNumber++;
  const line  = rawLine.trim();
  const upper = line.toUpperCase();

  // Skip blank lines and comments
  if (!line || line.startsWith(';')) continue;

  if (upper.startsWith('GIVEN ') || upper === 'GIVEN') {
    // A new GIVEN after a THEN closes the previous test
    if (currentDirective === 'THEN' && current) {
      pushTest(current, lineNumber);
      current = null;
    }
    if (!current) {
      current = startTest(lineNumber);
    }
    const text = line.slice(upper.startsWith('GIVEN ') ? 6 : 5).trim();
    current.given.push(text);
    currentDirective = 'GIVEN';

  } else if (upper.startsWith('WHEN ') || upper === 'WHEN') {
    if (!current) {
      parseErrors.push({ line: lineNumber, message: 'WHEN without preceding GIVEN' });
      continue;
    }
    const text = line.slice(upper.startsWith('WHEN ') ? 5 : 4).trim();
    current.when.push(text);
    currentDirective = 'WHEN';

  } else if (upper.startsWith('THEN ') || upper === 'THEN') {
    if (!current) {
      parseErrors.push({ line: lineNumber, message: 'THEN without preceding GIVEN/WHEN' });
      continue;
    }
    const text = line.slice(upper.startsWith('THEN ') ? 5 : 4).trim();
    current.then.push(text);
    currentDirective = 'THEN';

  } else if (upper.startsWith('AND ') || upper === 'AND') {
    if (!current || !currentDirective) {
      parseErrors.push({ line: lineNumber, message: 'AND without preceding directive' });
      continue;
    }
    const text = line.slice(upper.startsWith('AND ') ? 4 : 3).trim();
    if (currentDirective === 'GIVEN') current.given.push(text);
    else if (currentDirective === 'WHEN') current.when.push(text);
    else if (currentDirective === 'THEN') current.then.push(text);

  } else {
    // Continuation line — attach to current directive
    if (current && currentDirective) {
      if (currentDirective === 'GIVEN') current.given[current.given.length - 1] += ' ' + line;
      else if (currentDirective === 'WHEN') current.when[current.when.length - 1] += ' ' + line;
      else if (currentDirective === 'THEN') current.then[current.then.length - 1] += ' ' + line;
    }
  }
}

// Push the last test
pushTest(current, lineNumber);

// ─── Output ───────────────────────────────────────────────────────────────────
if (parseErrors.length > 0) {
  console.error(`\nPARSE ERRORS in ${inputFile}:`);
  for (const e of parseErrors) {
    console.error(`  Line ${e.line}: ${e.message}`);
  }
  console.error('\nFix errors above before running generate-jest.js');
  process.exit(1);
}

const output = {
  source:  inputFile,
  basename,
  parsed:  new Date().toISOString(),
  count:   tests.length,
  tests,
};

fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
console.log(`✓ Parsed ${tests.length} test(s) from ${inputFile}`);
console.log(`  → ${outputFile}`);
