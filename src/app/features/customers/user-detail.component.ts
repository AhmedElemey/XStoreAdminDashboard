import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { ApiError } from '../../core/api-error';
import { Dto, MappedUser } from '../../core/models';
import { readPage, mapUser, mapOrder, MappedOrder } from '../../core/mappers';
import { egp } from '../../core/format';
import { AvatarComponent } from '../../shared/avatar.component';
import { StateBlockComponent } from '../../shared/state-block.component';

@Component({
  selector: 'app-user-detail',
  imports: [RouterLink, AvatarComponent, StateBlockComponent],
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(AdminApiService);
  protected egp = egp;

  protected user = signal<MappedUser | null>(null);
  protected userState = signal<'loading' | 'error' | null>('loading');

  protected orders = signal<MappedOrder[]>([]);
  protected ordersState = signal<'loading' | 'error' | null>('loading');

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id') || '';
      this.loadUser(id);
      this.loadOrders(id);
    });
  }

  private async loadUser(id: string) {
    if (!id) {
      this.userState.set('error');
      return;
    }
    this.userState.set('loading');
    try {
      const data = await this.api.user(id);
      this.user.set(mapUser(data as Dto));
      this.userState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.userState.set('error');
    }
  }

  private async loadOrders(id: string) {
    if (!id) {
      this.ordersState.set('error');
      return;
    }
    this.ordersState.set('loading');
    try {
      const data = await this.api.orders({ userId: id, page: 1, pageSize: 10 });
      const p = readPage<Dto>(data, 10);
      this.orders.set(p.items.map(mapOrder));
      this.ordersState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.ordersState.set('error');
    }
  }

  protected openOrder(o: MappedOrder) {
    this.router.navigate(['/orders', o.id]);
  }
}
