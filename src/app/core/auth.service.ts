import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiError } from './api-error';
import { PLATFORM_ACCESS_KEY, isTrustedPlatformHost } from './platform-key';

const API_DEFAULT_BASE = '';
const BASE_KEY = 'xs_admin_base';
const TOKEN_KEY = 'xs_admin_token';

for (const stale of ['https://xstoreegy-001-site1.jtempurl.com', 'http://xstoreegy-001-site1.jtempurl.com', 'http://localhost:4200', 'http://xstoreegy002-001-site1.etempurl.com', 'https://xstoreegy002-001-site1.etempurl.com']) {
  if (localStorage.getItem(BASE_KEY) === stale) localStorage.removeItem(BASE_KEY);
}

/** Admin marketplace API session — token/base persisted in localStorage, exactly like the
 *  legacy prototype's `API` object. Kept separate from the delivery-backend session below. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private readonly tokenSig = signal(localStorage.getItem(TOKEN_KEY) || '');
  readonly isLoggedIn = computed(() => !!this.tokenSig());
  readonly adminName = signal('Ahmed (Owner)');
  /** roleName from GET /api/auth/get-profile; '' while unknown, so nothing is hidden by default. */
  readonly roleName = signal('');
  /** roleName "Administrator" = limited admin — Fee Payments and General Settings stay owner-only. */
  readonly limitedAdmin = computed(() => this.roleName().toLowerCase() === 'administrator');
  private profileReq: Promise<void> | null = null;
  private profileLoaded = false;

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
    const changed = v !== this.tokenSig();
    if (v) localStorage.setItem(TOKEN_KEY, v);
    else localStorage.removeItem(TOKEN_KEY);
    this.tokenSig.set(v);
    if (changed) this.resetProfile();
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
    if (this.token) {
      // The live backend validates the admin session ONLY from the standard Bearer header
      // (it answers 401 + WWW-Authenticate: Bearer otherwise). X-Auth-Token is kept
      // alongside to match the Postman collection's dual scheme.
      headers['Authorization'] = 'Bearer ' + this.token;
      headers['X-Auth-Token'] = this.token;
    } else if (isTrustedPlatformHost(url)) {
      // Free-tier infra gate for the marketplace host — only relevant before sign-in.
      headers['Authorization'] = PLATFORM_ACCESS_KEY;
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
      // Without a limit a hung server leaves the page spinning forever. Uploads get longer
      // because a receipt or banner image on a slow mobile connection can legitimately take a while.
      const timeoutMs = payload instanceof FormData ? 120_000 : 30_000;
      res = await fetch(url.toString(), { method, headers, body: payload, signal: AbortSignal.timeout(timeoutMs) });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'TimeoutError') {
        throw new ApiError(0, 'The server took too long to answer. Try again.');
      }
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
      // Every caller swallows a 401 and returns, relying on this redirect — without it the
      // admin stays on a page whose requests all fail, and can keep navigating signed out.
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
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
    await this.ensureProfile();
  }

  async logout(): Promise<void> {
    try {
      await this.apiFetch('/api/auth/logout', { method: 'POST', noAuthRedirect: true });
    } catch {
      /* clear the local session regardless */
    }
    this.token = '';
  }

  /** GET /api/auth/get-profile — sets the sidebar name and roleName. Returns false when the
   *  profile couldn't be loaded; non-critical, so the placeholders stay in place. */
  async loadProfile(): Promise<boolean> {
    try {
      const p = await this.apiFetch<Record<string, unknown>>('/api/auth/get-profile', { noAuthRedirect: true });
      // The profile arrives flat, inside the Result envelope's `data`, or wrapped again
      // (`data.user` / `data.profile`) depending on backend version — search any of them.
      const name = firstText(findField(p, ['fullNameEn', 'fullName'])) || firstText(findField(p, ['name']));
      if (name) this.adminName.set(name);
      const rawRole = findField(p, ['roleName', 'RoleName', 'role_name', 'role']);
      let role = firstText(rawRole);
      if (!role && rawRole && typeof rawRole === 'object') role = firstText(findField(rawRole, ['roleName', 'name', 'title']));
      this.roleName.set(role);
      if (!role) console.warn('[auth] No roleName in the get-profile response — role-based nav/route restrictions stay off.');
      return true;
    } catch {
      return false;
    }
  }

  /** Loads the profile once per session — the shell calls it on every page load (so the role
   *  survives a refresh) and the role guard awaits it. Concurrent callers share one request;
   *  a failed load is retried by the next caller. */
  ensureProfile(): Promise<void> {
    if (!this.token || this.profileLoaded) return Promise.resolve();
    if (!this.profileReq) {
      const reqToken = this.token;
      this.profileReq = this.loadProfile().then((ok) => {
        if (this.token !== reqToken) return; // session switched while this request was in flight
        this.profileLoaded = ok;
        this.profileReq = null;
      });
    }
    return this.profileReq;
  }

  /** Session over — drop the name and role so a different account can't inherit them. */
  private resetProfile() {
    this.adminName.set('Ahmed (Owner)');
    this.roleName.set('');
    this.profileLoaded = false;
    this.profileReq = null;
  }
}

function serverMsg(d: unknown): string {
  if (!d) return '';
  if (typeof d === 'string') return d;
  const o = d as Record<string, unknown>;
  // The live API's Result envelope: { isSuccess, data, errorEn, errorAr, statusCode }.
  if (typeof o['errorEn'] === 'string' && o['errorEn']) return o['errorEn'];
  const err = o['error'];
  if (err && typeof err === 'object') return String((err as Record<string, unknown>)['message'] || '');
  if (typeof err === 'string') return err;
  return String(o['message'] || o['title'] || '');
}

/** Depth-limited recursive lookup for a field under any of `keys`, wherever the profile
 *  response nests it (flat / `data` / `data.user` / …). Tolerant like the DTO mappers. */
function findField(value: unknown, keys: readonly string[], depth = 0): unknown {
  if (depth > 3 || value === null || typeof value !== 'object') return undefined;
  const obj = value as Record<string, unknown>;
  for (const key of keys) {
    const v = obj[key];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  for (const v of Object.values(obj)) {
    const found = findField(v, keys, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
}

function firstText(...vals: unknown[]): string {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v.trim();
  return '';
}
