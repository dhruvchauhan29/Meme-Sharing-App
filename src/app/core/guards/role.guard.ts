import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data['role'] as string;
  
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const user = authService.getCurrentUser();
  
  if (user && user.role === requiredRole) {
    return true;
  }

  // User doesn't have required role, redirect to feed
  console.error('Access denied: insufficient permissions');
  return router.createUrlTree(['/feed']);
};
