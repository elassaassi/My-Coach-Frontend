import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

/**
 * Reçoit le token JWT après le flux OAuth2 social login.
 * URL cible : /auth/callback?token=...&userId=...
 */
@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-page">
      <div class="callback-card">
        <div *ngIf="!error" class="callback-card__spinner"></div>
        <p *ngIf="!error">Connexion en cours...</p>
        <p *ngIf="error" class="callback-card__error">{{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .callback-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0D1B4B, #FF3A00);
    }
    .callback-card {
      background: #fff; border-radius: 16px; padding: 48px;
      text-align: center; box-shadow: 0 16px 48px rgba(0,0,0,0.2);
    }
    .callback-card__spinner {
      width: 48px; height: 48px; margin: 0 auto 16px;
      border: 4px solid rgba(255,58,0,0.2); border-top-color: #FF3A00;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    .callback-card__error { color: #EF4444; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class CallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  error = '';

  ngOnInit(): void {
    const token   = this.route.snapshot.queryParamMap.get('token');
    const userId  = this.route.snapshot.queryParamMap.get('userId');
    const errParam = this.route.snapshot.queryParamMap.get('error');

    if (errParam) {
      this.error = 'La connexion sociale a échoué. Veuillez réessayer.';
      setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      return;
    }

    if (token && userId) {
      localStorage.setItem('momentum_token', token);
      localStorage.setItem('momentum_userId', userId);
      this.router.navigate(['/dashboard']);
    } else {
      this.error = 'Token manquant. Redirection...';
      setTimeout(() => this.router.navigate(['/auth/login']), 2000);
    }
  }
}
