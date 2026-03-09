import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app.routes';
import { authInterceptor } from '@momentum/api-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideIonicAngular({
      mode: 'ios',   // UI cohérente iOS/Android
      animated: true
    }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ]
};