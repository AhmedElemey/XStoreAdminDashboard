import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KpiCardComponent } from '../../shared/kpi-card.component';
import { AvatarComponent } from '../../shared/avatar.component';
import { StateBlockComponent } from '../../shared/state-block.component';
import { AdminApiService } from '../../core/admin-api.service';
import { egp } from '../../core/format';
import { Dto, MappedListing } from '../../core/models';
import { MappedOrder, MappedOverview, mapListing, mapOrder, mapOverview, readPage } from '../../core/mappers';
import { ApiError } from '../../core/api-error';

@Component({
  selector: 'app-dashboard',
  imports: [KpiCardComponent, AvatarComponent, StateBlockComponent, FormsModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private api = inject(AdminApiService);
  protected egp = egp;

  protected loadState = signal<'loading' | 'error' | null>('loading');
  protected errorMsg = signal('');
  protected overview = signal<MappedOverview | null>(null);
  protected recentOrders = signal<MappedOrder[]>([]);
  protected pendingApprovals = signal<MappedListing[]>([]);
  protected pendingTotal = signal(0);

  /** yyyy-mm-dd, blank = let the backend default to its trailing 30-day window */
  protected from = signal('');
  protected to = signal('');

  ngOnInit() {
    this.load();
  }

  async load() {
    this.loadState.set('loading');
    try {
      const [overviewData, ordersData, listingsData] = await Promise.all([
        this.api.overview(this.from() || undefined, this.to() || undefined),
        this.api.orders({ page: 1, pageSize: 5 }),
        this.api.listings({ status: 'PENDING', page: 1, pageSize: 4 }),
      ]);
      this.overview.set(mapOverview(overviewData as Dto));
      this.recentOrders.set(readPage<Dto>(ordersData, 5).items.map(mapOrder));
      const listingsPage = readPage<Dto>(listingsData, 4);
      this.pendingApprovals.set(listingsPage.items.map((raw) => mapListing(raw, this.api.apiBase)));
      this.pendingTotal.set(listingsPage.total);
      this.loadState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.loadState.set('error');
      this.errorMsg.set(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  protected maxTrend() {
    const t = this.overview()?.revenueTrend ?? [];
    return t.length ? Math.max(...t) : 1;
  }
  protected trendPoints() {
    const t = this.overview()?.revenueTrend ?? [];
    const max = this.maxTrend();
    if (!t.length) return '';
    const step = t.length > 1 ? 560 / (t.length - 1) : 0;
    return t.map((v, i) => `${20 + i * step},${180 - (v / max) * 150}`).join(' ');
  }
  protected trendArea() {
    const pts = this.trendPoints();
    return pts ? `20,180 ${pts} 580,180` : '';
  }
  protected trendDots() {
    const t = this.overview()?.revenueTrend ?? [];
    const max = this.maxTrend();
    const step = t.length > 1 ? 560 / (t.length - 1) : 0;
    return t.map((v, i) => ({ cx: 20 + i * step, cy: 180 - (v / max) * 150 }));
  }
  protected maxCategoryCount() {
    const c = this.overview()?.categories ?? [];
    return c.length ? Math.max(...c.map((x) => x.count), 1) : 1;
  }

  protected applyRange() {
    this.load();
  }
  protected clearRange() {
    this.from.set('');
    this.to.set('');
    this.load();
  }

  protected goto(view: string) {
    this.router.navigateByUrl('/' + view);
  }
}
