import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { AuthService } from '@momentum/api-client';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const nav = inject(NavController);

  if (auth.isLoggedIn) return true;
  nav.navigateRoot('/auth/login');
  return false;
};