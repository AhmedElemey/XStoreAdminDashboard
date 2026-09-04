import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminApiService } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';
import { NavBadgesService } from '../../core/nav-badges.service';
import { ImageService } from '../../core/image.service';
import { readPage } from '../../core/mappers';
import { mapListing } from '../../core/mappers';
import { Dto, MappedListing } from '../../core/models';
import { egp } from '../../core/format';
import { ApiError } from '../../core/api-error';
import { StateBlockComponent } from '../../shared/state-block.component';
import { PagerComponent } from '../../shared/pager.component';
import { ChipTabsComponent } from '../../shared/chip-tabs.component';
import { IconComponent } from '../../shared/icon.component';
import { ProductDrawerComponent } from './product-drawer.component';

const STATUS_TABS: [string, string][] = [
  ['Pending', 'PENDING'],
  ['Approved', 'ACTIVE'],
  ['Rejected', 'REJECTED'],
];

let searchTimer: ReturnType<typeof setTimeout>;

@Component({
  selector: 'app-moderation',
  imports: [StateBlockComponent, PagerComponent, ChipTabsComponent, IconComponent],
  templateUrl: './moderation.component.html',
})
export class ModerationComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  private drawer = inject(DrawerService);
  private badges = inject(NavBadgesService);
  private images = inject(ImageService);

  protected egp = egp;

  protected formatDate(v: string): string {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  protected tabLabels = STATUS_TABS.map((t) => t[0]);
  protected status = signal('PENDING');
  protected name = signal('');
  protected page = signal(1);
  protected pageSize = 20;
  protected total = signal(0);
  protected totalPages = signal(1);
  protected items = signal<Dto[] | null>(null);
  protected loadState = signal<'loading' | 'error' | null>('loading');
  protected errorMsg = signal('');
  protected rejectOpen = signal(false);
  protected rejectReason = signal('');
  protected rejectIndex = signal(-1);
  protected rejectTitle = signal('');

  ngOnInit() {
    this.load();
  }

  protected onSearch(v: string) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      this.name.set(v.trim());
      this.page.set(1);
      this.load();
    }, 350);
  }

  protected activeLabel() {
    return STATUS_TABS.find((t) => t[1] === this.status())?.[0] ?? 'Pending';
  }

  protected selectTab(label: string) {
    const t = STATUS_TABS.find((x) => x[0] === label);
    this.status.set(t ? t[1] : 'PENDING');
    this.page.set(1);
    this.load();
  }

  protected gotoPage(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.page.set(p);
    this.load();
  }

  protected mapped(p: Dto): MappedListing {
    return mapListing(p, this.api.apiBase);
  }

  protected thumb(p: Dto): string | null {
    return this.images.resolveSync(this.mapped(p).image);
  }

  async load() {
    this.loadState.set('loading');
    try {
      const data = await this.api.listings({ status: this.status(), name: this.name(), page: this.page(), pageSize: this.pageSize });
      const p = readPage<Dto>(data, this.pageSize);
      this.items.set(p.items);
      this.total.set(p.total);
      this.totalPages.set(p.totalPages);
      this.loadState.set(null);
      if (this.status() === 'PENDING') this.badges.moderationPending.set(p.total > 0 ? p.total : null);
      this.resolveThumbs();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.loadState.set('error');
      this.errorMsg.set(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  private async resolveThumbs() {
    for (const raw of this.items() || []) {
      const m = mapListing(raw, this.api.apiBase);
      if (m.image) {
        this.images.resolve(m.image).then((resolved) => {
          if (resolved !== m.image) raw['__thumb'] = resolved;
          this.items.update((list) => (list ? [...list] : list));
        });
      }
    }
  }

  protected openDrawer(i: number) {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    this.drawer.show('Review product', ProductDrawerComponent, {
      listing: this.mapped(raw),
      status: this.status(),
      onApprove: () => this.decide(i, 'approve'),
      onReject: () => this.decide(i, 'reject'),
      onToggleHot: () => this.toggleHot(i),
    });
  }

  protected async decide(i: number, action: 'approve' | 'reject') {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    const m = this.mapped(raw);
    if (!m.id) {
      this.toast.show('Missing listing id');
      return;
    }
    if (action === 'reject') {
      this.rejectIndex.set(i);
      this.rejectTitle.set(m.title);
      this.rejectReason.set('');
      this.rejectOpen.set(true);
      return;
    }
    try {
      await this.api.approveListing(m.id);
      this.toast.show('Product approved — now live ✓');
      this.drawer.close();
      this.load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show(`Approve failed: ${(e as Error).message || 'error'}`);
    }
  }

  protected async confirmReject() {
    const i = this.rejectIndex();
    const raw = (this.items() || [])[i];
    if (!raw) { this.rejectOpen.set(false); return; }
    const m = this.mapped(raw);
    this.rejectOpen.set(false);
    try {
      await this.api.rejectListing(m.id, this.rejectReason());
      this.toast.show('Product rejected — vendor notified');
      this.drawer.close();
      this.load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show(`Reject failed: ${(e as Error).message || 'error'}`);
    }
  }

  protected closeReject() {
    this.rejectOpen.set(false);
  }

  protected async toggleHot(i: number) {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    const m = this.mapped(raw);
    if (!m.id) {
      this.toast.show('Missing listing id');
      return;
    }
    try {
      await this.api.toggleHotDeal(m.id, !m.isHot);
      raw['isHotDeal'] = !m.isHot;
      this.items.update((list) => (list ? [...list] : list));
      const updated = this.mapped(raw);
      this.drawer.updateInputs({ listing: updated });
      this.toast.show(m.isHot ? 'Removed hot-deal tag' : 'Marked as hot deal 🔥');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show('Hot-deal toggle failed: ' + ((e as Error).message || 'error'));
    }
  }
}
