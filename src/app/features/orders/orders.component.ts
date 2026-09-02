import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminApiService } from '../../core/admin-api.service';
import { DrawerService } from '../../core/drawer.service';
import { readPage, mapOrder, ORDER_STATUS } from '../../core/mappers';
import { Dto } from '../../core/models';
import { ApiError } from '../../core/api-error';
import { egp } from '../../core/format';
import { AvatarComponent } from '../../shared/avatar.component';
import { KpiCardComponent } from '../../shared/kpi-card.component';
import { ChipTabsComponent } from '../../shared/chip-tabs.component';
import { StateBlockComponent } from '../../shared/state-block.component';
import { PagerComponent } from '../../shared/pager.component';
import { OrderDrawerComponent } from './order-drawer.component';

const STATUS_TABS: [string, string][] = [['All', ''], ...ORDER_STATUS.map((s, i): [string, string] => [s[1], String(i)])];

@Component({
  selector: 'app-orders',
  imports: [AvatarComponent, KpiCardComponent, ChipTabsComponent, StateBlockComponent, PagerComponent],
  templateUrl: './orders.component.html',
})
export class OrdersComponent implements OnInit {
  private api = inject(AdminApiService);
  private drawer = inject(DrawerService);
  protected egp = egp;
  protected tabLabels = STATUS_TABS.map((t) => t[0]);
  protected statusLabel = signal('All');
  protected status = signal('');
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

  protected mapped(o: Dto) {
    return mapOrder(o);
  }

  protected selectTab(label: string) {
    const t = STATUS_TABS.find((x) => x[0] === label);
    this.status.set(t ? t[1] : '');
    this.statusLabel.set(label);
    this.page.set(1);
    this.load();
  }

  protected gotoPage(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.page.set(p);
    this.load();
  }

  async load() {
    this.loadState.set('loading');
    try {
      const data = await this.api.orders({ status: this.status(), page: this.page(), pageSize: this.pageSize });
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

  protected openOrder(i: number) {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    const m = this.mapped(raw);
    this.drawer.show('Order ' + m.id, OrderDrawerComponent, {
      orderId: m.id,
      summary: m,
      onCancelled: () => this.load(),
    });
  }
}
