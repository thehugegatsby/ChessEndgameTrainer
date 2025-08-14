# LLM Context Documentation

This directory contains context files specifically formatted for Large Language Models (LLMs) to quickly understand and work with the Chess Endgame Trainer codebase.

## 📁 Files

### `complete.md`
**Comprehensive Technical Overview**
- Complete architecture documentation
- All critical patterns and best practices
- WSL2 constraints and commands
- MCP tool selection matrix
- Optimized for single-model deep understanding

### `multi_model.md`
**Multi-LLM Optimized Context**
- Formatted for Gemini 2.5 Pro, GPT-5, O3, O4-Mini
- Instant orientation section for quick start
- Critical constraints prominently highlighted
- Anti-patterns and debugging guides
- Optimized for cross-model compatibility

## 🎯 Usage

### For AI Assistants
1. Load the appropriate context file based on your needs
2. `complete.md` for deep technical work
3. `multi_model.md` for quick orientation and general development

### For Developers
These files consolidate 45+ documentation files into AI-optimized formats. They serve as:
- Quick reference for AI pair programming
- Complete context for automated code reviews
- Training data for custom AI workflows

## 🔄 Maintenance

These files are generated from the project's documentation suite. When updating:
1. Modify source documentation in `docs/`
2. Regenerate these context files to maintain consistency
3. Ensure WSL2 constraints remain prominently featured

## 📊 Coverage

The context documentation covers:
- **Architecture**: Zustand store with 7 domain slices
- **Testing**: Vitest v3 migration (245 tests)
- **Features**: 4 bounded domains (chess-core, tablebase, training, move-quality)
- **Services**: TablebaseService, ChessService, AnalysisService
- **Standards**: TypeScript patterns, German UI text, component patterns
- **Workflow**: WSL2 commands, quality gates, MCP tool usage

---

Last Updated: 2025-01-14 | Vitest v3 Migration Complete