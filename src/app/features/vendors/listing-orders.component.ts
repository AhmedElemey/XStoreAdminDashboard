import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { ApiError } from '../../core/api-error';
import { Dto } from '../../core/models';
import { readPage, mapOrder, MappedOrder } from '../../core/mappers';
import { egp } from '../../core/format';
import { StateBlockComponent } from '../../shared/state-block.component';
import { PagerComponent } from '../../shared/pager.component';

@Component({
  selector: 'app-listing-orders',
  imports: [RouterLink, StateBlockComponent, PagerComponent],
  templateUrl: './listing-orders.component.html',
})
export class ListingOrdersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(AdminApiService);
  protected egp = egp;

  protected vendorId = '';
  protected listingId = '';

  protected orders = signal<MappedOrder[]>([]);
  protected ordersState = signal<'loading' | 'error' | null>('loading');
  protected page = signal(1);
  protected pageSize = 20;
  protected total = signal(0);
  protected totalPages = signal(1);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.vendorId = params.get('id') || '';
      this.listingId = params.get('listingId') || '';
      this.page.set(1);
      this.load();
    });
  }

  protected gotoPage(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.page.set(p);
    this.load();
  }

  private async load() {
    if (!this.listingId) {
      this.ordersState.set('error');
      return;
    }
    this.ordersState.set('loading');
    try {
      const data = await this.api.orders({ listingId: this.listingId, page: this.page(), pageSize: this.pageSize });
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

  protected openOrder(o: MappedOrder) {
    this.router.navigate(['/orders', o.id]);
  }
}
