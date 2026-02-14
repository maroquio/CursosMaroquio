#!/bin/bash
# =============================================================================
# Build Script for Jenkins
# =============================================================================
# Usage: ./jenkins/scripts/build.sh [version]
# =============================================================================

set -e

VERSION=${1:-$(git rev-parse --short HEAD)}
APP_NAME="typescript-bun-backend"

echo "=========================================="
echo "Building ${APP_NAME} v${VERSION}"
echo "=========================================="

# Install dependencies
echo "Installing dependencies..."
bun install --frozen-lockfile

# Type check
echo "Running type check..."
bun run type-check

# Build application
echo "Building application..."
bun run build

# Build Docker image
echo "Building Docker image..."
docker build \
    -t ${APP_NAME}:${VERSION} \
    -t ${APP_NAME}:latest \
    --build-arg BUILD_VERSION=${VERSION} \
    --build-arg BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
    .

echo "=========================================="
echo "Build complete: ${APP_NAME}:${VERSION}"
echo "=========================================="
