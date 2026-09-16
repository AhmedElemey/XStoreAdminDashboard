import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminApiService } from '../../core/admin-api.service';
import { DrawerService } from '../../core/drawer.service';
import { readPage, mapVendorReport } from '../../core/mappers';
import { Dto, MappedVendorReport } from '../../core/models';
import { ApiError } from '../../core/api-error';
import { StateBlockComponent } from '../../shared/state-block.component';
import { PagerComponent } from '../../shared/pager.component';
import { ChipTabsComponent } from '../../shared/chip-tabs.component';
import { IconComponent } from '../../shared/icon.component';
import { DateRangeFilterComponent } from '../../shared/date-range-filter.component';
import { ReportDrawerComponent } from './report-drawer.component';

/** Wire value ↔ display label — must match the mobile app's `VendorReportReason.wireName`
 *  (lib/features/reports/domain/entities/vendor_report_reason.dart in the xstore repo). */
export const REASON_TABS: [string, string][] = [
  ['All', ''],
  ['Fraud', 'Fraud'],
  ['Poor quality', 'PoorProductQuality'],
  ['Not as described', 'ItemNotAsDescribed'],
  ['No response', 'NoResponseFromSeller'],
  ['Harassment', 'Harassment'],
  ['Other', 'Other'],
];

export function reasonLabel(wire: string): string {
  return REASON_TABS.find((t) => t[1] === wire)?.[0] ?? wire;
}

let searchTimer: ReturnType<typeof setTimeout>;

@Component({
  selector: 'app-reports',
  imports: [StateBlockComponent, PagerComponent, ChipTabsComponent, IconComponent, DateRangeFilterComponent],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  private api = inject(AdminApiService);
  private drawer = inject(DrawerService);

  protected reasonLabel = reasonLabel;
  protected tabLabels = REASON_TABS.map((t) => t[0]);
  protected reason = signal('');
  protected keyword = signal('');
  protected fromDate = signal('');
  protected toDate = signal('');
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

  protected mapped(r: Dto): MappedVendorReport {
    return mapVendorReport(r);
  }

  protected activeTabLabel() {
    return REASON_TABS.find((t) => t[1] === this.reason())?.[0] ?? 'All';
  }

  protected selectTab(label: string) {
    const t = REASON_TABS.find((x) => x[0] === label);
    this.reason.set(t ? t[1] : '');
    this.page.set(1);
    this.load();
  }

  protected onSearch(v: string) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      this.keyword.set(v.trim());
      this.page.set(1);
      this.load();
    }, 350);
  }

  protected onRangeChange(r: { from: string; to: string }) {
    this.fromDate.set(r.from);
    this.toDate.set(r.to);
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
      const data = await this.api.vendorReports({
        reason: this.reason() || undefined,
        keyword: this.keyword() || undefined,
        from: this.fromDate() || undefined,
        to: this.toDate() || undefined,
        page: this.page(),
        pageSize: this.pageSize,
      });
      const p = readPage<Dto>(data, this.pageSize);
      this.items.set(p.items);
      this.total.set(p.total);
      this.totalPages.set(p.totalPages);
      this.loadState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.loadState.set('error');
      this.errorMsg.set(e instanceof Error ? e.message : "Reports aren't available yet.");
    }
  }

  protected openReport(i: number) {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    this.drawer.show('Report details', ReportDrawerComponent, { report: this.mapped(raw) });
  }
}
