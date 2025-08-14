# MCP Server Organization

## Overview

This document describes how MCP servers are organized in the EndgameTrainer project following modern best practices for 2025.

## Organization Principles

### 1. **Scope-based Organization**
- **Project Scope**: Team-shared servers (checked into git)
- **Local Scope**: Personal development configurations
- **Central Services**: Shared infrastructure for testing/staging

### 2. **Directory Structure**

```
~/projects/EndgameTrainer/          # Your project
├── .claude/
│   ├── settings.local.json        # Personal settings (gitignored)
│   └── settings.local.example     # Team template (checked in)
├── .mcp.json                      # Project-scoped MCP servers
├── scripts/start-dev.sh           # Dev environment startup
└── docs/tooling/                  # This documentation

~/mcp-servers/                     # Central services
├── zen-test-server/               # Shared test environment
└── other-shared-tools/            # Other centralized services
```

## Configuration Files

### `.mcp.json` (Project-scoped, checked in)
Contains MCP servers that the entire team uses:

```json
{
  "$schema": "https://json.schemastore.org/mcp.json",
  "mcpServers": {
    "claude-context": {
      "command": "npx",
      "args": ["-y", "@zilliz/claude-context-mcp@latest"]
    },
    "zen": {
      "command": "python",
      "args": ["~/mcp-servers/zen-test-server/server.py"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

### `.claude/settings.local.json` (Personal, gitignored)
Contains personal Claude Code settings including permissions and hooks:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "mcp__zen__challenge",
      "Bash(npm run dev:*)",
      // ... personal permissions
    ]
  },
  "hooks": {
    // Personal development hooks
  }
}
```

## Workflows

### For New Developers

1. **Clone and setup:**
   ```bash
   git clone <repo>
   cd EndgameTrainer
   cp .claude/settings.local.example .claude/settings.local.json
   ```

2. **Start development:**
   ```bash
   ./scripts/start-dev.sh
   ```

### For Local Development

- Use `./scripts/start-dev.sh` for complete environment setup
- MCP servers start automatically based on `.mcp.json`
- Personal settings are isolated and don't affect other developers
- Claude Context indexes codebase on first use for semantic search

### For Shared Testing

- Central test server runs at `~/mcp-servers/zen-test-server/`
- Accessible by multiple developers/CI systems
- Managed separately from individual projects

## Benefits of This Structure

1. **Isolation**: Each developer has their own local environment
2. **Reproducibility**: New developers can set up quickly
3. **Consistency**: Shared servers ensure consistent test environments
4. **Maintainability**: Clear separation of concerns
5. **Scalability**: Easy to add new servers or projects

## Migration Notes

This structure was established to resolve confusion between project-local and central MCP servers. The old structure with mixed locations has been reorganized into this clear, scope-based system.

## See Also

- [Claude Context MCP](mcp-claude-context.md)
- [WSL2 Environment Guide](../guides/wsl2.md)
- [MCP Tools Overview](mcp-overview.md)
- [Development Setup](../../CLAUDE.md)