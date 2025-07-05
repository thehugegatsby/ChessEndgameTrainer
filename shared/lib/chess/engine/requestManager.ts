/**
 * @fileoverview Request Manager for Engine Communication
 * @version 1.0.0
 * @description Manages pending requests and promise resolution for worker communication
 * Implements the request-response pattern with ID tracking
 */

import type { Move as ChessJsMove } from 'chess.js';
import type { EngineEvaluation } from './types';

/**
 * Represents a pending request with its promise handlers
 */
interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeoutId: NodeJS.Timeout;
  type: 'bestmove' | 'evaluation';
  timestamp: number; // For debugging and monitoring
}

/**
 * Manages pending requests and their promise resolution
 * Implements timeout handling and request tracking
 */
export class RequestManager {
  private pendingRequests = new Map<string, PendingRequest>();
  private requestCounter = 0;
  
  /**
   * Generates a unique request ID
   */
  generateRequestId(type: string): string {
    return `${type}-${++this.requestCounter}-${Date.now()}`;
  }

  /**
   * Registers a new request with timeout handling
   */
  registerRequest(
    id: string,
    type: 'bestmove' | 'evaluation',
    resolve: (value: any) => void,
    reject: (reason?: any) => void,
    timeoutMs: number
  ): void {
    // Clear any existing request with same ID (shouldn't happen)
    if (this.pendingRequests.has(id)) {
      console.warn(`[RequestManager] Overwriting existing request: ${id}`);
      this.cancelRequest(id);
    }

    // Set up timeout
    const timeoutId = setTimeout(() => {
      const request = this.pendingRequests.get(id);
      if (request) {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${id} timed out after ${timeoutMs}ms`));
        console.warn(`[RequestManager] Request timeout: ${id}`);
      }
    }, timeoutMs + 1000); // Add 1s buffer

    // Store the request
    this.pendingRequests.set(id, {
      resolve,
      reject,
      timeoutId,
      type,
      timestamp: Date.now()
    });
  }

  /**
   * Resolves a pending best move request
   */
  resolveBestMoveRequest(id: string, move: ChessJsMove | null): boolean {
    const request = this.pendingRequests.get(id);
    if (!request) {
      console.warn(`[RequestManager] No pending request found: ${id}`);
      return false;
    }

    if (request.type !== 'bestmove') {
      console.error(`[RequestManager] Type mismatch for ${id}: expected bestmove, got ${request.type}`);
      return false;
    }

    try {
      clearTimeout(request.timeoutId);
    } catch (error) {
      console.warn('[RequestManager] Error clearing timeout:', error);
    }
    this.pendingRequests.delete(id);
    request.resolve(move);
    
    const duration = Date.now() - request.timestamp;
    console.debug(`[RequestManager] Resolved bestmove ${id} in ${duration}ms`);
    
    return true;
  }

  /**
   * Resolves a pending evaluation request
   */
  resolveEvaluationRequest(id: string, evaluation: EngineEvaluation): boolean {
    const request = this.pendingRequests.get(id);
    if (!request) {
      console.warn(`[RequestManager] No pending request found: ${id}`);
      return false;
    }

    if (request.type !== 'evaluation') {
      console.error(`[RequestManager] Type mismatch for ${id}: expected evaluation, got ${request.type}`);
      return false;
    }

    try {
      clearTimeout(request.timeoutId);
    } catch (error) {
      console.warn('[RequestManager] Error clearing timeout:', error);
    }
    this.pendingRequests.delete(id);
    request.resolve(evaluation);
    
    const duration = Date.now() - request.timestamp;
    console.debug(`[RequestManager] Resolved evaluation ${id} in ${duration}ms`);
    
    return true;
  }

  /**
   * Rejects a pending request with an error
   */
  rejectRequest(id: string, error: string): boolean {
    const request = this.pendingRequests.get(id);
    if (!request) {
      console.warn(`[RequestManager] No pending request found: ${id}`);
      return false;
    }

    try {
      clearTimeout(request.timeoutId);
    } catch (error) {
      console.warn('[RequestManager] Error clearing timeout:', error);
    }
    this.pendingRequests.delete(id);
    request.reject(new Error(error));
    
    console.error(`[RequestManager] Rejected ${id}: ${error}`);
    
    return true;
  }

  /**
   * Cancels a pending request
   */
  cancelRequest(id: string): void {
    const request = this.pendingRequests.get(id);
    if (request) {
      try {
        clearTimeout(request.timeoutId);
      } catch (error) {
        console.warn('[RequestManager] Error clearing timeout:', error);
      }
      this.pendingRequests.delete(id);
      request.reject(new Error(`Request ${id} was cancelled`));
    }
  }

  /**
   * Cancels all pending requests
   */
  cancelAllRequests(reason: string = 'All requests cancelled'): void {
    const count = this.pendingRequests.size;
    for (const [id, request] of this.pendingRequests.entries()) {
      try {
        clearTimeout(request.timeoutId);
      } catch (error) {
        console.warn('[RequestManager] Error clearing timeout:', error);
      }
      request.reject(new Error(`${reason}: ${id}`));
    }
    this.pendingRequests.clear();
    console.log(`[RequestManager] Cancelled all ${count} pending requests`);
  }

  /**
   * Gets statistics about pending requests
   */
  getStats(): {
    pendingCount: number;
    totalRequests: number;
    oldestPendingMs: number | null;
  } {
    const now = Date.now();
    let oldestPendingMs: number | null = null;

    if (this.pendingRequests.size > 0) {
      const timestamps = Array.from(this.pendingRequests.values()).map(r => r.timestamp);
      const oldest = Math.min(...timestamps);
      oldestPendingMs = now - oldest;
    }

    return {
      pendingCount: this.pendingRequests.size,
      totalRequests: this.requestCounter,
      oldestPendingMs
    };
  }

  /**
   * Cleans up old/stuck requests (maintenance)
   */
  cleanupStaleRequests(maxAgeMs: number = 60000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > maxAgeMs) {
        this.cancelRequest(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.warn(`[RequestManager] Cleaned up ${cleaned} stale requests`);
    }

    return cleaned;
  }
}