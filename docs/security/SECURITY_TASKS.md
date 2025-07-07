# Security Tasks - ChessEndgameTrainer

Priority: 🚨 CRITICAL - Must be fixed before production

## 🛡️ Task 1: FEN String Sanitization

### Problem
User-provided FEN strings are passed directly to chess.js without validation, creating potential security risks:
- Malformed FEN could crash the application
- Potential for injection attacks
- No input length limits

### Implementation Plan

#### Step 1: Create FEN Sanitizer Utility
**File**: `shared/utils/security/fenSanitizer.ts` (NEW)

```typescript
export class FenSanitizer {
  private static readonly MAX_FEN_LENGTH = 100;
  private static readonly VALID_FEN_REGEX = /^[rnbqkpRNBQKP1-8\/\s\-]+$/;
  
  static sanitize(fen: string): string {
    // 1. Check length
    if (!fen || fen.length > this.MAX_FEN_LENGTH) {
      throw new Error('Invalid FEN: Length exceeds maximum');
    }
    
    // 2. Basic character validation
    if (!this.VALID_FEN_REGEX.test(fen)) {
      throw new Error('Invalid FEN: Contains invalid characters');
    }
    
    // 3. Validate FEN structure
    const parts = fen.split(' ');
    if (parts.length < 1 || parts.length > 6) {
      throw new Error('Invalid FEN: Wrong number of parts');
    }
    
    // 4. Validate board ranks
    const ranks = parts[0].split('/');
    if (ranks.length !== 8) {
      throw new Error('Invalid FEN: Must have 8 ranks');
    }
    
    // 5. Return sanitized FEN
    return fen.trim();
  }
  
  static isValid(fen: string): boolean {
    try {
      this.sanitize(fen);
      return true;
    } catch {
      return false;
    }
  }
}
```

#### Step 2: Update ScenarioEngine
**File**: `shared/lib/chess/ScenarioEngine.ts`

```typescript
import { FenSanitizer } from '@shared/utils/security/fenSanitizer';

// In loadPosition method:
loadPosition(fen: string): void {
  try {
    const sanitizedFen = FenSanitizer.sanitize(fen);
    this.chess.load(sanitizedFen);
  } catch (error) {
    logger.error('Invalid FEN provided', error);
    throw new Error('Failed to load position: Invalid FEN');
  }
}
```

#### Step 3: Update useChessGame Hook
**File**: `shared/hooks/useChessGame.ts`

```typescript
// In loadPosition function:
const loadPosition = useCallback((fen: string) => {
  try {
    const sanitizedFen = FenSanitizer.sanitize(fen);
    gameRef.current.load(sanitizedFen);
    setFen(sanitizedFen);
  } catch (error) {
    errorService.logError('useChessGame.loadPosition', error);
    // Show user-friendly error
  }
}, []);
```

#### Step 4: Add Tests
**File**: `tests/unit/security/fenSanitizer.test.ts` (NEW)

```typescript
describe('FenSanitizer', () => {
  describe('sanitize', () => {
    it('should accept valid FEN strings', () => {
      const validFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      expect(() => FenSanitizer.sanitize(validFen)).not.toThrow();
    });
    
    it('should reject FEN with invalid characters', () => {
      const maliciousFen = 'rnbqkbnr/pppp<script>alert("xss")</script>/8/8/8/8/PPPPPPPP/RNBQKBNR';
      expect(() => FenSanitizer.sanitize(maliciousFen)).toThrow();
    });
    
    it('should reject overly long FEN strings', () => {
      const longFen = 'a'.repeat(150);
      expect(() => FenSanitizer.sanitize(longFen)).toThrow();
    });
  });
});
```

## 🛡️ Task 2: General Input Validation

### Affected Areas
1. **Move Input**: User moves in algebraic notation
2. **Settings**: User preferences that get stored
3. **URL Parameters**: Position IDs and query params

### Implementation

#### Create Input Validator
**File**: `shared/utils/security/inputValidator.ts` (NEW)

```typescript
export class InputValidator {
  static validatePositionId(id: string): number {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 1000) {
      throw new Error('Invalid position ID');
    }
    return parsed;
  }
  
  static validateMove(move: string): string {
    // Only allow valid chess move notation
    const moveRegex = /^[a-h][1-8][a-h][1-8][qrbn]?$/i;
    if (!moveRegex.test(move) && !['O-O', 'O-O-O'].includes(move)) {
      throw new Error('Invalid move notation');
    }
    return move;
  }
  
  static sanitizeString(input: string, maxLength = 100): string {
    return input
      .substring(0, maxLength)
      .replace(/[<>\"'&]/g, '') // Remove potential HTML
      .trim();
  }
}
```

## 🛡️ Task 3: Content Security Policy

### Add CSP Headers
**File**: `next.config.js`

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Required for WASM
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://firestore.googleapis.com",
              "worker-src 'self' blob:", // For Web Workers
            ].join('; ')
          }
        ]
      }
    ];
  }
};
```

## 🛡️ Task 4: XSS Prevention Audit

### Areas to Check
1. **Dynamic Content Rendering**
   - [ ] Check all uses of dangerouslySetInnerHTML
   - [ ] Verify React escapes all user content
   - [ ] No direct innerHTML usage

2. **Third-party Libraries**
   - [ ] Audit chess.js input handling
   - [ ] Check react-chessboard for XSS vectors
   - [ ] Verify Stockfish WASM isolation

3. **Storage**
   - [ ] Sanitize before localStorage write
   - [ ] Validate on localStorage read
   - [ ] Clean Firestore inputs

## 📋 Testing Checklist

- [ ] Unit tests for all sanitizers
- [ ] Integration tests with malicious input
- [ ] Penetration testing with OWASP ZAP
- [ ] Security headers verification
- [ ] CSP violation monitoring

## 🚨 Immediate Actions

1. **Today**: Implement FEN sanitizer (2-3 hours)
2. **Tomorrow**: Add general input validation (3-4 hours)
3. **This Week**: Complete security audit (1-2 days)
4. **Before Production**: Penetration testing

## 📊 Success Metrics

- Zero unsanitized user inputs
- All security tests passing
- No CSP violations in production
- Security headers score A+ on securityheaders.com

## 🔗 References

- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [React Security Best Practices](https://react.dev/learn/keeping-components-pure#side-effects-unintended-consequences)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)