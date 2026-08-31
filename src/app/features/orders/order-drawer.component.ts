import { Component, inject, input } from '@angular/core';
import { DemoOrder } from '../../core/models';
import { DemoDataService } from '../../core/demo-data.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';
import { egp } from '../../core/format';

const STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
const OSTAT: Record<string, [string, string]> = {
  pending: ['b-grey', 'Pending'],
  confirmed: ['b-blue', 'Confirmed'],
  processing: ['b-indigo', 'Processing'],
  shipped: ['b-amber', 'Shipped'],
  delivered: ['b-green', 'Delivered'],
  cancelled: ['b-red', 'Cancelled'],
};

@Component({
  selector: 'app-order-drawer',
  templateUrl: './order-drawer.component.html',
})
export class OrderDrawerComponent {
  order = input.required<DemoOrder>();
  onAssignCourier = input<() => void>();

  protected demo = inject(DemoDataService);
  private toast = inject(ToastService);
  protected drawer = inject(DrawerService);
  protected egp = egp;
  protected OSTAT = OSTAT;
  protected steps = STEPS;

  protected total() {
    return this.demo.orderTotal(this.order());
  }
  protected currentStep() {
    return STEPS.indexOf(OSTAT[this.order().status][1]);
  }
  protected assignable() {
    return this.demo.courierAssignable(this.order());
  }
  protected canCancel() {
    return ['pending', 'confirmed', 'processing'].includes(this.order().status);
  }

  protected contactVendor() {
    this.toast.show('Message sent to vendor');
    this.drawer.close();
  }
  protected cancelOrder() {
    this.toast.show('Order cancelled');
    this.drawer.close();
  }
}
