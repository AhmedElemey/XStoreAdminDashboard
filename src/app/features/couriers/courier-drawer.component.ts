import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../../shared/avatar.component';
import { DemoCourier } from '../../core/models';
import { DemoDataService } from '../../core/demo-data.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';
import { egp } from '../../core/format';

@Component({
  selector: 'app-courier-drawer',
  imports: [AvatarComponent, FormsModule],
  templateUrl: './courier-drawer.component.html',
})
export class CourierDrawerComponent implements OnInit {
  courier = input.required<DemoCourier>();
  index = input.required<number>();

  protected demo = inject(DemoDataService);
  private toast = inject(ToastService);
  protected drawer = inject(DrawerService);
  protected egp = egp;
  protected amount = signal(0);
  protected busy = signal(false);

  ngOnInit() {
    this.amount.set(this.courier().cash);
  }

  protected due() {
    return this.demo.cashDue(this.courier());
  }

  protected async handover() {
    if (!this.amount() || this.amount() <= 0) {
      this.toast.show('Enter a valid amount');
      return;
    }
    this.busy.set(true);
    try {
      await this.demo.recordHandover(this.index(), this.amount());
      const c = this.demo.couriers()[this.index()];
      this.toast.show(!c || c.cash === 0 ? 'Handover recorded — courier settled ✓' : 'Handover recorded — ' + egp(c.cash) + ' still with courier');
      this.drawer.close();
    } catch (e) {
      this.toast.show((e as Error).message || 'Handover failed');
    } finally {
      this.busy.set(false);
    }
  }

  protected async toggleDuty() {
    try {
      await this.demo.courierDuty(this.index());
      const c = this.demo.couriers()[this.index()];
      this.toast.show(c ? c.n + (c.status === 'active' ? ' is on duty ✓' : ' set off duty') : 'Updated');
      this.drawer.close();
    } catch (e) {
      this.toast.show((e as Error).message || 'Update failed');
    }
  }
}
