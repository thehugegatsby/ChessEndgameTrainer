# 🔒 Security Guide - ChessEndgameTrainer

## 📊 Current Status (2025-01-08)
- **FEN Validation**: ✅ Implemented across all input boundaries
- **Worker Path Validation**: ✅ Whitelist implemented
- **CSP Headers**: Configured for WASM/SharedArrayBuffer
- **Priority**: Critical fixes completed, monitoring needed

## 🚨 Known Vulnerabilities & Fixes

### 1. FEN String Validation (FIXED)
**Issue**: Unvalidated FEN strings could cause XSS or crashes  
**Solution**: Created comprehensive FEN validator with sanitization
```typescript
// shared/utils/fenValidator.ts
export function validateAndSanitizeFen(fen: string): FenValidationResult {
  // Sanitize dangerous characters
  let sanitized = fen.trim().replace(/[<>'"]/g, '');
  
  // Validate structure (8 ranks, valid pieces, etc.)
  // Check piece placement, castling rights, en passant
  return { isValid, sanitized, errors };
}
```

### 2. Worker Path Security (FIXED)  
**Issue**: Potential path traversal in Worker instantiation
**Solution**: Whitelist allowed worker paths
```typescript
const allowedPaths = ['/stockfish.js', '/worker/stockfish.js'];
if (!allowedPaths.includes(workerPath) || workerPath.includes('../')) {
  throw new Error('Invalid worker path - potential security risk');
}
```

### 3. Input Validation (IN PROGRESS)
**Implemented validations**:
- ✅ FEN strings: Comprehensive validation via `validateAndSanitizeFen()`
- ✅ Worker paths: Whitelist validation prevents path traversal
- 🔄 Move notation input: Validated through chess.js library
- 🔄 URL parameters: Position IDs validated against known scenarios
- ⚠️ User settings/preferences: Basic type checking only
- ⚠️ localStorage data: Needs additional validation layer

## 🛡️ Security Headers Configuration

### Required Headers (next.config.js)
```javascript
async headers() {
  return [{
    source: '/:path*',
    headers: [
      // Required for Stockfish WASM
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      
      // Security headers
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]
  }];
}
```

### Content Security Policy
```javascript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'", // Required for WASM
    "worker-src 'self' blob:", // Web Workers
    "style-src 'self' 'unsafe-inline'", // Inline styles
    "connect-src 'self' https://tablebase.lichess.org https://firestore.googleapis.com",
  ].join('; ')
}
```

## 🔐 Implementation Checklist

### Immediate Actions
- [x] Implement FEN validation at all entry points
- [x] Add worker path validation
- [ ] Create general input validator utility
- [ ] Add rate limiting middleware
- [ ] Setup error tracking (Sentry)

### Before Production
- [ ] Run `npm audit fix`
- [ ] Penetration testing with OWASP ZAP
- [ ] Verify security headers (securityheaders.com)
- [ ] Enable CSP violation reporting
- [ ] Setup monitoring/alerting

## 🛠️ Quick Security Setup (52 minutes)

### 1. Update Dependencies (10 min)
```bash
npm audit
npm audit fix
# For breaking changes (careful!)
npm audit fix --force
```

### 2. Add Rate Limiting (15 min)
Create `middleware.ts`:
```typescript
const rateLimitMap = new Map();

export function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const limit = 100; // requests per minute
  
  // Rate limiting logic...
  if (requestCount > limit) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
}
```

### 3. Add Error Tracking (20 min)
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 4. Environment Variables
```env
# .env.local
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_ALLOWED_ORIGINS=https://your-domain.com
```

## 🧪 Security Testing

### Unit Tests
```typescript
describe('Security', () => {
  it('should sanitize malicious FEN input', () => {
    const malicious = 'rnbq<script>alert("xss")</script>/8/8/8/8/PPP/RNBQKBNR';
    const result = validateAndSanitizeFen(malicious);
    expect(result.sanitized).not.toContain('<script>');
  });
  
  it('should reject path traversal in worker path', () => {
    expect(() => validateWorkerPath('../../../etc/passwd'))
      .toThrow('Invalid worker path');
  });
});
```

### Security Audit Commands
```bash
# Check headers
curl -I https://your-app.vercel.app

# Run Lighthouse security audit  
npx lighthouse https://your-app.vercel.app --view

# Test CSP violations
# Check browser console for violations
```

## ⚠️ Common Security Issues

### WASM Not Loading?
- Ensure CSP includes `'wasm-unsafe-eval'`
- Check COOP/COEP headers are set correctly
- Verify worker-src allows 'blob:'

### Sentry Not Reporting?
- Check NEXT_PUBLIC_SENTRY_DSN is set
- Verify environment is 'production'
- Check for CSP blocking Sentry

### Headers Not Applied?
- Clear Vercel cache
- Check not overridden in vercel.json
- Verify next.config.js syntax

## 🔧 Detailed Implementation Tasks

### Task 1: FEN String Sanitization (Priority: 🚨 CRITICAL)

#### Implementation Files
- **Create**: `shared/utils/security/fenSanitizer.ts`
- **Update**: `shared/lib/chess/ScenarioEngine.ts`
- **Update**: `shared/hooks/useChessGame.ts`
- **Create**: `tests/unit/security/fenSanitizer.test.ts`

#### FenSanitizer Implementation
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
    
    return fen.trim();
  }
}
```

### Task 2: General Input Validation

#### Create Input Validator
```typescript
// shared/utils/security/inputValidator.ts
export class InputValidator {
  static validatePositionId(id: string): number {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 1000) {
      throw new Error('Invalid position ID');
    }
    return parsed;
  }
  
  static validateMove(move: string): string {
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

### Task 3: XSS Prevention Audit Checklist

#### Areas to Verify
- [ ] Check all uses of dangerouslySetInnerHTML
- [ ] Verify React escapes all user content
- [ ] No direct innerHTML usage
- [ ] Audit chess.js input handling
- [ ] Check react-chessboard for XSS vectors
- [ ] Verify Stockfish WASM isolation
- [ ] Sanitize before localStorage write
- [ ] Validate on localStorage read
- [ ] Clean Firestore inputs

## 📋 Security Testing Requirements

### Unit Tests
- [ ] FEN sanitizer tests with malicious input
- [ ] Input validator tests for all methods
- [ ] Worker path validation tests
- [ ] Integration tests with security scenarios

### Security Audit
- [ ] Run OWASP ZAP penetration testing
- [ ] Verify security headers with securityheaders.com
- [ ] Monitor CSP violations in production
- [ ] Test with malformed/malicious inputs

## 📊 Security Metrics

### Success Criteria
- Zero unsanitized user inputs
- All security tests passing (100% coverage)
- No CSP violations in production
- Security headers score A+ on securityheaders.com
- Zero critical/high vulnerabilities in npm audit

### Monitoring
- Set up CSP violation reporting endpoint
- Monitor Sentry for security-related errors
- Track failed validation attempts
- Alert on suspicious input patterns

## 📚 Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [React Security Best Practices](https://react.dev/learn/keeping-components-pure)
- [CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Last Updated**: 2025-01-09  
**Security Contact**: Report issues via GitHub Security tab