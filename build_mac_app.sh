#!/bin/bash
set -e

APP_NAME="MichelleDeSanta"
BUNDLE="$APP_NAME.app"
CONTENTS="$BUNDLE/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"

echo "=== Building $BUNDLE for macOS ==="

rm -rf "$BUNDLE"
mkdir -p "$MACOS"
mkdir -p "$RESOURCES"

# Compile Swift executable
swiftc mac/main.swift \
  -O \
  -o "$MACOS/$APP_NAME" \
  -framework Cocoa \
  -framework WebKit

# Copy Info.plist
cat << 'EOF' > "$CONTENTS/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>MichelleDeSanta</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>ru.slawastr.michelledesanta</string>
    <key>CFBundleName</key>
    <string>Michelle De Santa</string>
    <key>CFBundleDisplayName</key>
    <string>Michelle De Santa 3D</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

# Copy Icon
if [ -f "assets/AppIcon.icns" ]; then
  cp "assets/AppIcon.icns" "$RESOURCES/AppIcon.icns"
fi

# Copy Web Assets
cp index.html "$RESOURCES/"
cp -r css "$RESOURCES/"
cp -r js "$RESOURCES/"
cp -r assets "$RESOURCES/"

echo "=== Build Complete: $BUNDLE ==="
ls -lh "$MACOS/$APP_NAME"
