import { describe, expect, it } from 'vitest';
import { mapOrder, normalizeListingStatus, readAllPages, resolveListingStatus, unwrapDetail } from './mappers';

describe('mapOrder address extraction', () => {
  it('uses a flat string address as-is (the documented BACKEND_HANDOFF.md shape)', () => {
    const order = mapOrder({ id: '1', address: '12 Tahrir St, Dokki, Giza' });
    expect(order.addr).toBe('12 Tahrir St, Dokki, Giza');
  });

  it('assembles a readable line from a nested deliveryAddress object (the shape the mobile app confirmed live)', () => {
    const order = mapOrder({
      id: '1',
      deliveryAddress: {
        fullName: 'Sara Ahmed',
        street: '14 El Nasr Street, Apt 6',
        city: 'Maadi',
        wilaya: 'Cairo',
      },
    });
    expect(order.addr).toBe('14 El Nasr Street, Apt 6, Maadi, Cairo');
  });

  it('falls back through the Google-Maps-flavoured field aliases inside a nested address object', () => {
    const order = mapOrder({
      id: '1',
      shippingAddress: {
        detailedAddressByGoogleMaps: '5 Nile Corniche',
        cityByGoogleMaps: 'Zamalek',
        governmentByGoogleMaps: 'Cairo',
      },
    });
    expect(order.addr).toBe('5 Nile Corniche, Zamalek, Cairo');
  });

  it('never renders the literal "[object Object]" for an address object with none of the known fields', () => {
    const order = mapOrder({ id: '1', address: { someUnknownShape: true } });
    expect(order.addr).not.toContain('[object Object]');
    expect(order.addr).toBe('');
  });

  it('is empty (not "[object Object]" or a crash) when no address candidate is present at all', () => {
    const order = mapOrder({ id: '1' });
    expect(order.addr).toBe('');
  });
});

describe('listing status resolution', () => {
  it('normalizes string statuses and ignores numbers/unknowns', () => {
    expect(normalizeListingStatus('Pending Approval')).toBe('PENDING');
    expect(normalizeListingStatus('approved')).toBe('ACTIVE');
    expect(normalizeListingStatus('LIVE')).toBe('ACTIVE');
    expect(normalizeListingStatus('Rejected')).toBe('REJECTED');
    expect(normalizeListingStatus(1)).toBe('');
    expect(normalizeListingStatus('Draft')).toBe('');
    expect(normalizeListingStatus(null)).toBe('');
  });

  it('prefers the DTO status, then the query param, then nothing', () => {
    expect(resolveListingStatus({ listingStatus: 'ACTIVE' }, 'PENDING')).toBe('ACTIVE');
    expect(resolveListingStatus({ status: 2 }, 'rejected')).toBe('REJECTED');
    expect(resolveListingStatus({}, 'PENDING')).toBe('PENDING');
    expect(resolveListingStatus({}, 'bogus')).toBe('');
    expect(resolveListingStatus(null)).toBe('');
  });
});

describe('unwrapDetail', () => {
  it('returns a flat object as-is and unwraps data/item/result envelopes', () => {
    expect(unwrapDetail({ id: '1', titleEn: 'A' })).toEqual({ id: '1', titleEn: 'A' });
    expect(unwrapDetail({ data: { id: '1' } })).toEqual({ id: '1' });
    expect(unwrapDetail({ isSuccess: true, result: { item: { id: '2' } } })).toEqual({ id: '2' });
    expect(unwrapDetail(null)).toBeNull();
    expect(unwrapDetail('x')).toBeNull();
  });
});

describe('readAllPages', () => {
  const pages = (n: number, size: number, total: number) => async (page: number) => ({
    items: Array.from({ length: Math.min(size, total - (page - 1) * size) }, (_, i) => ({ id: (page - 1) * size + i })),
    totalCount: total,
    totalPages: n,
  });

  it('collects every page and stops at the last one', async () => {
    const calls: number[] = [];
    const fetch = pages(3, 2, 5);
    const r = await readAllPages((p, s) => (calls.push(p), fetch(p)), 2);
    expect(r.items.map((x: any) => x.id)).toEqual([0, 1, 2, 3, 4]);
    expect(r.total).toBe(5);
    expect(r.truncated).toBe(false);
    expect(calls).toEqual([1, 2, 3]);
  });

  it('handles a plain array response and flags truncation at maxPages', async () => {
    expect((await readAllPages(async () => [{ id: 1 }], 100)).items.length).toBe(1);
    const r = await readAllPages(pages(10, 2, 20), 2, 3);
    expect(r.items.length).toBe(6);
    expect(r.truncated).toBe(true);
  });
});
