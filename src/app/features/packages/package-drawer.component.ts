import { Component, inject, input } from '@angular/core';
import { DemoPackage } from '../../core/models';
import { DemoDataService } from '../../core/demo-data.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';
import { egp } from '../../core/format';

const STEPS = ['Submitted', 'Priced', 'Confirmed', 'Picked up', 'Delivered'];
const PSTAT: Record<string, [string, string]> = {
  submitted: ['b-grey', 'Submitted'],
  priced: ['b-blue', 'Priced'],
  confirmed: ['b-indigo', 'Confirmed'],
  pickedup: ['b-amber', 'Picked up'],
  delivered: ['b-green', 'Delivered'],
  cancelled: ['b-red', 'Cancelled'],
};

@Component({
  selector: 'app-package-drawer',
  templateUrl: './package-drawer.component.html',
})
export class PackageDrawerComponent {
  pkg = input.required<DemoPackage>();
  index = input.required<number>();
  onAssignCourier = input<() => void>();

  protected demo = inject(DemoDataService);
  private toast = inject(ToastService);
  protected drawer = inject(DrawerService);
  protected egp = egp;
  protected PSTAT = PSTAT;
  protected steps = STEPS;

  protected currentStep() {
    return STEPS.indexOf(PSTAT[this.pkg().status][1]);
  }

  protected async cancel() {
    try {
      await this.demo.cancelPkg(this.index());
      this.toast.show(this.pkg().id + ' cancelled — customer notified');
      this.drawer.close();
    } catch (e) {
      this.toast.show((e as Error).message || 'Cancel failed');
    }
  }
}
