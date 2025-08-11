#!/bin/bash

# Run linter and analyze output
echo "=== ESLint Error Analysis ==="
echo ""

# Count errors vs warnings
echo "Total Issues:"
pnpm lint 2>&1 | grep -E "  (Error|Warning):" | awk '{print $2}' | sort | uniq -c

echo ""
echo "=== Error Categories ==="
echo ""

# Extract only errors and categorize them
pnpm lint 2>&1 | grep "  Error: " | sed 's/.*Error: //' | sed 's/  .*//' | sort | uniq -c | sort -rn

echo ""
echo "=== Top 10 Files with Errors ==="
echo ""

# Files with most errors
pnpm lint 2>&1 | grep "  Error: " | cut -d':' -f1 | sed 's/^//' | sort | uniq -c | sort -rn | head -10

echo ""
echo "=== Error Rules Breakdown ==="
echo ""

# Count by rule name
pnpm lint 2>&1 | grep "  Error: " | awk -F'  ' '{print $NF}' | sort | uniq -c | sort -rn