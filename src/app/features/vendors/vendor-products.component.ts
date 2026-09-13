import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { ApiError } from '../../core/api-error';
import { Dto, MappedListing, MappedVendor } from '../../core/models';
import { mapVendor, mapListing, readPage } from '../../core/mappers';
import { egp } from '../../core/format';
import { StateBlockComponent } from '../../shared/state-block.component';
import { DateRangeFilterComponent } from '../../shared/date-range-filter.component';

@Component({
  selector: 'app-vendor-products',
  imports: [RouterLink, StateBlockComponent, DateRangeFilterComponent],
  templateUrl: './vendor-products.component.html',
})
export class VendorProductsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AdminApiService);
  protected egp = egp;

  protected vendor = signal<MappedVendor | null>(null);
  protected products = signal<MappedListing[]>([]);
  protected productsState = signal<'loading' | 'error' | null>('loading');
  protected fromDate = signal('');
  protected toDate = signal('');

  /** Client-side range filter — this endpoint returns the vendor's full product list
   *  with no query params, so the from/to bounds (submitted date) are applied here. */
  protected filteredProducts = computed(() => {
    const from = this.fromDate();
    const to = this.toDate();
    if (!from && !to) return this.products();
    const fromTime = from ? new Date(from).getTime() : -Infinity;
    const toTime = to ? new Date(to).getTime() : Infinity;
    return this.products().filter((p) => {
      const t = new Date(p.submitted).getTime();
      return !isNaN(t) && t >= fromTime && t <= toTime;
    });
  });

  protected onRangeChange(r: { from: string; to: string }) {
    this.fromDate.set(r.from);
    this.toDate.set(r.to);
  }

  protected id = '';

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id') || '';
      this.loadVendor();
      this.loadProducts();
    });
  }

  private async loadVendor() {
    if (!this.id) return;
    try {
      const data = await this.api.vendor(this.id);
      this.vendor.set(mapVendor(data as Dto));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      /* header falls back to a generic title — not critical */
    }
  }

  private async loadProducts() {
    if (!this.id) {
      this.productsState.set('error');
      return;
    }
    this.productsState.set('loading');
    try {
      const data = await this.api.vendorProducts(this.id);
      const p = readPage<Dto>(data, 200);
      this.products.set(p.items.map((raw) => mapListing(raw, this.api.apiBase)));
      this.productsState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.productsState.set('error');
    }
  }
}
