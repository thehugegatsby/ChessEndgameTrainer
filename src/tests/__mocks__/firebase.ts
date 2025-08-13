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
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn((callback) => {
    callback(mockUser);
    return vi.fn(); // unsubscribe function
  }),
};

export const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn((id: string) => ({
      get: vi.fn().mockResolvedValue({
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
      set: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    })),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      docs: [],
      empty: true,
    }),
  })),
  doc: vi.fn(),
  batch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
};

// Mock the Firebase modules
vi.mock('@shared/lib/firebase', () => ({
  auth: mockAuth,
  db: mockFirestore,
  initializeApp: vi.fn(),
  getAuth: vi.fn(() => mockAuth),
  getFirestore: vi.fn(() => mockFirestore),
}));

const firebaseMock = {
  auth: mockAuth,
  db: mockFirestore,
};

export default firebaseMock;