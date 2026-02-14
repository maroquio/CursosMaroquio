import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../stores/auth.store';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    clearError,
    loadFromStorage,
  } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      await storeLogin(credentials);
      navigate('/dashboard');
    },
    [storeLogin, navigate]
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      await storeRegister(credentials);
      navigate('/login');
    },
    [storeRegister, navigate]
  );

  const logout = useCallback(
    async (logoutAll = false) => {
      await storeLogout(logoutAll);
      navigate('/');
    },
    [storeLogout, navigate]
  );

  const hasRole = useCallback(
    (role: string) => {
      return user?.roles?.includes(role) ?? false;
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: string[]) => {
      return roles.some((role) => user?.roles?.includes(role));
    },
    [user]
  );

  const isAdmin = useCallback(() => {
    return hasRole('admin');
  }, [hasRole]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    loadFromStorage,
    hasRole,
    hasAnyRole,
    isAdmin,
  };
}
