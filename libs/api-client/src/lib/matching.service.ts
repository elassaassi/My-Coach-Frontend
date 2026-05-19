import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatchRequest, MatchRequestCommand } from '@momentum/models';

@Injectable({ providedIn: 'root' })
export class MatchingService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/v1/matches';

  requestMatch(cmd: MatchRequestCommand): Observable<MatchRequest> {
    return this.http.post<MatchRequest>(this.BASE, cmd);
  }

  getMyMatches(): Observable<MatchRequest[]> {
    return this.http.get<MatchRequest[]>(`${this.BASE}/me`);
  }

  getById(id: string): Observable<MatchRequest> {
    return this.http.get<MatchRequest>(`${this.BASE}/${id}`);
  }
}