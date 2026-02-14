interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

export function getTokenExpirationTime(token: string): Date | null {
  const payload = decodeJWT(token);
  if (!payload) return null;

  return new Date(payload.exp * 1000);
}

export function isTokenExpiringSoon(token: string, thresholdSeconds = 60): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now < thresholdSeconds;
}

export function getUserFromToken(token: string): { id: string; email: string; fullName: string; roles: string[] } | null {
  const payload = decodeJWT(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    email: payload.email,
    fullName: '', // fullName is not in JWT, will be populated from stored user or API
    roles: payload.roles,
  };
}
