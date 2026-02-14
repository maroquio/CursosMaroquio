/**
 * AuthenticatedUser DTO
 *
 * Segregated interface containing only user identity data.
 * Following ISP (Interface Segregation Principle), this allows
 * clients that only need user information to depend on a
 * minimal interface.
 *
 * @example
 * // Used to display user info in UI
 * const user: AuthenticatedUser = {
 *   id: '01234567-89ab-cdef-0123-456789abcdef',
 *   email: 'user@example.com',
 *   roles: ['user', 'admin']
 * };
 */
export interface AuthenticatedUser {
  /** User's unique identifier (UUID v7) */
  id: string;

  /** User's email address (normalized to lowercase) */
  email: string;

  /** User's full name */
  fullName: string;

  /** User's phone number */
  phone: string;

  /** User's profile photo URL */
  photoUrl: string | null;

  /** User's roles for authorization */
  roles: string[];
}
