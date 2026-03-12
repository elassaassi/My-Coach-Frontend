import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@momentum/api-client';
import { MnButtonComponent } from '@momentum/ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MnButtonComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card">

        <!-- Logo -->
        <div class="auth-card__brand">
          <div class="auth-card__logo">M</div>
          <h1 class="auth-card__title">Momentum</h1>
          <p class="auth-card__subtitle">Rejoins ta communauté sportive</p>
        </div>

        <!-- ── Boutons sociaux ──────────────────────────────────────────── -->
        <div class="social-buttons">

          <!-- Google -->
          <a *ngIf="googleEnabled" class="social-btn social-btn--google" [href]="googleLoginUrl">
            <svg class="social-btn__icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </a>

          <button *ngIf="!googleEnabled && providersChecked"
                  class="social-btn social-btn--google social-btn--unavailable"
                  type="button" disabled title="Google login non configuré — utilise email/mot de passe">
            <svg class="social-btn__icon" viewBox="0 0 24 24" width="20" height="20" opacity="0.5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
            <span class="social-btn__soon">Indisponible</span>
          </button>

          <!-- Facebook -->
          <a *ngIf="facebookEnabled" class="social-btn social-btn--facebook" [href]="facebookLoginUrl">
            <svg class="social-btn__icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continuer avec Facebook
          </a>

          <!-- Apple -->
          <button class="social-btn social-btn--apple" (click)="appleComingSoon()">
            <svg class="social-btn__icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#000" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
            </svg>
            Continuer avec Apple
            <span class="social-btn__soon">Bientôt</span>
          </button>
        </div>

        <!-- Séparateur -->
        <div class="divider"><span>ou avec email</span></div>

        <!-- ── Formulaire email/password ──────────────────────────────── -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" formControlName="email"
                   placeholder="ton@email.com" autocomplete="email" />
          </div>

          <div class="form-group">
            <label class="form-label">Mot de passe</label>
            <input class="form-input" type="password" formControlName="password"
                   placeholder="••••••••" autocomplete="current-password" />
          </div>

          <p *ngIf="error" class="form-error">{{ error }}</p>

          <mn-button type="submit" [loading]="loading" style="width:100%">
            Se connecter
          </mn-button>
        </form>

        <p class="auth-card__footer">
          Pas encore de compte ?
          <a routerLink="/auth/register">S'inscrire</a>
        </p>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private readonly fb    = inject(FormBuilder);
  private readonly auth  = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly http   = inject(HttpClient);

  readonly googleLoginUrl   = 'http://localhost:8080/oauth2/authorization/google';
  readonly facebookLoginUrl = 'http://localhost:8080/oauth2/authorization/facebook';

  googleEnabled   = false;
  facebookEnabled = false;
  providersChecked = false;

  readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading = false;
  error = '';

  ngOnInit(): void {
    const err = this.route.snapshot.queryParamMap.get('error');
    if (err === 'oauth2') {
      this.error = 'La connexion sociale a échoué. Vérifiez votre compte ou utilisez email/mot de passe.';
    } else if (err === 'no_email') {
      this.error = 'Le compte social ne fournit pas d\'email. Utilisez email/mot de passe.';
    }

    // Check which OAuth2 providers are actually configured on the backend
    this.http.get<{ data: { google: boolean; facebook: boolean } }>(
      'http://localhost:8080/api/v1/auth/providers'
    ).subscribe({
      next: (res) => {
        this.googleEnabled   = res.data?.google   ?? false;
        this.facebookEnabled = res.data?.facebook ?? false;
        this.providersChecked = true;
      },
      error: () => {
        // Backend unreachable — optimistically show buttons; let the redirect fail naturally
        this.googleEnabled   = true;
        this.facebookEnabled = true;
        this.providersChecked = true;
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    this.auth.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error = err.status === 401 ? 'Email ou mot de passe incorrect' : 'Erreur de connexion';
        this.loading = false;
      }
    });
  }

  appleComingSoon(): void {
    alert('Apple Sign In — disponible prochainement. Utilisez Google ou email pour l\'instant.');
  }
}