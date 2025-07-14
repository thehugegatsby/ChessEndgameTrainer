/**
 * @fileoverview Request Manager for Engine Communication
 * @version 1.0.0
 * @description Manages pending requests and promise resolution for worker communication
 * Implements the request-response pattern with ID tracking
 */

import type { Move as ChessJsMove } from 'chess.js';
import type { EngineEvaluation } from './types';
import { ENGINE } from '@shared/constants';

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
      this.cancelRequest(id);
    }

    // Set up timeout
    const timeoutId = setTimeout(() => {
      const request = this.pendingRequests.get(id);
      if (request) {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${id} timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs + ENGINE.TIMEOUT_BUFFER); // Add buffer from constants

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
      return false;
    }

    if (request.type !== 'bestmove') {
      return false;
    }

    try {
      clearTimeout(request.timeoutId);
    } catch (error) {
    }
    this.pendingRequests.delete(id);
    request.resolve(move);
    
    return true;
  }

  /**
   * Resolves a pending evaluation request
   */
  resolveEvaluationRequest(id: string, evaluation: EngineEvaluation): boolean {
    const request = this.pendingRequests.get(id);
    if (!request) {
      return false;
    }

    if (request.type !== 'evaluation') {
      return false;
    }

    try {
      clearTimeout(request.timeoutId);
    } catch (error) {
    }
    this.pendingRequests.delete(id);
    request.resolve(evaluation);
    
    return true;
  }

  /**
   * Rejects a pending request with an error
   */
  rejectRequest(id: string, error: string): boolean {
    const request = this.pendingRequests.get(id);
    if (!request) {
      return false;
    }

    try {
      clearTimeout(request.timeoutId);
    } catch (error) {
    }
    this.pendingRequests.delete(id);
    request.reject(new Error(error));
    
    
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
        }
      this.pendingRequests.delete(id);
      request.reject(new Error(`Request ${id} was cancelled`));
    }
  }

  /**
   * Cancels all pending requests
   */
  cancelAllRequests(reason: string = 'All requests cancelled'): void {
    for (const [id, request] of this.pendingRequests.entries()) {
      try {
        clearTimeout(request.timeoutId);
      } catch (error) {
        }
      request.reject(new Error(`${reason}: ${id}`));
    }
    this.pendingRequests.clear();
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
    }

    return cleaned;
  }
}