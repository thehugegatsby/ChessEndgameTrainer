#!/bin/bash
# Pilot Migration Script - Phase 1: Evaluation Tests

set -e # Exit on error

echo "🚀 Starting Pilot Test Migration..."

# Create backup
echo "📦 Creating backup..."
mkdir -p tests_backup_$(date +%Y%m%d_%H%M%S)
cp -r shared/__tests__ tests_backup_$(date +%Y%m%d_%H%M%S)/

# Create new test structure
echo "📁 Creating new test directories..."
mkdir -p tests/{unit,integration,e2e,performance,regression}
mkdir -p tests/unit/{evaluation,engine,ui,utils,chess}
mkdir -p tests/integration/{engine,tablebase,training,evaluation}
mkdir -p tests/e2e/{training-flow,navigation,regression}

# Pilot: Move 5 critical evaluation test files
echo "🔄 Moving evaluation tests (Pilot)..."

# 1. Unit test for evaluationHelpers
if [ -f "shared/utils/chess/__tests__/evaluationHelpers.test.ts" ]; then
  git mv shared/utils/chess/__tests__/evaluationHelpers.test.ts tests/unit/evaluation/
  echo "✓ Moved evaluationHelpers.test.ts"
fi

# 2. Comprehensive evaluation tests
if [ -f "shared/utils/chess/__tests__/evaluationHelpers.comprehensive.test.ts" ]; then
  git mv shared/utils/chess/__tests__/evaluationHelpers.comprehensive.test.ts tests/unit/evaluation/
  echo "✓ Moved evaluationHelpers.comprehensive.test.ts"
fi

# 3. Tablebase evaluation tests
for file in shared/__tests__/tablebase-evaluation-*.test.ts; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    git mv "$file" tests/integration/tablebase/
    echo "✓ Moved $filename"
  fi
done

# 4. Integration test
if [ -f "shared/__tests__/integration/tablebaseEvaluationChain.test.ts" ]; then
  git mv shared/__tests__/integration/tablebaseEvaluationChain.test.ts tests/integration/evaluation/
  echo "✓ Moved tablebaseEvaluationChain.test.ts"
fi

# Update import paths in moved files
echo "🔧 Updating import paths..."
find tests -name "*.test.ts" -o -name "*.test.tsx" | while read file; do
  # Update relative imports to use @/ alias
  sed -i.bak 's|"\.\./\.\./\.\./|"@/|g' "$file"
  sed -i.bak 's|"\.\./\.\./|"@/|g' "$file"
  sed -i.bak 's|"\.\./|"@/|g' "$file"
  
  # Remove backup files
  rm -f "${file}.bak"
done

echo "✅ Pilot migration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm test -- --selectProjects=unit"
echo "2. Verify all moved tests pass"
echo "3. If successful, continue with remaining tests"
echo "4. Update package.json test scripts"

# Create npm scripts for new structure
echo ""
echo "📝 Add these to package.json scripts:"
echo '"test:unit": "jest --selectProjects=unit",'
echo '"test:integration": "jest --selectProjects=integration",'
echo '"test:e2e": "jest --selectProjects=e2e",'
echo '"test:all": "jest --projects tests/unit tests/integration"'