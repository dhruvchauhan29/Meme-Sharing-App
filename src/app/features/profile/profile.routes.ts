import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile-page.component').then(m => m.ProfilePageComponent)
  },
  {
    path: 'liked',
    loadComponent: () => import('./liked-page.component').then(m => m.LikedPageComponent)
  },
  {
    path: 'saved',
    loadComponent: () => import('./saved-page.component').then(m => m.SavedPageComponent)
  }
];
