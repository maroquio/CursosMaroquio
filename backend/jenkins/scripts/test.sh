#!/bin/bash
# =============================================================================
# Test Script for Jenkins
# =============================================================================
# Usage: ./jenkins/scripts/test.sh
# =============================================================================

set -e

echo "=========================================="
echo "Running Tests"
echo "=========================================="

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    bun install --frozen-lockfile
fi

# Run type check
echo "Running type check..."
bun run type-check

# Run tests with JUnit reporter (for Jenkins)
echo "Running unit tests..."
mkdir -p test-results

# Try to run with JUnit reporter, fallback to standard if not available
if bun test --help 2>&1 | grep -q "reporter"; then
    bun test --reporter=junit --outputFile=test-results/junit.xml
else
    bun test
fi

echo "=========================================="
echo "All tests passed!"
echo "=========================================="
