#!/usr/bin/env python3
"""
WSL-Safety Hook for Claude Code
Prevents crashes by blocking Node.js commands with pipes/redirects in WSL
"""

import sys
import json
import re

# Read the incoming tool call data
try:
    input_data = sys.stdin.read()
    # Debug: Log what we receive
    with open("/tmp/hook_debug.log", "a") as f:
        f.write(f"Received input: {input_data}\n")
    data = json.loads(input_data)
except json.JSONDecodeError as e:
    # Log parsing error but allow command to continue
    with open("/tmp/hook_debug.log", "a") as f:
        f.write(f"JSON parse error: {e}\nInput was: {input_data}\n")
    print(f"Hook: Failed to parse JSON: {e}", file=sys.stderr)
    sys.exit(0)

# Only check Bash tool calls
if data.get("tool") != "Bash":
    sys.exit(0)

# Get the command being executed
command = data.get("params", {}).get("command", "")

# Define dangerous patterns for WSL + Node.js
dangerous_patterns = [
    # Node.js tools with stderr redirect
    r'(pnpm|npm|node|tsx|jest).*2>&1',
    # Node.js tools with pipes
    r'(pnpm|npm|node|tsx|jest).*\|',
    # pnpm test with double dash (also problematic in WSL)
    r'pnpm\s+test\s+.*--\s+',
]

# Check each pattern
for pattern in dangerous_patterns:
    if re.search(pattern, command):
        # Block the command with clear error message
        error_message = f"""❌ BLOCKED: This command will crash in WSL!
Command: {command}

Problem: Pipes and redirects crash with Node.js tools in WSL
Solution: Run the command directly without pipes/redirects

Examples:
  ❌ pnpm test 2>&1 | tail
  ✅ pnpm test

See: CLAUDE.md for WSL constraints"""
        
        print(error_message, file=sys.stderr)
        sys.stderr.flush()  # Ensure output is flushed
        
        # Exit code 2 blocks the command (Claude Code documentation)
        sys.exit(2)

# Allow all other commands
sys.exit(0)