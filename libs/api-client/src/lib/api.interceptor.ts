import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Ajoute le token JWT à chaque requête
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // Don't add auth header to external APIs (OSRM, Nominatim, etc.)
  if (!req.url.startsWith('/') && !req.url.includes('localhost')) {
    return next(req);
  }
  const token = localStorage.getItem('momentum_token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  return next(authReq);
};

// Déballage de la réponse enveloppée { success: true, data: {...} }
export const apiUnwrapInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body && typeof event.body === 'object') {
        const body = event.body as Record<string, unknown>;
        if ('success' in body) {
          return event.clone({ body: 'data' in body ? body['data'] : null });
        }
      }
      return event;
    })
  );
};

// Redirige vers /auth/login sur 401 (token absent ou expiré).
export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        localStorage.removeItem('momentum_token');
        router.navigate(['/auth/login']);
      }
      return throwError(() => err);
    })
  );
};
