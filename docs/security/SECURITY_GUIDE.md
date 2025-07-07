# 🔒 Security Implementation Guide
*Quick fixes for production deployment*

## 1. Update next.config.js (5 minutes)

Replace your current `next.config.js` with:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Required for SharedArrayBuffer (Stockfish)
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          // Security Headers
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Specific CSP for WASM
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://tablebase.lichess.org https://tablebase.lichess.ovh;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## 2. Run Security Audit (10 minutes)

```bash
# Check for vulnerabilities
npm audit

# Auto-fix safe updates
npm audit fix

# For breaking changes (careful!)
npm audit fix --force
```

## 3. Add Error Tracking (20 minutes)

### Install Sentry
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Update errorService.ts
```typescript
import * as Sentry from '@sentry/nextjs';

export const errorService = {
  logError: (context: string, error: unknown, additionalInfo?: any) => {
    console.error(`[${context}] Error:`, error, additionalInfo);
    
    // Send to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        tags: { context },
        extra: additionalInfo,
      });
    }
  }
};
```

## 4. Add Rate Limiting (15 minutes)

### Create middleware.ts
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map();

export function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const limit = 100; // requests per minute
  const windowMs = 60 * 1000; // 1 minute

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, {
      count: 0,
      resetTime: Date.now() + windowMs
    });
  }

  const ipData = rateLimitMap.get(ip);

  if (Date.now() > ipData.resetTime) {
    ipData.count = 0;
    ipData.resetTime = Date.now() + windowMs;
  }

  ipData.count += 1;

  if (ipData.count > limit) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

## 5. Environment Variables (.env.local)

```env
# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id

# Error Tracking  
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=chess-endgame-trainer

# Security
NEXT_PUBLIC_ALLOWED_ORIGINS=https://your-domain.com
```

## 6. Quick Deployment Test

```bash
# Build locally
npm run build

# Test production build
npm run start

# Check security headers
curl -I http://localhost:3000

# Deploy to Vercel
vercel --prod
```

## 7. Post-Deployment Verification

```bash
# Check security headers in production
curl -I https://your-app.vercel.app

# Run Lighthouse audit
npx lighthouse https://your-app.vercel.app --view

# Test WASM loading
# Open browser console and check for Stockfish initialization
```

## ⚡ Quick Wins Checklist

- [ ] Update next.config.js with security headers (5 min)
- [ ] Run npm audit fix (10 min)  
- [ ] Add Sentry (20 min)
- [ ] Test locally (10 min)
- [ ] Deploy to staging (5 min)
- [ ] Verify headers with curl (2 min)

**Total Time: ~52 minutes**

## 🚨 Common Issues

### WASM not loading?
- Check CSP includes `'wasm-unsafe-eval'`
- Verify CORS headers are set

### Sentry not reporting?
- Check NEXT_PUBLIC_SENTRY_DSN is set
- Verify it's using the production environment

### Headers not showing?
- Clear Vercel cache
- Check you're not overriding in vercel.json

---

*With these changes, your app will be production-ready with proper security!*