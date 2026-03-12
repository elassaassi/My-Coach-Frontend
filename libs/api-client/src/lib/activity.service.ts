import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Activity, ActivityMessage, ActivitySearchParams, CreateActivityRequest } from '@momentum/models';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/v1/activities';

  create(req: CreateActivityRequest): Observable<Activity> {
    return this.http.post<Activity>(this.BASE, req);
  }

  search(params?: ActivitySearchParams): Observable<Activity[]> {
    let httpParams = new HttpParams();
    if (params?.sport)    httpParams = httpParams.set('sport',    params.sport);
    if (params?.city)     httpParams = httpParams.set('city',     params.city);
    if (params?.status)   httpParams = httpParams.set('status',   params.status);
    if (params?.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo)   httpParams = httpParams.set('dateTo',   params.dateTo);
    if (params?.page  != null) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size  != null) httpParams = httpParams.set('size', params.size.toString());
    return this.http.get<Activity[]>(`${this.BASE}/search`, { params: httpParams });
  }

  getById(id: string): Observable<Activity> {
    return this.http.get<Activity>(`${this.BASE}/${id}`);
  }

  getMyActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.BASE}/me`);
  }

  join(id: string): Observable<void> {
    return this.http.post<void>(`${this.BASE}/${id}/join`, {});
  }

  leave(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}/leave`);
  }

  getMessages(activityId: string): Observable<ActivityMessage[]> {
    return this.http.get<ActivityMessage[]>(`${this.BASE}/${activityId}/messages`);
  }

  sendMessage(activityId: string, content: string): Observable<ActivityMessage> {
    return this.http.post<ActivityMessage>(`${this.BASE}/${activityId}/messages`, { content });
  }

  complete(id: string): Observable<Activity> {
    return this.http.post<Activity>(`${this.BASE}/${id}/complete`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}