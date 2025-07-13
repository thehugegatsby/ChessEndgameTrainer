/**
 * Firestore Data Converter for EndgamePosition
 * Ensures proper serialization/deserialization and handles Firebase-specific types
 */

import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData
} from 'firebase/firestore';
import { EndgamePosition } from '@shared/types';

/**
 * Firestore converter for EndgamePosition
 * Handles serialization/deserialization and ensures type safety
 */
export const positionConverter: FirestoreDataConverter<EndgamePosition> = {
  /**
   * Convert EndgamePosition to Firestore document data
   */
  toFirestore(position: EndgamePosition): DocumentData {
    // Only include fields that are defined in the EndgamePosition interface
    const { id, ...positionData } = position;
    return {
      ...positionData,
      // Note: id is stored in the document path, not in the document data
    };
  },

  /**
   * Convert Firestore document to EndgamePosition
   */
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): EndgamePosition {
    const rawData = snapshot.data(options);
    
    // Validate ID is numeric
    const id = parseInt(snapshot.id, 10);
    if (isNaN(id)) {
      throw new Error(`Invalid position ID: ${snapshot.id}`);
    }
    
    // Extract only the fields defined in EndgamePosition interface
    // By explicitly defining the shape, we automatically ignore
    // any extra fields from Firestore like createdAt
    const position: EndgamePosition = {
      id,
      title: rawData.title || '',
      description: rawData.description || '',
      fen: rawData.fen || '',
      category: rawData.category || '',
      difficulty: rawData.difficulty || 'beginner',
      targetMoves: rawData.targetMoves || 0,
      
      // Use conditional spreading for optional fields
      // This is cleaner than setting to undefined and then deleting
      ...(rawData.hints && { hints: rawData.hints }),
      ...(rawData.solution && { solution: rawData.solution }),
      ...(rawData.nextPositionId && { nextPositionId: rawData.nextPositionId }),
      ...(rawData.sideToMove && { sideToMove: rawData.sideToMove }),
      ...(rawData.goal && { goal: rawData.goal }),
    };
    
    return position;
  }
};