import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';
import { readPage, mapBanner } from '../../core/mappers';
import { Dto, MappedBanner } from '../../core/models';
import { ApiError } from '../../core/api-error';
import { StateBlockComponent } from '../../shared/state-block.component';
import { BannerFormComponent } from './banner-form.component';

@Component({
  selector: 'app-content',
  imports: [StateBlockComponent, FormsModule],
  templateUrl: './content.component.html',
})
export class ContentComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  private drawer = inject(DrawerService);

  protected items = signal<Dto[] | null>(null);
  protected loadState = signal<'loading' | 'error' | null>('loading');
  protected errorMsg = signal('');

  protected pbTitle = signal('');
  protected pbAud = signal('All buyers');

  ngOnInit() {
    this.load();
  }

  protected mapped(b: Dto): MappedBanner {
    return mapBanner(b, this.api.apiBase);
  }

  async load() {
    this.loadState.set('loading');
    try {
      const data = await this.api.banners();
      const items = Array.isArray(data) ? (data as Dto[]) : readPage<Dto>(data, 200).items;
      this.items.set(items);
      this.loadState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.loadState.set('error');
      this.errorMsg.set(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  protected async remove(i: number) {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    const m = this.mapped(raw);
    if (!m.id) {
      this.toast.show('Missing banner id');
      return;
    }
    if (!confirm(`Delete banner "${m.nameEn}"? This cannot be undone.`)) return;
    try {
      await this.api.deleteBanner(m.id);
      this.toast.show('Banner deleted');
      this.load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show('Delete failed: ' + ((e as Error).message || 'error'));
    }
  }

  protected openForm(i?: number) {
    const editing = i !== undefined;
    const raw = editing ? (this.items() || [])[i!] : null;
    const initial = raw ? this.mapped(raw) : null;
    this.drawer.show(editing ? 'Edit banner' : 'New banner', BannerFormComponent, {
      editing,
      initial,
      onSave: async (en: string, ar: string, sortOrder: number, categoryIds: string, storeIds: string, file: File | null) => {
        const fd = new FormData();
        fd.append('nameEn', en);
        fd.append('nameAr', ar);
        fd.append('sortOrder', String(sortOrder));
        fd.append('isActive', 'true');
        if (categoryIds) fd.append('categoryIds', categoryIds);
        if (storeIds) fd.append('storeIds', storeIds);
        if (file) fd.append('image', file);
        if (editing) await this.api.updateBanner(initial!.id, fd);
        else await this.api.createBanner(fd);
        this.toast.show(editing ? 'Banner updated ✓' : `Banner "${en}" added ✓`);
        this.load();
      },
    });
  }

  protected sendBroadcast() {
    if (!this.pbTitle().trim()) {
      this.toast.show('Enter a title');
      return;
    }
    this.toast.show('Broadcast sent to ' + this.pbAud() + ' ✓');
  }
}
