import { Routes } from '@angular/router';
import { unsavedChangesGuard } from './guards/unsaved-changes-guard';

/** Routes for the lazily loaded session feature area. */
export const sessionRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./session-page').then((m) => m.SessionPage),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/create-session/create-session').then((m) => m.CreateSession),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/edit-session/edit-session').then((m) => m.EditSession),
    canDeactivate: [unsavedChangesGuard],
  },
];
