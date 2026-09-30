import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { ApiError } from '../../core/api-error';
import { Dto, MappedListing, MappedVendor } from '../../core/models';
import { mapVendor, mapListing, readPage } from '../../core/mappers';
import { egp } from '../../core/format';
import { StateBlockComponent } from '../../shared/state-block.component';
import { PagerComponent } from '../../shared/pager.component';
import { DateRangeFilterComponent } from '../../shared/date-range-filter.component';

@Component({
  selector: 'app-vendor-products',
  imports: [RouterLink, StateBlockComponent, PagerComponent, DateRangeFilterComponent],
  templateUrl: './vendor-products.component.html',
})
export class VendorProductsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AdminApiService);
  protected egp = egp;

  protected vendor = signal<MappedVendor | null>(null);
  protected products = signal<MappedListing[]>([]);
  protected productsState = signal<'loading' | 'error' | null>('loading');
  protected page = signal(1);
  protected pageSize = 20;
  protected total = signal(0);
  protected totalPages = signal(1);
  protected fromDate = signal('');
  protected toDate = signal('');

  /** Client-side range filter — GET /api/admin/vendors/{id}/products only pages
   *  (page/pageSize), so the from/to bounds (submitted date) are applied here
   *  over the loaded page. */
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
    this.page.set(1);
    this.loadProducts();
  }

  protected gotoPage(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.page.set(p);
    this.loadProducts();
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
      const data = await this.api.vendorProducts(this.id, this.page(), this.pageSize);
      const p = readPage<Dto>(data, this.pageSize);
      this.products.set(p.items.map((raw) => mapListing(raw, this.api.apiBase)));
      this.total.set(p.total);
      this.totalPages.set(p.totalPages);
      this.productsState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.productsState.set('error');
    }
  }
}
