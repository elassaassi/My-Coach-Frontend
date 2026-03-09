import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonButton],
  template: `
    <ion-content>
      <div style="padding:32px;text-align:center">
        <h2>S'inscrire</h2>
        <p style="color:#6B7280;margin-top:16px">Formulaire d'inscription — à implémenter</p>
        <a routerLink="/auth/login" style="color:#FF3A00;display:block;margin-top:24px">← Se connecter</a>
      </div>
    </ion-content>
  `
})
export class RegisterComponent {}