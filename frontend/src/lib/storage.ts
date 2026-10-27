import type { AuthResponse } from '../types/api';

export type AuthTokens = AuthResponse;

const appScope = import.meta.env.VITE_APP_SCOPE === 'admin' ? 'admin' : 'storefront';
const AUTH_STORAGE_KEY = `nova-gear.${appScope}.auth`;
export const AUTH_STORAGE_EVENT = `nova-gear:${appScope}:auth-changed`;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function notifyAuthChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
  }
}

export function getAuthTokens(): AuthTokens | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedValue) {
      return null;
    }

    const tokens = JSON.parse(storedValue) as Partial<AuthTokens>;
    if (
      typeof tokens.accessToken !== 'string' ||
      typeof tokens.refreshToken !== 'string' ||
      typeof tokens.tokenType !== 'string'
    ) {
      return null;
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      accessTokenExpiresIn:
        typeof tokens.accessTokenExpiresIn === 'number' ? tokens.accessTokenExpiresIn : 0,
    };
  } catch {
    return null;
  }
}

export function saveAuthTokens(tokens: AuthTokens): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
  notifyAuthChanged();
}

export function clearAuthTokens(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyAuthChanged();
}
