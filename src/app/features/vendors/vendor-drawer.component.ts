import { Component, inject, input } from '@angular/core';
import { AvatarComponent } from '../../shared/avatar.component';
import { MappedVendor } from '../../core/models';
import { DrawerService } from '../../core/drawer.service';

@Component({
  selector: 'app-vendor-drawer',
  imports: [AvatarComponent],
  templateUrl: './vendor-drawer.component.html',
})
export class VendorDrawerComponent {
  vendor = input.required<MappedVendor>();
  onApprove = input<() => void>();
  onReject = input<() => void>();
  protected drawer = inject(DrawerService);
}
