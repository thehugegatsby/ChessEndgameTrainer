# 🔒 Security Guide - ChessEndgameTrainer

## 📊 Current Status (2025-07-08)
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

### 3. Input Validation (TODO)
**Areas requiring validation**:
- Move notation input
- URL parameters (position IDs)
- User settings/preferences
- localStorage data

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

## 📚 Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [React Security Best Practices](https://react.dev/learn/keeping-components-pure)
- [CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Last Updated**: 2025-07-08  
**Security Contact**: Report issues via GitHub Security tab