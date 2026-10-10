#!/bin/sh
# Install the launcher into ~/.local/bin and a desktop entry so it shows up in the app launcher.
set -eu
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$HOME/.local/bin"
APPS="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICONS="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/scalable/apps"
mkdir -p "$BIN" "$APPS" "$ICONS"

ln -sf "$APP_DIR/bin/deutsch-drill" "$BIN/deutsch-drill"
cp "$APP_DIR/src/web/public/icon.svg" "$ICONS/deutsch-drill.svg"
cat > "$APPS/deutsch-drill.desktop" <<DESKTOP
[Desktop Entry]
Version=1.0
Name=Deutsch Drill
Comment=Drill German grammar: verb conjugation and more
Exec=$BIN/deutsch-drill
Terminal=false
Type=Application
Icon=deutsch-drill
Categories=Education;Languages;
StartupWMClass=deutsch-drill
StartupNotify=true
DESKTOP
echo "Installed: $BIN/deutsch-drill and $APPS/deutsch-drill.desktop"
