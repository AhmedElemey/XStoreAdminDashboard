import { Injectable, signal } from '@angular/core';

/** Sidebar badge counts that come from a live-loaded view rather than local demo state,
 *  updated by each view after each load of its Pending tab. */
@Injectable({ providedIn: 'root' })
export class NavBadgesService {
  readonly moderationPending = signal<number | null>(5);
  readonly vendorsPending = signal<number | null>(null);
}
