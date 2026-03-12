import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Auth (public) ──────────────────────────────────────────────────────
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // ── App shell (protégé) ────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./core/layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'activities',
        loadChildren: () => import('./features/activities/activity.routes').then(m => m.ACTIVITY_ROUTES)
      },
      {
        path: 'matching',
        loadComponent: () => import('./features/matching/matching.component').then(m => m.MatchingComponent)
      },
      {
        path: 'rating',
        loadChildren: () => import('./features/rating/rating.routes').then(m => m.RATING_ROUTES)
      },
      {
        path: 'coaching',
        loadComponent: () => import('./features/coaching/coaching.component').then(m => m.CoachingComponent)
      },
      {
        path: 'highlights',
        loadComponent: () => import('./features/highlights/highlights.component').then(m => m.HighlightsComponent)
      },
      {
        path: 'scouting',
        loadComponent: () => import('./features/scouting/scouting.component').then(m => m.ScoutingComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'profile/:id',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/messaging/messaging.component').then(m => m.MessagingComponent)
      },
    ]
  },

  { path: '**', redirectTo: 'auth/login' }
];