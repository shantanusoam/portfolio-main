#!/usr/bin/env bash
set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 0

INPUT="$(cat || true)"
FILE_PATH=""

if command -v jq >/dev/null 2>&1; then
  FILE_PATH="$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"
fi

case "$FILE_PATH" in
  *lib/mascot/*.ts|*lib/mascot/*.tsx|*components/mascot/*.ts|*components/mascot/*.tsx|*app/motion-lab/*.ts|*app/motion-lab/*.tsx)
    ;;
  *)
    exit 0
    ;;
esac

if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

if [ -x node_modules/.bin/prettier ]; then
  npx prettier --check "$FILE_PATH" >/tmp/mascot-prettier.log 2>&1 || {
    cat /tmp/mascot-prettier.log >&2
    exit 2
  }
fi

exit 0
