import { Injectable, inject, signal } from '@angular/core';
import { DemoCourier, DemoPackage } from './models';
import { DeliveryApiService } from './delivery-api.service';
import { mapCourierSummary, mapRequest } from './delivery-mappers';

const SEED_COURIERS: DemoCourier[] = [
  { n: 'Mostafa El-Sayed', phone: '+20 105 550 0003', zone: 'Cairo — Nasr City & Heliopolis', status: 'active', cash: 3850, cap: 5000, today: 6, delivered30: 118, failed30: 7, joined: 'Jun 2026' },
  { n: 'Hassan Farouk', phone: '+20 101 888 2244', zone: 'Giza — Dokki & Mohandessin', status: 'active', cash: 5200, cap: 5000, today: 4, delivered30: 96, failed30: 9, joined: 'Jun 2026' },
  { n: 'Mahmoud Adel', phone: '+20 102 777 5566', zone: 'Cairo — Maadi', status: 'off', cash: 0, cap: 5000, today: 0, delivered30: 74, failed30: 4, joined: 'Jul 2026' },
];

const SEED_PKGS: DemoPackage[] = [
  { id: 'pkg_001', customer: 'Sara Khelifi', phone: '+20 125 550 0002', pickup: { street: '15 Abbas El Akkad St', city: 'Nasr City' }, drop: { name: 'Laila Hassan', phone: '+20 115 550 0010', street: '8 El Merghany St', city: 'Heliopolis' }, note: 'Envelope with signed contract — handle with care', submitted: '2 min ago', status: 'submitted', price: null, courier: null },
  { id: 'pkg_002', customer: 'Sara Khelifi', phone: '+20 125 550 0002', pickup: { street: '15 Abbas El Akkad St', city: 'Nasr City' }, drop: { name: 'Omar Fathy', phone: '+20 115 550 0011', street: '22 Gameat El Dewal St', city: 'Mohandessin' }, note: 'Small box of homemade sweets', submitted: '30 min ago', status: 'priced', price: 80, courier: null },
  { id: 'pkg_003', customer: 'Sara Khelifi', phone: '+20 125 550 0002', pickup: { street: '15 Abbas El Akkad St', city: 'Nasr City' }, drop: { name: 'Nour El-Din', phone: '+20 115 550 0012', street: '5 Makram Ebeid St', city: 'Nasr City' }, note: 'Spare laptop charger', submitted: '2h ago', status: 'confirmed', price: 60, courier: 'Mostafa El-Sayed' },
  { id: 'pkg_004', customer: 'Sara Khelifi', phone: '+20 125 550 0002', pickup: { street: '15 Abbas El Akkad St', city: 'Nasr City' }, drop: { name: 'Hana Mahmoud', phone: '+20 115 550 0013', street: '12 Baghdad St', city: 'Heliopolis' }, note: 'Birthday gift, fragile', submitted: '4h ago', status: 'pickedup', price: 80, courier: 'Mostafa El-Sayed' },
  { id: 'pkg_005', customer: 'Zamalek Boutique', phone: '+20 100 111 2233', requesterRole: 'vendor', pickup: { street: '12 Tahrir St', city: 'Dokki' }, drop: { name: 'Tarek Nabil', phone: '+20 111 222 0044', street: '9 Abbas El Akkad St', city: 'Nasr City' }, note: 'Fulfil a store order — padded envelope', submitted: 'Yesterday', status: 'delivered', price: 80, courier: 'Mostafa El-Sayed' },
  { id: 'pkg_006', customer: 'Mona Adel', phone: '+20 103 444 5566', pickup: { street: '14 Sidi Gaber', city: 'Alexandria' }, drop: { name: 'Rana Fathy', phone: '+20 111 222 0055', street: '30 El Geish Rd', city: 'Alexandria' }, note: 'Documents folder', submitted: 'Yesterday', status: 'cancelled', price: 60, courier: null },
];

const SEED_TEAM: [string, string, string][] = [
  ['Ahmed', 'Super Admin', 'Owner · full access'],
  ['Ops Team', 'Moderator', 'Orders + disputes'],
  ['Finance', 'Viewer', 'Read-only reports'],
];

/** Demo / seed-data store for Settings' team roster (no backend endpoint for it) plus the
 *  shared mutable state for the delivery pilot (Couriers / Delivery Requests), which
 *  swaps between this seed data and the live delivery-backend API — mirrors the legacy
 *  prototype's module-level `let COURIERS`, `let PKGS`, `TEAM`, etc. */
@Injectable({ providedIn: 'root' })
export class DemoDataService {
  private deliveryApi = inject(DeliveryApiService);

  readonly team = signal<[string, string, string][]>(SEED_TEAM);

  readonly couriers = signal<DemoCourier[]>(SEED_COURIERS);
  readonly packages = signal<DemoPackage[]>(SEED_PKGS);

  /* ---------- helpers ---------- */
  cashDue(c: DemoCourier): boolean {
    return c.cash >= c.cap;
  }
  pkgCross(p: DemoPackage): boolean {
    return p.pickup.city.trim().toLowerCase() !== p.drop.city.trim().toLowerCase();
  }
  pkgSuggest(p: DemoPackage): number {
    return 60 + (this.pkgCross(p) ? 20 : 0);
  }

  /* ---------- couriers ---------- */
  courierDuty(i: number) {
    if (this.deliveryApi.connected()) {
      const c = this.couriers()[i];
      return this.deliveryApi.setCourierDuty(c.apiId!, c.status === 'active' ? 'off' : 'active').then(() => this.loadCouriers());
    }
    this.couriers.update((list) => list.map((c, idx) => (idx === i ? { ...c, status: c.status === 'active' ? 'off' : 'active' } : c)));
    return Promise.resolve();
  }
  recordHandover(i: number, amt: number) {
    if (this.deliveryApi.connected()) {
      const c = this.couriers()[i];
      return this.deliveryApi.recordHandover(c.apiId!).then(() => this.loadCouriers());
    }
    this.couriers.update((list) => list.map((c, idx) => (idx === i ? { ...c, cash: Math.max(0, Math.round((c.cash - amt) * 100) / 100) } : c)));
    return Promise.resolve();
  }
  addCourier(name: string, phone: string, zone: string) {
    if (this.deliveryApi.connected()) {
      return this.deliveryApi.createCourier(name, phone, zone).then(() => this.loadCouriers());
    }
    this.couriers.update((list) => [...list, { n: name, phone, zone, status: 'active', cash: 0, cap: 5000, today: 0, delivered30: 0, failed30: 0, joined: 'Jul 2026' }]);
    return Promise.resolve();
  }

  /* ---------- delivery requests (package pilot) ---------- */
  setPkgPrice(i: number, amt: number) {
    if (this.deliveryApi.connected()) {
      const p = this.packages()[i];
      const price = Math.round(amt * 100) / 100;
      return this.deliveryApi.setPrice(p.apiId!, price).then(() => this.loadPackages());
    }
    const price = Math.round(amt * 100) / 100;
    this.packages.update((list) => list.map((p, idx) => (idx === i ? { ...p, price, status: 'priced' } : p)));
    return Promise.resolve();
  }
  cancelPkg(i: number) {
    if (this.deliveryApi.connected()) return Promise.reject(new Error('Cancellation is customer-side in the live API'));
    this.packages.update((list) => list.map((p, idx) => (idx === i ? { ...p, status: 'cancelled' } : p)));
    return Promise.resolve();
  }
  assignPkgCourier(i: number, courierIdx: number) {
    const courier = this.couriers()[courierIdx];
    if (this.deliveryApi.connected()) {
      const p = this.packages()[i];
      return this.deliveryApi.assignPackageCourier(p.apiId!, courier.apiId!).then(() => this.loadPackages());
    }
    this.packages.update((list) => list.map((p, idx) => (idx === i ? { ...p, courier: courier.n } : p)));
    this.couriers.update((list) => list.map((c, idx) => (idx === courierIdx ? { ...c, today: c.today + 1 } : c)));
    return Promise.resolve();
  }

  /* ---------- delivery API connect / disconnect ---------- */
  async connectDelivery(phone: string, base?: string) {
    await this.deliveryApi.connect(phone, base);
    await Promise.all([this.loadCouriers(), this.loadPackages()]);
  }
  disconnectDelivery() {
    this.deliveryApi.disconnect();
    this.couriers.set(SEED_COURIERS);
    this.packages.set(SEED_PKGS);
  }
  async loadCouriers() {
    if (!this.deliveryApi.connected()) return;
    const data = await this.deliveryApi.couriers();
    this.couriers.set((Array.isArray(data) ? data : []).map(mapCourierSummary));
  }
  async loadPackages() {
    if (!this.deliveryApi.connected()) return;
    if (!this.couriers().length || !this.couriers()[0].apiId) {
      try {
        await this.loadCouriers();
      } catch {
        /* fall through — package mapping still works without courier names */
      }
    }
    const data = await this.deliveryApi.packages();
    const byId = (id: string) => this.couriers().find((c) => c.apiId === id)?.n ?? null;
    this.packages.set((Array.isArray(data) ? data : []).map((r) => mapRequest(r, byId)));
  }
}
