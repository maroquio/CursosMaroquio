/**
 * Password Hasher Interface
 * Domain service interface for password hashing operations
 *
 * This interface belongs in the domain layer because:
 * 1. Password hashing is a domain concept (security requirement)
 * 2. The domain defines WHAT operations are needed
 * 3. Infrastructure implements HOW (bcrypt, argon2, etc.)
 */
export interface IPasswordHasher {
  /**
   * Hash a plain text password
   * @param password - The plain text password to hash
   * @returns The hashed password string
   */
  hash(password: string): Promise<string>;

  /**
   * Compare a plain text password with a hash
   * @param password - The plain text password to verify
   * @param hash - The hash to compare against
   * @returns True if the password matches the hash
   */
  compare(password: string, hash: string): Promise<boolean>;
}
