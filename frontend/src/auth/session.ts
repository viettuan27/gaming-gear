import type { AuthResponse, AuthUser } from '../types/api';

interface JwtPayload {
  sub?: string;
  roles?: unknown;
}

export function getAuthUserFromTokens(tokens: AuthResponse | null): AuthUser | null {
  if (!tokens?.accessToken) {
    return null;
  }

  const payload = decodeJwtPayload(tokens.accessToken);
  if (!payload?.sub || typeof payload.sub !== 'string') {
    return null;
  }

  const roles = Array.isArray(payload.roles)
    ? payload.roles.filter((role): role is string => typeof role === 'string')
    : [];

  return {
    email: payload.sub,
    roles,
    isAdmin: roles.includes('ADMIN'),
  };
}

function decodeJwtPayload(accessToken: string): JwtPayload | null {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));

    return JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload;
  } catch {
    return null;
  }
}
