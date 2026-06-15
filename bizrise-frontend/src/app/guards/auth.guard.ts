import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn) {
    return router.parseUrl('/auth/login');
  }
  if (auth.userRole !== 'admin') {
    return router.parseUrl('/');
  }
  return true;
};

export const entrepreneurGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn) {
    return router.parseUrl('/auth/login');
  }
  if (auth.userRole !== 'emprendedor') {
    return router.parseUrl('/');
  }
  return true;
};
