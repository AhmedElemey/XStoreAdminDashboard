import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Dto, MappedUser } from '../../core/models';
import { DrawerService } from '../../core/drawer.service';
import { AdminApiService } from '../../core/admin-api.service';
import { ApiError } from '../../core/api-error';
import { readPage, mapOrder, MappedOrder } from '../../core/mappers';
import { egp } from '../../core/format';
import { OrderDrawerComponent } from '../orders/order-drawer.component';

@Component({
  selector: 'app-user-drawer',
  templateUrl: './user-drawer.component.html',
})
export class UserDrawerComponent implements OnInit {
  user = input.required<MappedUser>();
  protected drawer = inject(DrawerService);
  private api = inject(AdminApiService);
  protected egp = egp;

  protected orders = signal<MappedOrder[]>([]);
  protected ordersState = signal<'loading' | 'error' | null>('loading');

  ngOnInit() {
    this.loadOrders();
  }

  private async loadOrders() {
    const id = this.user().id;
    if (!id) {
      this.ordersState.set('error');
      return;
    }
    this.ordersState.set('loading');
    try {
      const data = await this.api.orders({ userId: id, page: 1, pageSize: 5 });
      const p = readPage<Dto>(data, 5);
      this.orders.set(p.items.map(mapOrder));
      this.ordersState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.ordersState.set('error');
    }
  }

  protected openOrder(o: MappedOrder) {
    this.drawer.show('Order ' + o.id, OrderDrawerComponent, { orderId: o.id, summary: o });
  }
}
