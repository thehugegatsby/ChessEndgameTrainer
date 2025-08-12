# CONTRIBUTING.md

## 1. Git Workflow

Feature-branch workflow: Create branches from `main`, integrate via Pull Requests. No direct commits to `main`.

## 2. Issue Convention

### Title Format

`type(scope): clear descriptive title` (max 72 chars, lowercase, imperative mood)

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code improvement
- `docs`: Documentation
- `test`: Tests
- `chore`: Maintenance
- `perf`: Performance

**Scopes:**

- `ui`: User interface
- `api`: API endpoints
- `tablebase`: Endgame tablebase
- `auth`: Authentication
- `cache`: Caching logic
- `testing`: Test infrastructure

**Examples:**

- `feat(ui): add move history panel`
- `fix(tablebase): resolve timeout on lichess api`
- `refactor(cache): optimize lru implementation`

### Issue Body Structure (LLM-Optimized)

Required sections with emoji headers:

- `🎯 Task Overview`: Concise goal
- `📍 Exact File Locations`: Absolute paths with line numbers
- `🔧 Code Changes Required`: Before/after examples
- `✅ Verification Commands`: Test commands (e.g., `pnpm test`)
- `🚫 Constraints`: What NOT to change

## 3. Pull Request Format

### Branch Naming

`type/description-issue-XX`

Examples: `feat/move-history-issue-123`, `fix/api-timeout-issue-45`

### PR Title

Same format as issues, reference issue: `feat(ui): add move history (#123)`

### PR Body

- Link issue: `Closes #123`
- Brief change summary

## 4. Commit Messages

Same `type(scope): description` format, keep under 72 chars.

Examples:

- `feat(ui): add move history panel`
- `fix(tablebase): handle api timeout`
- `refactor(cache): optimize lru eviction`

Reference issues in body: `Fixes #123`
