/**
 * Helper for dynamic requires in tests
 * Resolves @shared path alias to absolute path for runtime requires
 */
import { resolve } from 'path';

export function requireShared(modulePath: string): any {
  // If not a @shared path, return normal require
  if (!modulePath.startsWith('@shared/')) {
    return require(modulePath);
  }
  
  // Remove @shared/ prefix and build absolute path
  const relativePath = modulePath.replace('@shared/', '');
  const absolutePath = resolve(__dirname, '../../shared', relativePath);
  
  try {
    // Try absolute path first
    return require(absolutePath);
  } catch (error) {
    // Fallback to original path (for local development where ts-node handles it)
    try {
      return require(modulePath);
    } catch (fallbackError) {
      // Try one more time with a different path resolution
      try {
        const srcPath = resolve(__dirname, '../../../src/shared', relativePath);
        return require(srcPath);
      } catch {
        throw new Error(`Failed to require module: ${modulePath} (tried ${absolutePath})`);
      }
    }
  }
}