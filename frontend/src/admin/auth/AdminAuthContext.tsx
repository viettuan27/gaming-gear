import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '../../api/services';
import {
  AUTH_STORAGE_EVENT,
  clearAuthTokens,
  getAuthTokens,
  saveAuthTokens,
  type AuthTokens,
} from '../../lib/storage';
import type { AuthResponse, AuthUser, LoginRequest } from '../../types/api';
import { getAuthUserFromTokens } from '../../auth/session';

interface AdminAuthContextValue {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  clearSession: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

function getStoredAdminTokens(): AuthTokens | null {
  const tokens = getAuthTokens();
  const user = getAuthUserFromTokens(tokens);

  if (tokens && !user?.isAdmin) {
    clearAuthTokens();
    return null;
  }

  return tokens;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<AuthTokens | null>(() => getStoredAdminTokens());

  const syncAuthState = useCallback(() => {
    setTokens(getStoredAdminTokens());
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
    const user = getAuthUserFromTokens(session);

    if (!user?.isAdmin) {
      try {
        await authApi.logout(session.refreshToken);
      } catch {
        // Token chưa từng được lưu trong admin origin; lỗi revoke không được phép mở portal.
      }

      clearAuthTokens();
      setTokens(null);
      throw new Error('Tài khoản này không có quyền quản trị. Hãy đăng nhập bằng tài khoản ADMIN.');
    }

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

  const clearSession = useCallback(() => {
    clearAuthTokens();
    setTokens(null);
  }, []);

  const value = useMemo<AdminAuthContextValue>(() => {
    const user = getAuthUserFromTokens(tokens);

    return {
      user,
      tokens,
      isAuthenticated: Boolean(user),
      isAdmin: user?.isAdmin ?? false,
      login,
      logout,
      clearSession,
    };
  }, [clearSession, login, logout, tokens]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error('useAdminAuth phải được sử dụng bên trong AdminAuthProvider.');
  }

  return context;
}
