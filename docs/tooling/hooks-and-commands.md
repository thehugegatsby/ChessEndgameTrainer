# Claude Code Hooks & Custom Commands

<!-- nav: docs/README#environment | tags: [hooks, commands] | updated: 2025-08-12 -->

This document tracks all hooks and custom commands configured for the EndgameTrainer project.

## Overview

Hooks are automated scripts that run at specific Claude Code events to enforce project rules, prevent errors, and improve workflow efficiency.

## Active Hooks

### 1. WSL-Safety Hook (pre-bash)

**Purpose:** Prevents WSL crashes caused by piping/redirecting Node.js commands

**Type:** `pre-bash` - Runs before every Bash command

**Problem it solves:**

- Claude Code frequently generates commands like `pnpm test 2>&1 | tail`
- These commands cause hangs/crashes in WSL with Node.js tools
- Manual correction is needed every time

**What it blocks:**

- Any Node.js tool (pnpm, npm, node, tsx, jest) combined with:
  - `2>&1` (stderr redirection)
  - `|` (pipes)
  - `--` with pnpm test

**Examples of blocked commands:**

- ❌ `pnpm test 2>&1 | tail`
- ❌ `npm run build 2>&1`
- ❌ `node script.js | grep error`
- ❌ `pnpm test -- --run`

**Examples of allowed commands:**

- ✅ `pnpm test`
- ✅ `npm run build`
- ✅ `node script.js`
- ✅ `pnpm test path/to/test.tsx`

**Implementation:** See `.claude/hooks/pre-bash-wsl-safety.py`

---

## Planned Hooks

_Future hooks will be documented here as they are implemented_

## Custom Commands

_Custom commands will be documented here as they are created_

## Hook Development Guidelines

1. **Naming Convention:**
   - Pattern: `{event}-{purpose}.{ext}`
   - Example: `pre-bash-wsl-safety.py`

2. **Location:**
   - All hooks in `.claude/hooks/`
   - Make executable with `chmod +x`

3. **Exit Codes:**
   - `0` = Allow command
   - `2` = Block command with error message (per Claude Code docs)
   - **KNOWN ISSUE**: Exit codes may not work as expected in all environments

4. **Testing:**
   - Test with problematic patterns
   - Verify allowed commands still work
   - Document test cases

## Current Status

**❌ HOOKS DEFINITIV DEFEKT - KONFIGURATION ENTFERNT**

**Update 2025-08-13**: Hook-System ist fundamentell defekt. Konfiguration wurde aus `.claude/settings.local.json` entfernt bis Claude Code das Problem behebt.

**Latest Investigation Results (2025-08-12)**:

### Current Evidence

- ✅ Hook wird geladen ("Running hook" sichtbar in UI)
- ❌ Hook-Commands werden nicht ausgeführt (keine Log-Dateien erstellt)
- ❌ Exit Code 2 blockiert Commands nicht
- ❌ Echo-Commands in Hooks erzeugen keine Ausgabe
- ❌ Python-Script wird nicht aufgerufen (kein Debug-Log)

### Multiple Hook Types Tested

- **PreToolUse**: Python-Script + Echo-Commands (beide nicht ausgeführt)
- **PostToolUse**: Echo-Commands (nicht ausgeführt)
- **notification**: Echo-Commands (nicht ausgeführt)
- **stop**: Echo-Commands (nicht ausgeführt)

### Core Problem

**Hook-Runner startet, aber Commands innerhalb der Hooks werden nicht ausgeführt.**

**Comprehensive Investigation Results (2025-08-13)**:

### Environment Details

- **Claude Code Version**: 1.0.77 (downgrade to 1.0.48 also tested - same issue)
- **Platform**: WSL2 Ubuntu on Windows
- **Project Location**: `/home/thehu/` (Linux filesystem, NOT /mnt/c)
- **Node.js**: v22.17.0

### Tests Performed

1. **Hook Script Functionality**: ✅ Works manually with correct exit codes
2. **Project-Level Config**: ❌ `.claude/settings.local.json` - not executed
3. **User-Level Config**: ❌ `~/.claude/settings.json` - not executed
4. **Simple Hook Test**: ❌ Minimal `echo` command - not executed
5. **Multiple Syntax Variants**: ❌ All failed

### Configuration Syntaxes Tested

#### 1. Original Complex Syntax (Failed)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": {
          "tools": ["Bash"]
        },
        "hooks": [
          {
            "type": "command",
            "command": "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/pre-bash-wsl-safety.py"
          }
        ]
      }
    ]
  }
}
```

#### 2. Corrected Syntax from GitHub Issues (Failed)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'hook test' >> log.file"
          }
        ]
      }
    ]
  }
}
```

#### 3. Simple cctoast-wsl Style (Failed)

```json
{
  "hooks": {
    "notification": ["echo 'notification hook' >> log.file"],
    "stop": ["echo 'stop hook' >> log.file"]
  }
}
```

### Research Findings

#### Known Issues

- **GitHub #3579**: User settings hooks not loading in v1.0.51-1.0.52 (still open)
- **GitHub #2906**: Excessive settings.json I/O in WSL (1000x/sec)
- **GitHub #3091**: Project-level hooks not working
- **GitHub #3417**: Hooks DO work in WSL for some users (contradicts our experience)

#### Multi-LLM Analysis

- Consulted 5 different LLMs via MCP tools
- Consensus: Likely Claude Code bug in hook loading system
- inotify limitations ruled out (project on Linux filesystem)

### Diagnostic Evidence

- **No log files created**: None of the test hooks created any output files
- **No error messages**: Claude Code provides no feedback about hook failures
- **Manual execution works**: All hook scripts function correctly when run manually
- **Version independence**: Problem exists in both 1.0.48 and 1.0.77

### Root Cause Assessment

**Hook-Runner lädt und startet, aber Hook-Commands werden überhaupt nicht ausgeführt.**

**Evidence 2025-08-12:**

- ✅ Hook-System wird geladen ("Running hook" message visible)
- ❌ Hook-Commands werden nicht ausgeführt (keine Logs, keine Exit-Codes)
- ❌ Weder Python-Scripts noch einfache Echo-Commands funktionieren
- **Problem**: Fundamentaler Bug in Hook-Command-Execution

Not caused by:

- ❌ Script syntax errors (manual execution works)
- ❌ File permissions (chmod +x applied)
- ❌ WSL filesystem issues (project on Linux FS)
- ❌ Version-specific regression (tested multiple versions)
- ❌ Configuration syntax (multiple formats tested)

### Current Workaround

**Package.json Redirects implementiert** - Falsche Test-Commands (`pnpm run test:vitest`) zeigen Warnung und leiten automatisch zum richtigen Command um. Siehe `package.json` Scripts.

### Failed Workaround Attempts

1. **Wrapper-Script Approach**: Shell-Redirects (`2>&1`) werden vor Script-Ausführung verarbeitet - Wrapper kann sie nicht abfangen
2. **Multiple Hook Types**: PreToolUse, PostToolUse, notification, stop - alle zeigen gleiches Problem
3. **Simple vs Complex Commands**: Sowohl einfache echo-Commands als auch Python-Scripts werden nicht ausgeführt

### Recommended Actions

1. **Report comprehensive bug** to Claude Code team with full diagnostic data
2. **Monitor GitHub issues** #3579, #3091 for resolution
3. **Continue manual validation** until hooks are functional
4. **Document hook requirements** in CLAUDE.md for future reference

## References

- [Claude Code Hooks Documentation](https://github.com/anthropics/claude-code)
- [Hook Examples Repository](https://github.com/disler/claude-code-hooks-mastery)
