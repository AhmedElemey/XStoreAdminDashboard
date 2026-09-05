import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { ApiError } from '../../core/api-error';
import { ToastService } from '../../core/toast.service';
import { Dto, MappedCommission, MappedVendor } from '../../core/models';
import { mapVendor, mapCommission } from '../../core/mappers';
import { egp } from '../../core/format';
import { AvatarComponent } from '../../shared/avatar.component';
import { StateBlockComponent } from '../../shared/state-block.component';

@Component({
  selector: 'app-vendor-detail',
  imports: [RouterLink, FormsModule, AvatarComponent, StateBlockComponent],
  templateUrl: './vendor-detail.component.html',
})
export class VendorDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  protected egp = egp;

  protected vendor = signal<MappedVendor | null>(null);
  protected vendorState = signal<'loading' | 'error' | null>('loading');

  protected commission = signal<MappedCommission | null>(null);
  protected commissionState = signal<'loading' | 'error' | null>('loading');
  protected warnDraft = signal(0);
  protected pauseDraft = signal(0);
  protected payAmount = signal(0);
  protected busy = signal(false);

  private id = '';

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id') || '';
      this.loadVendor();
      this.loadCommission();
    });
  }

  protected level(): 'none' | 'warn' | 'paused' {
    const c = this.commission();
    if (!c) return 'none';
    return c.outstanding >= c.pause ? 'paused' : c.outstanding >= c.warn ? 'warn' : 'none';
  }

  private async loadVendor() {
    if (!this.id) {
      this.vendorState.set('error');
      return;
    }
    this.vendorState.set('loading');
    try {
      const data = await this.api.vendor(this.id);
      this.vendor.set(mapVendor(data as Dto));
      this.vendorState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.vendorState.set('error');
    }
  }

  private async loadCommission() {
    if (!this.id) {
      this.commissionState.set('error');
      return;
    }
    this.commissionState.set('loading');
    try {
      const data = await this.api.vendorCommission(this.id);
      const c = mapCommission(data as Dto);
      this.commission.set(c);
      this.warnDraft.set(c.warn);
      this.pauseDraft.set(c.pause);
      this.payAmount.set(c.outstanding);
      this.commissionState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.commissionState.set('error');
    }
  }

  protected async saveThresholds() {
    if (!this.id) return;
    if (this.pauseDraft() < this.warnDraft()) {
      this.toast.show('Pause threshold must be ≥ warn threshold');
      return;
    }
    this.busy.set(true);
    try {
      await this.api.updateVendorCommissionThresholds(this.id, this.warnDraft(), this.pauseDraft());
      this.toast.show('Commission thresholds saved ✓');
      await this.loadCommission();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show('Save failed: ' + ((e as Error).message || 'error'));
    } finally {
      this.busy.set(false);
    }
  }

  protected async settle(full: boolean) {
    if (!this.id) return;
    if (!full && (!this.payAmount() || this.payAmount() <= 0)) {
      this.toast.show('Enter a valid amount');
      return;
    }
    this.busy.set(true);
    try {
      await this.api.settleVendorCommission(this.id, full ? undefined : this.payAmount());
      this.toast.show(full ? 'Wallet marked fully paid ✓' : 'Payment recorded ✓');
      await this.loadCommission();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show('Settle failed: ' + ((e as Error).message || 'error'));
    } finally {
      this.busy.set(false);
    }
  }

  protected async decide(action: 'approve' | 'reject') {
    const v = this.vendor();
    if (!v || !this.id) return;
    if (action === 'reject' && !confirm(`Reject vendor "${v.store}"? They will be notified.`)) return;
    try {
      if (action === 'approve') await this.api.approveVendor(this.id);
      else await this.api.rejectVendor(this.id);
      this.toast.show(action === 'approve' ? 'Vendor approved — now selling ✓' : 'Vendor rejected — notified');
      this.router.navigate(['/vendors']);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show(`${action === 'approve' ? 'Approve' : 'Reject'} failed: ${(e as Error).message || 'error'}`);
    }
  }
}
