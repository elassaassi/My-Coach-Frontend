import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Highlight, PublishHighlightRequest } from '@momentum/models';

@Injectable({ providedIn: 'root' })
export class HighlightService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/v1/highlights';

  publish(req: PublishHighlightRequest): Observable<Highlight> {
    return this.http.post<Highlight>(this.BASE, req);
  }

  getHighlightOfDay(): Observable<Highlight> {
    return this.http.get<Highlight>(`${this.BASE}/today`);
  }

  getFeed(): Observable<Highlight[]> {
    return this.http.get<Highlight[]>(this.BASE);
  }

  like(id: string, liked: boolean): Observable<void> {
    return this.http.post<void>(`${this.BASE}/${id}/like`, { liked });
  }
}