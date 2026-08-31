import { DemoCourier, DemoPackage, Dto } from './models';

export function ago(iso: string): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '—';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return m + ' min ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : d + 'd ago';
}

export function monthYear(iso: string): string {
  const dt = new Date(iso);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const PKG_STATUS_MAP: Record<string, DemoPackage['status']> = {
  submitted: 'submitted',
  priced: 'priced',
  confirmed: 'confirmed',
  pickedUp: 'pickedup',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

export function mapCourierSummary(c: Dto): DemoCourier {
  return {
    apiId: c['id'],
    n: c['name'] || '—',
    phone: c['phone'] || '—',
    zone: c['zone'] || '—',
    status: c['status'] === 'off' ? 'off' : 'active',
    cash: +c['cashInHandEgp'] || 0,
    cap: +c['handoverThresholdEgp'] || 5000,
    today: +c['today'] || 0,
    delivered30: +c['delivered30'] || 0,
    failed30: +c['failed30'] || 0,
    joined: monthYear(c['joined']),
  };
}

export function mapRequest(r: Dto, courierNameById: (id: string) => string | null): DemoPackage {
  const pk = r['pickup'] || {};
  const dp = r['dropoff'] || {};
  return {
    apiId: r['id'],
    id: r['id'] && r['id'].length > 10 ? r['id'].slice(0, 8) : r['id'] || '—',
    customer: r['consumerName'] || '—',
    phone: r['consumerPhone'] || '—',
    pickup: { street: pk['street'] || '', city: pk['city'] || '' },
    drop: { name: dp['fullName'] || '', phone: dp['phone'] || '', street: dp['street'] || '', city: dp['city'] || '' },
    note: r['packageNote'] || '',
    submitted: ago(r['createdAt']),
    status: PKG_STATUS_MAP[r['status']] || 'submitted',
    requesterRole: r['requesterRole'] === 'vendor' ? 'vendor' : 'customer',
    price: r['price'] != null ? +r['price'] : null,
    courier: r['courierId'] ? courierNameById(r['courierId']) || 'Courier' : null,
    courierId: r['courierId'] || null,
  };
}
