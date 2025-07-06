# Test-Definitionen für ChessEndgameTrainer

## Unit Tests (`tests/unit/`)
**Definition:** Tests einzelner Funktionen/Klassen OHNE externe Dependencies

### Merkmale:
- Keine echten API-Calls, Worker oder DOM-Manipulation
- Alle Dependencies werden gemockt
- Laufen in < 100ms
- Fokus auf Input/Output einer einzelnen Einheit

### Beispiele:
```typescript
// ✅ Unit Test
test('evaluationHelpers.getMoveQualityByTablebaseComparison', () => {
  const result = getMoveQualityByTablebaseComparison(2, 0, 'w');
  expect(result.text).toBe('🔻');
});

// ❌ KEIN Unit Test (nutzt echten Worker)
test('engine evaluates position', async () => {
  const engine = new Engine();
  await engine.init();
  const eval = await engine.evaluate('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
});
```

## Integration Tests (`tests/integration/`)
**Definition:** Tests der Interaktion zwischen mehreren Modulen/Services

### Merkmale:
- Können echte Worker nutzen, aber externe APIs werden gemockt
- Testen Datenflusss zwischen Komponenten
- Laufen in < 5 Sekunden
- Fokus auf korrekte Integration

### Beispiele:
```typescript
// ✅ Integration Test
test('ScenarioEngine with Stockfish Worker integration', async () => {
  const engine = new ScenarioEngine();
  await engine.init(); // Echter Worker
  const eval = await engine.evaluatePosition(testFEN);
  expect(eval.depth).toBeGreaterThan(10);
});

// ✅ Integration Test (Tablebase Mock, aber echte Service-Logik)
test('Evaluation chain processes tablebase data correctly', async () => {
  mockTablebaseAPI.mockResolvedValue({ wdl: 2, dtm: 15 });
  const result = await evaluationService.getCompleteEvaluation(fen);
  expect(result.moveQuality).toBe('optimal');
});
```

## End-to-End Tests (`tests/e2e/`)
**Definition:** Tests kompletter User-Flows durch die gesamte Anwendung

### Merkmale:
- Nutzen Playwright/Cypress
- Simulieren echte User-Interaktionen
- Keine Mocks (außer für instabile externe Services)
- Laufen in 10-60 Sekunden
- Fokus auf User-Perspektive

### Beispiele:
```typescript
// ✅ E2E Test
test('User completes training session with evaluation feedback', async ({ page }) => {
  await page.goto('/train/1');
  await page.click('[data-square="d2"]');
  await page.click('[data-square="d3"]');
  await expect(page.locator('[data-testid="move-evaluation"]')).toContainText('✓');
});
```

## Grenzfälle & Zuordnung

| Szenario | Testtyp | Begründung |
|----------|---------|------------|
| React Hook ohne API-Calls | Unit | Isolierte Logik |
| React Hook mit useContext | Integration | Mehrere Module |
| Component mit DOM-Events | Unit | Mit Testing Library mockbar |
| Component + API Call | Integration | Service-Integration |
| Multi-Step User Flow | E2E | Vollständiger Pfad |
| Worker Message Handling | Integration | Module-Interaktion |
| Performance Messung | Integration | System-Verhalten |