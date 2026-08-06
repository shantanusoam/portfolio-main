#!/usr/bin/env bash
set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 0

INPUT="$(cat || true)"

if command -v jq >/dev/null 2>&1; then
  ACTIVE="$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null || printf false)"
  if [ "$ACTIVE" = "true" ]; then
    exit 0
  fi
fi

# git diff alone misses brand-new untracked files, which is exactly the
# state of a freshly-scaffolded mascot subsystem — use status --porcelain
# (tracked changes + untracked) instead of diff --quiet.
CHANGED="$(git status --porcelain -- \
  'lib/mascot' \
  'components/mascot' \
  'app/motion-lab' \
  'tests/mascot' \
  'tests/e2e/mascot-*' \
  'docs/mascot' 2>/dev/null)"

if [ -z "$CHANGED" ]; then
  exit 0
fi

if node scripts/mascot/verify.mjs --fast; then
  exit 0
fi

echo "Mascot verification failed. Fix the reported checks before stopping." >&2
exit 2
