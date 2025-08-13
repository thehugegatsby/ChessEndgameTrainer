#!/bin/sh
# .husky/check-learnings.sh
# 
# Pre-commit hook to ensure LEARNINGS.md is updated when needed
# Can be bypassed with: SKIP_LEARNINGS_CHECK=1 git commit

# Check if LEARNINGS.md exists
if [ ! -f "docs/LEARNINGS.md" ]; then
  echo "⚠️  Warning: docs/LEARNINGS.md does not exist yet."
  echo "   Creating it now..."
  exit 0
fi

# Get list of staged files for analysis
STAGED_FILES=$(git diff --cached --name-only)

# Check if LEARNINGS.md is staged
if git diff --cached --quiet docs/LEARNINGS.md 2>/dev/null; then
  # Allow bypassing the check with an environment variable
  if [ "$SKIP_LEARNINGS_CHECK" = "1" ]; then
    echo "✓ Skipping LEARNINGS.md check (SKIP_LEARNINGS_CHECK=1)"
    exit 0
  fi

  # Optimize: Use already fetched STAGED_FILES instead of calling git diff again
  CHANGED_FILES=$(echo "$STAGED_FILES" | wc -l)
  
  # If only package files changed, it's probably a dependency update
  if echo "$STAGED_FILES" | grep -qE "^(package\.json|pnpm-lock\.yaml|package-lock\.json)$"; then
    ONLY_DEPS=$(echo "$STAGED_FILES" | grep -vE "^(package\.json|pnpm-lock\.yaml|package-lock\.json)$" | wc -l)
    if [ "$ONLY_DEPS" = "0" ]; then
      echo "✓ Dependency update detected - no learnings required"
      exit 0
    fi
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📝 LEARNING DOCUMENTATION REMINDER"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "No changes to docs/LEARNINGS.md detected."
  echo ""
  echo "Did this session produce any learnings about:"
  echo "  • Bug fixes or tricky issues?"
  echo "  • Architecture decisions?"
  echo "  • Performance optimizations?"
  echo "  • WSL/Environment quirks?"
  echo "  • Testing strategies?"
  echo ""
  echo "Options:"
  echo "  1. Add learning: Update docs/LEARNINGS.md and stage it"
  echo "  2. Skip check:   SKIP_LEARNINGS_CHECK=1 git commit ..."
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Non-zero exit blocks the commit
  exit 1
fi

echo "✓ LEARNINGS.md check passed - documentation updated!"
exit 0