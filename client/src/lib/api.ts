'use client';

import { API_BASE_URL, TOKEN_COOKIE } from './config';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const MAX_AGE = 60 * 60 * 24 * 7; // matches the server's default JWT lifetime

export const tokenStore = {
  get(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  },
  set(token: string) {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`;
  },
  clear() {
    document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
};

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

type Options = { method?: string; body?: unknown; auth?: boolean; signal?: AbortSignal };

async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, auth = false, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (res.status === 401 && auth) {
    tokenStore.clear();
    onUnauthorized?.();
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  get: <T,>(path: string, auth = false, signal?: AbortSignal) => request<T>(path, { auth, signal }),
  post: <T,>(path: string, body: unknown, auth = false) =>
    request<T>(path, { method: 'POST', body, auth }),
  patch: <T,>(path: string, body: unknown, auth = true) =>
    request<T>(path, { method: 'PATCH', body, auth }),
  del: <T,>(path: string, auth = true) => request<T>(path, { method: 'DELETE', auth })
};
