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
import { UserDrawerComponent } from './user-drawer.component';

let searchTimer: ReturnType<typeof setTimeout>;

@Component({
  selector: 'app-customers',
  imports: [StateBlockComponent, PagerComponent, AvatarComponent, IconComponent, KpiCardComponent],
  templateUrl: './customers.component.html',
})
export class CustomersComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  private drawer = inject(DrawerService);

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

  async load() {
    this.loadState.set('loading');
    try {
      const data = await this.api.users({ keyword: this.keyword(), role: 'CONSUMER', page: this.page(), pageSize: this.pageSize });
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
