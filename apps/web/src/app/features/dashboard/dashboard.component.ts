import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivityService, HighlightService, AuthService } from '@momentum/api-client';
import { Activity, Highlight } from '@momentum/models';
import { MnCardComponent, MnBadgeComponent } from '@momentum/ui';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MnCardComponent, MnBadgeComponent],
  template: `
    <div class="dashboard">
      <!-- Header -->
      <header class="dashboard__header">
        <div>
          <h2 class="dashboard__greeting">Bonjour 👋</h2>
          <p class="dashboard__sub">Que joues-tu aujourd'hui ?</p>
        </div>
        <a routerLink="/activities/create" class="btn-primary-sm">+ Créer activité</a>
      </header>

      <!-- Stats rapides -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-card__value">12</span>
          <span class="stat-card__label">Activités jouées</span>
        </div>
        <div class="stat-card stat-card--accent">
          <span class="stat-card__value">78</span>
          <span class="stat-card__label">ProScore</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">3</span>
          <span class="stat-card__label">Man of the Match</span>
        </div>
      </div>

      <!-- Activités proches -->
      <section class="section">
        <div class="section__header">
          <h3 class="section__title">Activités ouvertes</h3>
          <a routerLink="/activities" class="section__link">Voir tout →</a>
        </div>
        <div class="activities-grid">
          <mn-card *ngFor="let a of activities" [clickable]="true" [elevated]="true">
            <a [routerLink]="['/activities', a.id]" class="activity-item">
              <div class="activity-item__top">
                <span class="activity-item__sport">{{ a.sport }}</span>
                <mn-badge [color]="a.status === 'OPEN' ? 'success' : 'warning'">
                  {{ a.status === 'OPEN' ? 'Ouvert' : 'Complet' }}
                </mn-badge>
              </div>
              <h4 class="activity-item__title">{{ a.title }}</h4>
              <p class="activity-item__meta">
                📍 {{ a.location.city }} · {{ a.scheduledAt | date:'EEE dd MMM, HH:mm' }}
              </p>
              <p class="activity-item__spots">
                {{ a.currentParticipantsCount }}/{{ a.maxParticipants }} joueurs
              </p>
            </a>
          </mn-card>
        </div>
      </section>

      <!-- Highlight du jour -->
      <section class="section" *ngIf="highlightOfDay">
        <h3 class="section__title">🎬 Highlight du jour</h3>
        <mn-card [elevated]="true">
          <div class="highlight-preview">
            <div class="highlight-preview__media">
              <span class="highlight-preview__type">{{ highlightOfDay.mediaType }}</span>
            </div>
            <div class="highlight-preview__info">
              <p class="highlight-preview__caption">{{ highlightOfDay.caption }}</p>
              <span class="highlight-preview__likes">❤️ {{ highlightOfDay.likeCount }} likes</span>
            </div>
          </div>
        </mn-card>
      </section>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private readonly activityService = inject(ActivityService);
  private readonly highlightService = inject(HighlightService);

  activities: Activity[] = [];
  highlightOfDay: Highlight | null = null;

  ngOnInit(): void {
    this.activityService.search({ status: 'OPEN', size: 6 }).subscribe({
      next: (data) => this.activities = data,
      error: () => {}
    });
    this.highlightService.getHighlightOfDay().subscribe({
      next: (h) => this.highlightOfDay = h,
      error: () => {}
    });
  }
}