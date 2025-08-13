/**
 * Helper for dynamic requires in tests
 * Resolves @shared path alias to absolute path for runtime requires
 */
import { resolve } from 'path';

export function requireShared(modulePath: string): any {
  // Remove @shared/ prefix and build absolute path
  const relativePath = modulePath.replace('@shared/', '');
  const absolutePath = resolve(__dirname, '../../shared', relativePath);
  
  try {
    // Try absolute path first
    return require(absolutePath);
  } catch (error) {
    // Fallback to original path (for local development)
    try {
      return require(modulePath);
    } catch {
      throw new Error(`Failed to require module: ${modulePath} (tried ${absolutePath})`);
    }
  }
}