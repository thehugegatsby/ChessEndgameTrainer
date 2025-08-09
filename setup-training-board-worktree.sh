#!/bin/bash

# Setup script for TrainingBoard refactoring worktree
# Issues: #96 (Dialog Management) & #98 (Event Handler Extraction)

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="EndgameTrainer"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKTREE_NAME="training-board-complete"
WORKTREE_PATH="../${PROJECT_NAME}-${WORKTREE_NAME}"
ABSOLUTE_WORKTREE_PATH="$(cd "$SCRIPT_DIR/$WORKTREE_PATH" && pwd 2>/dev/null || echo "$SCRIPT_DIR/$WORKTREE_PATH")"

# Function to print colored messages
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo "🚀 Setting up TrainingBoard refactoring worktree..."
echo "📁 Worktree location: $ABSOLUTE_WORKTREE_PATH"

# Check if worktree exists
if [ ! -d "$ABSOLUTE_WORKTREE_PATH" ]; then
    echo "❌ Worktree not found at $ABSOLUTE_WORKTREE_PATH"
    echo "Please run: git worktree add -b feature/training-board-complete $WORKTREE_PATH"
    exit 1
fi

print_success "Worktree found, proceeding with setup..."

# Navigate to worktree
cd "$ABSOLUTE_WORKTREE_PATH"

# Setup symlinks using the same approach as the main setup script
print_info "Creating symlinks for efficient development..."

# 1. Symlink node_modules
print_info "Creating node_modules symlink..."
ln -sfn "../${PROJECT_NAME}/node_modules" node_modules

# 2. Symlink build directories
print_info "Creating build directory symlinks..."
ln -sfn "../${PROJECT_NAME}/.next" .next 2>/dev/null || true
ln -sfn "../${PROJECT_NAME}/dist" dist 2>/dev/null || true
ln -sfn "../${PROJECT_NAME}/build" build 2>/dev/null || true

# 3. Symlink TypeScript config
print_info "Symlinking TypeScript config..."
ln -sfn "../${PROJECT_NAME}/tsconfig.json" tsconfig.json

# 4. Symlink ESLint config
print_info "Symlinking ESLint config..."
ln -sfn "../${PROJECT_NAME}/.eslintrc.json" .eslintrc.json 2>/dev/null || true
ln -sfn "../${PROJECT_NAME}/eslint.config.js" eslint.config.js 2>/dev/null || true

# 5. Symlink other configs
print_info "Symlinking other configs..."
for config in next.config.js jest.config.js postcss.config.js tailwind.config.js tailwind.config.css; do
    [ -f "$SCRIPT_DIR/$config" ] && ln -sfn "../${PROJECT_NAME}/$config" "$config"
done

# 6. Symlink package files
ln -sfn "../${PROJECT_NAME}/package.json" package.json
ln -sfn "../${PROJECT_NAME}/package-lock.json" package-lock.json

# 7. Symlink environment files
print_info "Symlinking environment files..."
[ -f "$SCRIPT_DIR/.env.local" ] && ln -sfn "../${PROJECT_NAME}/.env.local" .env.local
[ -f "$SCRIPT_DIR/.env" ] && ln -sfn "../${PROJECT_NAME}/.env" .env

# 8. Create .gitignore for worktree
print_info "Creating .gitignore..."
cat > .gitignore << 'GITIGNORE'
# Symlinked files
node_modules
.next
dist
build
.env
.env.local
package.json
package-lock.json
tsconfig.json
.eslintrc.json
eslint.config.js
*.config.js
*.config.css

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db
GITIGNORE

echo "🧪 Running initial tests to verify setup..."
npm test -- --passWithNoTests --testPathPattern="TrainingBoard|DialogManager|MoveHandler" || {
    echo "⚠️  Some tests failed, but continuing setup..."
}

echo "🔍 Checking TypeScript compilation..."
npx tsc --noEmit || {
    echo "⚠️  TypeScript errors found, but continuing setup..."
}

echo ""
echo "🎯 TRAINING BOARD REFACTORING SETUP COMPLETE!"
echo ""
echo "📋 ACTIVE ISSUES:"
echo "   • Issue #96: Extract dialog management from TrainingBoard"
echo "   • Issue #98: Extract event handlers from TrainingBoard"
echo ""
echo "🛠️  CURRENT TRAININGBOARD STATE:"
echo "   • Location: src/shared/components/training/TrainingBoard/TrainingBoard.tsx"
echo "   • Lines: $(wc -l < src/shared/components/training/TrainingBoard/TrainingBoard.tsx 2>/dev/null || echo 'N/A')"
echo "   • Hooks already extracted: useMoveValidation, useGameNavigation, useMoveHandlers, useDialogHandlers"
echo ""
echo "📝 NEXT STEPS:"
echo "   1. Analyze current TrainingBoard component structure"
echo "   2. Extract remaining dialog management (Issue #96)"
echo "   3. Extract keyboard and board event handlers (Issue #98)"
echo "   4. Create comprehensive tests for extracted components"
echo ""
echo "🔧 USEFUL COMMANDS:"
echo "   npm test -- --testPathPattern=TrainingBoard  # Test TrainingBoard component"
echo "   npm test -- --testPathPattern=Dialog         # Test dialog components"
echo "   npm run build                                 # Verify build"
echo "   npx tsc --noEmit                             # Check TypeScript"
echo ""
echo "📁 Working in: $ABSOLUTE_WORKTREE_PATH"
echo "🌿 Branch: feature/training-board-complete"

# Show current git status
echo ""
echo "📊 Git Status:"
git status --short || echo "No changes yet"

echo ""
echo "✨ Ready to start TrainingBoard refactoring work!"
echo "   Focus Areas: Dialog Management & Event Handler Extraction"