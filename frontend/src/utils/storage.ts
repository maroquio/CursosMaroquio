const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  COLOR_SCHEME: 'mantine-color-scheme-value',
  LANGUAGE: 'i18nextLng',
  OAUTH_STATE: 'oauth_state',
  OAUTH_CODE_VERIFIER: 'oauth_code_verifier',
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const storage = {
  get<T>(key: StorageKey): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: StorageKey, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
    }
  },

  remove(key: StorageKey): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
};

export const sessionStorage_ = {
  get<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
    }
  },

  remove(key: string): void {
    sessionStorage.removeItem(key);
  },
};

export const tokenStorage = {
  getAccessToken(): string | null {
    return storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setAccessToken(token: string): void {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  getRefreshToken(): string | null {
    return storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken(token: string): void {
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  clearTokens(): void {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  },
};

export const oauthStorage = {
  setState(state: string): void {
    sessionStorage_.set(STORAGE_KEYS.OAUTH_STATE, state);
  },

  getState(): string | null {
    return sessionStorage_.get<string>(STORAGE_KEYS.OAUTH_STATE);
  },

  setCodeVerifier(codeVerifier: string): void {
    sessionStorage_.set(STORAGE_KEYS.OAUTH_CODE_VERIFIER, codeVerifier);
  },

  getCodeVerifier(): string | null {
    return sessionStorage_.get<string>(STORAGE_KEYS.OAUTH_CODE_VERIFIER);
  },

  clear(): void {
    sessionStorage_.remove(STORAGE_KEYS.OAUTH_STATE);
    sessionStorage_.remove(STORAGE_KEYS.OAUTH_CODE_VERIFIER);
  },
};

export { STORAGE_KEYS };
