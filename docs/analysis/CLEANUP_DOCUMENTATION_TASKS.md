# 🧹 Dokumentations-Bereinigung Tasks

**Priorität**: MITTEL  
**Zeitrahmen**: 1-2 Tage  
**Fokus**: Konsistenz, Aktualität, Struktur  

## 📝 Identifizierte Dokumentations-Probleme

### 1. Inkonsistenzen zwischen Dokumenten

| Problem | Dateien | Details |
|---------|---------|---------|
| Port-Nummern | README.md, CLAUDE.md | 3000 vs 3001 vs 3002 |
| Test-Zahlen | README.md, CLAUDE.md, Migration Reports | 787 vs 1100 vs 1085 |
| Endspiel-Anzahl | README.md, CLAUDE.md | 16 vs 6 vs 7 Positionen |
| chess.ts Zeilen | CLAUDE.md | "nur 5" vs tatsächlich 91 |

### 2. Veraltete oder fehlerhafte Referenzen

- `ARCHITECTURE_ANALYSIS.md` - referenziert aber existiert nicht
- `archive/` Ordner - erwähnt aber nicht vorhanden
- Zukunftsdaten "2025-07-07" in mehreren Dateien

### 3. Doppelte Dateien

- `/docs/migration-reports/zustand-migration-2025-01-07.md`
- `/docs/migration-reports/zustand-migration-final-2025-01-07.md`

---

## ✅ Bereinigungsaufgaben

### Task 1: Inkonsistenzen beheben

#### **1.1 Port-Nummer vereinheitlichen**
```bash
# Korrekt ist Port 3002 (laut package.json)
```

**Files to update:**
- [ ] `README.md` - Zeile 101: Change "3001" → "3002"
- [ ] `CLAUDE.md` - Zeile 56: Change "3000" → "3002"
- [ ] Search for other occurrences:
  ```bash
  grep -r "localhost:300[0-9]" docs/ README.md CLAUDE.md --exclude="*.md"
  ```

#### **1.2 Test-Zahlen synchronisieren**
```bash
# Run actual test count
npm test -- --listTests | wc -l
```

**Updates needed:**
- [ ] Get current test count from above command
- [ ] Update README.md with actual numbers
- [ ] Update CLAUDE.md with same numbers
- [ ] Add note: "Last updated: 2025-01-20"

#### **1.3 Endspiel-Positionen klarstellen**
**Agreed upon numbers:**
- Implemented: 7 positions
- Planned: 16 positions  
- Extensible to: 50+ positions

**Files to update:**
- [ ] README.md - Make consistent
- [ ] CLAUDE.md - Make consistent
- [ ] Add clarification comment in `/shared/data/endgames/index.ts`

#### **1.4 chess.ts Beschreibung korrigieren**
- [ ] CLAUDE.md - Line 123:
  ```markdown
  # OLD:
  Type Definitions: `types/chess.ts` hat jetzt 91 Zeilen (nicht mehr "nur 5") - Dokumentation veraltet
  
  # NEW:
  Type Definitions: `types/chess.ts` - Comprehensive type definitions (91 lines)
  ```

---

### Task 2: Veraltete Referenzen entfernen/korrigieren

#### **2.1 Nicht-existierende Dateien**
- [ ] Remove reference to `ARCHITECTURE_ANALYSIS.md` from CLAUDE.md
- [ ] Either create `archive/` folder or remove references:
  ```bash
  # Option 1: Create archive structure
  mkdir -p archive/migration-reports archive/session-handover archive/code-reviews
  
  # Option 2: Remove from CLAUDE.md documentation structure
  ```

#### **2.2 Datum-Fehler korrigieren**
- [ ] Search and replace "2025-07-07" → "2025-01-07":
  ```bash
  grep -r "2025-07-07" docs/ --include="*.md"
  ```
- [ ] Update files with correct dates
- [ ] Add comment where dates represent different events

---

### Task 3: Dateien konsolidieren

#### **3.1 Migration Reports**
```bash
# Compare the two files
diff docs/migration-reports/zustand-migration-2025-01-07.md \
     docs/migration-reports/zustand-migration-final-2025-01-07.md
```

**Decision:**
- [ ] If files are very similar: Keep `*-final-*.md`, archive the other
- [ ] If files show progression: Keep both, add README explaining difference
- [ ] Update references to point to the correct file

**Archive structure:**
```bash
mkdir -p archive/migration-reports/iterations
mv docs/migration-reports/zustand-migration-2025-01-07.md \
   archive/migration-reports/iterations/
```

---

### Task 4: Neue Dokumentationsstruktur

#### **4.1 Create Missing Docs**
- [ ] Create `/docs/architecture/ARCHITECTURE_ANALYSIS.md`:
  ```markdown
  # Architecture Analysis
  
  For comprehensive architecture analysis, see:
  - [PROJECT_ANALYSIS_2025-01-20.md](../analysis/PROJECT_ANALYSIS_2025-01-20.md)
  - [ARCHITECTURE.md](./ARCHITECTURE.md)
  ```

#### **4.2 Add Navigation Index**
- [ ] Create `/docs/INDEX.md`:
  ```markdown
  # Documentation Index
  
  ## 📁 Structure
  - `/analysis/` - Project analyses and recommendations
  - `/architecture/` - System design and architecture
  - `/database/` - Database and migration docs
  - `/deployment/` - Deployment guides
  - `/development/` - Development history and guides
  - `/features/` - Feature documentation
  - `/security/` - Security documentation
  - `/testing/` - Test strategies and reports
  
  ## 🔍 Quick Links
  - [Latest Analysis](./analysis/PROJECT_ANALYSIS_2025-01-20.md)
  - [Immediate Tasks](./analysis/IMMEDIATE_TASKS_WEEK1.md)
  - [Architecture Overview](./architecture/ARCHITECTURE.md)
  ```

---

### Task 5: Automatisierung einrichten

#### **5.1 Documentation Linter**
Create `.github/workflows/docs-check.yml`:
```yaml
name: Documentation Check

on:
  pull_request:
    paths:
      - '**.md'
      - 'docs/**'

jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check Markdown links
        uses: gaurav-nelson/github-action-markdown-link-check@v1
        with:
          folder-path: 'docs'
```

#### **5.2 Documentation Update Script**
Create `scripts/update-docs-stats.js`:
```javascript
#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

// Get current stats
const testCount = execSync('npm test -- --listTests | wc -l').toString().trim();
const coverage = execSync('npm test -- --coverage --silent | grep "All files"').toString();

// Update README.md and CLAUDE.md with current stats
// ... implementation
```

---

## 📊 Validation Checklist

After cleanup, verify:
- [ ] No broken internal links
- [ ] Consistent numbers across all docs
- [ ] No future dates (except planned features)
- [ ] All referenced files exist
- [ ] No duplicate information
- [ ] Clear hierarchy and navigation

## 🔄 Maintenance Process

Going forward:
1. **Weekly**: Run documentation linter
2. **On PR**: Automated link checking
3. **Monthly**: Full documentation review
4. **On Release**: Update all version numbers and stats

---

## 📝 Documentation Standards

### For new documentation:
```markdown
# Title

**Last Updated**: 2025-01-20  
**Status**: Active/Draft/Deprecated  
**Owner**: Team/Person  

## Overview
Brief description...

## Details
...

---
**Related**: [Link to related docs]
```

### Naming Conventions:
- Feature docs: `FEATURE_NAME.md`
- Analysis docs: `ANALYSIS_YYYY-MM-DD.md`
- Guides: `GUIDE_PURPOSE.md`
- Reports: `REPORT_TYPE_YYYY-MM-DD.md`

---

**Estimated Time**: 4-6 hours  
**Priority**: Medium (do after critical security fixes)  
**Impact**: Better developer experience, reduced confusion