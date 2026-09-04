import { Dto, MappedBanner, MappedCategory, MappedCommission, MappedListing, MappedUser, MappedVendor, Page } from './models';
import { egp } from './format';

/** first non-empty of a list of candidate values (mirrors legacy _fne). */
function firstNonEmpty(...vals: unknown[]): string {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return '';
}
function numOr(...vals: unknown[]): number | null {
  for (const v of vals) {
    const n = Number(v);
    if (v !== undefined && v !== null && v !== '' && Number.isFinite(n)) return n;
  }
  return null;
}
function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function absoluteImage(img: string | null, apiBase: string): string | null {
  if (!img) return null;
  if (/^https?:\/\//i.test(img)) return img;
  return apiBase.replace(/\/+$/, '') + '/' + img.replace(/^\/+/, '');
}

export function readPage<T = Dto>(data: unknown, pageSize: number): Page<T> {
  let items: T[] = [];
  let total = 0;
  let totalPages = 1;
  if (Array.isArray(data)) {
    items = data;
    total = data.length;
  } else if (data && typeof data === 'object') {
    const d = data as Dto;
    items = d['items'] || d['results'] || d['data'] || d['users'] || [];
    if (!Array.isArray(items)) items = [];
    total = num(d['totalCount']) ?? num(d['total']) ?? items.length;
    totalPages = num(d['totalPages']) ?? Math.max(1, Math.ceil(total / (pageSize || 20)));
  }
  return { items, total, totalPages };
}

export function mapCategory(c: Dto, apiBase: string): MappedCategory {
  const img = firstNonEmpty(c['imageUrl'], c['image'], c['imagePath'], c['iconUrl']) || null;
  return {
    id: firstNonEmpty(c['id'], c['categoryId'], c['_id']),
    nameEn: firstNonEmpty(c['nameEn'], c['name'], c['nameAr']) || 'Untitled',
    nameAr: firstNonEmpty(c['nameAr'], c['nameEn']),
    image: absoluteImage(img, apiBase),
    active: c['isActive'] === undefined || c['isActive'] === null ? true : !!c['isActive'],
    parentId: firstNonEmpty(c['parentId'], c['parentCategoryId']) || null,
    products: numOr(c['productsCount'], c['listingsCount'], c['liveProducts'], c['products']),
    subs: numOr(c['subcategoriesCount'], c['subCategoriesCount'], c['subcategories']),
  };
}

/** ListingCondition enum: 1=New, 2=Like New, 3=Good, 4=Used for Parts. */
const CONDITION_LABELS: Record<number, string> = { 1: 'New', 2: 'Like New', 3: 'Good', 4: 'Used for Parts' };

export function mapListing(p: Dto, apiBase: string): MappedListing {
  const img =
    firstNonEmpty(p['imageUrl'], p['thumbnailUrl'], Array.isArray(p['images']) ? p['images'][0] : null, Array.isArray(p['imageUrls']) ? p['imageUrls'][0] : null) || null;
  const condRaw = p['condition'];
  const condNum = typeof condRaw === 'number' ? condRaw : Number(condRaw);
  const condLabel = Number.isFinite(condNum) && CONDITION_LABELS[condNum]
    ? CONDITION_LABELS[condNum]
    : firstNonEmpty(condRaw) || '—';
  const rawImages = Array.isArray(p['imageUrls']) ? p['imageUrls'] : Array.isArray(p['images']) ? p['images'] : [];
  const images = rawImages.length ? rawImages : firstNonEmpty(p['imageUrl'], p['thumbnailUrl']) ? [firstNonEmpty(p['imageUrl'], p['thumbnailUrl'])] : [];
  return {
    id: firstNonEmpty(p['id'], p['listingId'], p['_id']),
    title: firstNonEmpty(p['titleEn'], p['title'], p['titleAr']) || 'Untitled',
    vendor: firstNonEmpty(p['vendorName'], p['storeNameEn'], p['storeName'], p['userName'], p['vendor']) || '—',
    category: firstNonEmpty(p['categoryName'], p['categoryNameEn'], p['category']) || '—',
    price: numOr(p['price']),
    compareAt: numOr(p['compareAtPrice'], p['compareAt']) || null,
    stock: numOr(p['stockQuantity'], p['stock']),
    condition: condLabel,
    brand: firstNonEmpty(p['brand']) || '—',
    location: firstNonEmpty(p['location'], [p['governorateNameEn'], p['detailedAddressByUser']].filter(Boolean).join(', ')) || '—',
    description: firstNonEmpty(p['descriptionEn'], p['description']),
    submitted: firstNonEmpty(p['createdAt'], p['submittedAt']),
    isHot: !!(p['isHotDeal'] || p['hotDeal']),
    image: images.length ? absoluteImage(images[0], apiBase) : null,
    images: images.map((u: string) => absoluteImage(u, apiBase) || u),
  };
}

export function mapBanner(b: Dto, apiBase: string): MappedBanner {
  const img = firstNonEmpty(b['imageUrl'], b['image'], b['imagePath']) || null;
  return {
    id: firstNonEmpty(b['id'], b['bannerId'], b['_id']),
    nameEn: firstNonEmpty(b['nameEn'], b['name']) || 'Untitled',
    nameAr: firstNonEmpty(b['nameAr']),
    sortOrder: numOr(b['sortOrder']) ?? 0,
    image: absoluteImage(img, apiBase),
  };
}

export function mapUser(u: Dto): MappedUser {
  const email = firstNonEmpty(u['email']);
  const phone = firstNonEmpty(u['phoneNumber'], u['phone'], u['whatsAppNumber']) || '—';
  const orders = numOr(u['ordersCount'], u['totalOrders'], u['orders']);
  const spend = numOr(u['totalSpent'], u['lifetimeSpend'], u['totalSpend']);
  return {
    id: firstNonEmpty(u['id'], u['userId'], u['_id'], u['uuid']),
    name: firstNonEmpty(u['fullNameEn'], u['fullName'], u['name'], u['nameEn'], u['fullNameAr'], email, u['phoneNumber']) || 'Unknown',
    sub: email || phone || 'role: ' + firstNonEmpty(u['role']) || 'consumer',
    city: firstNonEmpty(u['city'], u['storeCity'], u['governorate'], u['town'], u['location']) || '—',
    phone,
    email,
    role: firstNonEmpty(u['role']) || 'consumer',
    verified: !!u['isVerified'],
    orders: orders == null ? '—' : orders,
    spend: spend == null ? '—' : egp(spend),
    joined: firstNonEmpty(u['joinedAt'], u['createdAt'], u['joinDate']) || '—',
  };
}

/** VendorStatus enum per the real admin API: 1=Pending, 2=Approved, 3=Rejected. */
const VSTATUS: Record<number, [string, string]> = {
  1: ['b-amber', 'Pending'],
  2: ['b-green', 'Approved'],
  3: ['b-red', 'Rejected'],
};

export function mapVendor(v: Dto): MappedVendor {
  let st: [string, string];
  const sv = v['vendorStatus'];
  if (sv == null || sv === '') {
    st = ['b-grey', '—'];
  } else if (typeof sv === 'number' || /^\d+$/.test(String(sv))) {
    st = VSTATUS[Number(sv)] || ['b-grey', 'Status ' + sv];
  } else {
    const k = String(sv).toLowerCase();
    st = k.includes('pend') ? VSTATUS[1] : k.includes('approv') || k.includes('active') ? VSTATUS[2] : k.includes('reject') ? VSTATUS[3] : ['b-grey', String(sv)];
  }
  return {
    id: firstNonEmpty(v['id'], v['userId'], v['_id']),
    store: firstNonEmpty(v['storeNameEn'], v['storeName'], v['storeNameAr'], v['fullNameEn'], v['fullName'], v['name']) || 'Unnamed store',
    owner: firstNonEmpty(v['fullNameEn'], v['fullName'], v['ownerName'], v['nameEn']) || '—',
    city: firstNonEmpty(v['storeCity'], v['city'], v['governorate'], v['town']) || '—',
    phone: firstNonEmpty(v['phoneNumber'], v['whatsAppNumber'], v['phone']) || '—',
    email: firstNonEmpty(v['email']),
    category: firstNonEmpty(v['storeCategory'], v['storeCategoryName'], v['category']) || '—',
    verified: !!v['isVerified'],
    products: numOr(v['productsCount'], v['listingsCount'], v['products']),
    rating: numOr(v['rating']),
    joined: firstNonEmpty(v['joinedAt'], v['createdAt']) || '—',
    statusClass: st[0],
    statusLabel: st[1],
    isPending: st[1] === 'Pending',
  };
}

export interface MappedOrder {
  id: string;
  buyer: string;
  phone: string;
  addr: string;
  vendor: string;
  statusNum: number;
  statusKey: string;
  statusLabel: string;
  statusClass: string;
  total: number | null;
  courier: string | null;
  items: { name: string; qty: number; price: number }[];
}

/** OrderStatus enum per the real admin API: 0=Pending,1=Confirmed,2=Processing,3=Shipped,4=Delivered,5=Cancelled. */
export const ORDER_STATUS: [string, string, string][] = [
  ['pending', 'Pending', 'b-grey'],
  ['confirmed', 'Confirmed', 'b-blue'],
  ['processing', 'Processing', 'b-indigo'],
  ['shipped', 'Shipped', 'b-amber'],
  ['delivered', 'Delivered', 'b-green'],
  ['cancelled', 'Cancelled', 'b-red'],
];

/** Response shape for GET /api/admin/orders (list + by-id) isn't documented in the
 *  Postman collection beyond the OrderStatus enum, so this is tolerant to aliases like
 *  every other mapper here. Works for both the list-row shape and the fuller by-id shape
 *  (address/items are simply absent on the former until the drawer fetches the detail). */
export function mapOrder(o: Dto): MappedOrder {
  const statusNum = numOr(o['status']) ?? 0;
  const [statusKey, statusLabel, statusClass] = ORDER_STATUS[statusNum] ?? ORDER_STATUS[0];
  const rawItems = Array.isArray(o['items']) ? o['items'] : Array.isArray(o['orderItems']) ? o['orderItems'] : [];
  return {
    id: firstNonEmpty(o['id'], o['orderId'], o['_id']),
    buyer: firstNonEmpty(o['buyerName'], o['consumerName'], o['customerName'], o['fullNameEn'], o['fullName']) || '—',
    phone: firstNonEmpty(o['phoneNumber'], o['buyerPhone'], o['consumerPhone'], o['phone']) || '—',
    addr: firstNonEmpty(o['address'], o['deliveryAddress'], o['shippingAddress'], o['addressLine']),
    vendor: firstNonEmpty(o['vendorName'], o['storeNameEn'], o['storeName']) || '—',
    statusNum,
    statusKey,
    statusLabel,
    statusClass,
    total: numOr(o['totalAmount'], o['total'], o['amount'], o['grandTotal']),
    courier: firstNonEmpty(o['courierName'], o['courier']) || null,
    items: rawItems.map((it: Dto) => ({
      name: firstNonEmpty(it['titleEn'], it['title'], it['name'], it['productName'], it['titleSnapshot']) || 'Item',
      qty: numOr(it['quantity'], it['qty']) ?? 1,
      price: numOr(it['price'], it['unitPrice']) ?? 0,
    })),
  };
}

export interface MappedSystemSettings {
  commissionValueOnOrder: number;
  warnThresholdEgp: number;
  pauseThresholdEgp: number;
}

/** GET /api/admin/system-settings response shape isn't documented beyond the PUT body
 *  it accepts — tolerant to aliases like every other mapper here. */
export function mapSystemSettings(s: Dto): MappedSystemSettings {
  return {
    commissionValueOnOrder: numOr(s['commissionValueOnOrder'], s['commissionValue'], s['commissionPercent']) ?? 0,
    warnThresholdEgp: numOr(s['warnThresholdEgp'], s['warnThreshold']) ?? 0,
    pauseThresholdEgp: numOr(s['pauseThresholdEgp'], s['pauseThreshold']) ?? 0,
  };
}

export interface MappedOverview {
  gmv: number | null;
  orders: number | null;
  activeVendors: number | null;
  revenueTrend: number[];
  categories: { name: string; count: number }[];
}

/** Response shape for GET /api/admin/overview isn't documented beyond "30-day GMV/orders,
 *  vendor counts, daily revenue trend, and sales grouped by category" — tolerant to
 *  aliases like every other mapper here, and safe to render even if a field is missing. */
export function mapOverview(o: Dto): MappedOverview {
  const trendRaw = o['revenueTrend'] ?? o['dailyRevenue'] ?? o['trend'] ?? o['gmvTrend'] ?? [];
  const revenueTrend = (Array.isArray(trendRaw) ? trendRaw : [])
    .map((v) => (typeof v === 'object' && v !== null ? numOr((v as Dto)['value'], (v as Dto)['amount'], (v as Dto)['gmv']) : num(v)))
    .filter((v): v is number => v != null);
  const catsRaw = o['salesByCategory'] ?? o['categoryBreakdown'] ?? o['categories'] ?? [];
  const categories = (Array.isArray(catsRaw) ? catsRaw : []).map((c: Dto) => ({
    name: firstNonEmpty(c['categoryName'], c['name'], c['nameEn']) || '—',
    count: numOr(c['count'], c['ordersCount'], c['orders'], c['sales'], c['value']) ?? 0,
  }));
  return {
    gmv: numOr(o['gmv'], o['gmv30d'], o['gmvEgp'], o['totalGmv']),
    orders: numOr(o['orders'], o['orders30d'], o['ordersCount'], o['totalOrders']),
    activeVendors: numOr(o['activeVendors'], o['activeVendorsCount'], o['vendorsCount']),
    revenueTrend,
    categories,
  };
}

/** Response shape for GET /api/admin/vendors/{id}/commission isn't documented in the
 *  Postman collection (only the PATCH/POST request bodies are) — tolerant to aliases
 *  like every other mapper here. */
export function mapCommission(c: Dto): MappedCommission {
  return {
    outstanding: numOr(c['outstandingEgp'], c['outstandingBalanceEgp'], c['balanceEgp'], c['outstanding']) ?? 0,
    warn: numOr(c['warnThresholdEgp'], c['warnThreshold'], c['warn']) ?? 0,
    pause: numOr(c['pauseThresholdEgp'], c['pauseThreshold'], c['pause']) ?? 0,
  };
}
