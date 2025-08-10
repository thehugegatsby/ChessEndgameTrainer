#\!/bin/bash

FILE="src/tests/unit/orchestrators/PawnPromotionHandler.test.ts"

# Remove all jest.resetAllMocks() calls
sed -i 's/jest\.resetAllMocks();//g' "$FILE"

# Replace jest.spyOn with direct mock access for chessService
sed -i "s/const isGameOverSpy = jest\.spyOn(chessService, 'isGameOver');/(chessService.isGameOver as jest.Mock).mockClear();/g" "$FILE"
sed -i "s/const isCheckmateSpy = jest\.spyOn(chessService, 'isCheckmate');/(chessService.isCheckmate as jest.Mock).mockClear();/g" "$FILE"
sed -i "s/isGameOverSpy\.mockReturnValue/(chessService.isGameOver as jest.Mock).mockReturnValue/g" "$FILE"
sed -i "s/isCheckmateSpy\.mockReturnValue/(chessService.isCheckmate as jest.Mock).mockReturnValue/g" "$FILE"
sed -i "s/isGameOverSpy\.mockImplementation/(chessService.isGameOver as jest.Mock).mockImplementation/g" "$FILE"

# Replace tablebaseService with orchestratorTablebase
sed -i "s/jest\.spyOn(tablebaseService, 'getEvaluation')/(orchestratorTablebase.getEvaluation as jest.Mock).mockClear()/g" "$FILE"
sed -i "s/getEvaluationSpy\.mockResolvedValue/(orchestratorTablebase.getEvaluation as jest.Mock).mockResolvedValue/g" "$FILE"

# Clean up variable declarations
sed -i '/const getEvaluationSpy =/d' "$FILE"

echo "Fixed PawnPromotionHandler tests"
