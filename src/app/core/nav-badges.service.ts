import { Injectable, computed, inject, signal } from '@angular/core';
import { AdminApiService } from './admin-api.service';
import { readPage } from './mappers';

/** Sidebar/bell counts of items waiting for the admin. Loaded once when the shell opens
 *  (`refresh()`), then kept current by each view after it loads its Pending tab. null means
 *  "nothing pending" or "unknown" — never a placeholder number. */
@Injectable({ providedIn: 'root' })
export class NavBadgesService {
  private api = inject(AdminApiService);

  readonly moderationPending = signal<number | null>(null);
  readonly paymentsPending = signal<number | null>(null);
  readonly anyPending = computed(() => (this.moderationPending() ?? 0) + (this.paymentsPending() ?? 0) > 0);

  refresh() {
    this.api
      .listings({ status: 'PENDING', page: 1, pageSize: 1 })
      .then((d) => this.moderationPending.set(countOrNull(d)))
      .catch(() => this.moderationPending.set(null));
    // PROPOSED endpoint — until the backend ships it this fails and the badge stays hidden.
    this.api
      .commissionPayments({ status: 'Pending', page: 1, pageSize: 1 })
      .then((d) => this.paymentsPending.set(countOrNull(d)))
      .catch(() => this.paymentsPending.set(null));
  }
}

function countOrNull(data: unknown): number | null {
  const total = readPage(data, 1).total;
  return total > 0 ? total : null;
}
