import { ScenarioEngine } from '@shared/lib/chess/ScenarioEngine';
import { Engine } from '@shared/lib/chess/engine';

jest.mock('@shared/lib/chess/engine');

const MockEngine = Engine as jest.Mocked<typeof Engine>;

describe('ScenarioEngine', () => {
  let scenarioEngine: ScenarioEngine;
  const testFen = '8/k7/8/8/8/8/P7/K7 w - - 0 1';

  beforeEach(() => {
    // Mock-Implementierungen für jeden Test zurücksetzen
    (MockEngine.getInstance as jest.Mock).mockReturnValue({
      getBestMove: jest.fn().mockResolvedValue({ from: 'a7', to: 'a6' }),
      evaluatePosition: jest.fn().mockResolvedValue({ score: 150, mate: null }),
    });
    scenarioEngine = new ScenarioEngine(testFen);
  });

  it('sollte korrekt initialisiert werden', () => {
    expect(scenarioEngine.getFen()).toBe(testFen);
  });

  it('sollte einen Spielzug machen und den FEN aktualisieren', async () => {
    await scenarioEngine.makeMove({ from: 'a2', to: 'a4' });
    
    const newFen = scenarioEngine.getFen();
    expect(newFen).not.toBe(testFen);
    // Überprüft, ob der Bauer gezogen wurde und Weiß wieder am Zug ist.
    expect(newFen).toContain('w');
  });

  it('sollte die Position zurücksetzen', async () => {
    await scenarioEngine.makeMove({ from: 'a2', to: 'a3' });
    scenarioEngine.reset();
    expect(scenarioEngine.getFen()).toBe(testFen);
  });

  it('sollte die Engine-Bewertung abrufen', async () => {
    const evaluation = await scenarioEngine.getEvaluation();
    const mockEngineInstance = MockEngine.getInstance();
    expect(mockEngineInstance.evaluatePosition).toHaveBeenCalled();
    expect(evaluation.score).toBe(150);
  });
}); 