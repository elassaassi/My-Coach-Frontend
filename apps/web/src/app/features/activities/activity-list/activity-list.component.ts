import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivityService } from '@momentum/api-client';
import { Activity, ActivitySearchParams } from '@momentum/models';
import { MnCardComponent, MnBadgeComponent } from '@momentum/ui';

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MnCardComponent, MnBadgeComponent],
  template: `
    <div class="page-layout">
      <div class="page-header">
        <h2>Activités sportives</h2>
        <a routerLink="create" class="btn-primary">+ Créer</a>
      </div>

      <!-- Filtres -->
      <div class="filters">
        <select [(ngModel)]="filters.sport" (change)="search()" class="filter-select">
          <option value="">Tous les sports</option>
          <option value="football">Football</option>
          <option value="basketball">Basketball</option>
          <option value="tennis">Tennis</option>
          <option value="padel">Padel</option>
          <option value="running">Running</option>
        </select>
        <select [(ngModel)]="filters.status" (change)="search()" class="filter-select">
          <option value="">Tous statuts</option>
          <option value="OPEN">Ouvert</option>
          <option value="FULL">Complet</option>
        </select>
        <input [(ngModel)]="filters.city" (input)="search()"
               class="filter-input" placeholder="🔍 Ville..." />
      </div>

      <!-- Liste -->
      <div class="activities-grid">
        <mn-card *ngFor="let a of activities" [clickable]="true" [elevated]="true">
          <a [routerLink]="[a.id]" class="activity-card">
            <div class="activity-card__top">
              <span class="activity-card__sport-emoji">{{ sportEmoji(a.sport) }}</span>
              <mn-badge [color]="a.status === 'OPEN' ? 'success' : 'neutral'">{{ a.status }}</mn-badge>
            </div>
            <h4 class="activity-card__title">{{ a.title }}</h4>
            <p class="activity-card__location">📍 {{ a.location.venueName }}, {{ a.location.city }}</p>
            <p class="activity-card__date">📅 {{ a.scheduledAt | date:'EEE dd MMM yyyy à HH:mm' }}</p>
            <div class="activity-card__footer">
              <span class="activity-card__level">{{ a.requiredLevel }}</span>
              <span class="activity-card__spots">{{ a.currentParticipantsCount }}/{{ a.maxParticipants }} joueurs</span>
            </div>
          </a>
        </mn-card>
      </div>

      <p *ngIf="activities.length === 0 && !loading" class="empty-state">
        Aucune activité trouvée. Sois le premier à en créer une ! 🚀
      </p>
    </div>
  `,
  styleUrls: ['./activity-list.component.scss']
})
export class ActivityListComponent implements OnInit {
  private readonly activityService = inject(ActivityService);

  activities: Activity[] = [];
  loading = true;
  filters: ActivitySearchParams = {};

  ngOnInit(): void { this.search(); }

  search(): void {
    this.loading = true;
    this.activityService.search(this.filters).subscribe({
      next: (data) => { this.activities = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  sportEmoji(sport: string): string {
    const map: Record<string, string> = {
      football: '⚽', basketball: '🏀', tennis: '🎾',
      padel: '🏸', running: '🏃', volleyball: '🏐', swimming: '🏊'
    };
    return map[sport] ?? '🏅';
  }
}