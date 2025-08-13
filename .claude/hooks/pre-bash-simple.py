#!/usr/bin/env python3
"""
Simple WSL-Safety Hook - Alternative implementation
"""
import sys
import json
import re

# Read stdin
data = json.loads(sys.stdin.read())

# Only check Bash
if data.get("tool") != "Bash":
    sys.exit(0)

command = data.get("params", {}).get("command", "")

# Check dangerous patterns
patterns = [
    r'(pnpm|npm|node|tsx|jest).*2>&1',
    r'(pnpm|npm|node|tsx|jest).*\|',
    r'pnpm\s+test\s+.*--\s+'
]

for pattern in patterns:
    if re.search(pattern, command):
        print(f"❌ BLOCKED WSL-unsafe command: {command}", file=sys.stderr)
        sys.exit(2)

sys.exit(0)