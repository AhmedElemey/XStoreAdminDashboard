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

export interface ListingsQuery {
  status: string;
  page: number;
  pageSize: number;
  [key: string]: string | number | undefined;
}

/** Endpoint wrappers for the marketplace admin API — Postman "xStoreEcommerce Admin
 *  Dashboard" collection. Ported 1:1 from the legacy prototype's live-data loaders. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private auth = inject(AuthService);

  get apiBase() {
    return this.auth.base;
  }

  /* ---------- Users / Vendors — GET /api/users ---------- */
  users(q: UsersQuery) {
    return this.auth.apiFetch<unknown>('/api/users', { query: q });
  }
  approveUser(id: string) {
    return this.auth.apiFetch(`/api/users/${encodeURIComponent(id)}/approve`, { method: 'PUT' });
  }
  rejectUser(id: string) {
    return this.auth.apiFetch(`/api/users/${encodeURIComponent(id)}/reject`, { method: 'PUT' });
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
  toggleHotDeal(id: string) {
    return this.auth.apiFetch(`/api/admin/listings/${encodeURIComponent(id)}/hot-deal`, { method: 'PUT' });
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
