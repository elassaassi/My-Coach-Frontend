import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ActivityService, RatingService, AuthService } from '@momentum/api-client';
import { Activity, Participant } from '@momentum/models';
import { PlayerLevel } from '@momentum/models';

interface PlayerRating {
  userId: string;
  firstName: string;
  lastName: string;
  technicality: number;
  behavior: number;
  teamwork: number;
  level: PlayerLevel;
  isManOfMatch: boolean;
  comment: string;
  submitted: boolean;
  error: boolean;
}

const SPORT_META: Record<string, { emoji: string; label: string }> = {
  football:   { emoji: '⚽', label: 'Football'   },
  basketball: { emoji: '🏀', label: 'Basketball' },
  tennis:     { emoji: '🎾', label: 'Tennis'     },
  padel:      { emoji: '🏸', label: 'Padel'      },
  running:    { emoji: '🏃', label: 'Running'    },
  volleyball: { emoji: '🏐', label: 'Volleyball' },
  natation:   { emoji: '🏊', label: 'Natation'   },
  boxe:       { emoji: '🥊', label: 'Boxe'       },
  cyclisme:   { emoji: '🚴', label: 'Cyclisme'   },
  fitness:    { emoji: '💪', label: 'Fitness'    },
};

const LEVEL_OPTIONS: { value: PlayerLevel; label: string }[] = [
  { value: 'AMATEUR',   label: '🎽 Amateur'   },
  { value: 'SEMI_PRO',  label: '⚡ Semi-Pro'  },
  { value: 'PRO',       label: '🌟 Pro'       },
  { value: 'GOAT',      label: '👑 GOAT'      },
];

@Component({
  selector: 'app-rate-players',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rate-players.component.html',
  styleUrls: ['./rate-players.component.scss'],
})
export class RatePlayersComponent implements OnInit {
  private readonly route           = inject(ActivatedRoute);
  private readonly router          = inject(Router);
  private readonly activityService = inject(ActivityService);
  private readonly ratingService   = inject(RatingService);
  private readonly authService     = inject(AuthService);

  activity: Activity | null = null;
  ratings: PlayerRating[]  = [];
  loading   = true;
  submitting = false;
  allDone   = false;
  globalError = '';

  // ── 2-step flow ────────────────────────────────────────────────────────────
  step: 1 | 2 = 1;
  selectedMomUserId: string | null = null;

  readonly levelOptions = LEVEL_OPTIONS;

  get activityId(): string { return this.route.snapshot.paramMap.get('id') ?? ''; }
  get currentUserId(): string | null { return this.authService.currentUserId; }

  sportMeta(sport: string) { return SPORT_META[sport] ?? { emoji: '🏅', label: sport }; }

  ngOnInit(): void {
    if (!this.activityId) { this.router.navigate(['/activities']); return; }

    this.activityService.getById(this.activityId).subscribe({
      next: (activity) => {
        this.activity = activity;

        if (activity.status !== 'COMPLETED') {
          this.router.navigate(['/activities', this.activityId]);
          return;
        }

        this.ratingService.hasRatedActivity(this.activityId).subscribe({
          next: (rated) => {
            if (rated) {
              this.router.navigate(['/activities', this.activityId]);
              return;
            }
            this.ratings = activity.participants
              .filter(p => p.userId !== this.currentUserId)
              .map(p => this.buildRating(p));
            this.loading = false;
          },
          error: () => {
            this.ratings = activity.participants
              .filter(p => p.userId !== this.currentUserId)
              .map(p => this.buildRating(p));
            this.loading = false;
          },
        });
      },
      error: () => { this.loading = false; this.router.navigate(['/activities']); },
    });
  }

  private buildRating(p: Participant): PlayerRating {
    return {
      userId:       p.userId,
      firstName:    p.firstName ?? 'Joueur',
      lastName:     p.lastName  ?? '',
      technicality: 3,
      behavior:     3,
      teamwork:     3,
      level:        'AMATEUR',
      isManOfMatch: false,
      comment:      '',
      submitted:    false,
      error:        false,
    };
  }

  displayName(r: PlayerRating): string {
    if (r.firstName && r.lastName) return `${r.firstName} ${r.lastName[0]}.`;
    return r.firstName;
  }

  avatarInitial(r: PlayerRating): string {
    return (r.firstName[0] + (r.lastName[0] ?? '')).toUpperCase();
  }

  avatarHue(userId: string): number {
    let h = 0;
    for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) & 0xffffff;
    return Math.abs(h) % 360;
  }

  selectMoM(userId: string): void {
    this.selectedMomUserId = this.selectedMomUserId === userId ? null : userId;
  }

  proceedToMoM(): void {
    this.step = 2;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setStars(r: PlayerRating, field: 'technicality' | 'behavior' | 'teamwork', value: number): void {
    r[field] = value;
  }

  stars(value: number, total = 5): number[] {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  goBack(): void {
    this.router.navigate(['/activities', this.activityId]);
  }

  submitAll(): void {
    if (this.submitting) return;
    this.submitting  = true;
    this.globalError = '';

    // Apply MoM from step 2 election
    this.ratings.forEach(r => r.isManOfMatch = r.userId === this.selectedMomUserId);

    const pending = this.ratings.filter(r => !r.submitted);
    if (!pending.length) { this.submitting = false; this.allDone = true; return; }

    let remaining = pending.length;
    let hasError  = false;

    pending.forEach(r => {
      this.ratingService.ratePlayer({
        activityId:   this.activityId,
        ratedUserId:  r.userId,
        behavior:     r.behavior,
        technicality: r.technicality,
        teamwork:     r.teamwork,
        level:        r.level,
        isManOfMatch: r.isManOfMatch,
        comment:      r.comment || undefined,
      }).subscribe({
        next: () => {
          r.submitted = true;
          r.error     = false;
        },
        error: () => {
          r.error  = true;
          hasError = true;
        },
        complete: () => {
          remaining--;
          if (remaining === 0) {
            this.submitting = false;
            if (!hasError) {
              this.allDone = true;
              setTimeout(() => this.router.navigate(['/activities', this.activityId]), 2000);
            } else {
              this.globalError = 'Certaines évaluations ont échoué. Réessaie.';
            }
          }
        },
      });
    });
  }
}