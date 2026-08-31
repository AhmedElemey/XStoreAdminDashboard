import { Injectable, signal } from '@angular/core';

/** Sidebar badge counts that come from a live-loaded view rather than local demo state —
 *  currently just Product Moderation's pending count (GET /api/admin/listings totals),
 *  updated by the moderation view after each load of its Pending tab. */
@Injectable({ providedIn: 'root' })
export class NavBadgesService {
  readonly moderationPending = signal<number | null>(5);
}
