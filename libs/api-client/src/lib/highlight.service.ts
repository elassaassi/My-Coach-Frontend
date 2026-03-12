import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Comment, Highlight, PublishHighlightRequest } from '@momentum/models';

@Injectable({ providedIn: 'root' })
export class HighlightService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/v1/highlights';

  publish(req: PublishHighlightRequest): Observable<Highlight> {
    return this.http.post<Highlight>(this.BASE, req);
  }

  uploadFile(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(`${this.BASE}/upload`, form).pipe(
      map(res => res.url)
    );
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

  getComments(highlightId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.BASE}/${highlightId}/comments`);
  }

  addComment(highlightId: string, content: string): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.BASE}/${highlightId}/comments`, { content });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  update(id: string, caption: string, sport: string): Observable<void> {
    return this.http.patch<void>(`${this.BASE}/${id}`, { caption, sport });
  }

  archive(id: string, archive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.BASE}/${id}/archive`, { archive });
  }

  getArchived(): Observable<Highlight[]> {
    return this.http.get<Highlight[]>(`${this.BASE}/archived`);
  }
}
