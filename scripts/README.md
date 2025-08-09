# Scripts Directory

This directory contains utility scripts and data files for the EndgameTrainer project.

## Directory Structure

```
scripts/
├── data/                      # Test data and import files
│   ├── firestore_import_data/ # Firebase import data
│   └── first-position.json    # Initial position setup
│
├── setup-worktree.sh          # Git worktree setup script
├── setup-training-board-worktree.sh # Training board worktree setup
├── test_moves.js              # Move testing utility
│
├── firebase-*.js              # Firebase utilities
├── check-*.js                 # Code analysis scripts
├── dev-server.js              # Development server
└── ...                        # Other utility scripts
```

## Usage

### Development Scripts

- `dev-server.js` - Start development server
- `get-port.js` - Get available port for development

### Firebase Scripts

- `firebase-admin-import.js` - Import data using admin SDK
- `firebase-bulk-import.js` - Bulk data import
- `test-firebase-connection.js` - Test Firebase connectivity

### Analysis Scripts

- `check-duplicate-components.js` - Find duplicate React components
- `check-unused-services.js` - Find unused services
- `find-unused-files.js` - Find unused source files

### Test Scripts

- `test_moves.js` - Test chess move logic
- `test-real-api.js` - Test real API endpoints

## Data Files

The `data/` subdirectory contains:

- Sample positions for testing
- Firebase import/export data
- Configuration templates
