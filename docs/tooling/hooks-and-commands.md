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

**⚠️ HOOK FUNCTIONALITY ISSUE**

**Problem**: Der WSL-Safety Hook wird trotz korrekter Konfiguration nicht ausgeführt oder ignoriert Exit-Codes.

**Investigation Results**:

- Hook-Skript funktioniert korrekt (Exit-Code 0/2)
- Konfiguration entspricht Claude Code-Dokumentation
- Verschiedene Exit-Codes getestet (1, 2, 3, 125, 126, 127)
- Sowohl einfache als auch strukturierte Hook-Konfiguration getestet
- Debug-Hook wird nicht aufgerufen

**Possible Causes**:

1. Claude Code Hook-System funktioniert nicht in dieser Umgebung
2. Hooks erfordern Session-Neustart oder andere Aktivierung
3. WSL-spezifische Probleme mit Hook-Ausführung
4. Claude Code Version unterstützt Hooks nicht vollständig

**Workaround**: Manual validation required until hooks work properly

**Next Steps**:

1. Session restart to test hook activation
2. Report issue to Claude Code team
3. Consider alternative validation strategies

## References

- [Claude Code Hooks Documentation](https://github.com/anthropics/claude-code)
- [Hook Examples Repository](https://github.com/disler/claude-code-hooks-mastery)
