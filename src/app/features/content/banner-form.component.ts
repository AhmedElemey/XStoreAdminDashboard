import { Component, ElementRef, OnInit, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MappedBanner, Dto } from '../../core/models';
import { AdminApiService } from '../../core/admin-api.service';
import { readPage } from '../../core/mappers';
import { DrawerService } from '../../core/drawer.service';
import { ToastService } from '../../core/toast.service';
import { LookupItem, LookupMultiComponent } from '../../shared/lookup-multi.component';

function splitIds(s: string): string[] {
  return s ? s.split(',').map((x) => x.trim()).filter(Boolean) : [];
}

@Component({
  selector: 'app-banner-form',
  imports: [FormsModule, LookupMultiComponent],
  templateUrl: './banner-form.component.html',
})
export class BannerFormComponent implements OnInit {
  private api = inject(AdminApiService);
  protected drawer = inject(DrawerService);
  private toast = inject(ToastService);
  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  editing = input(false);
  initial = input<MappedBanner | null>(null);
  onSave = input.required<(en: string, ar: string, sortOrder: number, categoryIds: number[], storeIds: number[], file: File | null) => Promise<void>>();

  protected nameEn = signal('');
  protected nameAr = signal('');
  protected sortOrder = signal(1);
  protected categorySel = signal<string[]>([]);
  protected storeSel = signal<string[]>([]);
  protected busy = signal(false);

  ngOnInit() {
    const i = this.initial();
    if (i) {
      this.nameEn.set(i.nameEn);
      this.nameAr.set(i.nameAr);
      this.sortOrder.set(i.sortOrder || 1);
      this.categorySel.set(splitIds(i.categoryIds));
      this.storeSel.set(splitIds(i.storeIds));
    }
  }

  protected categoryLoader = async (search: string): Promise<LookupItem[]> => {
    const data = await this.api.categories();
    const list = Array.isArray(data) ? (data as Dto[]) : readPage<Dto>(data, 200).items;
    const q = search.toLowerCase();
    const exact = list.find((c) => String(c['id'] ?? '') === search);
    if (exact) return [{ id: String(exact['id'] ?? ''), name: String(exact['nameEn'] ?? exact['name'] ?? 'Untitled') }];
    return list
      .filter((c) => !q || String(c['nameEn'] ?? c['name'] ?? '').toLowerCase().includes(q))
      .map((c) => ({ id: String(c['id'] ?? c['categoryId'] ?? c['_id'] ?? ''), name: String(c['nameEn'] ?? c['name'] ?? 'Untitled') }));
  };

  protected storeLoader = async (search: string): Promise<LookupItem[]> => {
    const data = await this.api.storeLookup({ search: search || undefined, isActive: 'true' });
    const list = Array.isArray(data) ? (data as Dto[]) : readPage<Dto>(data, 200).items;
    return list.map((s) => ({ id: String(s['id'] ?? s['Id'] ?? ''), name: String(s['name'] ?? s['Name'] ?? 'Untitled') }));
  };

  protected async save() {
    const en = this.nameEn().trim();
    const ar = this.nameAr().trim();
    const file = this.fileInput()?.nativeElement.files?.[0] ?? null;
    if (!en || !ar) {
      this.toast.show('Enter both English and Arabic names');
      return;
    }
    if (!this.sortOrder() || this.sortOrder() < 1) {
      this.toast.show('Enter a valid sort order');
      return;
    }
    if (!this.editing() && !file) {
      this.toast.show('Pick a banner image');
      return;
    }
    this.busy.set(true);
    try {
      const categoryIds = this.categorySel().map((id) => Number(id)).filter((n) => Number.isInteger(n));
      const storeIds = this.storeSel().map((id) => Number(id)).filter((n) => Number.isInteger(n));
      await this.onSave()(en, ar, this.sortOrder(), categoryIds, storeIds, file);
      this.drawer.close();
    } catch (e) {
      this.toast.show(`${this.editing() ? 'Update' : 'Create'} failed: ${(e as Error).message || 'error'}`);
    } finally {
      this.busy.set(false);
    }
  }
}
