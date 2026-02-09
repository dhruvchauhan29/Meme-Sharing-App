import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized - token expired or invalid
        authService.logout();
        router.navigate(['/auth/login'], { 
          queryParams: { returnUrl: router.url }
        });
      } else if (error.status === 403) {
        // Forbidden - user doesn't have permission
        console.error('Access denied: You do not have permission to perform this action');
      }
      
      return throwError(() => error);
    })
  );
};
