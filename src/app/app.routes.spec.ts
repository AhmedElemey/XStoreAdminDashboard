import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

/** The shell's children array — where every routed section lives. */
function shellChildren() {
  const shell = routes.find((r) => r.path === '' && r.component);
  if (!shell?.children) throw new Error('Shell route (path: "") not found or has no children');
  return shell.children;
}

describe('app routes', () => {
  it('re-enables the Couriers (Delivery) and Delivery Requests routes', () => {
    // These were previously commented out until a real delivery-backend existed;
    // both pages already fall back to demo data with no live backend connected,
    // so they were re-enabled as an internal ops tool — regression guard against
    // that disabling drifting back in silently.
    const children = shellChildren();

    const couriers = children.find((r) => r.path === 'couriers');
    expect(couriers).toBeDefined();
    expect(couriers?.data?.['title']).toBe('Delivery');

    const packages = children.find((r) => r.path === 'packages');
    expect(packages).toBeDefined();
    expect(packages?.data?.['title']).toBe('Delivery Requests');
  });

  it('lazy-loads the Couriers route to the CouriersComponent', async () => {
    const children = shellChildren();
    const couriers = children.find((r) => r.path === 'couriers');
    const loaded = await couriers?.loadComponent?.();
    // Dev-mode bundling can mangle the class name with a leading "_", so match
    // loosely rather than pinning the exact transpiled name.
    expect((loaded as { name?: string })?.name).toContain('CouriersComponent');
  });

  it('lazy-loads the Delivery Requests route to the PackagesComponent', async () => {
    const children = shellChildren();
    const packages = children.find((r) => r.path === 'packages');
    const loaded = await packages?.loadComponent?.();
    expect((loaded as { name?: string })?.name).toContain('PackagesComponent');
  });

  it('keeps every other marketplace route intact alongside the delivery routes', () => {
    const children = shellChildren();
    const paths = children.map((r) => r.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        'overview',
        'moderation',
        'vendors',
        'vendors/:id',
        'reports',
        'categories',
        'orders',
        'orders/:id',
        'couriers',
        'packages',
        'customers',
        'customers/:id',
        'content',
        'settings',
      ]),
    );
  });

  it('falls back unknown paths to overview', () => {
    const children = shellChildren();
    const wildcard = children.find((r) => r.path === '**');
    expect(wildcard?.redirectTo).toBe('overview');
  });
});
