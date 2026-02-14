import type { TokenResponse } from './TokenResponse.ts';
import type { AuthenticatedUser } from './AuthenticatedUser.ts';

/**
 * LoginResponse DTO
 *
 * Composite interface combining TokenResponse and AuthenticatedUser.
 * This demonstrates ISP-compliant composition: LoginResponse extends
 * both segregated interfaces, allowing clients to use either the
 * full response or just the parts they need.
 *
 * @example
 * // Full login response
 * const response: LoginResponse = {
 *   accessToken: 'eyJ...',
 *   refreshToken: 'abc123...',
 *   expiresIn: 3600,
 *   user: {
 *     id: '01234567-89ab-cdef-0123-456789abcdef',
 *     email: 'user@example.com'
 *   }
 * };
 *
 * // Extract only tokens (TokenResponse)
 * const tokens: TokenResponse = {
 *   accessToken: response.accessToken,
 *   refreshToken: response.refreshToken,
 *   expiresIn: response.expiresIn
 * };
 *
 * // Extract only user (AuthenticatedUser)
 * const user: AuthenticatedUser = response.user;
 */
export interface LoginResponse extends TokenResponse {
  /** Authenticated user information */
  user: AuthenticatedUser;
}
