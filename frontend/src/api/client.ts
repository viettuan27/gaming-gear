/// <reference types="vite/client" />

import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { clearAuthTokens, getAuthTokens, saveAuthTokens } from '../lib/storage';
import type { ApiResponse, AuthResponse } from '../types/api';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
});

// Một axios instance riêng cho refresh token: nếu refresh thất bại, interceptor
// của apiClient sẽ không tự gọi refresh thêm lần nữa.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<AuthResponse | null> | null = null;

function isAuthenticationRequest(url: string | undefined): boolean {
  return url?.includes('/auth/') ?? false;
}

async function refreshAccessToken(): Promise<AuthResponse | null> {
  const tokens = getAuthTokens();
  if (!tokens?.refreshToken) {
    clearAuthTokens();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<ApiResponse<AuthResponse>>('/auth/refresh-token', {
        refreshToken: tokens.refreshToken,
      })
      .then((response) => {
        const session = response.data.data;

        if (!response.data.success || !session?.accessToken || !session.refreshToken) {
          throw new Error('Không thể làm mới phiên đăng nhập.');
        }

        saveAuthTokens(session);
        return session;
      })
      .catch(() => {
        clearAuthTokens();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getAuthTokens()?.accessToken;

  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthenticationRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const refreshedSession = await refreshAccessToken();

    if (!refreshedSession) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${refreshedSession.accessToken}`;
    return apiClient(originalRequest);
  },
);

/**
 * Các controller Spring Boot trả về một ApiResponse bọc ngoài dữ liệu.
 * Hàm này chỉ lấy phần data để code ở component/query gọn hơn.
 */
export async function unwrapResponse<T>(
  request: Promise<AxiosResponse<ApiResponse<T>>>,
): Promise<T> {
  const response = (await request).data;

  if (!response.success) {
    throw new Error(response.message || 'Yêu cầu không thể hoàn tất.');
  }

  return response.data;
}

interface ErrorEnvelope {
  message?: unknown;
  data?: unknown;
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.',
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ErrorEnvelope | undefined;

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }

    if (error.response?.status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }

    if (error.response?.status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.';
    }

    if (!error.response) {
      return 'Không thể kết nối đến máy chủ. Hãy kiểm tra backend đang chạy.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) {
    return {};
  }

  const data = error.response?.data as ErrorEnvelope | undefined;
  if (!data?.data || typeof data.data !== 'object' || Array.isArray(data.data)) {
    return {};
  }

  return Object.entries(data.data).reduce<Record<string, string>>((errors, [field, message]) => {
    if (typeof message === 'string') {
      errors[field] = message;
    }

    return errors;
  }, {});
}
