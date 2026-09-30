import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { todayDateOnly } from './format';
import { Dto } from './models';

export interface UsersQuery {
  keyword?: string;
  role?: string;
  isVerified?: string;
  /** Date-time range filter (matches `overview`'s confirmed `from`/`to`), sent
   *  optimistically — not confirmed against the real backend for this endpoint. */
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
  [key: string]: string | number | undefined;
}

export interface VendorsQuery {
  keyword?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
  [key: string]: string | number | undefined;
}

export interface ListingsQuery {
  status: string;
  name?: string;
  from?: string;
  to?: string;
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
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
  [key: string]: string | number | undefined;
}

/** PROPOSED — GET /api/admin/reports/vendor doesn't exist on the backend yet. See
 *  BACKEND_HANDOFF.md "Vendor reports". `keyword` (match against vendor/consumer name) and
 *  `reason` (exact wire value, e.g. "Fraud") are both sent optimistically — same
 *  "unconfirmed but plausible" convention as the other params in this file. */
export interface VendorReportsQuery {
  vendorId?: string;
  consumerId?: string;
  keyword?: string;
  reason?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
  [key: string]: string | number | undefined;
}

/** PROPOSED — see BACKEND_HANDOFF.md "Commission payment requests". `keyword` matches the
 *  vendor's store name. */
export interface CommissionPaymentsQuery {
  status?: string;
  keyword?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
  [key: string]: string | number | undefined;
}

/** PROPOSED — GET /api/general-settings. See BACKEND_HANDOFF.md "General Settings". */
export interface AppSettingsQuery {
  search?: string;
  dataType?: string;
  page: number;
  pageSize: number;
  [key: string]: string | number | undefined;
}

export interface AppSettingBody {
  key: string;
  dataType: string;
  value: string;
  description?: string;
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
  /** PROPOSED — not yet built on the backend. See BACKEND_HANDOFF.md "Vendors" (the same
   *  block/unblock contract applies to /api/users, not just /api/admin/vendors). */
  blockUser(id: string, reason: string, blockedUntil?: string) {
    if (blockedUntil && blockedUntil <= todayDateOnly()) throw new Error('Block-until date must be in the future.');
    return this.auth.apiFetch(`/api/users/${encodeURIComponent(id)}/block`, {
      method: 'POST',
      body: { reason, blockedUntil: blockedUntil || null },
    });
  }
  /** PROPOSED — not yet built on the backend. */
  unblockUser(id: string) {
    return this.auth.apiFetch(`/api/users/${encodeURIComponent(id)}/unblock`, { method: 'POST', body: {} });
  }

  /* ---------- Vendors — GET /api/admin/vendors (its own surface, not /api/users) ---------- */
  vendors(q: VendorsQuery) {
    return this.auth.apiFetch<unknown>('/api/admin/vendors', { query: q });
  }
  vendor(id: string) {
    return this.auth.apiFetch<unknown>(`/api/admin/vendors/${encodeURIComponent(id)}`);
  }
  vendorCommission(id: string) {
    return this.auth.apiFetch<unknown>(`/api/admin/vendors/${encodeURIComponent(id)}/commission/settings`);
  }
  vendorProducts(id: string, page = 1, pageSize = 20) {
    return this.auth.apiFetch<unknown>(`/api/admin/vendors/${encodeURIComponent(id)}/products`, { query: { page, pageSize } });
  }
  updateVendorCommissionSettings(id: string, commissionValueOnOrder: number, warnThresholdEgp: number, pauseThresholdEgp: number) {
    return this.auth.apiFetch(`/api/admin/vendors/${encodeURIComponent(id)}/commission/settings`, {
      method: 'PUT',
      body: { commissionValueOnOrder, warnThresholdEgp, pauseThresholdEgp },
    });
  }
  settleVendorCommission(id: string, amountEgp?: number) {
    return this.auth.apiFetch(`/api/admin/vendors/${encodeURIComponent(id)}/commission/settle`, {
      method: 'POST',
      body: amountEgp === undefined ? {} : { amountEgp },
    });
  }
  /** PROPOSED — not yet built on the backend. See BACKEND_HANDOFF.md "Vendors".
   *  `blockedUntil` (date-only, e.g. "2026-10-01") is optional — omit it (or pass undefined)
   *  for an indefinite block that only a manual unblock lifts. */
  blockVendor(id: string, reason: string, blockedUntil?: string) {
    if (blockedUntil && blockedUntil <= todayDateOnly()) throw new Error('Block-until date must be in the future.');
    return this.auth.apiFetch(`/api/admin/vendors/${encodeURIComponent(id)}/block`, {
      method: 'POST',
      body: { reason, blockedUntil: blockedUntil || null },
    });
  }
  /** PROPOSED — not yet built on the backend. See BACKEND_HANDOFF.md "Vendors". */
  unblockVendor(id: string) {
    return this.auth.apiFetch(`/api/admin/vendors/${encodeURIComponent(id)}/unblock`, { method: 'POST', body: {} });
  }

  /** PROPOSED — GET /api/admin/reports/vendor doesn't exist yet. See BACKEND_HANDOFF.md
   *  "Vendor reports". Consumer reports filed against a vendor after a placed order
   *  (xStore mobile app's "Report Vendor" feature). */
  vendorReports(q: VendorReportsQuery) {
    return this.auth.apiFetch<unknown>('/api/admin/reports/vendor', { query: q });
  }
  vendorReport(id: string) {
    return this.auth.apiFetch<unknown>(`/api/admin/reports/vendor/${encodeURIComponent(id)}`);
  }

  /* ---------- Commission payment requests — PROPOSED, see BACKEND_HANDOFF.md ---------- */
  commissionPayments(q: CommissionPaymentsQuery) {
    return this.auth.apiFetch<unknown>('/api/admin/commission-payments', { query: q });
  }
  /** Credits `amountEgp` against the vendor's outstanding balance server-side (same effect
   *  as settle, in one transaction with the status change). */
  approveCommissionPayment(id: string, amountEgp: number) {
    if (!(amountEgp > 0)) throw new Error('Approved amount must be greater than 0.');
    return this.auth.apiFetch(`/api/admin/commission-payments/${encodeURIComponent(id)}/approve`, { method: 'POST', body: { amountEgp } });
  }
  rejectCommissionPayment(id: string, reason: string) {
    if (!reason?.trim()) throw new Error('Rejection reason is required.');
    return this.auth.apiFetch(`/api/admin/commission-payments/${encodeURIComponent(id)}/reject`, { method: 'POST', body: { reason: reason.trim() } });
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

  /* ---------- General Settings (remote app config) — PROPOSED, see BACKEND_HANDOFF.md ---------- */
  appSettings(q: AppSettingsQuery) {
    return this.auth.apiFetch<unknown>('/api/general-settings', { query: q });
  }
  createAppSetting(body: AppSettingBody) {
    return this.auth.apiFetch('/api/general-settings', { method: 'POST', body });
  }
  /** `key` is immutable after create (mobile clients read by key) — the backend ignores it here. */
  updateAppSetting(id: string, body: AppSettingBody) {
    return this.auth.apiFetch(`/api/general-settings/${encodeURIComponent(id)}`, { method: 'PUT', body });
  }
  deleteAppSetting(id: string) {
    return this.auth.apiFetch(`/api/general-settings/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
  listing(id: string) {
    return this.auth.apiFetch<unknown>(`/api/admin/listings/${encodeURIComponent(id)}`);
  }
  approveListing(id: string) {
    return this.auth.apiFetch(`/api/admin/listings/${encodeURIComponent(id)}/approve`, { method: 'PUT', body: {} });
  }
  rejectListing(id: string, rejectionReason: string) {
    if (!rejectionReason?.trim()) throw new Error('Rejection reason is required.');
    return this.auth.apiFetch(`/api/admin/listings/${encodeURIComponent(id)}/reject`, { method: 'PUT', body: { rejectionReason: rejectionReason.trim() } });
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
