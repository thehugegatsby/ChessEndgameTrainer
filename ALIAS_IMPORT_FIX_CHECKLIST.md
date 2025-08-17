# 🔧 Alias Import Resolution Fix - Temporäre Arbeitsanleitung

## 📋 Aktueller Status: Test-Umgebung kann @shared/* Imports nicht auflösen

### 🔍 Problem-Diagnose (Abgeschlossen)
- [x] **Root Cause identifiziert:** Dual-Konfiguration zwischen tsconfig.json und vitest.config.ts
- [x] **Umfang analysiert:** 176 Dateien nutzen @shared imports, 131 nutzen relative imports
- [x] **Fehlerquelle lokalisiert:** vite-tsconfig-paths Plugin kann nicht konsistent auflösen

### 🎯 Strategische Entscheidung (Getroffen)
**Gewählte Strategie:** Option 1 - Alias-Konfiguration reparieren & standardisieren

**Warum diese Strategie:**
- ✅ 176 Dateien nutzen bereits @shared erfolgreich
- ✅ Industry Standard für große React/Next.js Projekte  
- ✅ Einfache Refactoring-Operationen beim Verschieben von Dateien
- ✅ Bessere Lesbarkeit: `@shared/components/Button` vs `../../../../shared/components/Button`

---

## 🚀 Implementierung Checkliste

### Phase 1: Konfiguration reparieren
- [x] **Vitest-Duplikat entfernen:** Redundante `resolve.alias` aus vitest.config.ts entfernt
- [x] **tsconfig.json konsistent machen:** Alle Pfade mit `./` Prefix versehen
- [ ] **Alias-Konfiguration erweitern:** Wildcards korrekt in Vitest handhaben

### Phase 2: Vitest Alias-Resolution fixen
- [x] **vite-tsconfig-paths Plugin-Reihenfolge korrigiert:** tsconfigPaths() vor react() Plugin
- [x] **Test ausführen:** EndgameTrainingPage.integration.test.tsx - IMMER NOCH FEHLER
- [ ] **Cache löschen:** Vite/Vitest Cache komplett leeren 
- [ ] **Fallback-Alias hinzufügen:** Explizite Vitest-Aliase als Backup

### Phase 3: Systematische Bereinigung
- [ ] **Test-Dateien konvertieren:** Alle relative imports in Tests zu @shared
- [ ] **Konsistenz prüfen:** Sicherstellen dass alle @shared/* imports funktionieren
- [ ] **ESLint-Regel hinzufügen:** Verhindern von tiefen relativen imports

### Phase 4: Validierung
- [ ] **Alle Tests laufen lassen:** Vollständige Test-Suite ausführen
- [ ] **Build testen:** Production Build läuft ohne Fehler
- [ ] **TypeScript Check:** `pnpm tsc` ohne Errors

---

## 🛠️ Aktuelle Vitest-Konfiguration (Reparatur erforderlich)

### Problem: vite-tsconfig-paths Plugin erkennt Wildcards nicht korrekt

```typescript
// config/testing/vitest.config.ts - AKTUELLER ZUSTAND
export default defineConfig({
  plugins: [react(), tsconfigPaths()], // ← Plugin ist da, aber funktioniert nicht
  resolve: {
    // alias: { ... } ← ENTFERNT (war Duplikat)
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
});
```

### Lösung: Explizite Wildcard-Behandlung hinzufügen

```typescript
// ZIEL-KONFIGURATION (zu implementieren)
resolve: {
  alias: [
    { find: /^@shared\/(.*)$/, replacement: path.resolve(sharedDir, '$1') },
    { find: /^@features\/(.*)$/, replacement: path.resolve(featuresDir, '$1') },
    { find: /^@tests\/(.*)$/, replacement: path.resolve(testsDir, '$1') },
    { find: '@', replacement: srcDir },
  ],
  extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
},
```

---

## ⚠️ Bekannte Probleme & Lösungsansätze

### Problem 1: EndgameTrainingPage Component
```
Error: Cannot find package '@shared/services/logging' imported from 
/home/thehu/coolProjects/EndgameTrainer/src/shared/pages/EndgameTrainingPage.tsx
```

**Ursache:** Component selbst nutzt @shared imports die in Tests fehlschlagen
**Lösung:** Vitest Alias-Resolution für gesamte Dependency-Chain reparieren

### Problem 2: Wildcard-Pattern nicht erkannt
```
tsconfig.json: "@shared/*": ["./src/shared/*"]  ← Wildcard
vitest resolve: "@shared": sharedDir            ← Kein Wildcard
```

**Ursache:** vite-tsconfig-paths Plugin behandelt Wildcards inkonsistent
**Lösung:** Regex-basierte Alias-Resolution (siehe Ziel-Konfiguration oben)

---

## 🎯 Nächste Schritte (Priorität)

1. **[SOFORT]** Cache löschen: `pnpm clean && rm -rf node_modules/.vite && rm -rf .cache`
2. **[DANN]** Test erneut ausführen: `pnpm test:file EndgameTrainingPage.integration.test.tsx`
3. **[FALLS FEHLER]** Explizite Regex-Aliases in Vitest-Konfiguration hinzufügen
4. **[BEI ERFOLG]** Alle Test-Dateien auf @shared imports konvertieren
5. **[ABSCHLUSS]** ESLint-Regel gegen tiefe relative imports

---

## 📊 Erfolgs-Metriken

- [ ] **0 Test-Failures** durch Import-Resolution
- [ ] **Alle 176 @shared-Dateien** funktionieren in Tests
- [ ] **Konsistente Import-Strategie** im gesamten Codebase
- [ ] **ESLint-Rule aktiv** verhindert zukünftige relative import problems

---

*Diese Datei wird gelöscht sobald alle Checkboxen abgehakt sind und die Alias-Imports stabil funktionieren.*