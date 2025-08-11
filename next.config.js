/**
 * Next.js 15 Configuration with Turbopack Optimizations
 * Based on latest Next.js 15 best practices
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const { PORTS } = require('./config/ports.js');

// Simplified configuration using centralized ports
const APP_CONFIG = {
  DEV_URL: "http://localhost",
  DEV_PORT: PORTS.DEV,
  DEV_HOST: "localhost",
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables
  env: {
    NEXT_PUBLIC_DEV_URL: APP_CONFIG.DEV_URL,
    NEXT_PUBLIC_DEV_PORT: APP_CONFIG.DEV_PORT.toString(),
  },

  // Server runtime configuration (server-side only)
  serverRuntimeConfig: {
    port: APP_CONFIG.DEV_PORT,
    host: APP_CONFIG.DEV_HOST,
  },

  // Public runtime configuration (available on client and server)
  publicRuntimeConfig: {
    devUrl: APP_CONFIG.DEV_URL,
    apiUrl: `${APP_CONFIG.DEV_URL}/api`,
  },

  // Allow cross-origin requests from E2E test environment  
  // Only enabled when running E2E tests to prevent warnings
  ...(process.env.IS_E2E_TEST === 'true' || process.env.NEXT_PUBLIC_IS_E2E_TEST === 'true' ? {
    allowedDevOrigins: [
      `http://127.0.0.1:${PORTS.E2E}`,   // E2E test server IP
      `http://localhost:${PORTS.E2E}`,   // E2E test server hostname
      `http://127.0.0.1:${PORTS.DEV}`,   // Dev server IP
      `http://localhost:${PORTS.DEV}`,   // Dev server hostname
    ]
  } : {}),

  // Performance optimizations
  experimental: {
    // Enable modern bundling
    esmExternals: true,
  },

  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    rules: {
      // SVG support for React components
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Build optimizations
  compiler: {
    // Remove console.log in production builds
    removeConsole: process.env.NODE_ENV === "production",
    // Remove test attributes in production
    reactRemoveProperties: process.env.NODE_ENV === "production",
  },

  // Static file optimization
  compress: true,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
};

module.exports = withBundleAnalyzer(nextConfig);