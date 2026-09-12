import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { readPage, mapVendor } from '../../core/mappers';
import { Dto, MappedVendor } from '../../core/models';
import { ApiError } from '../../core/api-error';
import { StateBlockComponent } from '../../shared/state-block.component';
import { PagerComponent } from '../../shared/pager.component';
import { AvatarComponent } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';

let searchTimer: ReturnType<typeof setTimeout>;

@Component({
  selector: 'app-vendors',
  imports: [StateBlockComponent, PagerComponent, AvatarComponent, IconComponent],
  templateUrl: './vendors.component.html',
})
export class VendorsComponent implements OnInit {
  private api = inject(AdminApiService);
  private router = inject(Router);

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
      const data = await this.api.vendors({ keyword: this.keyword(), page: this.page(), pageSize: this.pageSize });
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

  protected openVendor(i: number) {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    const m = this.mapped(raw);
    this.router.navigate(['/vendors', m.id]);
  }
}
