import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Fee Payments / General Settings are owner-only: an "Administrator" (roleName from
 *  GET /api/auth/get-profile) gets bounced to the dashboard even when typing the URL
 *  directly. Awaits the profile so the role is known on a fresh page load too. */
export const limitedAdminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  await auth.ensureProfile();
  // A failed profile fetch means the role is unknown, not confirmed non-limited —
  // fail closed here (unlike nav visibility) so a transient network error can't
  // let a limited admin reach an owner-only route by typing the URL directly.
  if (auth.profileLoadFailed()) return inject(Router).createUrlTree(['/overview']);
  if (!auth.limitedAdmin()) return true;
  return inject(Router).createUrlTree(['/overview']);
};
