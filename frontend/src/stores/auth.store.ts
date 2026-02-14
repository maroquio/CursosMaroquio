import { create } from 'zustand';
import { authApi } from '../api/auth.api';
import type {
  ChangePasswordRequest,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileRequest,
  User,
} from '../types/auth.types';
import { tokenStorage, storage, STORAGE_KEYS } from '../utils/storage';
import { getUserFromToken, isTokenExpired } from '../utils/token';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: (logoutAll?: boolean) => Promise<void>;
  refreshTokens: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  loadFromStorage: () => void;
  clearError: () => void;
  fetchUser: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  uploadPhoto: (file: File) => Promise<string>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(credentials);
      if (response.success && response.data) {
        const { accessToken, user } = response.data;
        // Only store access token in localStorage; refresh token is in HttpOnly cookie
        tokenStorage.setAccessToken(accessToken);
        // Merge user data with roles from token
        const userFromToken = getUserFromToken(accessToken);
        const userWithRoles = {
          ...user,
          roles: userFromToken?.roles || user.roles || [],
        };
        storage.set(STORAGE_KEYS.USER, userWithRoles);
        set({ user: userWithRoles, isAuthenticated: true, isLoading: false });
      } else {
        set({ error: response.error || 'Login failed', isLoading: false });
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (credentials: RegisterCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(credentials);
      if (!response.success) {
        set({ error: response.error || 'Registration failed', isLoading: false });
        throw new Error(response.error || 'Registration failed');
      }
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async (logoutAll = false) => {
    try {
      // Refresh token is sent automatically via HttpOnly cookie
      await authApi.logout(logoutAll);
    } catch {
      // Ignore errors on logout
    } finally {
      get().clearAuth();
    }
  },

  refreshTokens: async () => {
    try {
      // Refresh token is sent automatically via HttpOnly cookie
      const response = await authApi.refreshToken();
      if (response.success && response.data) {
        tokenStorage.setAccessToken(response.data.accessToken);
      } else {
        get().clearAuth();
      }
    } catch {
      get().clearAuth();
    }
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      storage.set(STORAGE_KEYS.USER, user);
    } else {
      storage.remove(STORAGE_KEYS.USER);
    }
  },

  clearAuth: () => {
    tokenStorage.clearTokens();
    storage.remove(STORAGE_KEYS.USER);
    set({ ...initialState, isLoading: false });
  },

  loadFromStorage: () => {
    const accessToken = tokenStorage.getAccessToken();

    if (!accessToken) {
      // No access token: try refreshing via HttpOnly cookie (might have a valid session)
      get()
        .refreshTokens()
        .then(() => {
          const newAccessToken = tokenStorage.getAccessToken();
          if (newAccessToken) {
            const userFromToken = getUserFromToken(newAccessToken);
            if (userFromToken) {
              set({ user: userFromToken, isAuthenticated: true, isLoading: false });
            } else {
              set({ isLoading: false });
            }
          } else {
            set({ isLoading: false });
          }
        })
        .catch(() => {
          set({ isLoading: false });
        });
      return;
    }

    if (isTokenExpired(accessToken)) {
      get()
        .refreshTokens()
        .then(() => {
          const newAccessToken = tokenStorage.getAccessToken();
          if (newAccessToken) {
            const userFromToken = getUserFromToken(newAccessToken);
            if (userFromToken) {
              set({
                user: userFromToken,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              set({ isLoading: false });
            }
          } else {
            set({ isLoading: false });
          }
        })
        .catch(() => {
          set({ isLoading: false });
        });
    } else {
      const userFromToken = getUserFromToken(accessToken);
      const storedUser = storage.get<User>(STORAGE_KEYS.USER);
      // Merge stored user with roles from token (token roles are authoritative)
      const user = storedUser
        ? { ...storedUser, roles: userFromToken?.roles || storedUser.roles || [] }
        : userFromToken;

      if (user) {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    }
  },

  clearError: () => {
    set({ error: null });
  },

  fetchUser: async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        get().setUser(response.data);
      }
    } catch {
      // Ignore error
    }
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await authApi.updateProfile(data);
    if (response.success && response.data) {
      get().setUser(response.data);
    } else {
      throw new Error(response.error || 'Failed to update profile');
    }
  },

  uploadPhoto: async (file: File) => {
    const response = await authApi.uploadPhoto(file);
    if (response.success && response.data) {
      const currentUser = get().user;
      if (currentUser) {
        get().setUser({ ...currentUser, photoUrl: response.data.photoUrl });
      }
      return response.data.photoUrl;
    } else {
      throw new Error(response.error || 'Failed to upload photo');
    }
  },

  changePassword: async (data: ChangePasswordRequest) => {
    const response = await authApi.changePassword(data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to change password');
    }
  },

  deleteAccount: async (password: string) => {
    const response = await authApi.deleteAccount({ password });
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete account');
    }
    get().clearAuth();
  },
}));
