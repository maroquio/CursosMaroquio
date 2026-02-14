import { env } from '@shared/config/env.ts';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

const isProduction = env.NODE_ENV === 'production';

/**
 * Set the refresh token as an HttpOnly cookie on the response.
 */
export function setRefreshTokenCookie(set: any, refreshToken: string): void {
  set.cookie = set.cookie ?? {};
  set.cookie[REFRESH_TOKEN_COOKIE] = {
    value: refreshToken,
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/v1/auth',
    maxAge: Math.floor(env.JWT_REFRESH_EXPIRY_MS / 1000),
    ...(isProduction && { domain: env.COOKIE_DOMAIN }),
  };
}

/**
 * Clear the refresh token cookie.
 */
export function clearRefreshTokenCookie(set: any): void {
  set.cookie = set.cookie ?? {};
  set.cookie[REFRESH_TOKEN_COOKIE] = {
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/v1/auth',
    maxAge: 0,
    ...(isProduction && { domain: env.COOKIE_DOMAIN }),
  };
}

/**
 * Read the refresh token from the cookie jar.
 */
export function getRefreshTokenFromCookie(cookie: any): string | null {
  if (!cookie) return null;
  const token = cookie[REFRESH_TOKEN_COOKIE];
  if (!token) return null;
  // Elysia cookie objects have a .value property
  const value = typeof token === 'string' ? token : token?.value;
  return value || null;
}
