#!/bin/bash

# Setup script for worktree EndgameTrainer-159
# Run this from within the worktree directory

echo "🚀 Setting up worktree for issue #159 - TablebaseService Testability Refactor"

# Install dependencies
echo "📦 Installing dependencies with pnpm..."
pnpm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local..."
    cat > .env.local << EOF
# Local environment variables
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
fi

# Verify installation
echo "✅ Verifying installation..."
pnpm run lint && pnpm tsc && echo "✅ TypeScript and linting checks passed!"

echo "🎯 Setup complete! You can now work on issue #159"
echo ""
echo "Next steps:"
echo "1. cd ../EndgameTrainer-159"
echo "2. Start refactoring TablebaseService for dependency injection"
echo "3. Run tests: pnpm test tablebase"
echo ""
echo "Issue #159: Refactor TablebaseService client architecture for testability"