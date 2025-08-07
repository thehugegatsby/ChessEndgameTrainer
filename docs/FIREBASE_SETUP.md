# Firebase Setup Documentation

## Firestore Security Rules

The project uses comprehensive security rules to ensure data isolation and access control:

### User Progress Data
```
/users/{userId}/userProgress/{document}
```

**Security Model:**
- Users can only read/write their own progress data (`request.auth.uid == userId`)
- Requires authentication for all operations
- Supports both UserStats and CardProgress documents
- Full CRUD operations allowed for data owner

**Data Structure:**
- `/users/{userId}/userProgress/stats` - User statistics document
- `/users/{userId}/userProgress/{positionId}` - Individual card progress documents

### Public Endgame Data

**Positions Collection** (`/positions/{positionId}`)
- Read-only access for authenticated users
- Managed externally (no user write access)

**Categories Collection** (`/categories/{categoryId}`)
- Read-only access for authenticated users
- Defines endgame position categories

**Chapters Collection** (`/chapters/{chapterId}`)
- Read-only access for authenticated users
- Organizes positions into training sequences

## Firestore Indexes

### Required Indexes

1. **Due Cards Query Index**
   - Collection: `userProgress`
   - Field: `nextReviewAt` (ascending)
   - Purpose: Enables efficient queries for cards due for review

## Deployment Commands

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy both
firebase deploy --only firestore

# Test rules with emulator
firebase emulators:start --only firestore
```

## Local Development

The project includes emulator configuration in `firebase.json`:
- Firestore emulator on port 8080
- Firebase UI on port 4000

```bash
# Start emulators for local development
npm run firebase:emulator

# Or directly
firebase emulators:start
```

## Security Testing

Test the security rules with these scenarios:

1. **Authenticated user accessing own data** ✅
2. **Authenticated user accessing other user's data** ❌
3. **Unauthenticated access to any data** ❌
4. **Reading public position data while authenticated** ✅
5. **Writing to positions/categories/chapters** ❌

Use the Firebase emulator UI to test these scenarios during development.