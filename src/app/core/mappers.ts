import { Dto, MappedBanner, MappedCategory, MappedListing, MappedUser, MappedVendor, Page } from './models';
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
    products: numOr(c['productsCount'], c['listingsCount'], c['liveProducts'], c['products']),
    subs: numOr(c['subcategoriesCount'], c['subCategoriesCount'], c['subcategories']),
  };
}

export function mapListing(p: Dto, apiBase: string): MappedListing {
  const img =
    firstNonEmpty(p['imageUrl'], p['thumbnailUrl'], Array.isArray(p['images']) ? p['images'][0] : null, Array.isArray(p['imageUrls']) ? p['imageUrls'][0] : null) || null;
  return {
    id: firstNonEmpty(p['id'], p['listingId'], p['_id']),
    title: firstNonEmpty(p['titleEn'], p['title'], p['titleAr']) || 'Untitled',
    vendor: firstNonEmpty(p['vendorName'], p['storeNameEn'], p['vendor']) || '—',
    category: firstNonEmpty(p['categoryName'], p['category']) || '—',
    price: numOr(p['price']),
    compareAt: numOr(p['compareAtPrice'], p['compareAt']) || null,
    stock: numOr(p['stockQuantity'], p['stock']),
    condition: firstNonEmpty(p['condition']) || '—',
    brand: firstNonEmpty(p['brand']) || '—',
    location: firstNonEmpty(p['location']) || '—',
    description: firstNonEmpty(p['descriptionEn'], p['description']),
    submitted: firstNonEmpty(p['createdAt'], p['submittedAt']),
    isHot: !!(p['isHotDeal'] || p['hotDeal']),
    image: absoluteImage(img, apiBase),
  };
}

export function mapBanner(b: Dto, apiBase: string): MappedBanner {
  const img = firstNonEmpty(b['imageUrl'], b['image'], b['imagePath']) || null;
  return {
    id: firstNonEmpty(b['id'], b['bannerId'], b['_id']),
    nameEn: firstNonEmpty(b['nameEn'], b['name']) || 'Untitled',
    nameAr: firstNonEmpty(b['nameAr']),
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

const VSTATUS: Record<number, [string, string]> = {
  0: ['b-amber', 'Pending'],
  1: ['b-green', 'Active'],
  2: ['b-red', 'Rejected'],
  3: ['b-grey', 'Suspended'],
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
    st = k.includes('pend')
      ? VSTATUS[0]
      : k.includes('active') || k.includes('approv')
        ? VSTATUS[1]
        : k.includes('reject')
          ? VSTATUS[2]
          : k.includes('suspend')
            ? VSTATUS[3]
            : ['b-grey', String(sv)];
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
