import { Component, computed, inject, signal } from '@angular/core';
import { DemoDataService } from '../../core/demo-data.service';
import { DrawerService } from '../../core/drawer.service';
import { egp } from '../../core/format';
import { AvatarComponent } from '../../shared/avatar.component';
import { KpiCardComponent } from '../../shared/kpi-card.component';
import { ChipTabsComponent } from '../../shared/chip-tabs.component';
import { OrderDrawerComponent } from './order-drawer.component';
import { AssignCourierDrawerComponent } from './assign-courier-drawer.component';

const TABS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const OSTAT: Record<string, [string, string]> = {
  pending: ['b-grey', 'Pending'],
  confirmed: ['b-blue', 'Confirmed'],
  processing: ['b-indigo', 'Processing'],
  shipped: ['b-amber', 'Shipped'],
  delivered: ['b-green', 'Delivered'],
  cancelled: ['b-red', 'Cancelled'],
};

@Component({
  selector: 'app-orders',
  imports: [AvatarComponent, KpiCardComponent, ChipTabsComponent],
  templateUrl: './orders.component.html',
})
export class OrdersComponent {
  protected demo = inject(DemoDataService);
  private drawer = inject(DrawerService);
  protected egp = egp;
  protected OSTAT = OSTAT;
  protected tabs = TABS;
  protected activeTab = signal('All');

  /** Rows are never removed from the DOM when filtering by tab — only hidden — so that
   *  row indices stay stable for the click handlers below (mirrors the legacy onChip()
   *  behaviour, which toggled display:none rather than re-rendering the table). */
  protected rowHidden(status: string): boolean {
    const tab = this.activeTab();
    return tab !== 'All' && status !== tab.toLowerCase();
  }

  protected orderTotal(items: [string, number, number][]) {
    return items.reduce((s, it) => s + it[1] * it[2], 0);
  }

  protected openOrder(idx: number) {
    const o = this.demo.orders()[idx];
    this.drawer.show('Order ' + o.id, OrderDrawerComponent, {
      order: o,
      onAssignCourier: () => this.openAssign(idx),
    });
  }

  protected openAssign(idx: number) {
    const o = this.demo.orders()[idx];
    this.drawer.show('Assign courier — ' + o.id, AssignCourierDrawerComponent, { order: o });
  }
}
