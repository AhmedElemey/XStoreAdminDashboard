import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { ApiError } from '../../core/api-error';
import { ToastService } from '../../core/toast.service';
import { Dto, MappedUser } from '../../core/models';
import { readPage, mapUser, mapOrder, MappedOrder } from '../../core/mappers';
import { egp } from '../../core/format';
import { AvatarComponent } from '../../shared/avatar.component';
import { StateBlockComponent } from '../../shared/state-block.component';

@Component({
  selector: 'app-user-detail',
  imports: [RouterLink, AvatarComponent, StateBlockComponent],
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  protected egp = egp;

  protected user = signal<MappedUser | null>(null);
  protected userState = signal<'loading' | 'error' | null>('loading');

  protected readonly ordersPreviewLimit = 5;
  protected orders = signal<MappedOrder[]>([]);
  protected ordersState = signal<'loading' | 'error' | null>('loading');
  protected previewOrders = computed(() => this.orders().slice(0, this.ordersPreviewLimit));

  protected blockOpen = signal(false);
  protected blockReason = signal('');
  protected blockUntil = signal('');
  protected blockBusy = signal(false);

  private id = '';

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id') || '';
      this.loadUser();
      this.loadOrders();
    });
  }

  private async loadUser() {
    if (!this.id) {
      this.userState.set('error');
      return;
    }
    this.userState.set('loading');
    try {
      const data = await this.api.user(this.id);
      this.user.set(mapUser(data as Dto));
      this.userState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.userState.set('error');
    }
  }

  private async loadOrders() {
    if (!this.id) {
      this.ordersState.set('error');
      return;
    }
    this.ordersState.set('loading');
    try {
      const data = await this.api.orders({ userId: this.id, page: 1, pageSize: 200 });
      const p = readPage<Dto>(data, 200);
      this.orders.set(p.items.map(mapOrder));
      this.ordersState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.ordersState.set('error');
    }
  }

  protected openBlock() {
    this.blockReason.set('');
    this.blockUntil.set('');
    this.blockOpen.set(true);
  }

  protected closeBlock() {
    if (this.blockBusy()) return;
    this.blockOpen.set(false);
  }

  protected async confirmBlock() {
    const reason = this.blockReason().trim();
    if (!this.id || !reason) {
      this.toast.show('Please write a reason for blocking this customer');
      return;
    }
    this.blockBusy.set(true);
    try {
      await this.api.blockUser(this.id, reason, this.blockUntil() || undefined);
      this.toast.show(this.blockUntil() ? `Customer blocked until ${this.blockUntil()} ✓` : 'Customer blocked indefinitely ✓');
      this.blockOpen.set(false);
      await this.loadUser();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show('Block failed: ' + ((e as Error).message || 'error'));
    } finally {
      this.blockBusy.set(false);
    }
  }

  protected async unblock() {
    const u = this.user();
    if (!u) return;
    if (!confirm(`Unblock ${u.name}? They will be able to use their account again.`)) return;
    this.blockBusy.set(true);
    try {
      await this.api.unblockUser(u.id);
      this.toast.show('Customer unblocked ✓');
      await this.loadUser();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show('Unblock failed: ' + ((e as Error).message || 'error'));
    } finally {
      this.blockBusy.set(false);
    }
  }
}
