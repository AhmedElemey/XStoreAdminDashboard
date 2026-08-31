import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminApiService } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';
import { mapCategory } from '../../core/mappers';
import { readPage } from '../../core/mappers';
import { Dto, MappedCategory } from '../../core/models';
import { ApiError } from '../../core/api-error';
import { StateBlockComponent } from '../../shared/state-block.component';
import { CategoryFormComponent } from './category-form.component';

@Component({
  selector: 'app-categories',
  imports: [StateBlockComponent],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  private drawer = inject(DrawerService);

  protected items = signal<Dto[] | null>(null);
  protected loadState = signal<'loading' | 'error' | null>('loading');
  protected errorMsg = signal('');

  ngOnInit() {
    this.load();
  }

  protected mapped(c: Dto): MappedCategory {
    return mapCategory(c, this.api.apiBase);
  }

  async load() {
    this.loadState.set('loading');
    try {
      const data = await this.api.categories();
      const items = Array.isArray(data) ? (data as Dto[]) : readPage<Dto>(data, 200).items;
      this.items.set(items);
      this.loadState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.loadState.set('error');
      this.errorMsg.set(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  protected async toggle(i: number) {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    const m = this.mapped(raw);
    if (!m.id) {
      this.toast.show('Missing category id');
      return;
    }
    const next = !m.active;
    try {
      await this.api.setCategoryStatus(m.id, next);
      raw['isActive'] = next;
      this.items.update((list) => (list ? [...list] : list));
      this.toast.show(`"${m.nameEn}" ${next ? 'visible' : 'hidden'}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show('Status update failed: ' + ((e as Error).message || 'error'));
    }
  }

  protected async remove(i: number) {
    const raw = (this.items() || [])[i];
    if (!raw) return;
    const m = this.mapped(raw);
    if (!m.id) {
      this.toast.show('Missing category id');
      return;
    }
    if (!confirm(`Delete category "${m.nameEn}"? This cannot be undone.`)) return;
    try {
      await this.api.deleteCategory(m.id);
      this.toast.show(`Category "${m.nameEn}" deleted`);
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
    this.drawer.show(editing ? 'Edit category' : 'Add category', CategoryFormComponent, {
      editing,
      initial,
      onSave: async (en: string, ar: string, active: boolean, file: File | null) => {
        const fd = new FormData();
        fd.append('nameEn', en);
        fd.append('nameAr', ar);
        fd.append('isActive', active ? 'true' : 'false');
        if (file) fd.append('image', file);
        if (editing) {
          fd.append('id', initial!.id);
          await this.api.updateCategory(fd);
        } else {
          await this.api.createCategory(fd);
        }
        this.toast.show(editing ? 'Category updated ✓' : `Category "${en}" added ✓`);
        this.load();
      },
    });
  }
}
