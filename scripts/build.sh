#!/bin/bash

# Build script for Meridia IDE
set -e

echo "Building Meridia IDE with Docker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[BUILD]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Parse command line arguments
PLATFORM=${1:-"all"}
CLEAN=${2:-"false"}

print_status "Building for platform: $PLATFORM"

# Clean previous builds if requested
if [ "$CLEAN" = "true" ]; then
    print_status "Cleaning previous builds..."
    rm -rf dist/*
    docker rmi meridia-builder 2>/dev/null || true
fi

# Build Docker image
print_status "Building Docker image..."
docker build -t meridia-builder .

# Create dist directory if it doesn't exist
mkdir -p dist

# Build based on platform
case $PLATFORM in
    "win"|"windows")
        print_status "Building Windows executable..."
        docker run --rm \
            -v "$(pwd)/dist:/app/dist" \
            -v "$(pwd)/.env:/app/.env:ro" \
            meridia-builder npm run build:win
        ;;
    "linux")
        print_status "Building Linux AppImage..."
        docker run --rm \
            -v "$(pwd)/dist:/app/dist" \
            -v "$(pwd)/.env:/app/.env:ro" \
            meridia-builder npm run build:linux
        ;;
    "all")
        print_status "Building for all platforms..."
        docker run --rm \
            -v "$(pwd)/dist:/app/dist" \
            -v "$(pwd)/.env:/app/.env:ro" \
            meridia-builder npm run build:all-platforms
        ;;
    *)
        print_error "Unknown platform: $PLATFORM"
        print_status "Available platforms: win, linux, all"
        exit 1
        ;;
esac

print_status "Build completed! Check the dist/ directory for your executables."

# List built files
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    print_status "Built files:"
    ls -la dist/
else
    print_warning "No files found in dist/ directory."
fi
