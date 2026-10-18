import { MappedCommissionPayment } from '../../core/models';

export const VENDOR_STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected'] as const;

export interface PaymentSummary {
  totalPaid: number;
  pendingCount: number;
  pendingAmount: number;
  rejectedCount: number;
}

/** Local calendar day (YYYY-MM-DD) of an ISO timestamp, or '' if unparsable — matches the
 *  native date input's value so range bounds compare as plain strings. */
export function localDay(iso: string): string {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The backend may ignore `vendorId`, so keep only this vendor's rows. */
export function onlyVendor(
  rows: MappedCommissionPayment[],
  vendorId: string,
): MappedCommissionPayment[] {
  return rows.filter((r) => r.vendorId === vendorId);
}

export function sortNewestFirst(rows: MappedCommissionPayment[]): MappedCommissionPayment[] {
  const t = (r: MappedCommissionPayment) => {
    const n = new Date(r.createdAtIso).getTime();
    return Number.isNaN(n) ? -Infinity : n;
  };
  return [...rows].sort((a, b) => {
    const ta = t(a);
    const tb = t(b);
    return ta === tb ? 0 : tb > ta ? 1 : -1;
  });
}

/** Status tab ('All' = no filter) plus an inclusive from/to day range on the submitted date.
 *  Rows with an unparsable date are excluded once a range is set. */
export function filterPayments(
  rows: MappedCommissionPayment[],
  status: string,
  from: string,
  to: string,
): MappedCommissionPayment[] {
  return rows.filter((r) => {
    if (status && status !== 'All' && r.status !== status) return false;
    if (from || to) {
      const day = localDay(r.createdAtIso);
      if (!day) return false;
      if (from && day < from) return false;
      if (to && day > to) return false;
    }
    return true;
  });
}

export function summarize(rows: MappedCommissionPayment[]): PaymentSummary {
  const s: PaymentSummary = { totalPaid: 0, pendingCount: 0, pendingAmount: 0, rejectedCount: 0 };
  for (const r of rows) {
    if (r.status === 'Approved') s.totalPaid += r.approvedAmount ?? r.amount;
    else if (r.status === 'Rejected') s.rejectedCount++;
    else if (r.status === 'Pending') {
      s.pendingCount++;
      s.pendingAmount += r.amount;
    }
  }
  return s;
}
