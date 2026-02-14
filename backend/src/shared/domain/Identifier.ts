/**
 * Base class for strongly-typed identifiers
 * Prevents accidental mixing of different ID types
 * Frozen after construction for immutability
 */
export abstract class Identifier<T> {
  constructor(private readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Get the string value of the identifier
   */
  public toValue(): string {
    return this.value;
  }

  /**
   * Get the string representation
   */
  public toString(): string {
    return this.value;
  }

  /**
   * Check equality with another identifier
   */
  public equals(id?: Identifier<T>): boolean {
    if (id === null || id === undefined) {
      return false;
    }

    // Check if same constructor (prevents UserId.equals(TaskId))
    if (!(id instanceof this.constructor)) {
      return false;
    }

    return id.toValue() === this.value;
  }
}
