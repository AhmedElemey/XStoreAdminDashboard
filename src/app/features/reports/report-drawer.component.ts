import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DrawerService } from '../../core/drawer.service';
import { MappedVendorReport } from '../../core/models';
import { reasonLabel } from './reports.component';

@Component({
  selector: 'app-report-drawer',
  imports: [RouterLink],
  templateUrl: './report-drawer.component.html',
})
export class ReportDrawerComponent {
  private drawer = inject(DrawerService);
  report = input.required<MappedVendorReport>();
  protected reasonLabel = reasonLabel;

  /** Navigating away via one of the vendor/customer/order links must close this drawer —
   *  it has no route of its own to react to, so the overlay would otherwise stay open on
   *  top of whatever page routerLink navigates to. */
  protected closeDrawer() {
    this.drawer.close();
  }
}
