# Claude Context MCP Server

## Overview

The Claude Context MCP server provides intelligent semantic search capabilities for your codebase. It indexes your project files and enables natural language queries to find relevant code snippets, making it easier to understand and navigate large codebases.

## Key Features

- **Semantic Search**: Search using natural language queries instead of exact text matching
- **Smart Indexing**: Automatically indexes supported file types with configurable splitters
- **Fast Retrieval**: Returns ranked results based on relevance
- **Flexible Configuration**: Support for custom file extensions and ignore patterns

## Installation

The server is already configured in `.mcp.json`:

```json
{
  "claude-context": {
    "command": "npx",
    "args": ["-y", "@zilliz/claude-context-mcp@latest"]
  }
}
```

## Usage Guide

### 1. Check Indexing Status

Before searching, verify if your codebase is indexed:

```
Tool: mcp__claude-context__get_indexing_status
Parameters:
- path: /absolute/path/to/project
```

### 2. Index Your Codebase

If not indexed, create the index:

```
Tool: mcp__claude-context__index_codebase
Parameters:
- path: /absolute/path/to/project
- splitter: "ast" (default) or "langchain"
- customExtensions: [".vue", ".svelte"] (optional)
- ignorePatterns: ["dist/**", "*.tmp"] (optional)
- force: false (set true to re-index)
```

**Splitter Options:**

- `ast`: Syntax-aware splitting with automatic fallback (recommended)
- `langchain`: Character-based splitting for general text

### 3. Search Your Code

Use natural language to find relevant code:

```
Tool: mcp__claude-context__search_code
Parameters:
- path: /absolute/path/to/project
- query: "authentication middleware implementation"
- limit: 10 (max 50)
- extensionFilter: [".ts", ".tsx"] (optional)
```

### 4. Clear Index (if needed)

Remove the index to free space or force fresh indexing:

```
Tool: mcp__claude-context__clear_index
Parameters:
- path: /absolute/path/to/project
```

## Common Use Cases

### Finding Implementations

```
Query: "user authentication logic"
Returns: Auth services, middleware, login components
```

### Understanding Architecture

```
Query: "state management store configuration"
Returns: Store setup, reducers, state interfaces
```

### Locating Bug-Prone Areas

```
Query: "error handling try catch"
Returns: All error handling patterns in codebase
```

### Discovering Similar Code

```
Query: "dialog modal component"
Returns: All dialog/modal implementations
```

### Refactoring Assistance

```
Query: "database connection setup"
Returns: All DB configuration and connection code
```

## Best Practices

### 1. Index Management

- Index once at project start
- Re-index after major structural changes
- Use `force: true` only when necessary

### 2. Query Optimization

- Use descriptive natural language
- Include technical terms when specific
- Combine concepts for better results

### 3. Filter Usage

- Use `extensionFilter` to narrow results
- Adjust `limit` based on needs (default 10)
- Higher limits for exploration, lower for specific searches

## Integration with EndgameTrainer

### Project-Specific Patterns

The EndgameTrainer codebase benefits from semantic search for:

1. **Feature Location**: Finding chess logic implementations
2. **Test Discovery**: Locating related test files
3. **State Management**: Understanding Zustand store structure
4. **Component Search**: Finding React components and hooks

### Example Queries for EndgameTrainer

```
# Find chess move validation
"move validation chess rules"

# Locate endgame evaluation
"tablebase evaluation endgame"

# Find training components
"training mode React component"

# Discover store actions
"zustand store actions mutations"
```

## Troubleshooting

### Index Not Found

- Ensure absolute paths are used
- Check if indexing completed successfully
- Verify no permission issues

### No Results

- Try broader search terms
- Check if files are excluded by ignore patterns
- Verify file extensions are included

### Slow Performance

- Consider reducing search limit
- Re-index with optimized splitter
- Check system resources

## Performance Tips

1. **Initial Indexing**: May take 30-60 seconds for large projects
2. **Search Speed**: Typically returns results in <1 second
3. **Memory Usage**: Index stored efficiently in memory
4. **Concurrent Searches**: Supported without performance degradation

## Configuration Examples

### Standard Web Project

```json
{
  "path": "/home/user/project",
  "splitter": "ast",
  "customExtensions": [".vue", ".scss"],
  "ignorePatterns": ["dist/**", "node_modules/**"]
}
```

### Documentation-Heavy Project

```json
{
  "path": "/home/user/docs-project",
  "splitter": "langchain",
  "customExtensions": [".md", ".mdx", ".rst"],
  "limit": 20
}
```

### Monorepo Setup

```json
{
  "path": "/home/user/monorepo/packages/core",
  "ignorePatterns": ["**/node_modules/**", "**/dist/**"],
  "force": true
}
```

## See Also

- [MCP Overview](mcp-overview.md)
- [MCP Organization](mcp-organization.md)
- [Development Setup](../../CLAUDE.md)
