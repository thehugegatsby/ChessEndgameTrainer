// Test that mocked modules work correctly
jest.mock("@shared/services/ChessService", () => ({
  chessService: {
    isGameOver: jest.fn(),
    isCheckmate: jest.fn(),
  },
}));

const { chessService } = require("@shared/services/ChessService");

describe("Mock Test", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should set mock return values", () => {
    chessService.isGameOver.mockReturnValue(true);
    chessService.isCheckmate.mockReturnValue(true);
    
    expect(chessService.isGameOver()).toBe(true);
    expect(chessService.isCheckmate()).toBe(true);
  });
});
