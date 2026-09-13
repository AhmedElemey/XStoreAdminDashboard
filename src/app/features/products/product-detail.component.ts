import { Component, OnInit, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { ApiError } from '../../core/api-error';
import { Dto, MappedListing } from '../../core/models';
import { mapListing } from '../../core/mappers';
import { egp } from '../../core/format';
import { StateBlockComponent } from '../../shared/state-block.component';

@Component({
  selector: 'app-product-detail',
  imports: [StateBlockComponent],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AdminApiService);
  private location = inject(Location);
  protected egp = egp;

  protected listing = signal<MappedListing | null>(null);
  protected listingState = signal<'loading' | 'error' | null>('loading');

  private id = '';

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id') || '';
      this.load();
    });
  }

  private async load() {
    if (!this.id) {
      this.listingState.set('error');
      return;
    }
    this.listingState.set('loading');
    try {
      const data = await this.api.listing(this.id);
      this.listing.set(mapListing(data as Dto, this.api.apiBase));
      this.listingState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.listingState.set('error');
    }
  }

  protected back() {
    this.location.back();
  }

  protected formatDate(v: string): string {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
