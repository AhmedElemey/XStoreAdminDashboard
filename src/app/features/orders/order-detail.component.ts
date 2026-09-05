import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { ApiError } from '../../core/api-error';
import { ToastService } from '../../core/toast.service';
import { Dto } from '../../core/models';
import { MappedOrder, ORDER_STATUS, mapOrder } from '../../core/mappers';
import { egp } from '../../core/format';
import { StateBlockComponent } from '../../shared/state-block.component';

const STEP_KEYS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, StateBlockComponent],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  protected egp = egp;
  protected steps = STEP_KEYS;

  protected order = signal<MappedOrder | null>(null);
  protected orderState = signal<'loading' | 'error' | null>('loading');
  protected busy = signal(false);

  private id = '';

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id') || '';
      this.load();
    });
  }

  private async load() {
    if (!this.id) {
      this.orderState.set('error');
      return;
    }
    this.orderState.set('loading');
    try {
      const data = await this.api.order(this.id);
      this.order.set(mapOrder(data as Dto));
      this.orderState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.orderState.set('error');
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
      await this.load();
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
