import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActivityService } from '@momentum/api-client';
import { AuthService } from '@momentum/api-client';
import { Activity } from '@momentum/models';
import { MnBadgeComponent } from '@momentum/ui';

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

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé', ELITE: 'Élite',
};

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MnBadgeComponent],
  templateUrl: './activity-detail.component.html',
  styleUrls: ['./activity-detail.component.scss'],
})
export class ActivityDetailComponent implements OnInit, OnDestroy {
  private readonly route           = inject(ActivatedRoute);
  private readonly router          = inject(Router);
  private readonly activityService = inject(ActivityService);
  private readonly authService     = inject(AuthService);

  activity: Activity | null = null;
  loading  = true;
  error    = false;
  joining  = false;

  // Countdown
  countdown = '';
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // Success flash
  joinSuccess = false;

  get currentUserId(): string | null { return this.authService.currentUserId; }

  get isOrganizer(): boolean {
    return !!this.activity && this.activity.organizerId === this.currentUserId;
  }

  get isParticipant(): boolean {
    if (!this.activity || !this.currentUserId) return false;
    return this.activity.participants.some(p => p.userId === this.currentUserId);
  }

  get spotsLeft(): number {
    if (!this.activity) return 0;
    return this.activity.maxParticipants - this.activity.currentParticipantsCount;
  }

  get spotsUrgent(): boolean { return this.spotsLeft <= 2 && this.spotsLeft > 0; }
  get isFull(): boolean { return this.spotsLeft <= 0; }

  get statusColor(): 'success' | 'warning' | 'error' | 'neutral' {
    const s = this.activity?.status;
    if (s === 'OPEN')      return 'success';
    if (s === 'FULL')      return 'warning';
    if (s === 'ONGOING')   return 'error';
    return 'neutral';
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      OPEN: 'Ouvert', FULL: 'Complet', ONGOING: 'En cours',
      COMPLETED: 'Terminé', CANCELLED: 'Annulé',
    };
    return map[this.activity?.status ?? ''] ?? (this.activity?.status ?? '');
  }

  get levelLabel(): string { return LEVEL_LABELS[this.activity?.requiredLevel ?? ''] ?? this.activity?.requiredLevel ?? ''; }

  sportMeta(sport: string) { return SPORT_META[sport] ?? { emoji: '🏅', label: sport }; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/activities']); return; }

    this.activityService.getById(id).subscribe({
      next: (a) => {
        this.activity = a;
        this.loading  = false;
        this.startCountdown();
      },
      error: () => { this.error = true; this.loading = false; },
    });
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  join(): void {
    if (!this.activity || this.joining) return;
    this.joining = true;
    this.activityService.join(this.activity.id).subscribe({
      next: () => {
        this.joining = false;
        this.joinSuccess = true;
        setTimeout(() => { this.joinSuccess = false; }, 3000);
        // Reload to get fresh participant list
        this.reload();
      },
      error: () => { this.joining = false; },
    });
  }

  leave(): void {
    if (!this.activity || this.joining) return;
    this.joining = true;
    this.activityService.leave(this.activity.id).subscribe({
      next: () => { this.joining = false; this.reload(); },
      error: () => { this.joining = false; },
    });
  }

  private reload(): void {
    if (!this.activity) return;
    this.activityService.getById(this.activity.id).subscribe({
      next: (a) => { this.activity = a; },
    });
  }

  private startCountdown(): void {
    const update = () => {
      if (!this.activity) return;
      const diff = new Date(this.activity.scheduledAt).getTime() - Date.now();
      if (diff <= 0) { this.countdown = 'C\'est maintenant'; return; }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000)  / 60_000);
      this.countdown = d > 0 ? `${d}j ${h}h ${m}min` : h > 0 ? `${h}h ${m}min` : `${m}min`;
    };
    update();
    this.countdownInterval = setInterval(update, 60_000);
  }

  participantInitial(userId: string): string {
    return userId.slice(0, 2).toUpperCase();
  }

  avatarHue(userId: string): number {
    let h = 0;
    for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) & 0xffffff;
    return Math.abs(h) % 360;
  }

  openMaps(): void {
    if (!this.activity) return;
    const { latitude, longitude } = this.activity.location;
    window.open(`https://maps.google.com/?q=${latitude},${longitude}`, '_blank');
  }
}