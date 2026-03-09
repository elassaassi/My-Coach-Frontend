import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonItem, IonInput, IonButton, IonText, IonLabel
} from '@ionic/angular/standalone';
import { AuthService } from '@momentum/api-client';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonItem, IonInput, IonButton, IonText, IonLabel
  ],
  template: `
    <ion-content class="login-content">
      <div class="login-container">
        <!-- Brand -->
        <div class="brand">
          <div class="brand__logo">M</div>
          <h1 class="brand__name">Momentum</h1>
          <p class="brand__tagline">Rejoins ta communauté sportive</p>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-field">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="ton@email.com" class="ion-input" />
          </div>
          <div class="form-field">
            <label>Mot de passe</label>
            <input type="password" formControlName="password" placeholder="••••••••" class="ion-input" />
          </div>

          <p *ngIf="error" class="error-msg">{{ error }}</p>

          <ion-button expand="block" type="submit" [disabled]="loading || form.invalid" class="submit-btn">
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </ion-button>
        </form>

        <p class="footer-link">
          Pas de compte ? <a routerLink="/auth/register">S'inscrire</a>
        </p>
      </div>
    </ion-content>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly nav = inject(NavController);

  readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading = false;
  error = '';

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.login(this.form.value as any).subscribe({
      next: () => this.nav.navigateRoot('/tabs/home'),
      error: () => { this.error = 'Email ou mot de passe incorrect'; this.loading = false; }
    });
  }
}