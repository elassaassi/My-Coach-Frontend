import { Routes } from '@angular/router';

export const RATING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
  },
  {
    path: 'stats/:userId',
    loadComponent: () => import('./player-stats/player-stats.component').then(m => m.PlayerStatsComponent)
  }
];