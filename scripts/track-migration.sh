#!/bin/bash
# Migration tracking script for ChessService -> Pure Functions migration

echo "=========================================="
echo "CHESSSERVICE MIGRATION PROGRESS TRACKER"
echo "=========================================="
echo

# ChessService usages
echo "📊 USAGE STATISTICS:"
CHESS_SERVICE_COUNT=$(grep -r "chessService\|ChessService" src/ | wc -l)
echo "  ChessService usages: $CHESS_SERVICE_COUNT"

FILES_WITH_CHESS_SERVICE=$(grep -r "chessService\|ChessService" src/ --files-with-matches | wc -l)
echo "  Files with ChessService: $FILES_WITH_CHESS_SERVICE"

# Event listeners
EVENT_LISTENERS=$(grep -r "\.subscribe\|\.on\|\.emit" src/ | wc -l)
echo "  Event listeners: $EVENT_LISTENERS"

# Test files specifically
TEST_FILES_WITH_CHESS_SERVICE=$(grep -r "chessService\|ChessService" src/ --include="*.test.ts" --include="*.test.tsx" --include="*.spec.ts" | wc -l)
echo "  Test file usages: $TEST_FILES_WITH_CHESS_SERVICE"

echo
echo "🎯 TARGET: 0 usages, 0 event listeners"
echo

# Show most problematic files (top 10)
echo "🔍 TOP FILES NEEDING MIGRATION:"
grep -r "chessService\|ChessService" src/ --files-with-matches | head -10 | while read file; do
    count=$(grep -c "chessService\|ChessService" "$file")
    echo "  $file: $count usages"
done

echo
echo "=========================================="