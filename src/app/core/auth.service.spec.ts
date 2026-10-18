import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthService } from './auth.service';

/** Node 25's experimental `localStorage` global shadows jsdom's — AuthService reads it at
 *  class-init time, so stub it in before importing the service. */
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    key: (i) => Array.from(m.keys())[i] ?? null,
    removeItem: (k) => {
      m.delete(k);
    },
    setItem: (k, v) => {
      m.set(k, String(v));
    },
  };
}

/** The sidebar hides Fee Payments / General Settings for roleName "Administrator" — this
 *  pins down the profile parsing that powers that check (see shell.component.ts). */
describe('AuthService role detection', () => {
  let auth: AuthService;

  beforeAll(() => {
    vi.stubGlobal('localStorage', memoryStorage());
  });
  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    const { AuthService: Service } = await import('./auth.service');
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { navigate: vi.fn(), url: '/' } }],
    });
    auth = TestBed.inject(Service);
    localStorage.clear();
  });

  it('flags roleName "Administrator" as limitedAdmin', async () => {
    vi.spyOn(auth, 'apiFetch').mockResolvedValue({ fullNameEn: 'Admin One', roleName: 'Administrator' });
    await auth.loadProfile();
    expect(auth.adminName()).toBe('Admin One');
    expect(auth.roleName()).toBe('Administrator');
    expect(auth.limitedAdmin()).toBe(true);
  });

  it('unwraps the Result envelope and nested profile wrappers', async () => {
    vi.spyOn(auth, 'apiFetch').mockResolvedValue({ isSuccess: true, data: { roleName: 'administrator' } });
    await auth.loadProfile();
    expect(auth.limitedAdmin()).toBe(true);

    vi.spyOn(auth, 'apiFetch').mockResolvedValue({ isSuccess: true, data: { user: { fullNameEn: 'Admin Two', roleName: 'Administrator' } } });
    await auth.loadProfile();
    expect(auth.adminName()).toBe('Admin Two');
    expect(auth.limitedAdmin()).toBe(true);
  });

  it('does not restrict other roles', async () => {
    vi.spyOn(auth, 'apiFetch').mockResolvedValue({ data: { roleName: 'Super Admin' } });
    await auth.loadProfile();
    expect(auth.limitedAdmin()).toBe(false);
  });

  it('clears the role when the session ends', async () => {
    vi.spyOn(auth, 'apiFetch').mockImplementation(async (path: string) =>
      path === '/api/auth/logout' ? {} : { roleName: 'Administrator' },
    );
    auth.token = 'tkn';
    await auth.ensureProfile();
    expect(auth.limitedAdmin()).toBe(true);
    await auth.logout();
    expect(auth.roleName()).toBe('');
    expect(auth.limitedAdmin()).toBe(false);
  });

  it('reloads the profile when a different account signs in', async () => {
    vi.spyOn(auth, 'apiFetch').mockResolvedValue({ roleName: 'Administrator' });
    auth.token = 'first';
    await auth.ensureProfile();
    expect(auth.limitedAdmin()).toBe(true);

    auth.token = 'second';
    expect(auth.roleName()).toBe('');
    vi.spyOn(auth, 'apiFetch').mockResolvedValue({ roleName: 'Super Admin' });
    await auth.ensureProfile();
    expect(auth.limitedAdmin()).toBe(false);
  });
});
