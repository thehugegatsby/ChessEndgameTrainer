/** @type {import('next').NextConfig} */
const nextConfig = {
  // SWC compiler options (only used when Babel is not detected)
  compiler: {
    // Remove React dev props in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
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
      {
        // Apply CORP header specifically to WASM files for SharedArrayBuffer support
        source: '/stockfish-nnue-16.wasm',
        headers: [
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    // Clean architecture - no test constants injection needed
    // Tests will use domain-driven selectors discovered through reality
    
    // File watching optimization to prevent cascade restarts
    if (dev && !isServer) {
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/test-results/**',
          '**/playwright-report/**',
          '**/.git/**',
          '**/coverage/**'
        ],
        // Reduce polling frequency to prevent conflicts
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig; 