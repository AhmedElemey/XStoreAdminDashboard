import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeliveryApiService } from '../core/delivery-api.service';
import { DemoDataService } from '../core/demo-data.service';
import { ToastService } from '../core/toast.service';

/** Connect/disconnect bar for the delivery-backend pilot, shared by the Couriers and
 *  Delivery Requests views — mirrors the legacy deliveryConnectBar() markup. */
@Component({
  selector: 'app-delivery-connect-bar',
  imports: [FormsModule],
  templateUrl: './delivery-connect-bar.component.html',
})
export class DeliveryConnectBarComponent {
  protected deliveryApi = inject(DeliveryApiService);
  private demo = inject(DemoDataService);
  private toast = inject(ToastService);

  protected base = signal(this.deliveryApi.base);
  protected phone = signal('');
  protected busy = signal(false);

  protected async connect() {
    if (!this.phone().trim()) {
      this.toast.show('Enter the admin phone');
      return;
    }
    this.busy.set(true);
    try {
      await this.demo.connectDelivery(this.phone().trim(), this.base().trim() || undefined);
      this.toast.show('Delivery API connected ✓');
    } catch (e) {
      this.toast.show((e as Error).message || 'Connect failed');
    } finally {
      this.busy.set(false);
    }
  }

  protected disconnect() {
    this.demo.disconnectDelivery();
    this.toast.show('Disconnected — showing demo data');
  }
}
