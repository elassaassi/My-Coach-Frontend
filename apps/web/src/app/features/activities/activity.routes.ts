import { Routes } from '@angular/router';

export const ACTIVITY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./activity-list/activity-list.component').then(m => m.ActivityListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./activity-create/activity-create.component').then(m => m.ActivityCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./activity-detail/activity-detail.component').then(m => m.ActivityDetailComponent)
  }
];