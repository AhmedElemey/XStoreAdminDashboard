import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { ApiError } from '../../core/api-error';
import { ToastService } from '../../core/toast.service';
import { Dto, MappedCommission, MappedListing, MappedVendor } from '../../core/models';
import { mapVendor, mapCommission, mapListing, readPage } from '../../core/mappers';
import { egp } from '../../core/format';
import { AvatarComponent } from '../../shared/avatar.component';
import { StateBlockComponent } from '../../shared/state-block.component';
import { ChipTabsComponent } from '../../shared/chip-tabs.component';

const TABS = ['Overview', 'Listings'];

@Component({
  selector: 'app-vendor-detail',
  imports: [RouterLink, FormsModule, AvatarComponent, StateBlockComponent, ChipTabsComponent],
  templateUrl: './vendor-detail.component.html',
})
export class VendorDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  protected egp = egp;

  protected tabLabels = TABS;
  protected activeTab = signal('Overview');

  protected vendor = signal<MappedVendor | null>(null);
  protected vendorState = signal<'loading' | 'error' | null>('loading');

  protected commission = signal<MappedCommission | null>(null);
  protected commissionState = signal<'loading' | 'error' | null>('loading');
  protected warnDraft = signal(0);
  protected pauseDraft = signal(0);
  protected payAmount = signal(0);
  protected busy = signal(false);

  protected listings = signal<MappedListing[]>([]);
  protected listingsState = signal<'loading' | 'error' | null>('loading');
  private listingsLoaded = false;

  private id = '';

  ngOnInit() {
    const initialTab = this.route.snapshot.queryParamMap.get('tab');
    if (initialTab === 'listings') this.activeTab.set('Listings');

    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id') || '';
      this.loadVendor();
      this.loadCommission();
      if (this.activeTab() === 'Listings') this.loadListings();
    });
  }

  protected selectTab(label: string) {
    this.activeTab.set(label);
    if (label === 'Listings' && !this.listingsLoaded) this.loadListings();
  }

  private async loadListings() {
    if (!this.id) {
      this.listingsState.set('error');
      return;
    }
    this.listingsLoaded = true;
    this.listingsState.set('loading');
    try {
      const data = await this.api.listings({ status: '', vendorId: this.id, page: 1, pageSize: 50 });
      const p = readPage<Dto>(data, 50);
      this.listings.set(p.items.map((raw) => mapListing(raw, this.api.apiBase)));
      this.listingsState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.listingsState.set('error');
    }
  }

  protected openListing(l: MappedListing) {
    this.router.navigate(['/vendors', this.id, 'listings', l.id]);
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
