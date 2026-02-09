import { Routes } from '@angular/router';
import { authGuard, roleGuard, canDeactivateGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/feed',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'feed',
    loadChildren: () => import('./features/feed/feed.routes').then(m => m.FEED_ROUTES)
  },
  {
    path: 'post/:id',
    loadComponent: () => import('./features/post-detail/post-detail-page.component').then(m => m.PostDetailPageComponent)
  },
  {
    path: 'compose',
    loadComponent: () => import('./features/post-composer/compose-page.component').then(m => m.ComposePageComponent),
    canActivate: [authGuard],
    canDeactivate: [canDeactivateGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./features/post-composer/edit-page.component').then(m => m.EditPageComponent),
    canActivate: [authGuard],
    canDeactivate: [canDeactivateGuard]
  },
  {
    path: 'me',
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: '**',
    redirectTo: '/feed'
  }
];
