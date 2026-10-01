import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AdminApiService } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';
import { mapCategory } from '../../core/mappers';
import { readPage } from '../../core/mappers';
import { Dto, MappedCategory } from '../../core/models';
import { ApiError } from '../../core/api-error';
import { StateBlockComponent } from '../../shared/state-block.component';
import { ImageService } from '../../core/image.service';
import { CategoryFormComponent } from './category-form.component';

@Component({
  selector: 'app-categories',
  imports: [StateBlockComponent, NgTemplateOutlet],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  private drawer = inject(DrawerService);
  private images = inject(ImageService);

  /** Every category, parents and subcategories alike (flattened from the API's nested
   *  `children`), each subcategory carrying its parent's id in `parentId`. */
  protected items = signal<Dto[] | null>(null);
  private ids = computed(() => new Set((this.items() || []).map((r) => this.mapped(r).id)));
  /** Parents, plus any subcategory whose parent isn't in the list, so nothing is hidden. */
  protected topLevel = computed(() =>
    (this.items() || []).filter((r) => {
      const pid = this.mapped(r).parentId;
      return !pid || !this.ids().has(pid);
    }),
  );
  protected loadState = signal<'loading' | 'error' | null>('loading');
  protected errorMsg = signal('');

  ngOnInit() {
    this.load();
  }

  protected mapped(c: Dto): MappedCategory {
    return mapCategory(c, this.api.apiBase);
  }

  protected catImg(raw: Dto): string | null {
    if (raw['__img']) return raw['__img'];
    return this.images.resolveSync(mapCategory(raw, this.api.apiBase).image);
  }

  protected childrenOf(parent: Dto): Dto[] {
    const id = this.mapped(parent).id;
    return (this.items() || []).filter((r) => this.mapped(r).parentId === id);
  }

  protected subsLabel(parent: Dto): string {
    const n = this.childrenOf(parent).length || this.mapped(parent).subs || 0;
    return n ? `${n} subcategor${n === 1 ? 'y' : 'ies'}` : '—';
  }

  protected onImgError(raw: Dto): void {
    raw['__imgErr'] = true;
    this.items.update((list) => (list ? [...list] : list));
  }

  async load() {
    this.loadState.set('loading');
    try {
      const data = await this.api.categories();
      const items = readPage<Dto>(data, 200).items;
      this.items.set(flattenCategories(items));
      this.loadState.set(null);
      this.resolveImages();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.loadState.set('error');
      this.errorMsg.set(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  private async resolveImages() {
    for (const raw of this.items() || []) {
      const img = mapCategory(raw, this.api.apiBase).image;
      if (img) {
        this.images.resolve(img).then((resolved) => {
          if (resolved !== img) raw['__img'] = resolved;
          this.items.update((list) => (list ? [...list] : list));
        });
      }
    }
  }

  protected async toggle(raw: Dto) {
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

  protected async remove(raw: Dto) {
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

  protected openForm(raw?: Dto) {
    const editing = raw !== undefined;
    const initial = raw ? this.mapped(raw) : null;
    // One level of nesting, matching the mobile app's category picker: only top-level
    // categories can be parents.
    const parentOptions = this.topLevel().map((r) => this.mapped(r)).filter((c) => !initial || c.id !== initial.id);
    this.drawer.show(editing ? 'Edit category' : 'Add category', CategoryFormComponent, {
      editing,
      initial,
      parentOptions,
      onSave: async (en: string, ar: string, active: boolean, parentId: string, file: File | null) => {
        const fd = new FormData();
        fd.append('nameEn', en);
        fd.append('nameAr', ar);
        fd.append('isActive', active ? 'true' : 'false');
        if (parentId) fd.append('parentId', parentId);
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

/** GET /api/categories nests subcategories under each parent's `children` (confirmed by the
 *  mobile app's category picker). Flatten them so each row can be edited on its own, and
 *  stamp `parentId` on children that don't carry it. De-duplicates by id in case the API
 *  also lists a subcategory at the top level. */
function flattenCategories(list: Dto[]): Dto[] {
  const out: Dto[] = [];
  const byId = new Map<string, Dto>();
  const add = (c: Dto, parentId: unknown) => {
    const id = String(c['id'] ?? c['categoryId'] ?? '');
    const row = (id && byId.get(id)) || c;
    if (parentId != null && row['parentId'] == null && row['parentCategoryId'] == null) row['parentId'] = parentId;
    if (row !== c) return;
    if (id) byId.set(id, c);
    out.push(c);
    const kids = c['children'] ?? c['subCategories'] ?? c['subcategories'];
    if (Array.isArray(kids)) kids.forEach((k: Dto | null) => k && typeof k === 'object' && add(k, c['id'] ?? c['categoryId']));
  };
  list.forEach((c) => add(c, null));
  return out;
}
