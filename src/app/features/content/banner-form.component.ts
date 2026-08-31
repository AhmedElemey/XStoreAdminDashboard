import { Component, ElementRef, OnInit, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MappedBanner } from '../../core/models';
import { DrawerService } from '../../core/drawer.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-banner-form',
  imports: [FormsModule],
  templateUrl: './banner-form.component.html',
})
export class BannerFormComponent implements OnInit {
  editing = input(false);
  initial = input<MappedBanner | null>(null);
  onSave = input.required<(en: string, ar: string, file: File | null) => Promise<void>>();

  protected drawer = inject(DrawerService);
  private toast = inject(ToastService);
  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected nameEn = signal('');
  protected nameAr = signal('');
  protected busy = signal(false);

  ngOnInit() {
    const i = this.initial();
    if (i) {
      this.nameEn.set(i.nameEn);
      this.nameAr.set(i.nameAr);
    }
  }

  protected async save() {
    const en = this.nameEn().trim();
    const ar = this.nameAr().trim();
    const file = this.fileInput()?.nativeElement.files?.[0] ?? null;
    if (!en || !ar) {
      this.toast.show('Enter both English and Arabic names');
      return;
    }
    if (!this.editing() && !file) {
      this.toast.show('Pick a banner image');
      return;
    }
    this.busy.set(true);
    try {
      await this.onSave()(en, ar, file);
      this.drawer.close();
    } catch (e) {
      this.toast.show(`${this.editing() ? 'Update' : 'Create'} failed: ${(e as Error).message || 'error'}`);
    } finally {
      this.busy.set(false);
    }
  }
}
