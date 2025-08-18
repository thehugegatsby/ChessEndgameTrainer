# WSL Setup Guide - EndgameTrainer

> **Erstellt:** 2025-08-18  
> **Zweck:** Komplette WSL Neuinstallation und Projekt-Setup

## 🚀 WSL2 Fresh Installation

### 1. WSL2 Basis Installation (Windows PowerShell als Admin)
```powershell
# WSL installieren mit Ubuntu
wsl --install -d Ubuntu

# WSL2 als Default setzen
wsl --set-default-version 2

# Ubuntu starten und User/Password einrichten
wsl
```

### 2. Ubuntu Basis Updates
```bash
# System updaten
sudo apt update && sudo apt upgrade -y

# Build essentials
sudo apt install -y build-essential curl git wget
```

## 📦 Development Environment Setup

### Node.js 20 LTS + pnpm
```bash
# Node.js 20 installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm global installieren
npm install -g pnpm

# Versions prüfen
node --version  # sollte v20.x.x sein
pnpm --version  # sollte 8.x.x oder höher sein
```

### Git Konfiguration
```bash
# Git User Setup
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# GitHub SSH Key (optional aber empfohlen)
ssh-keygen -t ed25519 -C "your.email@example.com"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub  # Diesen Key bei GitHub hinzufügen
```

## 🎯 EndgameTrainer Project Setup

### Repository klonen und installieren
```bash
# Mit HTTPS (einfacher)
git clone https://github.com/[username]/EndgameTrainer.git
cd EndgameTrainer

# Mit SSH (wenn SSH Key eingerichtet)
git clone git@github.com:[username]/EndgameTrainer.git
cd EndgameTrainer

# Dependencies installieren
pnpm install

# Playwright Browser installieren (für E2E Tests)
pnpm exec playwright install chromium
```

### Environment Variables
```bash
# .env.local erstellen (falls nicht vorhanden)
cp .env.example .env.local  # Falls example existiert

# Oder manuell erstellen
cat > .env.local << 'EOF'
# Development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_IS_E2E_TEST=false

# Firebase (optional)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
EOF
```

## 🔧 VS Code Setup (Optional aber empfohlen)

### VS Code in WSL installieren
```bash
# VS Code Server wird automatisch installiert beim ersten Mal:
code .

# Extensions die automatisch synchronisiert werden sollten:
# - ESLint
# - Prettier
# - TypeScript and JavaScript Language Features
# - Tailwind CSS IntelliSense
```

## ✅ Projekt Validierung

### Alle wichtigen Commands testen
```bash
# Development Server starten
pnpm run dev
# → Sollte auf http://localhost:3000 laufen

# TypeScript prüfen
pnpm tsc
# → Sollte ohne Errors durchlaufen

# Linting
pnpm run lint
# → Sollte ohne Errors durchlaufen

# Tests ausführen
pnpm test
# → Sollte Tests ausführen (kann Warnings haben)

# Build testen
pnpm run build
# → Sollte erfolgreich builden
```

## 🎮 MCP (Model Context Protocol) Setup

### Claude Desktop App Konfiguration
```bash
# MCP config sollte automatisch funktionieren
# Falls nicht, prüfen:
cat .mcp.json

# MCP Server starten (automatisch bei pnpm run dev)
# Oder manuell:
npx @modelcontextprotocol/server-playwright
```

## 📁 Wichtige Projekt-Struktur

```
EndgameTrainer/
├── src/
│   ├── app/              # Next.js 15 App Router
│   ├── domains/           # Domain-Driven Design
│   │   ├── evaluation/    # Tablebase Services
│   │   └── game/          # Chess Logic
│   ├── features/          # Feature-basierte Module
│   ├── shared/            # Gemeinsame Komponenten
│   └── tests/             # Test-Dateien
├── config/                # Konfigurationsdateien
├── docs/                  # Dokumentation
├── CLAUDE.md             # AI Assistant Instructions
├── SCRATCHPAD.md         # Session Memory
└── package.json          # Dependencies
```

## 🐛 Bekannte WSL-spezifische Probleme

### 1. File Watching Issues
```bash
# Falls hot-reload nicht funktioniert
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 2. Port bereits belegt
```bash
# Port-Prozess finden und beenden
lsof -ti:3000 | xargs kill -9
# oder
pkill -f "next dev"
```

### 3. Permissions Issues
```bash
# Falls Permission Errors
chmod -R 755 node_modules
chmod -R 755 .next
```

### 4. Performance Optimierung
```bash
# WSL2 .wslconfig (in Windows User Home)
# %USERPROFILE%\.wslconfig
[wsl2]
memory=8GB
processors=4
swap=2GB
```

## 🚦 Quick Start Checkliste

- [ ] WSL2 Ubuntu installiert
- [ ] Node.js 20 LTS installiert
- [ ] pnpm global installiert
- [ ] Git konfiguriert
- [ ] Repository geklont
- [ ] `pnpm install` erfolgreich
- [ ] `pnpm run dev` startet auf localhost:3000
- [ ] Chess Board wird angezeigt
- [ ] `pnpm tsc` läuft ohne Errors
- [ ] `pnpm run lint` läuft ohne Errors

## 📝 Projekt-spezifische Configs

### Package.json Scripts die funktionieren
```json
{
  "dev": "next dev",
  "build": "next build",
  "test": "vitest run",
  "test:watch": "vitest watch",
  "test:e2e": "playwright test",
  "lint": "next lint",
  "typecheck": "tsc --noEmit"
}
```

### Versions-Requirements
- Node.js: 20.x oder höher
- pnpm: 8.x oder höher
- Next.js: 15.x
- React: 19.x
- TypeScript: 5.x

## 💡 Tipps für effizientes Arbeiten

1. **Terminal Multiplexer:** tmux oder Windows Terminal mit mehreren Tabs
2. **Aliases einrichten:** 
   ```bash
   alias dev="pnpm run dev"
   alias test="pnpm test"
   alias build="pnpm run build"
   ```
3. **Git Aliases:**
   ```bash
   git config --global alias.st status
   git config --global alias.co checkout
   git config --global alias.br branch
   ```

## 🔄 Nach WSL Reset - Erste Schritte

1. **Dieses Dokument folgen** für komplettes Setup
2. **CLAUDE.md prüfen** für AI Assistant Context
3. **SCRATCHPAD.md lesen** für aktuellen Projekt-Status
4. **pnpm run dev** starten und testen
5. **Git History prüfen** für letzte Änderungen

---
**Success Metric:** Wenn `pnpm run dev` läuft und Chess Board auf localhost:3000 angezeigt wird, ist Setup erfolgreich! 🎉