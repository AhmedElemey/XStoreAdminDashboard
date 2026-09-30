import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { ApiError } from '../../core/api-error';
import { Dto, MappedUser } from '../../core/models';
import { readPage, mapUser, mapOrder, MappedOrder } from '../../core/mappers';
import { egp } from '../../core/format';
import { StateBlockComponent } from '../../shared/state-block.component';
import { PagerComponent } from '../../shared/pager.component';

@Component({
  selector: 'app-customer-orders',
  imports: [RouterLink, StateBlockComponent, PagerComponent],
  templateUrl: './customer-orders.component.html',
})
export class CustomerOrdersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AdminApiService);
  protected egp = egp;

  protected user = signal<MappedUser | null>(null);
  protected orders = signal<MappedOrder[]>([]);
  protected ordersState = signal<'loading' | 'error' | null>('loading');
  protected page = signal(1);
  protected pageSize = 10;
  protected total = signal(0);
  protected totalPages = signal(1);

  protected id = '';

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id') || '';
      this.loadUser();
      this.loadOrders();
    });
  }

  private async loadUser() {
    if (!this.id) return;
    try {
      const data = await this.api.user(this.id);
      this.user.set(mapUser(data as Dto));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      /* header falls back to a generic title — not critical */
    }
  }

  private async loadOrders() {
    if (!this.id) {
      this.ordersState.set('error');
      return;
    }
    this.ordersState.set('loading');
    try {
      const data = await this.api.orders({ userId: this.id, page: this.page(), pageSize: this.pageSize });
      const p = readPage<Dto>(data, this.pageSize);
      this.orders.set(p.items.map(mapOrder));
      this.total.set(p.total);
      this.totalPages.set(p.totalPages);
      this.ordersState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.ordersState.set('error');
    }
  }

  protected gotoPage(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.page.set(p);
    this.loadOrders();
  }
}
