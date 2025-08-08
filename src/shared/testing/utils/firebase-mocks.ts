/**
 * Firebase Mock Utilities
 * Provides mock implementations for Firestore operations
 */

// Global mock data store - shared across all mock instances
const mockDataStore = new Map<string, Map<string, any>>();

// Helper functions
export const createMockDoc = (exists: boolean, data: any = {}) => ({
  exists: () => exists,
  data: () => data,
  id: data.id || "1",
});

export const createMockSnapshot = (docs: any[] = []) => ({
  empty: docs.length === 0,
  size: docs.length,
  docs: docs.map((data) => ({
    data: () => data,
    id: data.id || "1",
  })),
  forEach: (callback: (doc: any) => void) => {
    docs.forEach((data) =>
      callback({
        data: () => data,
        id: data.id || "1",
      }),
    );
  },
});

// Mock function instances - defined outside to allow reset
const mockDoc = jest.fn((_, collection: string, id: string) => ({
  _collection: collection,
  _id: id,
}));

const mockGetDoc = jest.fn(async (docRef: any) => {
  const collectionData = mockDataStore.get(docRef._collection);
  if (!collectionData) {
    return createMockDoc(false);
  }
  const docData = collectionData.get(docRef._id);
  return createMockDoc(!!docData, docData);
});

const mockCollection = jest.fn((_, collectionName: string) => ({
  _name: collectionName,
}));

const mockGetDocs = jest.fn(async (queryOrCollection: any) => {
  const collectionName =
    queryOrCollection._name || queryOrCollection._collection;
  const collectionData = mockDataStore.get(collectionName);

  if (!collectionData) {
    return createMockSnapshot([]);
  }

  let results = Array.from(collectionData.values());

  // Apply query filters if present
  if (queryOrCollection._filters) {
    queryOrCollection._filters.forEach((filter: any) => {
      results = results.filter((item) => {
        if (filter.op === "==") {
          return item[filter.field] === filter.value;
        }
        if (filter.op === ">") {
          return item[filter.field] > filter.value;
        }
        if (filter.op === "<") {
          return item[filter.field] < filter.value;
        }
        return true;
      });
    });
  }

  // Apply ordering if present
  if (queryOrCollection._orderBy) {
    const { field, direction } = queryOrCollection._orderBy;
    results.sort((a, b) => {
      if (direction === "desc") {
        return b[field] - a[field];
      }
      return a[field] - b[field];
    });
  }

  // Apply limit if present
  if (queryOrCollection._limit) {
    results = results.slice(0, queryOrCollection._limit);
  }

  return createMockSnapshot(results);
});

const mockQuery = jest.fn((collection: any, ...constraints: any[]) => {
  const query = {
    _collection: collection._name,
    _filters: [] as any[],
    _orderBy: null as any,
    _limit: null as number | null,
  };

  constraints.forEach((constraint) => {
    if (constraint.type === "where") {
      query._filters.push(constraint);
    } else if (constraint.type === "orderBy") {
      query._orderBy = constraint;
    } else if (constraint.type === "limit") {
      query._limit = constraint.value;
    }
  });

  return query;
});

const mockWhere = jest.fn((field: string, op: string, value: any) => ({
  type: "where",
  field,
  op,
  value,
}));

const mockOrderBy = jest.fn((field: string, direction: string = "asc") => ({
  type: "orderBy",
  field,
  direction,
}));

const mockLimit = jest.fn((value: number) => ({
  type: "limit",
  value,
}));

// Reset function to clear all mock state
export const resetMockFirestore = () => {
  mockDataStore.clear();
  mockDoc.mockClear();
  mockGetDoc.mockClear();
  mockCollection.mockClear();
  mockGetDocs.mockClear();
  mockQuery.mockClear();
  mockWhere.mockClear();
  mockOrderBy.mockClear();
  mockLimit.mockClear();
};

// Test helper to set document data
export const setMockDoc = (collection: string, id: string, data: any) => {
  if (!mockDataStore.has(collection)) {
    mockDataStore.set(collection, new Map());
  }
  mockDataStore.get(collection)!.set(id, { ...data, id });
};

// Test helper to set collection data
export const setMockCollection = (collection: string, documents: any[]) => {
  const collectionMap = new Map();
  documents.forEach((doc) => {
    collectionMap.set(doc.id.toString(), doc);
  });
  mockDataStore.set(collection, collectionMap);
};

// Main factory function
export const createMockFirestore = () => {
  return {
    doc: mockDoc,
    getDoc: mockGetDoc,
    collection: mockCollection,
    getDocs: mockGetDocs,
    query: mockQuery,
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
  };
};
