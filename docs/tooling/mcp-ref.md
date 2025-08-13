# MCP REF Tools

<!-- nav: docs/tooling/mcp-overview | tags: [mcp, ref, documentation] | updated: 2025-08-13 -->

## Overview

The REF MCP server provides ultra-efficient documentation search capabilities. Always use this before WebSearch for documentation queries.

## Primary Tool

### `mcp__ref__ref_search_documentation`

**Purpose:** Search technical documentation efficiently  
**Token Impact:** ~54 tokens (vs 20,000+ for WebSearch)  
**Coverage:** Major frameworks, libraries, and platforms

## When to Use

### ✅ USE REF for:

- Framework documentation (React, Next.js, Vue, etc.)
- Library APIs (Zustand, React Query, etc.)
- Language references (JavaScript, TypeScript, Python)
- Platform docs (Node.js, Deno, Bun)
- Build tools (Webpack, Vite, ESBuild)
- Testing frameworks (Jest, Vitest, Playwright)

### ❌ DON'T use REF for:

- Project-specific documentation (use Read tool)
- Blog posts or tutorials (use WebSearch)
- GitHub issues/discussions (use WebSearch)
- Stack Overflow answers (use WebSearch)

## Usage Examples

### Example 1: Framework Pattern

```
Query: "React Router v7 loader pattern"
Tool: mcp__ref__ref_search_documentation
Result: Efficient retrieval of loader documentation
```

### Example 2: API Reference

```
Query: "Zustand persist middleware TypeScript"
Tool: mcp__ref__ref_search_documentation
Result: Direct access to persistence API docs
```

### Example 3: Error Resolution

```
Query: "Next.js Error: Hydration failed"
Tool: mcp__ref__ref_search_documentation
Result: Official troubleshooting guide
```

## Integration with Other Tools

### Documentation Search Workflow

1. **First:** Try `mcp__ref__ref_search_documentation`
2. **If not found:** Use WebSearch with specific domains
3. **For code examples:** Check project with Grep/Read
4. **For implementation:** Use appropriate Zen tool

### Combined Usage

```
1. REF: "Vitest mock modules"          // Get official approach
2. Grep: "mock|stub|spy"               // Find project examples
3. zen__testgen: Generate tests        // Apply knowledge
```

## Performance Comparison

| Method      | Token Usage    | Speed   | Accuracy            |
| ----------- | -------------- | ------- | ------------------- |
| REF         | ~54 tokens     | Instant | Official docs only  |
| WebSearch   | 20,000+ tokens | Slower  | Broader but noisier |
| Manual Read | Varies         | Fast    | Project-specific    |

## Best Practices

### Query Formulation

```
// Good: Specific and technical
"TypeScript discriminated unions exhaustive check"
"Vite dynamic import glob eager"

// Less effective: Too general
"how to use TypeScript"
"Vite configuration"
```

### Version Specificity

```
// Include version when relevant
"React Router v7 deferred data"
"Next.js 14 app router middleware"

// Omit for stable APIs
"Array.prototype.map MDN"
"CSS Grid specification"
```

## Common Patterns

### Learning New Framework

```
1. REF: "Framework getting started"
2. REF: "Framework core concepts"
3. REF: "Framework best practices"
4. Project: Apply to codebase
```

### Debugging Integration

```
1. Error occurs
2. REF: Search error message
3. REF: Check migration guides
4. Fix: Apply solution
```

### API Exploration

```
1. REF: "Library API reference"
2. REF: "Specific method documentation"
3. Code: Implement feature
```

## Limitations

- **Official docs only** - No community content
- **Major libraries** - May miss niche packages
- **English only** - Limited multilingual support
- **Current versions** - May lag on beta/RC docs

## Fallback Strategy

When REF doesn't have the documentation:

1. **Check project README** - Often has usage examples
2. **Search GitHub repo** - Look for /docs or /examples
3. **Use WebSearch** - For blog posts and tutorials
4. **Check npm/package page** - Basic usage info

## Token Optimization Tips

- Use REF first, always
- Batch related queries
- Cache results mentally
- Reference found docs in implementation
