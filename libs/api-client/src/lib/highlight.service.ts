import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Comment, Highlight, PublishHighlightRequest } from '@momentum/models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class HighlightService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/v1/highlights';

  publish(req: PublishHighlightRequest): Observable<{ id: string }> {
    return this.http
      .post<ApiResponse<{ id: string }>>(this.BASE, req)
      .pipe(map(r => r.data));
  }

  uploadFile(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    return this.http
      .post<ApiResponse<{ url: string }>>(`${this.BASE}/upload`, form)
      .pipe(map(r => r.data.url));
  }

  getHighlightOfDay(): Observable<Highlight | null> {
    return this.http
      .get<ApiResponse<Highlight | null>>(`${this.BASE}/today`)
      .pipe(map(r => r.data));
  }

  getFeed(): Observable<Highlight[]> {
    return this.http
      .get<ApiResponse<Highlight[]>>(this.BASE)
      .pipe(map(r => r.data ?? []));
  }

  like(id: string, liked: boolean): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.BASE}/${id}/like`, { liked })
      .pipe(map(() => void 0));
  }

  getComments(highlightId: string): Observable<Comment[]> {
    return this.http
      .get<ApiResponse<Comment[]>>(`${this.BASE}/${highlightId}/comments`)
      .pipe(map(r => r.data ?? []));
  }

  addComment(highlightId: string, content: string): Observable<{ id: string }> {
    return this.http
      .post<ApiResponse<{ id: string }>>(`${this.BASE}/${highlightId}/comments`, { content })
      .pipe(map(r => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.BASE}/${id}`)
      .pipe(map(() => void 0));
  }

  update(id: string, caption: string, sport: string): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.BASE}/${id}`, { caption, sport })
      .pipe(map(() => void 0));
  }

  archive(id: string, archive: boolean): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.BASE}/${id}/archive`, { archive })
      .pipe(map(() => void 0));
  }

  getArchived(): Observable<Highlight[]> {
    return this.http
      .get<ApiResponse<Highlight[]>>(`${this.BASE}/archived`)
      .pipe(map(r => r.data ?? []));
  }
}