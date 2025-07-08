# Contributing to Chess Endgame Trainer

First off, thank you for considering contributing to Chess Endgame Trainer! We're excited to have you. This project is a community effort to build a top-tier, modern tool for chess players to master complex endgames. Every contribution, from a bug report to a new feature, is valuable.

This document provides guidelines to ensure a smooth and effective collaboration process.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How to Contribute](#how-to-contribute)
   - [Reporting Bugs](#reporting-bugs)
   - [Suggesting Enhancements](#suggesting-enhancements)
   - [Pull Requests](#pull-requests)
3. [Development Setup](#development-setup)
4. [Code Style and Conventions](#code-style-and-conventions)
5. [Testing Requirements](#testing-requirements)
6. [Commit Message Format](#commit-message-format)
7. [Pull Request Process](#pull-request-process)
8. [Documentation Standards](#documentation-standards)
9. [Security Considerations](#security-considerations)

## Code of Conduct

We strive to maintain a welcoming and inclusive community. All participants are expected to:
- Be respectful and constructive in all interactions
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

Please report unacceptable behavior to the project maintainers.

## How to Contribute

We use GitHub to manage all contributions. The primary ways to contribute are through Issues and Pull Requests.

### Reporting Bugs

If you find a bug, please create an issue in our [issue tracker](https://github.com/thehugegatsby/ChessEndgameTrainer/issues). A great bug report includes:
- A clear and descriptive title
- Steps to reproduce the bug
- The expected behavior vs. the actual behavior
- The FEN string of the position, if applicable
- Screenshots or error messages
- Browser and OS information

### Suggesting Enhancements

For new features or enhancements, please:
1. Check existing issues and discussions first
2. Start a discussion in GitHub Discussions for significant changes
3. Provide clear use cases and benefits
4. Be open to feedback and alternative approaches

### Pull Requests

Pull Requests are welcome for bug fixes and pre-approved features. Please follow the [Pull Request Process](#pull-request-process) outlined below.

## Development Setup

**Prerequisites:**
- Node.js v18+
- npm or yarn

**Installation & Setup:**
```bash
# 1. Fork and clone the repository
git clone https://github.com/thehugegatsby/ChessEndgameTrainer.git
cd ChessEndgameTrainer

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev              # Runs on port 3002
```

**Essential Commands:**
```bash
npm run dev              # Dev server (port 3002)
npm test                 # Run tests
npm run lint            # ESLint
npm run build           # Production build
npm run check-duplicates # Find duplicate components
npm run analyze-code    # Run all code analysis
```

## Code Style and Conventions

We strictly follow the conventions outlined in `CLAUDE.md` to maintain code quality and consistency.

### TypeScript
- **Strict Mode**: All new code must be TypeScript strict-compliant
- **No `any`**: Use `unknown` or define specific types
- **Interfaces over Types**: For objects and data structures

### React Patterns
Separate business logic from UI presentation using custom hooks:

```typescript
// Hooks for logic separation
const useChessLogic = () => { 
  // All state management and chess logic
  return { boardPosition, onMove, bestMoves };
};

const ChessComponent = () => {
  const logic = useChessLogic();
  return <UI {...logic} />;
};
```

### Error Handling
Use centralized error logging:

```typescript
try {
  await riskyOperation();
} catch (error) {
  ErrorService.logError('Context', error);
  // Graceful degradation
}
```

### Key Architecture Rules
1. **Singleton Pattern**: Only ONE Stockfish instance (`Engine.getInstance()`)
2. **Stable References**: Use `useRef` + `useMemo` in hooks to prevent loops
3. **Mobile Constraints**: Max 20MB memory per worker
4. **Debouncing**: 300ms for evaluations
5. **Cache Limits**: LRU cache max 200 items

## Testing Requirements

Quality is paramount. All new features and bug fixes **must** include comprehensive tests.

- **Minimum 80% Coverage**: Required for all new code
- **Run Coverage**: `npm run test:coverage`
- **Mock Properly**: Mock Worker APIs and external services
- **Factory Patterns**: Use for consistent test data

Example test structure:
```typescript
describe('ChessComponent', () => {
  it('should validate FEN before processing', () => {
    // Test implementation
  });
});
```

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Formatting changes (no code change)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat: add Lucena position training module
fix(engine): prevent crash on invalid FEN input
docs: update mobile platform setup instructions
```

## Pull Request Process

1. **Setup**: Ensure all conventions are followed
2. **Branch**: Create feature branch from `main` (`git checkout -b feat/your-feature`)
3. **Code**: Write code with accompanying tests
4. **Test**: Ensure all tests pass (`npm test`)
5. **Lint**: Check code style (`npm run lint`)
6. **Coverage**: Verify 80% minimum coverage for changes
7. **Document**: Update relevant documentation if needed
8. **Push**: Push branch and open PR against `main`
9. **Describe**: Provide clear PR description, link related issues
10. **Review**: Request review from maintainers

### PR Title Format
Follow the same convention as commit messages:
```
feat: implement Philidor position trainer
```

## Documentation Standards

- **TSDoc Comments**: For complex functions/components
- **Architecture Updates**: Update `/docs/ARCHITECTURE.md` for significant changes
- **README Updates**: Keep feature list and setup instructions current
- **Inline Comments**: Only when logic is non-obvious

## Security Considerations

All contributions must follow these security principles:

1. **Validate FEN Inputs**: All FEN strings must be validated
   ```typescript
   const result = validateAndSanitizeFen(userInput);
   if (!result.isValid) throw new Error('Invalid FEN');
   ```

2. **Sanitize User Content**: Prevent XSS attacks
3. **No Hardcoded Credentials**: Use environment variables
4. **Path Validation**: Validate worker paths to prevent traversal
5. **Content Security Policy**: Maintain CSP headers for WASM

## Questions?

Feel free to:
- Open an issue for clarification
- Start a discussion in GitHub Discussions
- Reach out to maintainers

Thank you for contributing to Chess Endgame Trainer! Your efforts help chess players worldwide improve their endgame skills.