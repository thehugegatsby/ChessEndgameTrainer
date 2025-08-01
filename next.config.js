/** @type {import('next').NextConfig} */
const isE2ETest = process.env.NEXT_PUBLIC_IS_E2E_TEST === "true";

const nextConfig = {
  // Fix cross-origin warnings for E2E tests
  allowedDevOrigins: [
    "http://127.0.0.1:3003",
    "http://localhost:3003",
    "127.0.0.1:3003",
    "localhost:3003",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: ["127.0.0.1:3003", "localhost:3003"],
    },
  },

  // SWC compiler options (only used when Babel is not detected)
  compiler: {
    // Remove React dev props in production
    reactRemoveProperties: process.env.NODE_ENV === "production",
  },
  env: {
    // NEXT_PUBLIC_IS_E2E_TEST wird direkt über webServer.env in playwright.config gesetzt
    // Wenn es nicht gesetzt ist (z.B. bei normalen Entwicklungs- oder Produktions-Builds),
    // fällt es auf 'false' zurück
    NEXT_PUBLIC_IS_E2E_TEST: process.env.NEXT_PUBLIC_IS_E2E_TEST || "false",
  },
  /**
   *
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
      {
        // Apply CORP header specifically to WASM files for SharedArrayBuffer support
        source: "/stockfish-nnue-16.wasm",
        headers: [
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
  /**
   *
   * @param config
   * @param root0
   * @param root0.isServer
   * @param root0.dev
   */
  webpack: (config, { isServer, dev }) => {
    // Disable webpack cache during E2E tests to avoid corruption issues
    if (isE2ETest) {
      config.cache = false;
    }

    // File watching optimization to prevent cascade restarts
    if (dev && !isServer) {
      config.watchOptions = {
        ignored: [
          "**/node_modules/**",
          "**/.next/**",
          "**/test-results/**",
          "**/playwright-report/**",
          "**/.git/**",
          "**/coverage/**",
        ],
        // Reduce polling frequency to prevent E2E test conflicts
        poll: isE2ETest ? 2000 : 1000,
        aggregateTimeout: isE2ETest ? 500 : 300,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
