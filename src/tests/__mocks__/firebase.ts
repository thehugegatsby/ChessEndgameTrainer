/**
 * Firebase Mock for Testing
 * Provides mocked Firebase Auth and Firestore functionality
 */

export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
};

export const mockAuth = {
  currentUser: mockUser,
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: mockUser }),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn((callback) => {
    callback(mockUser);
    return jest.fn(); // unsubscribe function
  }),
};

export const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn((id: string) => ({
      get: jest.fn().mockResolvedValue({
        exists: true,
        id,
        data: () => ({
          id,
          fen: '8/8/8/8/4k3/8/4K3/8 w - - 0 1',
          title: 'Test Position',
          description: 'Test Description',
          goal: 'checkmate',
          difficulty: 'medium',
        }),
      }),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    })),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      docs: [],
      empty: true,
    }),
  })),
  doc: jest.fn(),
  batch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
};

// Mock the Firebase modules
jest.mock('@shared/lib/firebase', () => ({
  auth: mockAuth,
  db: mockFirestore,
  initializeApp: jest.fn(),
  getAuth: jest.fn(() => mockAuth),
  getFirestore: jest.fn(() => mockFirestore),
}));

export default {
  auth: mockAuth,
  db: mockFirestore,
};