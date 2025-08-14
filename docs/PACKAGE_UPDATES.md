# Package Updates - 14. Januar 2025

## 📦 Aktuelle Package-Versionen

### Kritische Updates heute durchgeführt:

#### ⚠️ Tailwind CSS Downgrade (Breaking Change Fix)
- **Von**: `tailwindcss@4.1.12` + `@tailwindcss/postcss@4.1.12`
- **Nach**: `tailwindcss@3.4.17` (stable)
- **Grund**: Tailwind v4 hat massive Breaking Changes die die UI zerstört haben
- **Fix**: 
  - PostCSS config erstellt
  - CSS Syntax von `@import "tailwindcss"` zu `@tailwind base/components/utilities`
  - Next.js Cache gelöscht (`.next` Ordner)

#### ✅ Erfolgreiche Updates:
- `@tanstack/react-query`: 5.85.0 → 5.85.3
- `msw`: 2.10.4 → 2.10.5 (dev)

### Core Dependencies:

| Package | Version | Status |
|---------|---------|--------|
| next | 15.4.6 | ✅ Aktuell |
| react | 19.1.1 | ✅ Aktuell |
| react-dom | 19.1.1 | ✅ Aktuell |
| typescript | 5.9.2 | ✅ Aktuell |
| tailwindcss | 3.4.17 | ⚠️ v3 (nicht v4!) |
| zustand | 5.0.7 | ✅ Aktuell |
| @tanstack/react-query | 5.85.3 | ✅ Aktuell |
| vitest | 3.2.4 | ✅ Aktuell |

### Dev Dependencies:

| Package | Version | Status |
|---------|---------|--------|
| msw | 2.10.5 | ✅ Aktuell |
| @playwright/test | 1.53.2 | ✅ Aktuell |
| eslint | 9.31.0 | ✅ Aktuell |
| prettier | 3.6.2 | ✅ Aktuell |

## 🔧 Wichtige Hinweise

### Tailwind CSS v3 beibehalten!
- **NICHT** auf v4 updaten bis das Projekt migriert wurde
- v4 benötigt komplette Config-Überarbeitung
- Breaking Changes betreffen CSS imports und PostCSS setup

### PostCSS Configuration
Datei `postcss.config.js` muss vorhanden sein:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### CSS Import Syntax für v3:
```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 📝 Update-Befehle

```bash
# Check für outdated packages
pnpm outdated

# Update specific packages (safe)
pnpm update @tanstack/react-query msw

# WARNUNG: Tailwind v4 NICHT installieren!
# pnpm add -D tailwindcss@latest  # ❌ NICHT MACHEN
```

## 🚀 Nach Updates

1. Cache löschen: `rm -rf .next`
2. Dev Server neu starten: `pnpm run dev`
3. Tests laufen lassen: `pnpm test`
4. Lint & Typecheck: `pnpm run lint && pnpm tsc`