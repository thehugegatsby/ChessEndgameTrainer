# JSDoc TODO Liste

## 🔴 Priorität HOCH - Zentrale Business Logic

### Hooks (Core Business Logic) ✅ ERLEDIGT
- [x] `/shared/hooks/useToast.ts` - ✅ Vollständige JSDoc mit Beispielen
- [x] `/shared/hooks/useLocalStorage.ts` - ✅ Erweiterte JSDoc für alle API-Varianten
- [x] `/shared/hooks/useHydration.ts` - ✅ Umfassende SSR-Dokumentation
- [x] `/shared/hooks/useMoveQuality.ts` - ✅ Verbesserte JSDoc-Struktur
- [x] `/shared/hooks/useBatchMoveQuality.ts` - ✅ Batch-Processing Dokumentation
- [x] `/shared/hooks/useAnalysisData.ts` - ✅ Vollständige Dokumentation
- [x] `/shared/hooks/usePageReady.ts` - ✅ E2E-Testing Dokumentation erweitert
- [x] `/shared/hooks/useTrainingSession.ts` - ✅ Bestehende Dokumentation verbessert
- [x] `/shared/hooks/useDebounce.ts` - ✅ Bereits vorhanden, überprüft
- [x] `/shared/hooks/usePositionAnalysis.ts` - ✅ Bereits vorhanden, überprüft

### Services (Kritische Infrastruktur) ✅ TEILWEISE ERLEDIGT
- [x] `/shared/services/container/ServiceContainer.ts` - ✅ Klassen- und Methoden-Dokumentation
- [ ] `/shared/services/container/types.ts` - Service Container Types
- [x] `/shared/services/platform/PlatformService.ts` - ✅ Datei-Header und Klassen-Dokumentation
- [ ] `/shared/services/database/PositionService.ts` - Database Service
- [x] `/shared/services/logging/Logger.ts` - ✅ Umfassende Modul-Dokumentation mit allen Klassen

### Store Orchestrators (Cross-Slice Logic) ✅ ERLEDIGT
- [x] `/shared/store/orchestrators/handlePlayerMove.ts` - ✅ Vollständige Dokumentation (makeUserMove)
- [x] `/shared/store/orchestrators/handleOpponentTurn.ts` - ✅ Vollständige Dokumentation (requestTablebaseMove)
- [x] `/shared/store/orchestrators/requestPositionEvaluation.ts` - ✅ Vollständige Dokumentation
- [x] `/shared/store/orchestrators/loadTrainingContext.ts` - ✅ Vollständige Dokumentation

## 🟡 Priorität MITTEL - UI & Utilities

### Zentrale UI-Komponenten
- [ ] `/shared/components/training/TrainingBoard/TrainingBoard.tsx` - Nur Stub JSDoc
- [ ] `/shared/components/tablebase/TablebasePanel.tsx` - Hauptkomponente
- [ ] `/shared/components/tablebase/MoveEvaluationBar.tsx` - Evaluation Display
- [ ] `/shared/components/tablebase/MoveResultGroup.tsx` - Move Grouping
- [ ] `/shared/components/training/AnalysisPanel/index.tsx` - Analysis UI
- [ ] `/shared/components/training/MovePanelZustand.tsx` - Move Panel
- [ ] `/shared/components/training/TablebaseAnalysisPanel/index.tsx` - Tablebase UI

### Utility Functions
- [ ] `/shared/utils/positionAnalysisFormatter.ts` - Formatierung
- [ ] `/shared/utils/moveQualityFormatters.ts` - Move Quality Display
- [ ] `/shared/utils/tablebase/resultClassification.ts` - Result Logic
- [ ] `/shared/utils/chess/gameStatus.ts` - Game State Utils
- [ ] `/shared/utils/chess/evaluationHelpers.ts` - Evaluation Utils
- [ ] `/shared/utils/titleFormatter.ts` - Title Formatting

### UI Components (Reusable)
- [ ] `/shared/components/ui/button.tsx` - Keine JSDoc
- [ ] `/shared/components/ui/Toast.tsx` - Toast Notifications
- [ ] `/shared/components/ui/MoveErrorDialog.tsx` - Error Dialogs
- [ ] `/shared/components/ui/ProgressCard.tsx` - Progress Display
- [ ] `/shared/components/ui/DarkModeToggle.tsx` - Theme Toggle

## 🟢 Priorität NIEDRIG - Support & Tests

### Layout & Navigation
- [ ] `/shared/components/layout/AppLayout.tsx` - App Layout
- [ ] `/shared/components/layout/Header.tsx` - Header Component
- [ ] `/shared/components/navigation/AdvancedEndgameMenu.tsx` - Navigation

### Chess UI Components
- [ ] `/shared/components/chess/Chessboard.tsx` - Chess Board Wrapper
- [ ] `/shared/components/training/EndgameControls.tsx` - Game Controls
- [ ] `/shared/components/training/EvaluationLegend.tsx` - Legend Display
- [ ] `/shared/components/training/MoveHistory.tsx` - Move History
- [ ] `/shared/components/training/NavigationControls.tsx` - Navigation
- [ ] `/shared/components/training/PrincipalVariation.tsx` - PV Display
- [ ] `/shared/components/training/SimpleEvaluationDisplay.tsx` - Simple Eval
- [ ] `/shared/components/training/WikiPanel.tsx` - Wiki Integration

### Test & Mock Services
- [ ] `/shared/services/test/TestApiService.ts` - Test API
- [ ] `/shared/services/test/BrowserTestApi.ts` - Browser Test API
- [ ] `/shared/services/container/mocks.ts` - Service Mocks
- [ ] `/shared/services/TablebaseService.e2e.mocks.ts` - E2E Mocks

### Misc Components
- [ ] `/shared/components/analysis/MoveQualityDisplay.tsx` - Quality Display
- [ ] `/shared/components/analysis/MoveQualityIndicator.tsx` - Quality Indicator
- [ ] `/shared/components/ui/SettingsIcon.tsx` - Settings Icon
- [ ] `/shared/components/training/AnalysisPanel/AnalysisDetails.tsx` - Analysis Details
- [ ] `/shared/components/training/AnalysisPanel/MoveAnalysis.tsx` - Move Analysis

## 📋 Empfohlene JSDoc-Struktur

### Für Hooks:
```typescript
/**
 * Hook für [Zweck]
 * 
 * @example
 * ```tsx
 * const { data, loading } = useHookName({ option: value });
 * ```
 * 
 * @param options - Hook-Optionen
 * @returns Hook-Rückgabewerte
 */
```

### Für Komponenten:
```typescript
/**
 * [Komponenten-Beschreibung]
 * 
 * @example
 * ```tsx
 * <ComponentName prop="value" onEvent={handler} />
 * ```
 */
```

### Für Services:
```typescript
/**
 * Service für [Zweck]
 * 
 * @remarks
 * [Zusätzliche Implementierungsdetails]
 * 
 * @example
 * ```typescript
 * const result = await service.method(params);
 * ```
 */
```

## 🎯 Nächste Schritte

1. **Erledigt ✅**: Hooks dokumentiert (alle 10 Core Hooks)
2. **Erledigt ✅**: Store Orchestrators dokumentiert (alle 4)
3. **Als nächstes**: 
   - Service Types & Database Service (HIGH Priority Rest)
   - Zentrale UI-Komponenten (TrainingBoard, TablebasePanel)
4. **Danach**: Utility Functions und kleinere Komponenten
5. **Optional**: Test-Utilities und Mocks

## 📊 Statistik

- **Gesamt**: ~70 Dateien ohne vollständige JSDoc
- **Erledigt**: 15 Dateien ✅
  - Hooks: 10/10 ✅
  - Services: 3/5 (2 noch offen)
  - Orchestrators: 4/4 ✅
- **Hoch**: ~5 Dateien noch offen (2 Service Types, 1 Database Service)
- **Mittel**: ~25 Dateien (UI Components, Utils)
- **Niedrig**: ~25 Dateien (Layout, Test, Misc)

**Fortschritt**: ~21% (15/70 Dateien)