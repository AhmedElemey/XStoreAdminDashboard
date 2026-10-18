import { describe, expect, it } from 'vitest';
import { MappedCommissionPayment } from '../../core/models';
import {
  filterPayments,
  localDay,
  onlyVendor,
  sortNewestFirst,
  summarize,
} from './vendor-payments.util';

function row(over: Partial<MappedCommissionPayment>): MappedCommissionPayment {
  return {
    id: '1',
    vendorId: 'v1',
    vendorName: 'Store',
    method: 'InstaPay',
    amount: 100,
    approvedAmount: null,
    status: 'Pending',
    receiptUrl: null,
    rejectionReason: '',
    createdAt: '',
    createdAtIso: '2026-03-10T12:00:00',
    reviewedAt: '',
    reviewedBy: '',
    ...over,
  };
}

describe('onlyVendor', () => {
  it('drops rows the backend returned for other vendors', () => {
    const rows = [
      row({ id: 'a' }),
      row({ id: 'b', vendorId: 'v2' }),
      row({ id: 'c', vendorId: '' }),
    ];
    expect(onlyVendor(rows, 'v1').map((r) => r.id)).toEqual(['a']);
  });
});

describe('sortNewestFirst', () => {
  it('orders by raw date descending, unparsable dates last, without mutating the input', () => {
    const rows = [
      row({ id: 'old', createdAtIso: '2026-01-01T00:00:00' }),
      row({ id: 'bad', createdAtIso: '' }),
      row({ id: 'new', createdAtIso: '2026-05-01T00:00:00' }),
    ];
    expect(sortNewestFirst(rows).map((r) => r.id)).toEqual(['new', 'old', 'bad']);
    expect(rows[0].id).toBe('old');
  });
});

describe('filterPayments', () => {
  const rows = [
    row({ id: 'p', status: 'Pending', createdAtIso: '2026-03-10T09:00:00' }),
    row({ id: 'a', status: 'Approved', createdAtIso: '2026-03-15T09:00:00' }),
    row({ id: 'r', status: 'Rejected', createdAtIso: '2026-04-01T09:00:00' }),
    row({ id: 'x', status: 'Approved', createdAtIso: '' }),
  ];
  const ids = (r: MappedCommissionPayment[]) => r.map((x) => x.id);

  it('treats All and empty as no status filter', () => {
    expect(ids(filterPayments(rows, 'All', '', ''))).toEqual(['p', 'a', 'r', 'x']);
    expect(ids(filterPayments(rows, '', '', ''))).toEqual(['p', 'a', 'r', 'x']);
  });

  it('filters by status', () => {
    expect(ids(filterPayments(rows, 'Approved', '', ''))).toEqual(['a', 'x']);
  });

  it('applies an inclusive day range and excludes undated rows once a range is set', () => {
    expect(ids(filterPayments(rows, 'All', '2026-03-10', '2026-03-15'))).toEqual(['p', 'a']);
    expect(ids(filterPayments(rows, 'All', '2026-03-16', ''))).toEqual(['r']);
    expect(ids(filterPayments(rows, 'Approved', '', '2026-03-31'))).toEqual(['a']);
  });
});

describe('summarize', () => {
  it('sums approvedAmount ?? amount for approved, counts pending and rejected', () => {
    const s = summarize([
      row({ status: 'Approved', amount: 500, approvedAmount: 450 }),
      row({ status: 'Approved', amount: 200, approvedAmount: null }),
      row({ status: 'Pending', amount: 100 }),
      row({ status: 'Pending', amount: 50 }),
      row({ status: 'Rejected', amount: 999 }),
    ]);
    expect(s).toEqual({ totalPaid: 650, pendingCount: 2, pendingAmount: 150, rejectedCount: 1 });
  });

  it('is all zeros for no rows', () => {
    expect(summarize([])).toEqual({
      totalPaid: 0,
      pendingCount: 0,
      pendingAmount: 0,
      rejectedCount: 0,
    });
  });
});

describe('localDay', () => {
  it('returns empty for missing or invalid input', () => {
    expect(localDay('')).toBe('');
    expect(localDay('nope')).toBe('');
  });
  it('formats a local timestamp as YYYY-MM-DD', () => {
    expect(localDay('2026-03-10T12:00:00')).toBe('2026-03-10');
  });
});
