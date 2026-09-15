import { describe, expect, it } from 'vitest';
import { mapOrder } from './mappers';

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
