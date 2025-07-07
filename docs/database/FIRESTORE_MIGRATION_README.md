# Firestore Migration Guide

## Overview

This guide provides step-by-step instructions for migrating the ChessEndgameTrainer data from TypeScript arrays to Firebase Firestore. The migration is designed to be safe, reversible, and zero-downtime.

## Prerequisites

1. **Firebase Project**: Ensure you have a Firebase project created at [Firebase Console](https://console.firebase.google.com)
2. **Firestore Database**: Firestore must be enabled in your Firebase project
3. **Environment Variables**: Set up the following environment variables:

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Enable Firestore (set to 'false' to use TypeScript arrays)
NEXT_PUBLIC_USE_FIRESTORE=false
```

## Migration Commands

### 1. Test Migration (Dry Run)

First, verify what will be migrated without actually writing to Firestore:

```bash
npm run migrate:firestore -- --dry-run
```

This will show:
- Number of positions to migrate
- Number of categories to migrate
- Number of chapters to migrate

### 2. Run Migration

To perform the actual migration:

```bash
npm run migrate:firestore
```

This will:
- Migrate all positions, categories, and chapters to Firestore
- Show progress for each collection
- Automatically verify the migration after completion

### 3. Verify Migration

To verify an existing migration:

```bash
npm run migrate:verify
```

This checks:
- Document counts match source data
- All required collections exist
- Data integrity is maintained

### 4. Selective Migration

You can migrate specific collections:

```bash
# Migrate only positions
npm run migrate:firestore -- --positions-only

# Migrate only categories
npm run migrate:firestore -- --categories-only

# Migrate only chapters
npm run migrate:firestore -- --chapters-only
```

## Enabling Firestore in Production

### Step 1: Run Migration

Complete the migration as described above.

### Step 2: Enable Dual-Read Mode

Set the environment variable to enable Firestore:

```bash
NEXT_PUBLIC_USE_FIRESTORE=true
```

The application will now:
- Read from Firestore first
- Fall back to TypeScript arrays if Firestore fails
- Cache frequently accessed data

### Step 3: Monitor Performance

Check the browser console for:
- Cache hit rates
- Firestore read counts
- Fallback occurrences

### Step 4: Full Migration

Once confident, you can remove the TypeScript array fallback in a future release.

## Firestore Security Rules

Apply these security rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Read-only access for positions
    match /positions/{position} {
      allow read: if true;
      allow write: if false;
    }
    
    // Read-only access for categories
    match /categories/{category} {
      allow read: if true;
      allow write: if false;
    }
    
    // Read-only access for chapters
    match /chapters/{chapter} {
      allow read: if true;
      allow write: if false;
    }
    
    // Future: User progress (when auth is implemented)
    match /users/{userId}/progress/{progressId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Check Firestore security rules
   - Ensure Firebase project is correctly configured
   - Verify API keys are correct

2. **Migration seems stuck**
   - Check Firebase Console for quota limits
   - Large migrations are batched (500 docs at a time)
   - Check console logs for specific errors

3. **Data not appearing in app**
   - Verify `NEXT_PUBLIC_USE_FIRESTORE=true` is set
   - Check browser console for errors
   - Ensure migration completed successfully

4. **Slow performance**
   - First loads may be slower (building cache)
   - Check Firestore usage in Firebase Console
   - Consider enabling Firestore offline persistence

### Rollback Procedure

If issues occur after enabling Firestore:

1. **Immediate Rollback**: Set `NEXT_PUBLIC_USE_FIRESTORE=false`
2. **Clear Cache**: The app will immediately revert to TypeScript arrays
3. **No Data Loss**: Original TypeScript arrays remain unchanged

## Migration Architecture

### Data Flow
```
TypeScript Arrays → Migration Service → Firestore
                          ↓
                    Batch Processing
                    (500 docs/batch)
                          ↓
                    Verification
```

### Collections Structure
```
firestore/
├── positions/
│   ├── 1 (document)
│   ├── 2 (document)
│   └── ...
├── categories/
│   ├── pawn (document)
│   ├── rook (document)
│   └── ...
└── chapters/
    ├── basic-checkmates (document)
    └── ...
```

### Dual-Read Pattern
```
Request → PositionService
            ↓
    Check USE_FIRESTORE flag
            ↓
    [If true] Try Firestore
            ↓
    [On error] Fallback to Arrays
            ↓
    Cache Result
            ↓
    Return Data
```

## Performance Considerations

- **Initial Load**: First-time users will experience Firestore reads
- **Subsequent Loads**: LRU cache reduces Firestore reads by ~80%
- **Fallback Speed**: TypeScript array fallback is instant
- **Network**: Consider user's connection speed

## Future Enhancements

1. **Offline Support**: Enable Firestore offline persistence
2. **User Progress**: Store training progress in Firestore
3. **Real-time Updates**: Push new positions without deployment
4. **Analytics**: Track popular positions and success rates
5. **Admin Panel**: Web interface for content management

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in browser console
3. Check Firebase Console for service status
4. Create an issue in the GitHub repository

---

**Last Updated**: 2025-01-19
**Migration Version**: 1.0.0