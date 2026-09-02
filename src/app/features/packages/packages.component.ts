import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoDataService } from '../../core/demo-data.service';
import { DemoPackage } from '../../core/models';
import { DrawerService } from '../../core/drawer.service';
import { ToastService } from '../../core/toast.service';
import { egp } from '../../core/format';
import { AvatarComponent } from '../../shared/avatar.component';
import { KpiCardComponent } from '../../shared/kpi-card.component';
import { DeliveryConnectBarComponent } from '../../shared/delivery-connect-bar.component';
import { PackageDrawerComponent } from './package-drawer.component';
import { AssignPackageCourierDrawerComponent } from './assign-package-courier-drawer.component';

const PSTAT: Record<string, [string, string]> = {
  submitted: ['b-grey', 'Submitted'],
  priced: ['b-blue', 'Priced'],
  confirmed: ['b-indigo', 'Confirmed'],
  pickedup: ['b-amber', 'Picked up'],
  delivered: ['b-green', 'Delivered'],
  cancelled: ['b-red', 'Cancelled'],
};

@Component({
  selector: 'app-packages',
  imports: [AvatarComponent, KpiCardComponent, DeliveryConnectBarComponent, FormsModule],
  templateUrl: './packages.component.html',
})
export class PackagesComponent {
  protected demo = inject(DemoDataService);
  private drawer = inject(DrawerService);
  private toast = inject(ToastService);
  protected egp = egp;
  protected PSTAT = PSTAT;

  /** index of the priced request currently being re-priced inline — mirrors legacy PKG_EDIT */
  protected editIdx = signal(-1);
  protected priceDraft = signal(0);

  protected need = computed(() => this.demo.packages().filter((p) => p.status === 'submitted').length);
  protected wait = computed(() => this.demo.packages().filter((p) => p.status === 'priced').length);
  protected transit = computed(() => this.demo.packages().filter((p) => p.status === 'confirmed' || p.status === 'pickedup').length);
  protected done = computed(() => this.demo.packages().filter((p) => p.status === 'delivered').length);

  protected startPrice(i: number) {
    const p = this.demo.packages()[i];
    this.editIdx.set(i);
    this.priceDraft.set(p.price ?? this.demo.pkgSuggest(p));
  }
  protected cancelEdit() {
    this.editIdx.set(-1);
  }

  protected priceHint(p: DemoPackage) {
    return `Suggested ${egp(this.demo.pkgSuggest(p))} — 60 base${this.demo.pkgCross(p) ? ' + 20 cross-city' : ''}`;
  }

  protected async savePrice(i: number) {
    const amt = this.priceDraft();
    if (!amt || amt <= 0) {
      this.toast.show('Enter a valid price');
      return;
    }
    const first = this.demo.packages()[i].status === 'submitted';
    try {
      await this.demo.setPkgPrice(i, amt);
      this.editIdx.set(-1);
      const p = this.demo.packages()[i];
      this.toast.show(first ? `${p.id} priced at ${egp(p.price!)} — customer asked to confirm ✓` : `Price updated to ${egp(p.price!)} — customer notified ✓`);
    } catch (e) {
      this.toast.show((e as Error).message || 'Pricing failed');
    }
  }

  protected async cancelPkg(i: number) {
    try {
      await this.demo.cancelPkg(i);
      this.toast.show(this.demo.packages()[i]?.id + ' cancelled — customer notified');
    } catch (e) {
      this.toast.show((e as Error).message || 'Cancel failed');
    }
  }

  protected openDrawer(i: number) {
    const p = this.demo.packages()[i];
    this.drawer.show('Request ' + p.id, PackageDrawerComponent, {
      pkg: p,
      index: i,
      onAssignCourier: () => this.openAssign(i),
    });
  }

  protected openAssign(i: number) {
    const p = this.demo.packages()[i];
    this.drawer.show('Assign courier — ' + p.id, AssignPackageCourierDrawerComponent, { pkg: p, index: i });
  }
}
