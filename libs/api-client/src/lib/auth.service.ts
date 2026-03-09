import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@momentum/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/v1';

  private readonly _currentUser$ = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this._currentUser$.asObservable();

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('momentum_token');
  }

  get currentUserId(): string | null {
    return localStorage.getItem('momentum_userId');
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE}/users/register`, req).pipe(
      tap(res => this.storeSession(res))
    );
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE}/auth/login`, req).pipe(
      tap(res => this.storeSession(res))
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.BASE}/users/me`).pipe(
      tap(user => this._currentUser$.next(user))
    );
  }

  logout(): void {
    localStorage.removeItem('momentum_token');
    localStorage.removeItem('momentum_userId');
    this._currentUser$.next(null);
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem('momentum_token', res.accessToken);
    localStorage.setItem('momentum_userId', res.userId);
  }
}