import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UpdateProfileRequest } from '@momentum/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/v1/users';

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.BASE}/me`);
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.BASE}/${id}`);
  }

  updateProfile(req: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.BASE}/me/profile`, req);
  }
}