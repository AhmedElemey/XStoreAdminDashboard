/** Raw DTOs from the admin/delivery APIs are intentionally loose (Record<string, any>) —
 *  the backend's exact field names are unconfirmed for several endpoints, so every mapper
 *  below is tolerant to aliases, exactly like the legacy prototype's mapX() helpers. */
export type Dto = Record<string, any>;

export interface Page<T> {
  items: T[];
  total: number;
  totalPages: number;
}

export interface MappedCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  image: string | null;
  active: boolean;
  parentId: string | null;
  products: number | null;
  subs: number | null;
}

export interface MappedListing {
  id: string;
  title: string;
  vendor: string;
  category: string;
  price: number | null;
  compareAt: number | null;
  stock: number | null;
  condition: string;
  brand: string;
  location: string;
  description: string;
  submitted: string;
  isHot: boolean;
  image: string | null;
}

export interface MappedBanner {
  id: string;
  nameEn: string;
  nameAr: string;
  sortOrder: number;
  image: string | null;
}

export interface MappedUser {
  id: string;
  name: string;
  sub: string;
  city: string;
  phone: string;
  email: string;
  role: string;
  verified: boolean;
  orders: number | string;
  spend: string;
  joined: string;
}

export interface MappedVendor {
  id: string;
  store: string;
  owner: string;
  city: string;
  phone: string;
  email: string;
  category: string;
  verified: boolean;
  products: number | null;
  rating: number | null;
  joined: string;
  statusClass: string;
  statusLabel: string;
  isPending: boolean;
}

export interface MappedCommission {
  outstanding: number;
  warn: number;
  pause: number;
}

/* ---------- demo data models (Couriers / Packages) ---------- */
export interface DemoCourier {
  n: string;
  phone: string;
  zone: string;
  status: 'active' | 'off';
  cash: number;
  cap: number;
  today: number;
  delivered30: number;
  failed30: number;
  joined: string;
  apiId?: string;
}

export interface DemoPackage {
  id: string;
  apiId?: string;
  customer: string;
  phone: string;
  requesterRole?: 'vendor' | 'customer';
  pickup: { street: string; city: string };
  drop: { name: string; phone: string; street: string; city: string };
  note: string;
  submitted: string;
  status: 'submitted' | 'priced' | 'confirmed' | 'pickedup' | 'delivered' | 'cancelled';
  price: number | null;
  courier: string | null;
  courierId?: string | null;
}

