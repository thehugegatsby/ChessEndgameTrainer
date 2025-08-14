/**
 * Mock implementation of Next.js use-intersection hook
 * This prevents IntersectionObserver errors in tests
 */

module.exports = {
  useIntersection: () => ({
    rootRef: { current: null },
    isIntersecting: false,
    entry: undefined,
  }),
};