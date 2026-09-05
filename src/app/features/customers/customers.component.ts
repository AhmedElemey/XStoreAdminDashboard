import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminApiService } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';
import { readPage, mapUser } from '../../core/mappers';
import { Dto, MappedUser } from '../../core/models';
import { ApiError } from '../../core/api-error';
import { StateBlockComponent } from '../../shared/state-block.component';
import { PagerComponent } from '../../shared/pager.component';
import { AvatarComponent } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';
import { KpiCardComponent } from '../../shared/kpi-card.component';
import { ChipTabsComponent } from '../../shared/chip-tabs.component';
import { UserDrawerComponent } from './user-drawer.component';

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
  private drawer = inject(DrawerService);

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

  ngOnInit() {
    this.load();
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
      const data = await this.api.users({
        keyword: this.keyword(),
        role: 'CONSUMER',
        isVerified: this.verifiedFilter() || undefined,
        page: this.page(),
        pageSize: this.pageSize,
      });
      const p = readPage<Dto>(data, this.pageSize);
      this.items.set(p.items);
      this.total.set(p.total);
      this.totalPages.set(p.totalPages);
      this.loadState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.loadState.set('error');
      this.errorMsg.set(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  protected openDrawer(i: number) {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    const m = this.mapped(raw);
    this.drawer.show(m.name, UserDrawerComponent, { user: m });
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
