/**
 * Result type for functional error handling
 * Implements a monadic pattern for composable operations
 */
export class Result<T> {
  private constructor(
    private readonly isSuccess: boolean,
    private readonly error?: string | Error,
    private readonly value?: T
  ) {}

  /**
   * Creates a successful result
   */
  public static ok<U>(value: U): Result<U> {
    return new Result(true, undefined, value);
  }

  /**
   * Creates a failed result
   */
  public static fail<U>(error: string | Error): Result<U> {
    return new Result(false, error);
  }

  /**
   * Checks if the result is successful
   */
  public get isOk(): boolean {
    return this.isSuccess;
  }

  /**
   * Checks if the result is a failure
   */
  public get isFailure(): boolean {
    return !this.isSuccess;
  }

  /**
   * Gets the value from a successful result
   */
  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(`Cannot get value from failed result: ${this.error}`);
    }
    return this.value as T;
  }

  /**
   * Gets the error from a failed result
   */
  public getError(): string | Error | undefined {
    return this.error;
  }

  /**
   * Maps the value of a successful result
   */
  public map<U>(fn: (value: T) => U): Result<U> {
    if (!this.isSuccess) {
      return Result.fail<U>(this.error as string | Error);
    }
    try {
      return Result.ok(fn(this.value as T));
    } catch (error) {
      return Result.fail<U>(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Chains operations on a successful result
   */
  public flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (!this.isSuccess) {
      return Result.fail<U>(this.error as string | Error);
    }
    return fn(this.value as T);
  }

  /**
   * Unwraps the result, throwing if it's a failure
   */
  public getValueOrThrow(): T {
    if (!this.isSuccess) {
      throw this.error instanceof Error ? this.error : new Error(this.error);
    }
    return this.value as T;
  }

  /**
   * Provides a default value for a failed result
   */
  public getValueOrDefault(defaultValue: T): T {
    return this.isSuccess ? (this.value as T) : defaultValue;
  }
}
