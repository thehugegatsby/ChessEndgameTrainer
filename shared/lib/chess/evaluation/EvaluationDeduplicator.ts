/**
 * EvaluationDeduplicator - Prevents duplicate evaluation requests
 * 
 * This service ensures that multiple identical position evaluations
 * share the same Promise, preventing redundant work and improving performance.
 */

type EvaluationFunction<T> = (fen: string) => Promise<T>;

export class EvaluationDeduplicator {
  private pending = new Map<string, Promise<any>>();
  
  /**
   * Deduplicate evaluation requests by FEN position
   * 
   * @param fen - Position in FEN notation
   * @param evaluationFn - Function that performs the actual evaluation
   * @returns Promise that resolves to the evaluation result
   */
  async evaluate<T>(fen: string, evaluationFn: EvaluationFunction<T>): Promise<T> {
    // Check if evaluation is already in progress
    if (this.pending.has(fen)) {
      return this.pending.get(fen) as Promise<T>;
    }

    // Create shared promise for this position
    const promise = evaluationFn(fen)
      .finally(() => {
        // Clean up when evaluation completes (success or failure)
        this.pending.delete(fen);
      });
    
    this.pending.set(fen, promise);
    return promise;
  }

  /**
   * Check if a position is currently being evaluated
   */
  isPending(fen: string): boolean {
    return this.pending.has(fen);
  }

  /**
   * Get the number of pending evaluations
   */
  getPendingCount(): number {
    return this.pending.size;
  }

  /**
   * Cancel all pending evaluations
   * Useful for cleanup during component unmount
   */
  clear(): void {
    this.pending.clear();
  }

  /**
   * Get statistics about deduplication effectiveness
   */
  getStats(): {
    pendingEvaluations: number;
    activeFENs: string[];
  } {
    return {
      pendingEvaluations: this.pending.size,
      activeFENs: Array.from(this.pending.keys())
    };
  }
}