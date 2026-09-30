import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { DrawerService } from '../../core/drawer.service';
import { ImageService } from '../../core/image.service';
import { mapCommission } from '../../core/mappers';
import { Dto, MappedCommissionPayment } from '../../core/models';
import { egp } from '../../core/format';
import { methodLabel, statusBadgeClass } from './payments.component';

/** Review drawer for one payment request: receipt, the vendor's current balance, and the
 *  approve (with an adjustable amount) / reject (with a reason) decision. */
@Component({
  selector: 'app-payment-drawer',
  imports: [RouterLink],
  templateUrl: './payment-drawer.component.html',
})
export class PaymentDrawerComponent {
  private api = inject(AdminApiService);
  private images = inject(ImageService);
  private drawer = inject(DrawerService);

  payment = input.required<MappedCommissionPayment>();
  onApprove = input<(amount: number) => Promise<boolean>>();
  onReject = input<(reason: string) => Promise<boolean>>();

  protected egp = egp;
  protected methodLabel = methodLabel;
  protected statusBadgeClass = statusBadgeClass;
  protected receipt = signal<string | null>(null);
  /** null while loading or when the balance endpoint fails. */
  protected outstanding = signal<number | null>(null);
  /** Raw text of the amount field — the number is derived, so typing "1." isn't rewritten. */
  protected approveInput = signal('');
  protected approveAmount = computed(() => {
    const n = Number(this.approveInput().replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : 0;
  });
  protected rejecting = signal(false);
  protected rejectReason = signal('');
  protected rejectError = signal('');
  protected busy = signal(false);

  protected isPending = computed(() => this.payment().status === 'Pending');
  protected amountError = computed(() => {
    const n = this.approveAmount();
    if (!(n > 0)) return 'Amount must be greater than 0.';
    if (n > this.payment().amount) return `Can't approve more than the vendor claimed (${egp(this.payment().amount)}).`;
    return '';
  });
  protected amountValid = computed(() => !this.amountError());
  protected balanceAfter = computed(() => {
    const o = this.outstanding();
    return o == null ? null : Math.max(0, o - this.approveAmount());
  });

  constructor() {
    // An effect, not ngOnInit: the drawer host reuses this instance when another row is
    // opened while the drawer is still open, and only swaps the `payment` input.
    effect(() => {
      const p = this.payment();
      this.approveInput.set(String(p.amount));
      this.rejecting.set(false);
      this.rejectReason.set('');
      this.rejectError.set('');
      this.outstanding.set(null);
      this.receipt.set(p.receiptUrl ? this.images.resolveSync(p.receiptUrl) : null);
      if (p.receiptUrl) {
        this.images.resolve(p.receiptUrl).then((url) => {
          if (this.payment().id === p.id) this.receipt.set(url);
        });
      }
      if (p.vendorId && p.status === 'Pending') this.loadBalance(p);
    });
  }

  private async loadBalance(p: MappedCommissionPayment) {
    try {
      const outstanding = mapCommission((await this.api.vendorCommission(p.vendorId)) as Dto).outstanding;
      if (this.payment().id === p.id) this.outstanding.set(outstanding);
    } catch {
      /* balance is context only — the decision doesn't depend on it */
    }
  }

  protected async approve() {
    const cb = this.onApprove();
    if (!cb || !this.amountValid() || this.busy()) return;
    this.busy.set(true);
    await cb(this.approveAmount());
    this.busy.set(false);
  }

  protected onRejectInput(v: string) {
    this.rejectReason.set(v);
    if (v.trim()) this.rejectError.set('');
  }

  protected async reject() {
    const cb = this.onReject();
    const reason = this.rejectReason().trim();
    if (!reason) {
      this.rejectError.set('Rejection reason is required.');
      return;
    }
    if (!cb || this.busy()) return;
    this.busy.set(true);
    await cb(reason);
    this.busy.set(false);
  }

  /** The vendor link navigates away; close the overlay so it doesn't sit over the new page. */
  protected closeDrawer() {
    this.drawer.close();
  }
}
