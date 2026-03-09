import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Leaderboard, PlayerStats, RatePlayerRequest } from '@momentum/models';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/v1';

  ratePlayer(req: RatePlayerRequest): Observable<void> {
    return this.http.post<void>(`${this.BASE}/ratings`, req);
  }

  getPlayerStats(userId: string): Observable<PlayerStats> {
    return this.http.get<PlayerStats>(`${this.BASE}/ratings/stats/${userId}`);
  }

  getLeaderboard(sport: string): Observable<Leaderboard> {
    return this.http.get<Leaderboard>(`${this.BASE}/ratings/leaderboard`, {
      params: { sport }
    });
  }
}