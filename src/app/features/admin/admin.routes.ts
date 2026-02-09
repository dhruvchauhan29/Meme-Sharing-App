import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'moderation',
    loadComponent: () => import('./moderation-page.component').then(m => m.ModerationPageComponent)
  }
];
