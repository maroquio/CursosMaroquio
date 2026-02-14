/**
 * TokenResponse DTO
 *
 * Segregated interface containing only token-related data.
 * Following ISP (Interface Segregation Principle), this allows
 * clients that only need token information to depend on a
 * minimal interface.
 *
 * @example
 * // Used by refresh token operations
 * const tokens: TokenResponse = {
 *   accessToken: 'eyJ...',
 *   refreshToken: 'abc123...',
 *   expiresIn: 3600
 * };
 */
export interface TokenResponse {
  /** JWT access token */
  accessToken: string;

  /** Opaque refresh token for token rotation */
  refreshToken: string;

  /** Access token expiration time in seconds */
  expiresIn: number;
}
