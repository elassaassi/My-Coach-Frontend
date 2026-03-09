import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Auth
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Tabs shell (app principale)
  {
    path: 'tabs',
    loadComponent: () => import('./core/layout/tabs.component').then(m => m.TabsComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'activities',
        loadComponent: () => import('./features/activities/activities.component').then(m => m.ActivitiesComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/create/create.component').then(m => m.CreateComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },

  { path: '', redirectTo: 'tabs', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth/login' }
];