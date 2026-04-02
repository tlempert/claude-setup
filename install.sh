#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
CLAUDE="$HOME/.claude"

echo "Installing Claude Code setup from $REPO..."

# Create target directories
mkdir -p "$CLAUDE/skills" "$CLAUDE/hooks"

# --- Config files ---
symlink() {
  local src="$1" dst="$2"
  if [ -e "$dst" ] && [ ! -L "$dst" ]; then
    echo "  backing up existing $dst → $dst.bak"
    mv "$dst" "$dst.bak"
  fi
  ln -sf "$src" "$dst"
  echo "  linked $dst"
}

symlink "$REPO/CLAUDE.md"        "$CLAUDE/CLAUDE.md"
symlink "$REPO/RTK.md"           "$CLAUDE/RTK.md"
symlink "$REPO/keybindings.json" "$CLAUDE/keybindings.json"
symlink "$REPO/hooks/rtk-rewrite.sh" "$CLAUDE/hooks/rtk-rewrite.sh"
chmod +x "$REPO/hooks/rtk-rewrite.sh"

# --- Settings ---
if [ ! -f "$CLAUDE/settings.json" ]; then
  cp "$REPO/settings.template.json" "$CLAUDE/settings.json"
  # Replace <you> placeholder with actual username
  sed -i '' "s|<you>|$(whoami)|g" "$CLAUDE/settings.json"
  echo "  created $CLAUDE/settings.json (fill in your CORALOGIX_API_KEY)"
else
  echo "  skipped settings.json — already exists (edit manually to merge changes)"
fi

# --- Skills ---
for skill_dir in "$REPO/skills"/*/; do
  skill_name="$(basename "$skill_dir")"
  dst_dir="$CLAUDE/skills/$skill_name"
  mkdir -p "$dst_dir"

  # Symlink each file inside the skill folder individually
  for file in "$skill_dir"*; do
    [ -f "$file" ] || continue
    symlink "$file" "$dst_dir/$(basename "$file")"
  done

  # Handle scripts/ subdirectory
  if [ -d "$skill_dir/scripts" ]; then
    mkdir -p "$dst_dir/scripts"
    for file in "$skill_dir/scripts/"*; do
      [ -f "$file" ] || continue
      symlink "$file" "$dst_dir/scripts/$(basename "$file")"
    done
  fi
done

echo ""
echo "Done. Next steps:"
echo "  1. Edit ~/.claude/settings.json and set CORALOGIX_API_KEY"
echo "  2. Install RTK:          cargo install rtk  (or brew install rtk)"
echo "  3. Verify RTK:           rtk --version"
echo "  4. Verify ccstatusline:  npx -y ccstatusline@latest --version"
echo "  5. Launch Claude Code and verify skills load with /describe"
