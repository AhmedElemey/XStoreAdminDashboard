import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../../shared/avatar.component';
import { MappedCommission, MappedVendor } from '../../core/models';
import { DrawerService } from '../../core/drawer.service';
import { AdminApiService } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { mapCommission } from '../../core/mappers';
import { egp } from '../../core/format';

@Component({
  selector: 'app-vendor-drawer',
  imports: [AvatarComponent, FormsModule],
  templateUrl: './vendor-drawer.component.html',
})
export class VendorDrawerComponent implements OnInit {
  vendor = input.required<MappedVendor>();
  onApprove = input<() => void>();
  onReject = input<() => void>();

  protected drawer = inject(DrawerService);
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  protected egp = egp;

  protected commission = signal<MappedCommission | null>(null);
  protected commissionState = signal<'loading' | 'error' | null>('loading');
  protected warnDraft = signal(0);
  protected pauseDraft = signal(0);
  protected payAmount = signal(0);
  protected busy = signal(false);

  ngOnInit() {
    this.loadCommission();
  }

  protected level(): 'none' | 'warn' | 'paused' {
    const c = this.commission();
    if (!c) return 'none';
    return c.outstanding >= c.pause ? 'paused' : c.outstanding >= c.warn ? 'warn' : 'none';
  }

  private async loadCommission() {
    const id = this.vendor().id;
    if (!id) {
      this.commissionState.set('error');
      return;
    }
    this.commissionState.set('loading');
    try {
      const data = await this.api.vendorCommission(id);
      const c = mapCommission(data as Record<string, unknown>);
      this.commission.set(c);
      this.warnDraft.set(c.warn);
      this.pauseDraft.set(c.pause);
      this.payAmount.set(c.outstanding);
      this.commissionState.set(null);
    } catch {
      this.commissionState.set('error');
    }
  }

  protected async saveThresholds() {
    const id = this.vendor().id;
    if (!id) return;
    if (this.pauseDraft() < this.warnDraft()) {
      this.toast.show('Pause threshold must be ≥ warn threshold');
      return;
    }
    this.busy.set(true);
    try {
      await this.api.updateVendorCommissionThresholds(id, this.warnDraft(), this.pauseDraft());
      this.toast.show('Commission thresholds saved ✓');
      await this.loadCommission();
    } catch (e) {
      this.toast.show('Save failed: ' + ((e as Error).message || 'error'));
    } finally {
      this.busy.set(false);
    }
  }

  protected async settle(full: boolean) {
    const id = this.vendor().id;
    if (!id) return;
    if (!full && (!this.payAmount() || this.payAmount() <= 0)) {
      this.toast.show('Enter a valid amount');
      return;
    }
    this.busy.set(true);
    try {
      await this.api.settleVendorCommission(id, full ? undefined : this.payAmount());
      this.toast.show(full ? 'Wallet marked fully paid ✓' : 'Payment recorded ✓');
      await this.loadCommission();
    } catch (e) {
      this.toast.show('Settle failed: ' + ((e as Error).message || 'error'));
    } finally {
      this.busy.set(false);
    }
  }
}
