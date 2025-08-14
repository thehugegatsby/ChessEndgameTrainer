---
id: bug-2025-01-14-001
title: "validateMove als Arrow Function Property statt Methode"
severity: high
time_to_fix: 240
pattern_id: js.MethodBinding.ArrowPropertyThis

# 1. SYMPTOME & KONTEXT
symptom: "handlePlayerMove gibt false zurück in Tests, obwohl isPlayerTurn=true und isOpponentThinking=false"
error_signature: "DEBUG [RootStore] handlePlayerMoveOrchestrator result { result: false }"
environment:
  - test_runner: vitest@3.2.4
  - dom_env: jsdom
  - framework: next@15.3.3
  - language: typescript
  - test_file: EndgameTrainingPage.integration.test.tsx

# 2. IRRWEGE (KRITISCH für LLM-Learning!)
failed_hypotheses:
  - hypothesis: "IntersectionObserver Mock funktioniert nicht richtig"
    time_wasted: 180
    indicators: 
      - "observer.observe is not a function"
      - "Cannot read properties of undefined (reading 'observe')"
    why_wrong: "War ein Nebeneffekt, nicht die Hauptursache. Observer-Probleme waren bereits gelöst."
    
  - hypothesis: "Happy-DOM vs JSDOM Inkompatibilität"
    time_wasted: 60
    indicators: 
      - "Tests funktionieren im Browser aber nicht in Vitest"
      - "Different behavior between test environments"
    why_wrong: "Environment war bereits auf JSDOM umgestellt und korrekt konfiguriert"
    
  - hypothesis: "isOpponentThinking wird nicht richtig gesetzt"
    time_wasted: 30
    indicators:
      - "Early return in handlePlayerMove at line 98"
    why_wrong: "clearOpponentThinking() wurde korrekt aufgerufen, Problem lag woanders"

# 3. LÖSUNG
root_cause: "validateMove im ChessService Mock war als Arrow Function Property definiert statt als echte Methode"
solution: |
  ```typescript
  // ❌ FALSCH - Arrow Function Property:
  validateMove = vi.fn().mockReturnValue(true);
  
  // ✅ RICHTIG - Echte Methode:
  validateMove(
    _move: { from: string; to: string; promotion?: string } | string
  ): boolean {
    return true;
  }
  ```

# 4. ERKENNUNGSMUSTER für Zukunft
key_indicators:
  - "Mock-Methode wird aufgerufen aber gibt unexpected value zurück"
  - "vi.fn().mockReturnValue() als Property Assignment"
  - "Orchestrator/Service gibt false zurück obwohl Mock true returnen sollte"
  - "this-Binding Probleme in Mock-Implementierungen"

# 5. PLAYBOOK für ähnliche Fälle
next_time_try:
  1. "Check Mock-Definition: Arrow Function Property vs echte Methode"
  2. "Console.log direkt im Mock ob er aufgerufen wird und was er zurückgibt"
  3. "Vergleiche Mock-Struktur mit Original-Service Interface"
  4. "Prüfe ob vi.fn() als Property oder als Methode verwendet wird"
  5. "Nutze TypeScript strict mode um solche Fehler früher zu erkennen"

# 6. ANTI-PATTERNS (Was NICHT tun)
avoid:
  - "Nicht stundenlang Observer-Mocks debuggen wenn das Problem woanders liegt"
  - "Nicht zwischen Test-Environments wechseln ohne konkreten Grund"
  - "Nicht blind Polyfills hinzufügen ohne zu verstehen wo der Fehler liegt"

# 7. RELATED PATTERNS
related_bugs:
  - "js.Mocking.MethodVsProperty"
  - "testing.MockImplementation.IncorrectBinding"
  - "vitest.MockFunction.AsProperty"

# 8. CODE SMELLS
code_smells:
  - mock_method_as_arrow_property
  - vi_fn_as_class_property
  - missing_method_implementation
  - incorrect_mock_structure

# 9. METRIKEN
metrics:
  files_checked: 15
  false_starts: 3
  commits_to_fix: 1
  developers_involved: 1
  test_iterations: 20+
---

## Detaillierte Analyse

Diese Debug-Session zeigt ein klassisches Problem bei der Mock-Implementierung in TypeScript/Vitest Tests.

### Timeline

1. **00:00** - Problem entdeckt: 2 Tests in `EndgameTrainingPage.integration.test.tsx` schlagen fehl
2. **00:30** - Erste Hypothese: IntersectionObserver Mocks sind kaputt (52 Errors initially)
3. **02:00** - Viele Versuche Observer-Mocks zu fixen, Wechsel von Happy-DOM zu JSDOM
4. **03:00** - Observer-Probleme gelöst, aber 2 Tests fallen immer noch
5. **03:30** - Deep-Dive mit Gemini ThinkDeep Tool
6. **04:00** - Root Cause gefunden: validateMove Mock-Definition ist falsch

### Der entscheidende Hinweis

Der Durchbruch kam durch systematische Analyse mit dem ThinkDeep Tool:

```
handlePlayerMove → MoveValidator.validateMove() → chessService.validateMove()
```

Die Kette sah korrekt aus, aber der Mock `validateMove = vi.fn().mockReturnValue(true)` 
wurde nicht richtig aufgerufen, weil er als Arrow Function Property statt als Methode definiert war.

### Lessons Learned

1. **Mock-Struktur muss exakt der Original-Struktur entsprechen** - Methoden müssen als Methoden gemockt werden, nicht als Properties
2. **Systematische Analyse zahlt sich aus** - ThinkDeep/Konsens-Tools helfen bei komplexen Problemen
3. **Nicht von Nebeneffekten ablenken lassen** - Observer-Errors waren ein Symptom, nicht die Ursache
4. **TypeScript Types sind nicht genug** - Runtime-Verhalten kann trotz korrekter Types anders sein

### Prävention

Um dieses Problem in Zukunft zu vermeiden:

1. **Mock-Template erstellen** mit korrekter Methoden-Struktur
2. **Lint-Rule** für vi.fn() als Property Assignment
3. **Test für Mock-Struktur** der prüft ob alle Methoden korrekt implementiert sind
4. **Documentation** in Mock-Files über korrekte Verwendung