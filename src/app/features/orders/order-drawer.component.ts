import { Component, OnInit, inject, input, signal } from '@angular/core';
import { AdminApiService } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';
import { ApiError } from '../../core/api-error';
import { Dto } from '../../core/models';
import { MappedOrder, ORDER_STATUS, mapOrder } from '../../core/mappers';
import { egp } from '../../core/format';

const STEP_KEYS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

@Component({
  selector: 'app-order-drawer',
  templateUrl: './order-drawer.component.html',
})
export class OrderDrawerComponent implements OnInit {
  orderId = input.required<string>();
  /** row-level summary so the drawer has something to show while the full detail loads */
  summary = input.required<MappedOrder>();
  onCancelled = input<() => void>();

  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  protected drawer = inject(DrawerService);
  protected egp = egp;
  protected steps = STEP_KEYS;
  protected busy = signal(false);
  protected order = signal<MappedOrder | null>(null);

  ngOnInit() {
    this.order.set(this.summary());
    this.load();
  }

  private async load() {
    try {
      const data = await this.api.order(this.orderId());
      this.order.set(mapOrder(data as Dto));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      // keep showing the row summary — the detail endpoint may be unavailable
    }
  }

  protected currentStep() {
    const o = this.order();
    return o ? STEP_KEYS.indexOf(o.statusKey) : -1;
  }
  protected canCancel() {
    const o = this.order();
    return !!o && ['pending', 'confirmed', 'processing'].includes(o.statusKey);
  }

  protected async cancel() {
    const o = this.order();
    if (!o) return;
    const reason = prompt('Reason for cancelling this order?', 'Cancelled by administrator');
    if (reason === null) return;
    this.busy.set(true);
    try {
      await this.api.cancelOrder(o.id, reason);
      this.toast.show('Order cancelled');
      this.drawer.close();
      this.onCancelled()?.();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show('Cancel failed: ' + ((e as Error).message || 'error'));
    } finally {
      this.busy.set(false);
    }
  }

  protected label(key: string) {
    return ORDER_STATUS.find((s) => s[0] === key)?.[1] ?? key;
  }
}
