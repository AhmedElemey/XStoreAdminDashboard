import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ShellComponent } from './shell.component';
import { DemoDataService } from '../core/demo-data.service';

describe('ShellComponent nav', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideRouter([])],
    });
  });

  it('shows Delivery and Delivery Requests in the Marketplace nav group', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    const marketplace = fixture.componentInstance['navGroups'].find((g) => g.group === 'Marketplace');

    expect(marketplace).toBeDefined();
    const views = marketplace!.links.map((l) => l.view);
    expect(views).toContain('couriers');
    expect(views).toContain('packages');

    const delivery = marketplace!.links.find((l) => l.view === 'couriers');
    expect(delivery?.label).toBe('Delivery');
    const deliveryRequests = marketplace!.links.find((l) => l.view === 'packages');
    expect(deliveryRequests?.label).toBe('Delivery Requests');
  });

  it("badges the Delivery link with the count of couriers whose cash is due for handover", () => {
    const fixture = TestBed.createComponent(ShellComponent);
    const demo = TestBed.inject(DemoDataService);
    const instance = fixture.componentInstance;

    const expectedDue = demo.couriers().filter((c) => demo.cashDue(c)).length || null;
    expect(instance['couriersCashDue']()).toBe(expectedDue);
  });

  it('badges the Delivery Requests link with the count of submitted packages', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    const demo = TestBed.inject(DemoDataService);
    const instance = fixture.componentInstance;

    const expectedSubmitted = demo.packages().filter((p) => p.status === 'submitted').length || null;
    expect(instance['packagesSubmitted']()).toBe(expectedSubmitted);
  });

  it('badges null (not zero) when nothing is due, so the sidebar badge hides instead of showing "0"', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    const demo = TestBed.inject(DemoDataService);
    const instance = fixture.componentInstance;

    // Force every courier below their cap so nothing is due.
    demo.couriers.set(demo.couriers().map((c) => ({ ...c, cash: 0 })));
    expect(instance['couriersCashDue']()).toBeNull();
  });
});
