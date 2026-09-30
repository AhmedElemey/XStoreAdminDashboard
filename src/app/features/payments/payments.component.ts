import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminApiService } from '../../core/admin-api.service';
import { DrawerService } from '../../core/drawer.service';
import { NavBadgesService } from '../../core/nav-badges.service';
import { ToastService } from '../../core/toast.service';
import { mapCommissionPayment, readPage } from '../../core/mappers';
import { Dto, MappedCommissionPayment } from '../../core/models';
import { egp } from '../../core/format';
import { ApiError } from '../../core/api-error';
import { StateBlockComponent } from '../../shared/state-block.component';
import { PagerComponent } from '../../shared/pager.component';
import { ChipTabsComponent } from '../../shared/chip-tabs.component';
import { IconComponent } from '../../shared/icon.component';
import { DateRangeFilterComponent } from '../../shared/date-range-filter.component';
import { PaymentDrawerComponent } from './payment-drawer.component';

const STATUS_TABS: [string, string][] = [
  ['Pending', 'Pending'],
  ['Approved', 'Approved'],
  ['Rejected', 'Rejected'],
  ['All', ''],
];

/** Wire value ↔ label — must match the mobile app's `CommissionPaymentMethod.wireName`
 *  (lib/features/commission/domain/entities/commission_payment_method.dart in the xstore repo). */
const METHOD_LABELS: Record<string, string> = {
  InstaPay: 'InstaPay',
  VodafoneCash: 'Vodafone Cash',
  OrangeCash: 'Orange Cash',
  EtisalatCash: 'Etisalat Cash',
};

export function methodLabel(wire: string): string {
  return METHOD_LABELS[wire] ?? wire;
}

export function statusBadgeClass(status: string): string {
  return status === 'Approved' ? 'b-green' : status === 'Rejected' ? 'b-red' : 'b-amber';
}

let searchTimer: ReturnType<typeof setTimeout>;

@Component({
  selector: 'app-payments',
  imports: [StateBlockComponent, PagerComponent, ChipTabsComponent, IconComponent, DateRangeFilterComponent],
  templateUrl: './payments.component.html',
})
export class PaymentsComponent implements OnInit {
  private api = inject(AdminApiService);
  private drawer = inject(DrawerService);
  private badges = inject(NavBadgesService);
  private toast = inject(ToastService);

  protected egp = egp;
  protected methodLabel = methodLabel;
  protected statusBadgeClass = statusBadgeClass;
  protected tabLabels = STATUS_TABS.map((t) => t[0]);
  protected status = signal('Pending');
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

  protected mapped(r: Dto): MappedCommissionPayment {
    return mapCommissionPayment(r, this.api.apiBase);
  }

  protected activeTabLabel() {
    return STATUS_TABS.find((t) => t[1] === this.status())?.[0] ?? 'All';
  }

  protected selectTab(label: string) {
    const t = STATUS_TABS.find((x) => x[0] === label);
    this.status.set(t ? t[1] : '');
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
      const data = await this.api.commissionPayments({
        status: this.status() || undefined,
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
      if (this.status() === 'Pending' && !this.keyword() && !this.fromDate() && !this.toDate()) {
        this.badges.paymentsPending.set(p.total > 0 ? p.total : null);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.loadState.set('error');
      this.errorMsg.set(e instanceof Error ? e.message : "Payment requests aren't available yet.");
    }
  }

  protected openPayment(i: number) {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    const payment = this.mapped(raw);
    this.drawer.show('Review payment', PaymentDrawerComponent, {
      payment,
      onApprove: (amount: number) => this.approve(payment, amount),
      onReject: (reason: string) => this.reject(payment, reason),
    });
  }

  /** Returns true on success so the drawer knows whether to keep its form state. */
  private async approve(p: MappedCommissionPayment, amount: number): Promise<boolean> {
    try {
      await this.api.approveCommissionPayment(p.id, amount);
      this.toast.show(`Approved — ${egp(amount)} deducted from ${p.vendorName}'s balance ✓`);
      this.drawer.close();
      this.load();
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return false;
      this.toast.show(`Approve failed: ${(e as Error).message || 'error'}`);
      return false;
    }
  }

  private async reject(p: MappedCommissionPayment, reason: string): Promise<boolean> {
    try {
      await this.api.rejectCommissionPayment(p.id, reason);
      this.toast.show('Payment rejected — vendor notified');
      this.drawer.close();
      this.load();
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return false;
      this.toast.show(`Reject failed: ${(e as Error).message || 'error'}`);
      return false;
    }
  }
}
