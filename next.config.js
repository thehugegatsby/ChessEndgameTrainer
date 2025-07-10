/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Make process.env.NEXT_PUBLIC_IS_E2E_TEST available in client and server code
    // Using NEXT_PUBLIC_ prefix ensures it's available on the client side
    NEXT_PUBLIC_IS_E2E_TEST: process.env.NEXT_PUBLIC_IS_E2E_TEST || 'false',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    // Only inject constants in client-side bundles for testing
    if (!isServer && (dev || process.env.NODE_ENV === 'test')) {
      const webpack = require('webpack');
      
      // Import constants for injection
      const testConstants = require('./tests/e2e/config/constants');
      
      // Inject constants into browser context
      config.plugins.push(
        new webpack.DefinePlugin({
          'window.__E2E_TEST_CONSTANTS__': JSON.stringify({
            SELECTORS: testConstants.SELECTORS,
            TIMEOUTS: testConstants.TIMEOUTS,
            TEST_BRIDGE: testConstants.TEST_BRIDGE,
            NAVIGATION_CONFIG: testConstants.NAVIGATION_CONFIG,
            ERROR_MESSAGES: testConstants.ERROR_MESSAGES,
            LOG_CONTEXTS: testConstants.LOG_CONTEXTS,
            RETRY_CONFIG: testConstants.RETRY_CONFIG,
            PERFORMANCE: testConstants.PERFORMANCE,
            VALIDATION: testConstants.VALIDATION,
            FEATURES: testConstants.FEATURES,
            ANIMATION: testConstants.ANIMATION,
            ACTIVE_MOVE_INDICATORS: testConstants.ACTIVE_MOVE_INDICATORS,
            HIGHLIGHT_INDICATORS: testConstants.HIGHLIGHT_INDICATORS,
            TEST_DATA: testConstants.TEST_DATA,
          })
        })
      );
    }

    return config;
  },
};

module.exports = nextConfig; 