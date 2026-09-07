import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdminApiService, UsersQuery } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { readPage, mapUser, customerOrdersCount } from '../../core/mappers';
import { Dto, MappedUser, Page } from '../../core/models';
import { ApiError } from '../../core/api-error';
import { StateBlockComponent } from '../../shared/state-block.component';
import { PagerComponent } from '../../shared/pager.component';
import { AvatarComponent } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';
import { KpiCardComponent } from '../../shared/kpi-card.component';
import { ChipTabsComponent } from '../../shared/chip-tabs.component';

let searchTimer: ReturnType<typeof setTimeout>;

// The `isVerified` list item field the badge reads is never populated by the API today,
// so every row shows "Unverified" regardless of real status — but the server-side
// ?isVerified=true|false filter does work correctly (confirmed against live data), so
// expose it as a filter here even though the per-row badge is a known backend gap.
const VERIFIED_TABS: [string, string][] = [
  ['All', ''],
  ['Verified', 'true'],
  ['Unverified', 'false'],
];

@Component({
  selector: 'app-customers',
  imports: [StateBlockComponent, PagerComponent, AvatarComponent, IconComponent, KpiCardComponent, ChipTabsComponent],
  templateUrl: './customers.component.html',
})
export class CustomersComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  protected tabLabels = VERIFIED_TABS.map((t) => t[0]);
  protected verifiedFilter = signal('');
  protected keyword = signal('');
  protected page = signal(1);
  protected pageSize = 20;
  protected total = signal(0);
  protected totalPages = signal(1);
  protected items = signal<Dto[] | null>(null);
  protected loadState = signal<'loading' | 'error' | null>('loading');
  protected errorMsg = signal('');
  protected ordersPerCustomer = signal<number | null>(null);
  protected repeatRate = signal<number | null>(null);

  /** No aggregate stats endpoint exists for these KPIs, so they're computed client-side
   *  from every matching customer's order count — capped so an unfiltered view over a huge
   *  customer base can't trigger an unbounded request. */
  private readonly statsFetchCap = 2000;

  ngOnInit() {
    this.load();
  }

  protected ordersPerCustomerLabel() {
    const v = this.ordersPerCustomer();
    return v == null ? '—' : v.toFixed(1);
  }

  protected repeatRateLabel() {
    const v = this.repeatRate();
    return v == null ? '—' : Math.round(v) + '%';
  }

  protected mapped(u: Dto): MappedUser {
    return mapUser(u);
  }

  /** The API never returns isVerified on list items, so m.verified is always null —
   *  but while a Verified/Unverified filter is active, every row in the result set is
   *  known to match it (the server-side filter is real), so use that as ground truth. */
  protected rowVerified(m: MappedUser): boolean | null {
    if (this.verifiedFilter() === 'true') return true;
    if (this.verifiedFilter() === 'false') return false;
    return m.verified;
  }

  protected onSearch(v: string) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      this.keyword.set(v.trim());
      this.page.set(1);
      this.load();
    }, 350);
  }

  protected gotoPage(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.page.set(p);
    this.load();
  }

  protected activeTabLabel() {
    return VERIFIED_TABS.find((t) => t[1] === this.verifiedFilter())?.[0] ?? 'All';
  }

  protected selectTab(label: string) {
    const t = VERIFIED_TABS.find((x) => x[0] === label);
    this.verifiedFilter.set(t ? t[1] : '');
    this.page.set(1);
    this.load();
  }

  async load() {
    this.loadState.set('loading');
    try {
      const query: UsersQuery = {
        keyword: this.keyword(),
        role: 'CONSUMER',
        isVerified: this.verifiedFilter() || undefined,
        page: this.page(),
        pageSize: this.pageSize,
      };
      const data = await this.api.users(query);
      const p = readPage<Dto>(data, this.pageSize);
      this.items.set(p.items);
      this.total.set(p.total);
      this.totalPages.set(p.totalPages);
      this.loadState.set(null);
      this.loadCustomerStats(query, p);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.loadState.set('error');
      this.errorMsg.set(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  /** Orders-per-customer and repeat-rate reflect the currently filtered set of customers
   *  (same keyword/verified filters as the table), not just the visible page, so this
   *  re-fetches the full matching set when it doesn't already fit on one page. Runs after
   *  the table has rendered and fails silently — a stale/blank KPI isn't worth an error
   *  state when the table itself loaded fine. */
  private async loadCustomerStats(query: UsersQuery, page: Page<Dto>) {
    try {
      const raws =
        page.items.length >= page.total
          ? page.items
          : readPage<Dto>(await this.api.users({ ...query, page: 1, pageSize: Math.min(page.total, this.statsFetchCap) }), page.total).items;
      const counts = raws.map(customerOrdersCount).filter((n): n is number => n != null);
      if (!counts.length) {
        this.ordersPerCustomer.set(null);
        this.repeatRate.set(null);
        return;
      }
      const totalOrders = counts.reduce((a, b) => a + b, 0);
      this.ordersPerCustomer.set(totalOrders / counts.length);
      this.repeatRate.set((counts.filter((c) => c > 1).length / counts.length) * 100);
    } catch {
      this.ordersPerCustomer.set(null);
      this.repeatRate.set(null);
    }
  }

  protected openUser(i: number) {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    const m = this.mapped(raw);
    this.router.navigate(['/customers', m.id]);
  }

  protected exportCsv() {
    const items = this.items() || [];
    if (!items.length) {
      this.toast.show('Nothing to export yet');
      return;
    }
    const head = ['Name', 'City', 'Phone', 'Email', 'Orders', 'Role'];
    const body = items.map((u) => {
      const m = this.mapped(u);
      return [m.name, m.city, m.phone, m.email, m.orders, m.role];
    });
    const csv = [head, ...body].map((r) => r.map((c) => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'xstore-customers-page' + this.page() + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    this.toast.show(`Exported ${items.length} customers (current page)`);
  }
}
