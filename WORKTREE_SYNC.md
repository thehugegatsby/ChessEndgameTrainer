# 🔄 Worktree Sync Instructions

## Nach Installation neuer Dependencies in Main:

```bash
# Im Worktree ausführen:
cd /home/thehu/coolProjects/EndgameTrainer-122
pnpm install

# Das holt die neuen Dependencies aus dem verlinkten pnpm-lock.yaml
```

## Warum ist das nötig?

- `pnpm-lock.yaml` ist ein Symlink zur Main ✅
- `node_modules` ist NICHT verlinkt (jeder Worktree hat seine eigene) ✅
- Wenn Main neue Dependencies bekommt, muss der Worktree diese auch installieren

## Quick Commands:

```bash
# Von Main aus:
pnpm add -D some-package        # Neue Dev-Dependency
cd ../EndgameTrainer-122 && pnpm install  # Sync Worktree

# Oder als One-Liner:
pnpm add -D some-package && (cd ../EndgameTrainer-122 && pnpm install)
```
