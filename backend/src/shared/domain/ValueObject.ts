/**
 * Base class for Value Objects
 * Value objects are immutable objects without identity, identified by their value
 * Two value objects with the same properties are considered equal
 */
export abstract class ValueObject<T extends Record<string, any>> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * Check equality with another value object
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }

    if (!(vo instanceof this.constructor)) {
      return false;
    }

    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }

  /**
   * Get the properties of this value object
   */
  public getProps(): T {
    return this.props;
  }
}
