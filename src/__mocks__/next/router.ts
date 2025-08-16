import { type NextRouter } from 'next/router';
// Import the pre-instantiated mock router directly
import mockRouter from 'next-router-mock';

// Export the useRouter hook
export function useRouter(): NextRouter {
  return mockRouter;
}

// Export the router instance for direct manipulation in tests
export { mockRouter };

// Export default for import Router from 'next/router'
export default mockRouter;
