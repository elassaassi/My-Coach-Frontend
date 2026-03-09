import { Component } from '@angular/core';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle],
  template: `
    <ion-header><ion-toolbar color="secondary"><ion-title>Activités</ion-title></ion-toolbar></ion-header>
    <ion-content><div style="padding:24px"><p style="color:#6B7280">Liste activités — à implémenter</p></div></ion-content>
  `
})
export class ActivitiesComponent {}