import { Component, input, signal, inject, effect } from '@angular/core';
import { ImageService } from '../../core/image.service';
import { MappedListing } from '../../core/models';
import { egp } from '../../core/format';

@Component({
  selector: 'app-product-drawer',
  templateUrl: './product-drawer.component.html',
})
export class ProductDrawerComponent {
  private images = inject(ImageService);
  listing = input.required<MappedListing>();
  status = input<string>('PENDING');
  onApprove = input<() => void>();
  onReject = input<() => void>();
  onToggleHot = input<() => void>();
  protected egp = egp;
  protected img = signal<string | null>(null);

  constructor() {
    effect(() => {
      const img = this.listing().image;
      this.img.set(img ? this.images.resolveSync(img) : null);
    });
  }

  protected formatDate(v: string): string {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
