/**
 * Firestore Data Converters for Type Safety
 * 
 * Solves TS4111 errors by providing type-safe converters
 * for Firestore documents, eliminating index signature access.
 */

import type {
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  FirestoreDataConverter,
} from 'firebase/firestore';
import type { EndgamePosition, EndgameCategory, EndgameChapter } from '@shared/types';

/**
 * Converter for EndgamePosition documents
 */
export const positionConverter: FirestoreDataConverter<EndgamePosition> = {
  toFirestore(position: EndgamePosition): DocumentData {
    // When writing, we omit the id as it's the document ID
    const { id: _id, ...data } = position;
    return data;
  },
  
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): EndgamePosition {
    const data = snapshot.data(options);
    
    // Safely construct the EndgamePosition from document data
    return {
      id: parseInt(snapshot.id),
      title: data['title'] || '',
      description: data['description'] || '',
      fen: data['fen'] || '',
      category: data['category'] || '',
      difficulty: data['difficulty'] || 'beginner',
      targetMoves: data['targetMoves'],
      hints: data['hints'],
      solution: data['solution'],
      nextPositionId: data['nextPositionId'],
      sideToMove: data['sideToMove'],
      goal: data['goal'],
    } as EndgamePosition;
  }
};

/**
 * Converter for EndgameCategory documents
 */
export const categoryConverter: FirestoreDataConverter<EndgameCategory> = {
  toFirestore(category: EndgameCategory): DocumentData {
    return {
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      positions: category.positions || [],
      subcategories: category.subcategories || [],
    };
  },
  
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): EndgameCategory {
    const data = snapshot.data(options);
    
    return {
      id: snapshot.id,
      name: data['name'] || '',
      description: data['description'] || '',
      icon: data['icon'] || '',
      positions: data['positions'] || [],
      subcategories: data['subcategories'] || [],
    };
  }
};

/**
 * Converter for EndgameChapter documents
 */
export const chapterConverter: FirestoreDataConverter<EndgameChapter> = {
  toFirestore(chapter: EndgameChapter): DocumentData {
    return {
      name: chapter.name,
      description: chapter.description || '',
      category: chapter.category,
      lessons: chapter.lessons || [],
      totalLessons: chapter.totalLessons || 0,
    };
  },
  
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): EndgameChapter {
    const data = snapshot.data(options);
    
    return {
      id: snapshot.id,
      name: data['name'] || '',
      description: data['description'] || '',
      category: data['category'] || '',
      lessons: data['lessons'] || [],
      totalLessons: data['totalLessons'] || 0,
    };
  }
};

/**
 * Generic converter for simple key-value documents
 * Use this for documents where you just need basic type safety
 */
export function createGenericConverter<T extends Record<string, unknown>>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T): DocumentData {
      return data as DocumentData;
    },
    
    fromFirestore(
      snapshot: QueryDocumentSnapshot,
      options: SnapshotOptions
    ): T {
      return snapshot.data(options) as T;
    }
  };
}