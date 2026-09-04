import { Injectable, computed, signal } from '@angular/core';

const DELIVERY_DEFAULT_BASE = 'http://localhost:5080';
const BASE_KEY = 'xs_delivery_base';
const TOKEN_KEY = 'xs_delivery_token';

/** Session + fetch wrapper for the standalone delivery-backend (couriers, package
 *  requests, cash oversight) — a separate service from the marketplace admin API,
 *  with its own base URL + Bearer token. Ported from the legacy prototype's `DELIVERY`
 *  object / deliveryFetch(). Not connected → callers fall back to demo seed data. */
@Injectable({ providedIn: 'root' })
export class DeliveryApiService {
  private readonly tokenSig = signal(localStorage.getItem(TOKEN_KEY) || '');
  readonly connected = computed(() => !!this.tokenSig());

  get base(): string {
    return localStorage.getItem(BASE_KEY) || DELIVERY_DEFAULT_BASE;
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

  async fetch<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
    const { method = 'GET', body } = opts;
    const url = this.base.replace(/\/+$/, '') + path;
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    let payload: BodyInit | undefined;
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    let res: Response;
    try {
      res = await fetch(url, { method, headers, body: payload });
    } catch {
      throw new Error('Cannot reach delivery API at ' + this.base + ' (server down or CORS).');
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
    if (res.status === 401) {
      this.token = '';
      throw new Error('Delivery session expired — reconnect.');
    }
    if (!res.ok) {
      const d = data as Record<string, unknown> | null;
      throw new Error((d && (d['title'] || d['message'] || (typeof d['error'] === 'string' ? d['error'] : ''))) as string || `Request failed (${res.status}).`);
    }
    return data as T;
  }

  async connect(phoneNumber: string, base?: string): Promise<void> {
    if (base) this.base = base;
    const data = await this.fetch<Record<string, unknown>>('/api/auth/login', { method: 'POST', body: { phoneNumber } });
    const token = data?.['token'] as string | undefined;
    if (!token) throw new Error('No token returned.');
    if (data?.['role'] && String(data['role']).toLowerCase() !== 'admin') throw new Error('That account is not an admin.');
    this.token = token;
  }

  disconnect(): void {
    this.token = '';
  }

  couriers() {
    return this.fetch<unknown>('/api/admin/couriers');
  }
  packages() {
    return this.fetch<unknown>('/api/delivery-requests/admin');
  }
  setPrice(id: string, price: number) {
    return this.fetch(`/api/delivery-requests/${id}/price`, { method: 'POST', body: { price } });
  }
  assignPackageCourier(id: string, courierId: string) {
    return this.fetch(`/api/delivery-requests/${id}/assign`, { method: 'POST', body: { courierId } });
  }
  recordHandover(courierId: string) {
    return this.fetch(`/api/admin/couriers/${courierId}/cash-handover`, { method: 'POST' });
  }
  setCourierDuty(courierId: string, status: 'active' | 'off') {
    return this.fetch(`/api/admin/couriers/${courierId}/duty`, { method: 'POST', body: { status } });
  }
  createCourier(name: string, phone: string, zone: string) {
    return this.fetch('/api/admin/couriers', { method: 'POST', body: { name, phone, zone } });
  }
}
