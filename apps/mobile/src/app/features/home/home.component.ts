import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonBadge, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { ActivityService, HighlightService } from '@momentum/api-client';
import { Activity, Highlight } from '@momentum/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonBadge, IonRefresher, IonRefresherContent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="secondary">
        <ion-title>
          <div class="toolbar-brand">
            <span class="toolbar-logo">M</span> Momentum
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Highlight du jour -->
      <div class="section">
        <h3 class="section-title">🎬 Highlight du jour</h3>
        <ion-card *ngIf="highlightOfDay" class="highlight-card">
          <div class="highlight-card__media">📸 {{ highlightOfDay.caption }}</div>
          <ion-card-content>
            <p>❤️ {{ highlightOfDay.likeCount }} likes · {{ highlightOfDay.sport }}</p>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Activités proches -->
      <div class="section">
        <h3 class="section-title">⚽ Activités ouvertes</h3>
        <ion-card *ngFor="let a of activities" class="activity-card">
          <ion-card-header>
            <ion-card-title>{{ a.title }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>📍 {{ a.location.city }} · {{ a.scheduledAt | date:'dd MMM, HH:mm' }}</p>
            <p>{{ a.currentParticipantsCount }}/{{ a.maxParticipants }} joueurs</p>
            <ion-badge [color]="a.status === 'OPEN' ? 'success' : 'medium'">
              {{ a.status }}
            </ion-badge>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private readonly activityService = inject(ActivityService);
  private readonly highlightService = inject(HighlightService);

  activities: Activity[] = [];
  highlightOfDay: Highlight | null = null;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.activityService.search({ status: 'OPEN', size: 5 }).subscribe({ next: d => this.activities = d });
    this.highlightService.getHighlightOfDay().subscribe({ next: h => this.highlightOfDay = h });
  }

  refresh(event: any): void {
    this.load();
    setTimeout(() => event.target.complete(), 1000);
  }
}