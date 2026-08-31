import { Component, inject, input } from '@angular/core';
import { AvatarComponent } from '../../shared/avatar.component';
import { DemoOrder } from '../../core/models';
import { DemoDataService } from '../../core/demo-data.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';
import { egp } from '../../core/format';

@Component({
  selector: 'app-assign-courier-drawer',
  imports: [AvatarComponent],
  templateUrl: './assign-courier-drawer.component.html',
})
export class AssignCourierDrawerComponent {
  order = input.required<DemoOrder>();
  protected demo = inject(DemoDataService);
  private toast = inject(ToastService);
  protected drawer = inject(DrawerService);
  protected egp = egp;

  protected total() {
    return this.demo.orderTotal(this.order());
  }

  protected assign(ci: number) {
    const courier = this.demo.couriers()[ci];
    // Find the order's index in the live list (order() is a snapshot passed at drawer-open time).
    const idx = this.demo.orders().indexOf(this.order());
    if (idx === -1) return;
    this.demo.assignOrderCourier(idx, ci);
    this.toast.show('Order assigned to ' + courier.n + ' ✓');
    this.drawer.close();
  }
}
