import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@momentum/api-client';
import { MnButtonComponent } from '@momentum/ui';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MnButtonComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__brand">
          <div class="auth-card__logo">M</div>
          <h1 class="auth-card__title">Rejoindre Momentum</h1>
          <p class="auth-card__subtitle">Crée ton compte gratuitement</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Prénom</label>
              <input class="form-input" type="text" formControlName="firstName" placeholder="Mohamed" />
            </div>
            <div class="form-group">
              <label class="form-label">Nom</label>
              <input class="form-input" type="text" formControlName="lastName" placeholder="Alami" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" formControlName="email" placeholder="ton@email.com" />
          </div>

          <div class="form-group">
            <label class="form-label">Mot de passe</label>
            <input class="form-input" type="password" formControlName="password" placeholder="8 caractères minimum" />
          </div>

          <p *ngIf="error" class="form-error">{{ error }}</p>

          <mn-button type="submit" [loading]="loading" style="width:100%">
            Créer mon compte
          </mn-button>
        </form>

        <p class="auth-card__footer">
          Déjà inscrit ? <a routerLink="/auth/login">Se connecter</a>
        </p>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.scss']
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(8)]]
  });

  loading = false;
  error = '';

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.register(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => { this.error = 'Inscription impossible. Cet email est peut-être déjà utilisé.'; this.loading = false; }
    });
  }
}