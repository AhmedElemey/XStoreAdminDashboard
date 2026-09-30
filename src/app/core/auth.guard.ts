import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  // Keep the page they asked for so login can send them back to it.
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
