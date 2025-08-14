#!/bin/bash

# EndgameTrainer Development Server Startup Script
# This script starts the local development environment with MCP server

set -e  # Exit on error

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLAUDE_SETTINGS="$PROJECT_DIR/.claude/settings.local.json"
MCP_CONFIG="$PROJECT_DIR/.mcp.json"

echo "🏁 Starting EndgameTrainer Development Environment..."

# Check if local Claude settings exist
if [ ! -f "$CLAUDE_SETTINGS" ]; then
    echo "⚠️  Local Claude settings not found. Creating from example..."
    cp "$PROJECT_DIR/.claude/settings.local.example" "$CLAUDE_SETTINGS"
    echo "✅ Created $CLAUDE_SETTINGS"
    echo "💡 You can customize your local settings now if needed."
fi

# Check if MCP config exists
if [ ! -f "$MCP_CONFIG" ]; then
    echo "❌ MCP configuration not found at $MCP_CONFIG"
    exit 1
fi

echo "✅ Claude settings: $CLAUDE_SETTINGS"
echo "✅ MCP config: $MCP_CONFIG"

# Check if zen test server exists
ZEN_SERVER_PATH="$HOME/services/mcp-servers/zen-test-server"
if [ ! -d "$ZEN_SERVER_PATH" ]; then
    echo "⚠️  Zen test server not found at $ZEN_SERVER_PATH"
    echo "💡 Run: mv /path/to/old/zen-mcp-server $ZEN_SERVER_PATH"
    exit 1
fi

echo "✅ Zen test server found at $ZEN_SERVER_PATH"

# Start the development server
echo ""
echo "🚀 Starting pnpm dev server..."
echo "   Claude Code will connect to MCP servers automatically"
echo "   MCP servers configured in: $MCP_CONFIG"
echo ""

cd "$PROJECT_DIR"
exec pnpm run dev