import { Component, computed, inject, signal } from '@angular/core';
import { DemoDataService } from '../../core/demo-data.service';
import { DrawerService } from '../../core/drawer.service';
import { egp } from '../../core/format';
import { AvatarComponent } from '../../shared/avatar.component';
import { KpiCardComponent } from '../../shared/kpi-card.component';
import { ChipTabsComponent } from '../../shared/chip-tabs.component';
import { DeliveryConnectBarComponent } from '../../shared/delivery-connect-bar.component';
import { CourierDrawerComponent } from './courier-drawer.component';
import { AddCourierFormComponent } from './add-courier-form.component';

const TABS = ['All', 'Active', 'Off duty'];

@Component({
  selector: 'app-couriers',
  imports: [AvatarComponent, KpiCardComponent, ChipTabsComponent, DeliveryConnectBarComponent],
  templateUrl: './couriers.component.html',
})
export class CouriersComponent {
  protected demo = inject(DemoDataService);
  private drawer = inject(DrawerService);
  protected egp = egp;
  protected tabs = TABS;
  protected activeTab = signal('All');

  protected held = computed(() => this.demo.couriers().reduce((s, c) => s + c.cash, 0));
  protected today = computed(() => this.demo.couriers().reduce((s, c) => s + c.today, 0));
  protected del30 = computed(() => this.demo.couriers().reduce((s, c) => s + c.delivered30, 0));
  protected fail30 = computed(() => this.demo.couriers().reduce((s, c) => s + c.failed30, 0));
  protected failRate = computed(() => {
    const total = this.del30() + this.fail30();
    return total ? Math.round((this.fail30() / total) * 100) : 0;
  });
  protected activeCount = computed(() => this.demo.couriers().filter((c) => c.status === 'active').length);
  protected cashDueCount = computed(() => this.demo.couriers().filter((c) => this.demo.cashDue(c)).length);

  protected rowHidden(status: string): boolean {
    const tab = this.activeTab();
    if (tab === 'All') return false;
    if (tab === 'Off duty') return status !== 'off';
    return status !== 'active';
  }

  protected openDrawer(i: number) {
    const c = this.demo.couriers()[i];
    this.drawer.show('Courier — ' + c.n, CourierDrawerComponent, { courier: c, index: i });
  }

  protected openAddCourier() {
    this.drawer.show('Add courier (owner-created account)', AddCourierFormComponent, {});
  }
}
