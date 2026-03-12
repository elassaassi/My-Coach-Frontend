import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

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
