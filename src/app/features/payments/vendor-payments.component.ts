import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { DrawerService } from '../../core/drawer.service';
import { ToastService } from '../../core/toast.service';
import { mapCommission, mapCommissionPayment, mapVendor, readAllPages } from '../../core/mappers';
import { Dto, MappedCommissionPayment } from '../../core/models';
import { egp } from '../../core/format';
import { ApiError } from '../../core/api-error';
import { StateBlockComponent } from '../../shared/state-block.component';
import { ChipTabsComponent } from '../../shared/chip-tabs.component';
import { KpiCardComponent } from '../../shared/kpi-card.component';
import { DateRangeFilterComponent } from '../../shared/date-range-filter.component';
import { PaymentDrawerComponent } from './payment-drawer.component';
import { methodLabel, statusBadgeClass } from './payments.component';
import { approvePayment, rejectPayment } from './payment-actions';
import {
  VENDOR_STATUS_TABS,
  filterPayments,
  onlyVendor,
  sortNewestFirst,
  summarize,
} from './vendor-payments.util';

/** Super-admin view of every fee payment request one vendor has submitted. */
@Component({
  selector: 'app-vendor-payments',
  imports: [
    RouterLink,
    StateBlockComponent,
    ChipTabsComponent,
    KpiCardComponent,
    DateRangeFilterComponent,
  ],
  templateUrl: './vendor-payments.component.html',
})
export class VendorPaymentsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AdminApiService);
  private drawer = inject(DrawerService);
  private toast = inject(ToastService);

  protected egp = egp;
  protected methodLabel = methodLabel;
  protected statusBadgeClass = statusBadgeClass;
  protected tabLabels: string[] = [...VENDOR_STATUS_TABS];
  protected vendorId = '';
  protected status = signal('All');
  protected fromDate = signal('');
  protected toDate = signal('');
  protected rows = signal<MappedCommissionPayment[]>([]);
  protected vendorName = signal('Vendor');
  /** null while loading or when the balance endpoint fails. */
  protected outstanding = signal<number | null>(null);
  protected loadState = signal<'loading' | 'error' | null>('loading');
  protected errorMsg = signal('');
  /** Rows the backend returned for other vendors (it ignored `vendorId`) were dropped. */
  protected droppedRows = signal(0);
  protected truncated = signal(false);
  protected loadedCount = signal(0);
  /** Bumped on every load(); an answer for an older load is dropped. */
  private loadSeq = 0;

  protected summary = computed(() => summarize(this.rows()));
  protected visible = computed(() =>
    filterPayments(this.rows(), this.status(), this.fromDate(), this.toDate()),
  );

  ngOnInit() {
    this.vendorId = this.route.snapshot.paramMap.get('vendorId') ?? '';
    this.load();
  }

  protected selectTab(label: string) {
    this.status.set(label);
  }

  protected onRangeChange(r: { from: string; to: string }) {
    this.fromDate.set(r.from);
    this.toDate.set(r.to);
  }

  async load() {
    const seq = ++this.loadSeq;
    const vendorId = this.vendorId;
    this.loadState.set('loading');
    // Balance is context only: its failure must never fail the page.
    const balance = this.api
      .vendorCommission(vendorId)
      .then((c) => mapCommission(c as Dto).outstanding)
      .catch(() => null);
    try {
      const all = await readAllPages<Dto>((page, pageSize) =>
        this.api.commissionPayments({ vendorId, page, pageSize }),
      );
      if (seq !== this.loadSeq) return; // a newer load() has started; drop this stale answer
      const mapped = all.items.map((r) => mapCommissionPayment(r, this.api.apiBase));
      const mine = sortNewestFirst(onlyVendor(mapped, vendorId));
      this.rows.set(mine);
      this.droppedRows.set(mapped.length - mine.length);
      this.truncated.set(all.truncated);
      this.loadedCount.set(mapped.length);
      this.vendorName.set(mine[0]?.vendorName || 'Vendor');
      this.loadState.set(null);
      balance.then((o) => {
        if (seq === this.loadSeq) this.outstanding.set(o);
      });
      if (!mine.length) this.loadVendorName(seq);
    } catch (e) {
      if (seq !== this.loadSeq) return;
      if (e instanceof ApiError && e.status === 401) return;
      this.loadState.set('error');
      this.errorMsg.set(e instanceof Error ? e.message : "Payment history isn't available yet.");
    }
  }

  /** No payment rows to read the store name from — fall back to the vendor record. */
  private async loadVendorName(seq: number) {
    try {
      const v = mapVendor((await this.api.vendor(this.vendorId)) as Dto);
      if (seq === this.loadSeq && v.store) this.vendorName.set(v.store);
    } catch {
      /* keeps the generic "Vendor" heading */
    }
  }

  protected openPayment(m: MappedCommissionPayment) {
    const deps = {
      api: this.api,
      toast: this.toast,
      drawer: this.drawer,
      onDone: () => this.load(),
    };
    this.drawer.show('Review payment', PaymentDrawerComponent, {
      payment: m,
      onApprove: () => approvePayment(deps, m),
      onReject: (reason: string) => rejectPayment(deps, m, reason),
    });
  }
}
