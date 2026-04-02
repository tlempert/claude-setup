#!/usr/bin/env node
/**
 * crap-report.js
 * Computes CRAP scores by combining Jest V8/Istanbul coverage data with
 * ESLint cyclomatic complexity measurements.
 *
 * CRAP(f) = CC(f)² × (1 − coverage(f))³ + CC(f)
 *
 * Prerequisites:
 *   npx jest --coverage --coverageReporters=json --silent
 *
 * Usage:
 *   node .claude/skills/run-crap-analysis/scripts/crap-report.js
 *   node .claude/skills/run-crap-analysis/scripts/crap-report.js --src=lib
 *   node .claude/skills/run-crap-analysis/scripts/crap-report.js --staged
 *   node .claude/skills/run-crap-analysis/scripts/crap-report.js --changed
 *
 * --staged  : only files staged in git (git diff --cached)
 * --changed : all locally modified files — staged + unstaged (git diff HEAD)
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const { execSync } = require('child_process');

// ─── Thresholds ───────────────────────────────────────────────────────────────
const CC_LIMIT       = 5;
const CRAP_CRITICAL  = 30;
const CRAP_WARNING   = 15;

// ─── CLI args ─────────────────────────────────────────────────────────────────
const stagedFlag      = process.argv.includes('--staged');
const changedFlag     = process.argv.includes('--changed');
const keepCoverageFlag = process.argv.includes('--keep-coverage');
const srcArg          = process.argv.find(a => a.startsWith('--src='));
const SRC             = srcArg ? srcArg.split('=')[1] : (fs.existsSync('src') ? 'src' : '.');

// ─── Git file helpers ─────────────────────────────────────────────────────────
const SOURCE_EXTS = /\.(ts|tsx|js|jsx|mjs)$/;

/**
 * Returns an array of absolute paths for files matching the requested scope.
 * staged=true  → git diff --cached --name-only
 * staged=false → git diff HEAD --name-only  (staged + unstaged)
 */
function getGitFiles(staged) {
  const cmd = staged
    ? 'git diff --cached --name-only'
    : 'git diff HEAD --name-only';

  let output = '';
  try {
    output = execSync(cmd, { encoding: 'utf8' });
  } catch {
    // fall through — empty list is safe
  }

  // Also include staged files when --changed, in case there are no unstaged changes
  if (!staged) {
    try {
      const stagedOut = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      output += '\n' + stagedOut;
    } catch { /* ignore */ }
  }

  const seen = new Set();
  return output
    .split('\n')
    .map(f => f.trim())
    .filter(f => f && SOURCE_EXTS.test(f))
    .map(f => path.resolve(f))
    .filter(f => {
      if (seen.has(f)) return false;
      seen.add(f);
      return fs.existsSync(f); // skip deleted files
    });
}

// Resolve the file list once — null means "use directory mode"
const GIT_FILES = stagedFlag
  ? getGitFiles(true)
  : changedFlag
    ? getGitFiles(false)
    : null;

if (GIT_FILES !== null && GIT_FILES.length === 0) {
  const label = stagedFlag ? '--staged' : '--changed';
  console.log(`\nNo source files found for ${label}. Nothing to analyse.\n`);
  process.exit(0);
}

const SCOPE_LABEL = stagedFlag
  ? 'staged changes only'
  : changedFlag
    ? 'all local changes'
    : `src: ${SRC}`;

// ─── Step 1: Load coverage data ───────────────────────────────────────────────
const COVERAGE_PATH = path.resolve('coverage/coverage-final.json');

if (!fs.existsSync(COVERAGE_PATH)) {
  console.error('ERROR: coverage/coverage-final.json not found.');
  console.error('Run first:  npx jest --coverage --coverageReporters=json --silent');
  process.exit(1);
}

const rawCoverage = JSON.parse(fs.readFileSync(COVERAGE_PATH, 'utf8'));

/**
 * Build a map: filePath → Map<"line:name", { name, line, hits, pct }>
 * Using per-function coverage from Istanbul/V8 JSON format.
 */
function buildFunctionCoverageMap(raw) {
  const map = new Map();
  for (const [filePath, data] of Object.entries(raw)) {
    const fnMap    = data.fnMap  || {};
    const fnCounts = data.f      || {};
    const fnHits   = new Map();

    for (const [id, info] of Object.entries(fnMap)) {
      const hits  = fnCounts[id] || 0;
      const name  = info.name || `(anonymous)`;
      const line  = info.loc?.start?.line || 0;
      const key   = `${line}:${name}`;
      fnHits.set(key, { name, line, hits, covered: hits > 0 });
    }
    map.set(filePath, fnHits);
  }
  return map;
}

const coverageMap = buildFunctionCoverageMap(rawCoverage);

// ─── Step 2: Get cyclomatic complexity via ESLint ─────────────────────────────
/**
 * @param {string}        srcDir    - directory to lint (used when fileList is null)
 * @param {string[]|null} fileList  - explicit absolute file paths (--staged / --changed)
 */
function getComplexityData(srcDir, fileList) {
  const results = [];
  let raw = '';

  // When given an explicit file list, pass each file path directly.
  // When using directory mode, rely on --ext to filter extensions.
  const eslintTarget = fileList
    ? fileList.map(f => `"${f}"`).join(' ')
    : `"${srcDir}"`;

  const extFlag = fileList ? '' : '--ext .js,.ts,.jsx,.tsx,.mjs ';

  try {
    raw = execSync(
      `npx eslint ${eslintTarget} ` +
      extFlag +
      `--rule '{"complexity": ["warn", 1]}' ` +
      `--format json ` +
      `--no-eslintrc ` +
      `--ignore-pattern "node_modules/**" ` +
      `--ignore-pattern "generated-acceptance-specs/**" ` +
      `2>/dev/null || true`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (e) {
    raw = e.stdout || '';
  }

  if (!raw.trim()) return results;

  let eslintOutput;
  try {
    eslintOutput = JSON.parse(raw);
  } catch {
    return results;
  }

  for (const fileResult of eslintOutput) {
    for (const msg of fileResult.messages) {
      if (msg.ruleId !== 'complexity') continue;

      // "Function 'name' has a complexity of N."
      // Arrow functions and anonymous: "Function has a complexity of N."
      const named     = msg.message.match(/Function '([^']+)' has a complexity of (\d+)/);
      const anonymous = msg.message.match(/complexity of (\d+)/);

      results.push({
        file: fileResult.filePath,
        name: named ? named[1] : '(anonymous)',
        line: msg.line || 0,
        cc:   named ? parseInt(named[2], 10) : parseInt(anonymous?.[1] || '1', 10),
      });
    }
  }

  return results;
}

const complexityData = getComplexityData(SRC, GIT_FILES);

if (complexityData.length === 0) {
  const hint = GIT_FILES
    ? `  Files scoped:\n${GIT_FILES.map(f => '    ' + f).join('\n')}`
    : `  Searched: ${SRC}`;
  console.warn('WARNING: No complexity data found. Check that ESLint is installed and src path is correct.');
  console.warn(hint);
}

// ─── Step 3: Join complexity + coverage ──────────────────────────────────────
function findCoverage(filePath, fnName, fnLine) {
  const fileCov = coverageMap.get(filePath);
  if (!fileCov) return { covered: false, hits: 0 };

  // Try exact key match
  const exactKey = `${fnLine}:${fnName}`;
  if (fileCov.has(exactKey)) return fileCov.get(exactKey);

  // Try name-only match (for line number drift)
  for (const [, info] of fileCov) {
    if (info.name === fnName) return info;
  }

  // Try line-proximity match (within ±3 lines)
  for (const [, info] of fileCov) {
    if (Math.abs(info.line - fnLine) <= 3) return info;
  }

  return { covered: false, hits: 0 };
}

function crapScore(cc, coverageRatio) {
  return Math.round((cc ** 2) * ((1 - coverageRatio) ** 3) + cc);
}

const report = [];

for (const { file, name, line, cc } of complexityData) {
  const cov     = findCoverage(file, name, line);
  const covRatio = cov.covered ? 1.0 : 0.0;  // Simplified: function hit or not
  const crap    = crapScore(cc, covRatio);
  const relFile = path.relative(process.cwd(), file);

  report.push({ file: relFile, absFile: file, name, line, cc, covered: cov.covered, hits: cov.hits, coveragePct: cov.covered ? '100%' : '0%', crap });
}

report.sort((a, b) => b.crap - a.crap || b.cc - a.cc);

// ─── Step 4: Render output ────────────────────────────────────────────────────
const critical = report.filter(r => r.crap > CRAP_CRITICAL);
const warning  = report.filter(r => r.crap > CRAP_WARNING && r.crap <= CRAP_CRITICAL);
const highCC   = report.filter(r => r.cc > CC_LIMIT && r.crap <= CRAP_WARNING);
const clean    = report.filter(r => r.crap <= CRAP_WARNING && r.cc <= CC_LIMIT);

const scopePadded = `Scope     : ${SCOPE_LABEL}`.padEnd(62);
console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  CRAP ANALYSIS REPORT                                        ║');
console.log('╠══════════════════════════════════════════════════════════════╣');
console.log(`║  Formula : CRAP = CC² × (1 − cov)³ + CC                     ║`);
console.log(`║  CC Limit: ${String(CC_LIMIT).padEnd(4)}  Critical: CRAP>${CRAP_CRITICAL}  Warning: CRAP>${CRAP_WARNING}         ║`);
console.log(`║  ${scopePadded}║`);
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');

if (critical.length > 0) {
  console.log(`🔴  CRITICAL  —  CRAP > ${CRAP_CRITICAL}  (${critical.length} function${critical.length !== 1 ? 's' : ''})\n`);
  renderTable(critical.slice(0, 15));
}

if (warning.length > 0) {
  console.log(`🟡  WARNING  —  CRAP ${CRAP_WARNING}–${CRAP_CRITICAL}  (${warning.length} function${warning.length !== 1 ? 's' : ''})\n`);
  renderTable(warning.slice(0, 10));
}

if (highCC.length > 0) {
  console.log(`🔵  HIGH CC (CC > ${CC_LIMIT}, coverage acceptable)  —  ${highCC.length} function${highCC.length !== 1 ? 's' : ''}\n`);
  renderTable(highCC.slice(0, 10));
}

if (critical.length === 0 && warning.length === 0 && highCC.length === 0) {
  console.log('✅  All functions are within acceptable CRAP and CC thresholds.\n');
}

console.log('── Summary ──────────────────────────────────────────────────────');
console.log(`   Functions analyzed : ${report.length}`);
console.log(`   Critical (CRAP>${CRAP_CRITICAL}): ${critical.length}`);
console.log(`   Warning  (CRAP>${CRAP_WARNING}): ${warning.length}`);
console.log(`   High CC  (CC>${CC_LIMIT})   : ${highCC.length}`);
console.log(`   Clean               : ${clean.length}`);
console.log('');

// ─── Cleanup coverage artefacts ───────────────────────────────────────────────
// `npx jest --coverage` writes coverage/ which has no value after this report.
// Delete it unless the caller explicitly asked to keep it (--keep-coverage).
if (!keepCoverageFlag) {
  const coverageDir = path.resolve('coverage');
  if (fs.existsSync(coverageDir)) {
    fs.rmSync(coverageDir, { recursive: true, force: true });
  }
}

// Exit non-zero if there are critical issues
process.exit(critical.length > 0 ? 1 : 0);

// ─── Render helpers ───────────────────────────────────────────────────────────
function renderTable(rows) {
  const W = { crap: 7, cc: 5, cov: 9, fn: 32, file: 50 };
  const header = [
    'CRAP'.padEnd(W.crap),
    'CC'.padEnd(W.cc),
    'Coverage'.padEnd(W.cov),
    'Function'.padEnd(W.fn),
    'File:Line',
  ].join('  ');

  console.log('  ' + header);
  console.log('  ' + '─'.repeat(header.length));

  for (const r of rows) {
    const crapStr = r.crap > CRAP_CRITICAL ? `[${r.crap}]` : String(r.crap);
    const ccStr   = r.cc > CC_LIMIT        ? `[${r.cc}]`   : String(r.cc);

    console.log('  ' + [
      crapStr.padEnd(W.crap),
      ccStr.padEnd(W.cc),
      r.coveragePct.padEnd(W.cov),
      r.name.slice(0, W.fn).padEnd(W.fn),
      `${r.file}:${r.line}`,
    ].join('  '));
  }
  console.log('');
}
