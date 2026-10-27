import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '../api/services';
import {
  AUTH_STORAGE_EVENT,
  clearAuthTokens,
  getAuthTokens,
  saveAuthTokens,
  type AuthTokens,
} from '../lib/storage';
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../types/api';
import { getAuthUserFromTokens } from './session';

export interface AuthContextValue {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginRequest) => Promise<AuthResponse>;
  register: (payload: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<AuthTokens | null>(() => getAuthTokens());

  const syncAuthState = useCallback(() => {
    setTokens(getAuthTokens());
  }, []);

  useEffect(() => {
    window.addEventListener('storage', syncAuthState);
    window.addEventListener(AUTH_STORAGE_EVENT, syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener(AUTH_STORAGE_EVENT, syncAuthState);
    };
  }, [syncAuthState]);

  const login = useCallback(async (payload: LoginRequest) => {
    const session = await authApi.login(payload);
    saveAuthTokens(session);
    setTokens(session);
    return session;
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    const session = await authApi.register(payload);
    saveAuthTokens(session);
    setTokens(session);
    return session;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getAuthTokens()?.refreshToken;

    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } finally {
      clearAuthTokens();
      setTokens(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = getAuthUserFromTokens(tokens);

    return {
      user,
      tokens,
      isAuthenticated: Boolean(user),
      isAdmin: user?.isAdmin ?? false,
      login,
      register,
      logout,
    };
  }, [login, logout, register, tokens]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider.');
  }

  return context;
}
