import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminApiService } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';
import { readPage, mapVendor } from '../../core/mappers';
import { Dto, MappedVendor } from '../../core/models';
import { ApiError } from '../../core/api-error';
import { StateBlockComponent } from '../../shared/state-block.component';
import { PagerComponent } from '../../shared/pager.component';
import { ChipTabsComponent } from '../../shared/chip-tabs.component';
import { AvatarComponent } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';
import { VendorDrawerComponent } from './vendor-drawer.component';

const STATUS_TABS: [string, string][] = [
  ['All', ''],
  ['Pending', '0'],
  ['Active', '1'],
  ['Rejected', '2'],
  ['Suspended', '3'],
];

let searchTimer: ReturnType<typeof setTimeout>;

@Component({
  selector: 'app-vendors',
  imports: [StateBlockComponent, PagerComponent, ChipTabsComponent, AvatarComponent, IconComponent],
  templateUrl: './vendors.component.html',
})
export class VendorsComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  private drawer = inject(DrawerService);

  protected tabLabels = STATUS_TABS.map((t) => t[0]);
  protected statusLabel = signal('All');
  protected vendorStatus = signal('');
  protected keyword = signal('');
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

  protected mapped(v: Dto): MappedVendor {
    return mapVendor(v);
  }

  protected selectTab(label: string) {
    const t = STATUS_TABS.find((x) => x[0] === label);
    this.vendorStatus.set(t ? t[1] : '');
    this.statusLabel.set(label);
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

  protected gotoPage(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.page.set(p);
    this.load();
  }

  async load() {
    this.loadState.set('loading');
    try {
      const data = await this.api.users({ keyword: this.keyword(), role: 'VENDOR', vendorStatus: this.vendorStatus(), page: this.page(), pageSize: this.pageSize });
      const p = readPage<Dto>(data, this.pageSize);
      this.items.set(p.items);
      this.total.set(p.total);
      this.totalPages.set(p.totalPages);
      this.loadState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.loadState.set('error');
      this.errorMsg.set(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  protected openDrawer(i: number) {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    this.drawer.show('Vendor — ' + this.mapped(raw).store, VendorDrawerComponent, {
      vendor: this.mapped(raw),
      onApprove: () => this.decide(i, 'approve'),
      onReject: () => this.decide(i, 'reject'),
    });
  }

  protected async decide(i: number, action: 'approve' | 'reject') {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    const m = this.mapped(raw);
    if (!m.id) {
      this.toast.show('Missing vendor id — cannot ' + action);
      return;
    }
    if (action === 'reject' && !confirm(`Reject vendor "${m.store}"? They will be notified.`)) return;
    try {
      if (action === 'approve') await this.api.approveUser(m.id);
      else await this.api.rejectUser(m.id);
      this.toast.show(action === 'approve' ? 'Vendor approved — now selling ✓' : 'Vendor rejected — notified');
      this.drawer.close();
      this.load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show(`${action === 'approve' ? 'Approve' : 'Reject'} failed: ${(e as Error).message || 'error'}`);
    }
  }
}
