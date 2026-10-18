import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { ApiError } from '../../core/api-error';
import { ImageService } from '../../core/image.service';
import { ToastService } from '../../core/toast.service';
import { Dto, MappedListing } from '../../core/models';
import {
  ListingStatus,
  firstNonEmpty,
  mapListing,
  normalizeListingStatus,
  resolveListingStatus,
  unwrapDetail,
} from '../../core/mappers';
import { egp } from '../../core/format';
import { StateBlockComponent } from '../../shared/state-block.component';
import { FieldTreeComponent } from '../../shared/field-tree.component';
import { formatDateTime } from '../../shared/field-tree.util';

interface Fact {
  label: string;
  value: string;
  mono?: boolean;
  copy?: boolean;
  link?: string[];
}

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, StateBlockComponent, FieldTreeComponent],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AdminApiService);
  private location = inject(Location);
  private images = inject(ImageService);
  private toast = inject(ToastService);
  private titleService = inject(Title);
  protected egp = egp;
  protected apiBase = this.api.apiBase;

  /** Raw backend DTO (envelope unwrapped) — feeds the extras and the "All backend fields" tree. */
  protected raw = signal<Dto | null>(null);
  protected listing = computed<MappedListing | null>(() => {
    const r = this.raw();
    return r ? mapListing(r, this.api.apiBase) : null;
  });
  protected state = signal<'loading' | 'error' | 'notfound' | null>('loading');
  protected errorMsg = signal('');
  protected busy = signal(false);

  protected rejectOpen = signal(false);
  protected rejectReason = signal('');
  protected rejectError = signal('');
  private rejectBtn = viewChild<ElementRef<HTMLButtonElement>>('rejectBtn');
  private rejectTa = viewChild<ElementRef<HTMLTextAreaElement>>('rejectTa');
  private modalCard = viewChild<ElementRef<HTMLElement>>('modalCard');
  private thumbsEl = viewChild<ElementRef<HTMLElement>>('thumbs');

  protected selected = signal(0);
  private resolved = signal<Record<string, string>>({});
  protected failed = signal<Record<number, boolean>>({});

  private id = '';
  private queryStatus = signal('');
  /** Set locally after a successful approve/reject so the badge is right even if the DTO has no status field. */
  private statusOverride = signal<ListingStatus | ''>('');
  private loadSeq = 0;

  /** DTO status field → locally-applied action result → `status` query param → none. */
  protected status = computed<ListingStatus | ''>(() => {
    const fromDto = resolveListingStatus(this.raw(), null);
    return fromDto || this.statusOverride() || normalizeListingStatus(this.queryStatus());
  });
  /** Raw status string to show in a grey badge when it is not one of the known three. */
  protected unknownStatus = computed(() => {
    if (this.status()) return '';
    const r = this.raw() || {};
    return firstNonEmpty(r['status'], r['listingStatus'], r['approvalStatus']);
  });

  protected extras = computed(() => {
    const r = this.raw() || {};
    const title = this.listing()?.title ?? '';
    const titleAr = firstNonEmpty(r['titleAr']);
    return {
      titleAr: titleAr && titleAr !== title ? titleAr : '',
      descAr: firstNonEmpty(r['descriptionAr']),
      vendorId: firstNonEmpty(
        r['vendorId'],
        r['userId'],
        r['vendor']?.id,
        r['sellerId'],
        r['storeId'],
      ),
    };
  });

  protected discount = computed(() => {
    const p = this.listing();
    if (!p || p.price == null || !p.compareAt || p.compareAt <= p.price) return 0;
    return Math.round((1 - p.price / p.compareAt) * 100);
  });

  protected facts = computed<Fact[]>(() => {
    const p = this.listing();
    const r = this.raw();
    if (!p || !r) return [];
    const x = this.extras();
    const sub = firstNonEmpty(
      r['subCategoryName'],
      r['subCategoryNameEn'],
      r['subcategoryName'],
      r['subCategory'],
    );
    const date = (...v: unknown[]) => {
      const s = firstNonEmpty(...v);
      return s ? formatDateTime(s) : '';
    };
    const out: Fact[] = [
      { label: 'Vendor', value: p.vendor, link: x.vendorId ? ['/vendors', x.vendorId] : undefined },
      { label: 'Category', value: sub ? `${p.category} › ${sub}` : p.category },
      { label: 'Brand', value: p.brand },
      { label: 'Condition', value: p.condition },
      { label: 'Location', value: p.location },
    ];
    const optional: Fact[] = [
      { label: 'Created', value: date(r['createdAt'], r['submittedAt']) },
      { label: 'Updated', value: date(r['updatedAt'], r['modifiedAt'], r['lastModifiedAt']) },
      { label: 'Approved', value: date(r['approvedAt'], r['approvedOn'], r['reviewedAt']) },
      { label: 'Listing ID', value: p.id, mono: true, copy: true },
      { label: 'Vendor ID', value: x.vendorId, mono: true },
      { label: 'Category ID', value: firstNonEmpty(r['categoryId']), mono: true },
    ];
    return [...out, ...optional.filter((f) => f.value)];
  });

  /** Gallery URLs: the resolved (blob) URL once available, else the absolute URL. */
  protected gallery = computed(() => {
    const p = this.listing();
    const map = this.resolved();
    return (p?.images ?? []).filter(Boolean).map((u) => ({ href: u, src: map[u] || u }));
  });

  protected canGoBack =
    typeof history !== 'undefined' && history.length > 1 && this.sameOriginReferrer();

  constructor() {
    effect(() => {
      for (const u of this.listing()?.images ?? []) {
        if (!u || this.resolved()[u]) continue;
        this.images.resolve(u).then((r) => {
          if (r && r !== u) this.resolved.update((m) => ({ ...m, [u]: r }));
        });
      }
    });
    effect(() => {
      const t = this.listing()?.title;
      if (t) this.titleService.setTitle(`${t} · Product — xStore Admin`);
    });
    effect(() => {
      if (this.rejectOpen()) setTimeout(() => this.rejectTa()?.nativeElement.focus());
    });
  }

  ngOnInit() {
    this.route.queryParamMap.subscribe((q) => this.queryStatus.set(q.get('status') || ''));
    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id') || '';
      this.statusOverride.set('');
      this.selected.set(0);
      this.load(true);
    });
  }

  private sameOriginReferrer(): boolean {
    try {
      return !!document.referrer && new URL(document.referrer).origin === window.location.origin;
    } catch {
      return false;
    }
  }

  protected retry() {
    this.load(true);
  }

  /** `initial` shows the loading state; reloads after an action keep the current content. */
  private async load(initial: boolean) {
    if (!this.id) {
      this.state.set('notfound');
      return;
    }
    const seq = ++this.loadSeq;
    if (initial) this.state.set('loading');
    try {
      const data = await this.api.listing(this.id);
      if (seq !== this.loadSeq) return;
      const dto = unwrapDetail(data);
      if (!dto || !Object.keys(dto).length) {
        if (initial) this.state.set('notfound');
        return;
      }
      this.raw.set(dto);
      this.failed.set({});
      this.state.set(null);
    } catch (e) {
      if (seq !== this.loadSeq) return;
      if (e instanceof ApiError && e.status === 401) return;
      if (!initial) {
        this.toast.show(`Couldn't refresh: ${(e as Error).message || 'error'}`);
        return;
      }
      if (e instanceof ApiError && e.status === 404) {
        this.state.set('notfound');
        return;
      }
      this.errorMsg.set(e instanceof Error ? e.message : 'Something went wrong.');
      this.state.set('error');
    }
  }

  // ---- navigation ----
  protected onBack(e: Event) {
    if (this.canGoBack) {
      e.preventDefault();
      this.location.back();
    }
  }

  // ---- gallery ----
  protected select(i: number) {
    const n = this.gallery().length;
    if (!n) return;
    this.selected.set(((i % n) + n) % n);
  }

  protected onThumbKey(e: KeyboardEvent) {
    const n = this.gallery().length;
    let next: number;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = this.selected() + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = this.selected() - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else return;
    e.preventDefault();
    this.select(next);
    setTimeout(() =>
      this.thumbsEl()
        ?.nativeElement.querySelectorAll<HTMLElement>('button')
        [this.selected()]?.focus(),
    );
  }

  protected markFailed(i: number) {
    this.failed.update((f) => ({ ...f, [i]: true }));
  }

  protected copy(text: string) {
    if (!navigator.clipboard) {
      this.toast.show('Copy failed — select the ID text instead');
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => this.toast.show('Copied'),
      () => this.toast.show('Copy failed'),
    );
  }

  // ---- admin actions (mirror moderation) ----
  private guardId(): boolean {
    const id = this.listing()?.id || this.id;
    if (!id) this.toast.show('Missing listing id');
    return !!id;
  }

  protected async approve() {
    if (this.busy() || !this.guardId()) return;
    this.busy.set(true);
    try {
      await this.api.approveListing(this.listing()?.id || this.id);
      this.statusOverride.set('ACTIVE');
      this.toast.show('Product approved — now live ✓');
      await this.load(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show(`Approve failed: ${(e as Error).message || 'error'}`);
    } finally {
      this.busy.set(false);
    }
  }

  protected openReject() {
    if (this.busy() || !this.guardId()) return;
    this.rejectReason.set('');
    this.rejectError.set('');
    this.rejectOpen.set(true);
  }

  protected closeReject() {
    this.rejectOpen.set(false);
    this.rejectError.set('');
    setTimeout(() => this.rejectBtn()?.nativeElement.focus());
  }

  protected onRejectInput(v: string) {
    this.rejectReason.set(v);
    if (v.trim()) this.rejectError.set('');
  }

  protected async confirmReject() {
    const reason = this.rejectReason().trim();
    if (!reason) {
      this.rejectError.set('Rejection reason is required.');
      return;
    }
    if (this.busy()) return;
    this.busy.set(true);
    this.rejectOpen.set(false);
    try {
      await this.api.rejectListing(this.listing()?.id || this.id, reason);
      this.statusOverride.set('REJECTED');
      this.toast.show('Product rejected — vendor notified');
      await this.load(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show(`Reject failed: ${(e as Error).message || 'error'}`);
    } finally {
      this.busy.set(false);
    }
  }

  protected async toggleHot() {
    const p = this.listing();
    if (!p || this.busy() || !this.guardId()) return;
    this.busy.set(true);
    try {
      await this.api.toggleHotDeal(p.id || this.id, !p.isHot);
      this.toast.show(p.isHot ? 'Removed hot-deal tag' : 'Marked as hot deal 🔥');
      await this.load(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show('Hot-deal toggle failed: ' + ((e as Error).message || 'error'));
    } finally {
      this.busy.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape() {
    if (this.rejectOpen()) this.closeReject();
  }

  /** Keeps Tab inside the reject dialog. */
  protected trapTab(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const nodes = this.modalCard()?.nativeElement.querySelectorAll<HTMLElement>(
      'textarea, button:not([disabled])',
    );
    if (!nodes?.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
