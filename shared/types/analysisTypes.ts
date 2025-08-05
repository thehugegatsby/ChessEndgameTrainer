export type AnalysisData = {
  scenarioId: string;
  initialFEN: string;
  playedMoves: string[];
  mistakeIndex?: number;
  correctLine?: string[];
  evaluations?: number[]; // centipawn scores
};
