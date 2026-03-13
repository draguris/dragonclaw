#!/usr/bin/env bash
set -euo pipefail

# DragonClaw 龙爪 — Installer
# curl -fsSL https://dragonclaw.asia/install.sh | bash

REPO="https://github.com/draguris/dragonclaw.git"
INSTALL_DIR="$HOME/.dragonclaw/app"

echo ""
echo "  DragonClaw 龙爪 — Installer"
echo "  ──────────────────────────────"
echo ""

# ── 1. Check git ──
if ! command -v git &> /dev/null; then
  echo "  [!] git is required. Installing..."
  if command -v apt-get &> /dev/null; then
    sudo apt-get update -qq && sudo apt-get install -y git
  elif command -v brew &> /dev/null; then
    # macOS — xcode-select installs git
    xcode-select --install 2>/dev/null || true
  else
    echo "  ERROR: git not found. Install git first: https://git-scm.com"
    exit 1
  fi
fi

# ── 2. Check / install Node.js >= 20 ──
NEED_NODE=false
if ! command -v node &> /dev/null; then
  NEED_NODE=true
elif [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 20 ]; then
  NEED_NODE=true
fi

if [ "$NEED_NODE" = true ]; then
  echo "  [1/4] Installing Node.js 22..."
  if command -v brew &> /dev/null; then
    brew install node@22
  elif command -v apt-get &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
    sudo dnf install -y nodejs
  elif command -v pacman &> /dev/null; then
    sudo pacman -S nodejs npm
  else
    echo "  ERROR: Cannot auto-install Node.js on this system."
    echo "  Please install Node.js >= 20 manually: https://nodejs.org"
    exit 1
  fi
else
  echo "  [1/4] Node.js $(node -v) found"
fi

# ── 3. Clone or update ──
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "  [2/4] Updating DragonClaw..."
  cd "$INSTALL_DIR"
  git pull --quiet --ff-only
else
  echo "  [2/4] Cloning DragonClaw..."
  rm -rf "$INSTALL_DIR"
  mkdir -p "$(dirname "$INSTALL_DIR")"
  git clone --depth 1 "$REPO" "$INSTALL_DIR"
fi

# ── 4. Install dependencies ──
echo "  [3/4] Installing dependencies..."
cd "$INSTALL_DIR"
npm install --production --silent 2>&1 | tail -1

# ── 5. Create symlink ──
echo "  [4/4] Setting up command..."
chmod +x "$INSTALL_DIR/src/cli.js"

if [ -w "/usr/local/bin" ]; then
  ln -sf "$INSTALL_DIR/src/cli.js" /usr/local/bin/dragonclaw
  echo "  Linked: /usr/local/bin/dragonclaw"
else
  mkdir -p "$HOME/.local/bin"
  ln -sf "$INSTALL_DIR/src/cli.js" "$HOME/.local/bin/dragonclaw"
  # Add to PATH if not already there
  if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    SHELL_RC=""
    if [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc";
    elif [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"; fi
    if [ -n "$SHELL_RC" ]; then
      echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
      echo "  Added ~/.local/bin to PATH in $SHELL_RC"
      echo "  Run: source $SHELL_RC"
    fi
  fi
  echo "  Linked: ~/.local/bin/dragonclaw"
fi

echo ""
echo "  DragonClaw installed!"
echo ""
echo "  Next:"
echo "    dragonclaw onboard    # setup wizard (pick your LLM, add keys)"
echo "    dragonclaw start      # start the agent"
echo "    dragonclaw chat       # chat in terminal"
echo ""
echo "  Docs: https://docs.dragonclaw.asia"
echo "  GitHub: https://github.com/draguris/dragonclaw"
echo ""
