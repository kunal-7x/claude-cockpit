#!/usr/bin/env sh
# Claude Cockpit — one-line installer (macOS / Linux).
#   curl -fsSL https://raw.githubusercontent.com/kunal-7x/claude-cockpit/main/install.sh | sh
set -e
DIR="$HOME/.cockpit"

printf '\n  \033[1;35mClaude Cockpit installer\033[0m\n'

if ! command -v node >/dev/null 2>&1; then
  echo "  Node.js is required. Get it at https://nodejs.org , then re-run."
  exit 1
fi

if command -v git >/dev/null 2>&1; then
  if [ -d "$DIR/.git" ]; then
    echo "  Updating existing copy..."
    git -C "$DIR" pull --ff-only
  else
    echo "  Cloning..."
    rm -rf "$DIR"
    git clone --depth 1 https://github.com/kunal-7x/claude-cockpit.git "$DIR"
  fi
else
  echo "  git is required. Please install git, then re-run."
  exit 1
fi

node "$DIR/bin/install.js"

# 'cockpit' command shim
SHIM="$DIR/cockpit"
printf '#!/usr/bin/env sh\nnode "%s/bin/update.js" "$@"\n' "$DIR" > "$SHIM"
chmod +x "$SHIM"
echo "  Tip: add ~/.cockpit to your PATH to use the 'cockpit' command, or run: node ~/.cockpit/bin/update.js"
