#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[RELEASE]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Get version from parameter or package.json
VERSION=${1:-$(node -p "require('./package.json').version")}
REPO="MeridiaByMNovus/Meridia"

print_status "Creating release v$VERSION for $REPO"

# [Previous checks remain the same...]

# Build all platforms - with fallback for Docker issues
print_status "Building all platforms..."

# Check if Docker is accessible
if docker info &> /dev/null; then
    print_status "Using Docker build..."
    if [ -f "scripts/build.sh" ]; then
        ./scripts/build.sh all
    else
        print_status "Docker available but build.sh not found, using npm build..."
        npm run clean
        npm run build:all
        npm run copy
        npm run package
    fi
elif sudo docker info &> /dev/null; then
    print_warning "Docker requires sudo access..."
    if [ -f "scripts/build.sh" ]; then
        sudo ./scripts/build.sh all
    else
        print_status "Building with npm (no Docker)..."
        npm run clean
        npm run build:all
        npm run copy
        npm run package
    fi
else
    print_warning "Docker not accessible, falling back to native build..."
    npm run clean
    npm run build:all
    npm run copy
    npm run package
fi


if [ -f "scripts/build.sh" ]; then
    ./scripts/build.sh all
else
    print_status "Building without Docker..."
    npm run clean
    npm run build:all
    npm run copy
    npm run build:all-platforms
fi

# Check if build artifacts exist
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    print_error "No build artifacts found in dist/ directory!"
    exit 1
fi

print_status "Build completed. Found artifacts:"
ls -la dist/

# Create release notes with dynamic content
RELEASE_NOTES="## 🚀 What's New in v$VERSION

### ✨ Features
- Cross-platform builds for Windows, and Linux
- Enhanced Python development environment
- Advanced Studio data analytics tools
- Performance improvements and bug fixes

### 📦 Downloads
- **Windows**: Download the .exe installer or portable version
- **Linux**: Download the .AppImage or .deb package

### 🔧 Installation
1. Download the appropriate file for your operating system
2. Run the installer or extract the portable version
3. Launch Meridia and start coding!

### 📊 Build Information
- Built on: $(date)
- Commit: $(git rev-parse --short HEAD)
- Node.js: $(node --version)
- Electron: $(node -p "require('./node_modules/electron/package.json').version" 2>/dev/null || echo "Unknown")

---
**Full Changelog**: https://github.com/$REPO/compare/v$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "0.0.0")...v$VERSION"

# Create GitHub release with all available artifacts
print_status "Creating GitHub release..."

# Find all build artifacts dynamically
ASSETS=()
for pattern in "dist/Meridia-Setup-*.exe" "dist/Meridia-*-portable.exe" "dist/Meridia-*.AppImage" "dist/Meridia-*.deb" "dist/Meridia-*.rpm" "dist/Meridia-*.zip"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            ASSETS+=("$file")
        fi
    done
done

if [ ${#ASSETS[@]} -eq 0 ]; then
    print_error "No release assets found!"
    exit 1
fi

print_status "Uploading ${#ASSETS[@]} assets: ${ASSETS[*]}"

# Create release
gh release create "v$VERSION" \
    --repo "$REPO" \
    --title "Meridia IDE v$VERSION" \
    --notes "$RELEASE_NOTES" \
    "${ASSETS[@]}"

print_status "✅ Release v$VERSION created successfully!"
print_info "🌐 View release: https://github.com/$REPO/releases/tag/v$VERSION"

# Optional: Open release in browser
read -p "Open release in browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    gh release view "v$VERSION" --web --repo "$REPO"
fi
