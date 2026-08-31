import { Component, input } from '@angular/core';
import { MappedListing } from '../../core/models';
import { egp } from '../../core/format';

@Component({
  selector: 'app-product-drawer',
  templateUrl: './product-drawer.component.html',
})
export class ProductDrawerComponent {
  listing = input.required<MappedListing>();
  onApprove = input<() => void>();
  onReject = input<() => void>();
  onToggleHot = input<() => void>();
  protected egp = egp;
}
