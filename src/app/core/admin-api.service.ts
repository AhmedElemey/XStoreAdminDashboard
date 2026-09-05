import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Dto } from './models';

export interface UsersQuery {
  keyword?: string;
  role?: string;
  isVerified?: string;
  vendorStatus?: string;
  page: number;
  pageSize: number;
  [key: string]: string | number | undefined;
}

export interface VendorsQuery {
  keyword?: string;
  vendorStatus?: string;
  page: number;
  pageSize: number;
  [key: string]: string | number | undefined;
}

export interface ListingsQuery {
  status: string;
  name?: string;
  page: number;
  pageSize: number;
  [key: string]: string | number | undefined;
}

export interface OrdersQuery {
  status?: string;
  /** Filter to one buyer's orders. Param name isn't confirmed against the real backend
   *  (the Postman collection doesn't document a per-user filter on this endpoint) — sent
   *  optimistically, same as the other unconfirmed-but-plausible params in this file. */
  userId?: string;
  page: number;
  pageSize: number;
  [key: string]: string | number | undefined;
}

/** Endpoint wrappers for the marketplace admin API — matches the real
 *  "xStoreEcommerce Admin & Super Admin" Postman collection. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private auth = inject(AuthService);

  get apiBase() {
    return this.auth.base;
  }

  /* ---------- Users (customers) — GET /api/users ---------- */
  users(q: UsersQuery) {
    return this.auth.apiFetch<unknown>('/api/users', { query: q });
  }
  user(id: string) {
    return this.auth.apiFetch<unknown>(`/api/users/${encodeURIComponent(id)}`);
  }

  /* ---------- Vendors — GET /api/admin/vendors (its own surface, not /api/users) ---------- */
  vendors(q: VendorsQuery) {
    return this.auth.apiFetch<unknown>('/api/admin/vendors', { query: q });
  }
  vendor(id: string) {
    return this.auth.apiFetch<unknown>(`/api/admin/vendors/${encodeURIComponent(id)}`);
  }
  approveVendor(id: string) {
    return this.auth.apiFetch(`/api/admin/vendors/${encodeURIComponent(id)}/approve`, { method: 'PUT' });
  }
  rejectVendor(id: string) {
    return this.auth.apiFetch(`/api/admin/vendors/${encodeURIComponent(id)}/reject`, { method: 'PUT' });
  }
  vendorCommission(id: string) {
    return this.auth.apiFetch<unknown>(`/api/admin/vendors/${encodeURIComponent(id)}/commission`);
  }
  updateVendorCommissionThresholds(id: string, warnThresholdEgp: number, pauseThresholdEgp: number) {
    return this.auth.apiFetch(`/api/admin/vendors/${encodeURIComponent(id)}/commission`, {
      method: 'PATCH',
      body: { warnThresholdEgp, pauseThresholdEgp },
    });
  }
  settleVendorCommission(id: string, amountEgp?: number) {
    return this.auth.apiFetch(`/api/admin/vendors/${encodeURIComponent(id)}/commission/settle`, {
      method: 'POST',
      body: amountEgp === undefined ? {} : { amountEgp },
    });
  }

  /* ---------- Admin orders (ADMINISTRATOR only) — GET /api/admin/orders ---------- */
  orders(q: OrdersQuery) {
    return this.auth.apiFetch<unknown>('/api/admin/orders', { query: q });
  }
  order(id: string) {
    return this.auth.apiFetch<unknown>(`/api/admin/orders/${encodeURIComponent(id)}`);
  }
  cancelOrder(id: string, reason: string) {
    return this.auth.apiFetch(`/api/admin/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: { reason } });
  }

  /* ---------- Dashboard overview ---------- */
  overview(from?: string, to?: string) {
    return this.auth.apiFetch<unknown>('/api/admin/overview', { query: { from, to } });
  }

  /* ---------- System settings ---------- */
  systemSettings() {
    return this.auth.apiFetch<unknown>('/api/admin/system-settings');
  }
  updateSystemSettings(body: { commissionValueOnOrder: number; warnThresholdEgp: number; pauseThresholdEgp: number }) {
    return this.auth.apiFetch('/api/admin/system-settings', { method: 'PUT', body });
  }

  /* ---------- Categories ---------- */
  categories() {
    return this.auth.apiFetch<unknown>('/api/categories');
  }
  createCategory(fd: FormData) {
    return this.auth.apiFetch('/api/categories', { method: 'POST', body: fd });
  }
  updateCategory(fd: FormData) {
    return this.auth.apiFetch('/api/categories', { method: 'PUT', body: fd });
  }
  setCategoryStatus(id: string, isActive: boolean) {
    return this.auth.apiFetch(`/api/categories/${encodeURIComponent(id)}/status`, { method: 'PUT', body: { isActive } });
  }
  deleteCategory(id: string) {
    return this.auth.apiFetch(`/api/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  /* ---------- Product moderation — GET /api/admin/listings ---------- */
  listings(q: ListingsQuery) {
    return this.auth.apiFetch<unknown>('/api/admin/listings', { query: q });
  }
  approveListing(id: string) {
    return this.auth.apiFetch(`/api/admin/listings/${encodeURIComponent(id)}/approve`, { method: 'PUT', body: {} });
  }
  rejectListing(id: string, rejectionReason: string) {
    return this.auth.apiFetch(`/api/admin/listings/${encodeURIComponent(id)}/reject`, { method: 'PUT', body: { rejectionReason } });
  }
  toggleHotDeal(id: string, isHotDeal: boolean) {
    return this.auth.apiFetch(`/api/admin/listings/${encodeURIComponent(id)}/hot-deal`, { method: 'PUT', body: { isHotDeal } });
  }

  /* ---------- Banners ---------- */
  banners() {
    return this.auth.apiFetch<unknown>('/api/banners');
  }
  createBanner(fd: FormData) {
    return this.auth.apiFetch('/api/banners', { method: 'POST', body: fd });
  }
  updateBanner(id: string, fd: FormData) {
    return this.auth.apiFetch(`/api/banners/${encodeURIComponent(id)}`, { method: 'PUT', body: fd });
  }
  deleteBanner(id: string) {
    return this.auth.apiFetch(`/api/banners/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
}
export type { Dto };
