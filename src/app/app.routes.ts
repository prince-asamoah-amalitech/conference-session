import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'sessions', pathMatch: 'full' },
  {
    path: 'sessions',
    loadChildren: () => import('./session-page/session.routes').then((m) => m.sessionRoutes),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./session-page/components/page-not-found/page-not-found').then((m) => m.PageNotFound),
  },
];
