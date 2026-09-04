import { Injectable, computed, signal } from '@angular/core';
import { ApiError } from './api-error';

const API_DEFAULT_BASE = 'https://xstoreegy002-001-site1.etempurl.com';
const BASE_KEY = 'xs_admin_base';
const TOKEN_KEY = 'xs_admin_token';

for (const stale of ['https://xstoreegy-001-site1.jtempurl.com', 'http://xstoreegy-001-site1.jtempurl.com', 'http://localhost:4200', 'http://xstoreegy002-001-site1.etempurl.com']) {
  if (localStorage.getItem(BASE_KEY) === stale) localStorage.removeItem(BASE_KEY);
}

/** Admin marketplace API session — token/base persisted in localStorage, exactly like the
 *  legacy prototype's `API` object. Kept separate from the delivery-backend session below. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSig = signal(localStorage.getItem(TOKEN_KEY) || '');
  readonly isLoggedIn = computed(() => !!this.tokenSig());
  readonly adminName = signal('Ahmed (Owner)');

  get base(): string {
    return localStorage.getItem(BASE_KEY) || API_DEFAULT_BASE;
  }
  set base(v: string) {
    if (v) localStorage.setItem(BASE_KEY, v);
    else localStorage.removeItem(BASE_KEY);
  }
  get token(): string {
    return this.tokenSig();
  }
  set token(v: string) {
    if (v) localStorage.setItem(TOKEN_KEY, v);
    else localStorage.removeItem(TOKEN_KEY);
    this.tokenSig.set(v);
  }

  /** Generic fetch wrapper — mirrors legacy apiFetch(): Bearer auth, JSON or multipart body,
   *  tolerant response parsing, and 401 → force sign-out. */
  async apiFetch<T = unknown>(
    path: string,
    opts: { method?: string; query?: Record<string, string | number | undefined | null>; body?: unknown; noAuthRedirect?: boolean } = {},
  ): Promise<T> {
    const { method = 'GET', query, body, noAuthRedirect = false } = opts;
    const base = this.base.replace(/\/+$/, '');
    let url: URL;
    try {
      url = base ? new URL(base + path) : new URL(path, window.location.origin);
    } catch {
      throw new ApiError(0, 'Invalid API base URL.');
    }
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
      });
    }
    const headers: Record<string, string> = {};
    headers['Authorization'] = 'Basic MTEzMjQ4ODM6NjAtZGF5ZnJlZXRyaWFs';
    if (this.token) {
      // The backend accepts either — sent both to match the Postman collection exactly.
      // headers['Authorization'] = 'Bearer ' + this.token;
      headers['X-Auth-Token'] = this.token;
    }
    let payload: BodyInit | undefined;
    if (body instanceof FormData) {
      payload = body;
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    let res: Response;
    try {
      res = await fetch(url.toString(), { method, headers, body: payload });
    } catch {
      throw new ApiError(0, 'Network error — is the API reachable at ' + this.base + '? (CORS or server down)');
    }
    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (res.status === 401 && !noAuthRedirect) {
      this.token = '';
      throw new ApiError(401, 'Your session expired — please sign in again.');
    }
    if (!res.ok) throw new ApiError(res.status, serverMsg(data) || `Request failed (${res.status}).`);
    return data as T;
  }

  async login(phoneNumber: string, password: string): Promise<void> {
    const data = await this.apiFetch<Record<string, unknown>>('/api/auth/login', {
      method: 'POST',
      noAuthRedirect: true,
      body: { phoneNumber, password, rememberMe: true },
    });
    const token = (data?.['token'] || data?.['accessToken']) as string | undefined;
    if (!token) throw new ApiError(0, 'Server did not return a token.');
    this.token = token;
    await this.loadProfile();
  }

  async logout(): Promise<void> {
    try {
      await this.apiFetch('/api/auth/logout', { method: 'POST', noAuthRedirect: true });
    } catch {
      /* clear the local session regardless */
    }
    this.token = '';
    this.adminName.set('Ahmed (Owner)');
  }

  /** GET /api/auth/get-profile — replaces the placeholder sidebar name once available.
   *  Non-critical: a failure here just leaves the placeholder in place. */
  async loadProfile(): Promise<void> {
    try {
      const p = await this.apiFetch<Record<string, unknown>>('/api/auth/get-profile', { noAuthRedirect: true });
      const name = (p?.['fullNameEn'] || p?.['fullName'] || p?.['name']) as string | undefined;
      if (name) this.adminName.set(name);
    } catch {
      /* keep the placeholder */
    }
  }
}

function serverMsg(d: unknown): string {
  if (!d) return '';
  if (typeof d === 'string') return d;
  const o = d as Record<string, unknown>;
  const err = o['error'];
  if (err && typeof err === 'object') return String((err as Record<string, unknown>)['message'] || '');
  if (typeof err === 'string') return err;
  return String(o['message'] || o['title'] || '');
}
