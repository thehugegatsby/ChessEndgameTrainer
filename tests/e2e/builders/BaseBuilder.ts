/**
 * @fileoverview Base Builder Class
 * @description Minimal base class for shared builder functionality
 */

/**
 * Abstract base builder providing immutable builder pattern
 * @template T The type being built
 * @template B The builder type (for proper chaining)
 */
export abstract class BaseBuilder<T, B extends BaseBuilder<T, B>> {
  protected data: Partial<T>;

  constructor(initialData: Partial<T> = {}) {
    // Deep clone to ensure immutability
    this.data = this.deepClone(initialData);
  }

  /**
   * Creates a new instance of the builder with updated data
   * Ensures immutability by creating new instances
   */
  protected with<K extends keyof T>(key: K, value: T[K]): B {
    const BuilderClass = this.constructor as new (data: Partial<T>) => B;
    return new BuilderClass({
      ...this.data,
      [key]: value,
    });
  }

  /**
   * Creates a new instance with multiple updates
   */
  protected withMany(updates: Partial<T>): B {
    const BuilderClass = this.constructor as new (data: Partial<T>) => B;
    return new BuilderClass({
      ...this.data,
      ...updates,
    });
  }

  /**
   * Deep clones an object to ensure immutability
   */
  protected deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }
    
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    
    return cloned;
  }

  /**
   * Returns the current state of the builder data
   * Useful for debugging
   */
  protected getCurrentData(): Readonly<Partial<T>> {
    return this.deepClone(this.data);
  }

  /**
   * Abstract method to validate the built object
   * Must be implemented by subclasses
   */
  protected abstract validate(data: T): void;

  /**
   * Abstract method to provide default values
   * Must be implemented by subclasses
   */
  protected abstract getDefaults(): T;

  /**
   * Builds the final object with validation
   */
  public build(): T {
    const defaults = this.getDefaults();
    const finalData = { ...defaults, ...this.data } as T;
    
    // Validate before returning
    this.validate(finalData);
    
    // Return a deep clone to ensure the built object is immutable
    return this.deepClone(finalData);
  }
}