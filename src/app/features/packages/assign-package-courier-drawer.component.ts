import { Component, inject, input } from '@angular/core';
import { AvatarComponent } from '../../shared/avatar.component';
import { DemoPackage } from '../../core/models';
import { DemoDataService } from '../../core/demo-data.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';
import { egp } from '../../core/format';

@Component({
  selector: 'app-assign-package-courier-drawer',
  imports: [AvatarComponent],
  templateUrl: './assign-package-courier-drawer.component.html',
})
export class AssignPackageCourierDrawerComponent {
  pkg = input.required<DemoPackage>();
  index = input.required<number>();

  protected demo = inject(DemoDataService);
  private toast = inject(ToastService);
  protected drawer = inject(DrawerService);
  protected egp = egp;

  protected async assign(ci: number) {
    const courier = this.demo.couriers()[ci];
    try {
      await this.demo.assignPkgCourier(this.index(), ci);
      this.toast.show(this.pkg().id + ' assigned to ' + courier.n + ' ✓');
      this.drawer.close();
    } catch (e) {
      this.toast.show((e as Error).message || 'Assign failed');
    }
  }
}
