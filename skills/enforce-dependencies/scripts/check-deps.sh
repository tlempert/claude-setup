#!/usr/bin/env bash
# check-deps.sh
# Runs dependency-cruiser to enforce layer boundary rules defined in .dependency-cruiser.js
#
# Usage:
#   bash .claude/skills/enforce-dependencies/scripts/check-deps.sh [src-path]
#
# Exit codes:
#   0 — no violations
#   1 — violations found or tool not available

set -euo pipefail

SRC="${1:-src}"

# ─── Check tool availability ──────────────────────────────────────────────────
if ! npx --no-install depcruise --version > /dev/null 2>&1; then
  echo "ERROR: dependency-cruiser is not installed."
  echo ""
  echo "Install it with:"
  echo "  npm install --save-dev dependency-cruiser"
  echo "  npx depcruise --init   # generates .dependency-cruiser.js"
  exit 1
fi

# ─── Check for config file ────────────────────────────────────────────────────
CONFIG_FILE=""
for f in ".dependency-cruiser.js" ".dependency-cruiser.cjs" ".dependency-cruiser.mjs"; do
  if [ -f "$f" ]; then
    CONFIG_FILE="$f"
    break
  fi
done

if [ -z "$CONFIG_FILE" ]; then
  echo "WARNING: No .dependency-cruiser config found."
  echo "Running with built-in defaults. To generate project-specific rules:"
  echo "  npx depcruise --init"
  echo ""
  # Run without --validate so it still reports but doesn't fail on missing config
  npx depcruise "$SRC" \
    --output-type text \
    --exclude "node_modules" \
    2>&1
  echo ""
  echo "✓ Dependency scan complete (no rules file — install one for enforcement)."
  exit 0
fi

# ─── Run with validation ──────────────────────────────────────────────────────
echo "Checking dependency rules against: $CONFIG_FILE"
echo ""

set +e
npx depcruise "$SRC" \
  --output-type text \
  --validate "$CONFIG_FILE" \
  --exclude "node_modules|generated-acceptance-specs" \
  2>&1
EXIT_CODE=$?
set -e

echo ""
if [ "$EXIT_CODE" -eq 0 ]; then
  echo "✓ No dependency violations found."
else
  echo "✗ Dependency violations detected. See report above."
  echo ""
  echo "Run the enforce-dependencies skill to get remediation guidance."
fi

exit "$EXIT_CODE"
