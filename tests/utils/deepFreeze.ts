/**
 * Deep freeze utility for creating truly immutable test objects
 * Recursively freezes all nested objects to prevent mutations
 */

/**
 * Recursively freezes an object and all its nested properties
 * @param obj - The object to freeze
 * @returns The same object, but deeply frozen
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  // Freeze the object itself
  Object.freeze(obj);

  // Get all property names including non-enumerable
  const propNames = Object.getOwnPropertyNames(obj);

  // Recursively freeze all properties
  for (const prop of propNames) {
    const value = (obj as any)[prop];

    // Skip if property is not an object or is already frozen
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      // Handle arrays specially to maintain their type
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item && typeof item === "object") {
            value[index] = deepFreeze(item);
          }
        });
      }
      deepFreeze(value);
    }
  }

  return obj as Readonly<T>;
}

/**
 * Type-safe deep freeze that preserves const assertions
 * Use this when you want to maintain literal types
 */
export function deepFreezeConst<T extends object>(obj: T): T {
  return deepFreeze(obj) as T;
}

/**
 * Checks if an object is deeply frozen
 * Useful for testing that immutability is properly applied
 */
export function isDeepFrozen(obj: any): boolean {
  if (!Object.isFrozen(obj)) {
    return false;
  }

  // Check all properties recursively
  for (const prop of Object.getOwnPropertyNames(obj)) {
    const value = obj[prop];
    if (value && typeof value === "object") {
      if (!isDeepFrozen(value)) {
        return false;
      }
    }
  }

  return true;
}
