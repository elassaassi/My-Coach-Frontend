import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { ActivityService, UserService, RatingService } from '@momentum/api-client';
import { AuthService } from '@momentum/api-client';
import { Activity, ActivityMessage, User } from '@momentum/models';
import { PlayerStats } from '@momentum/models';
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
  imports: [CommonModule, FormsModule, RouterLink, MnBadgeComponent],
  templateUrl: './activity-detail.component.html',
  styleUrls: ['./activity-detail.component.scss'],
})
export class ActivityDetailComponent implements OnInit, OnDestroy {
  private readonly route           = inject(ActivatedRoute);
  private readonly router          = inject(Router);
  private readonly activityService = inject(ActivityService);
  private readonly authService     = inject(AuthService);
  private readonly userService     = inject(UserService);
  private readonly ratingService   = inject(RatingService);

  activity: Activity | null = null;
  loading  = true;
  error    = false;
  joining  = false;

  // Countdown
  countdown = '';
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // Success flash
  joinSuccess = false;

  // ── Player profile modal ────────────────────────────────────────────────
  playerPanelOpen  = false;
  playerPanelUser: User | null = null;
  playerPanelStats: PlayerStats | null = null;
  playerPanelLoading = false;

  // ── Chat ───────────────────────────────────────────────────────────────
  messages: ActivityMessage[] = [];
  chatInput    = '';
  sending      = false;
  chatError    = '';
  private chatInterval: ReturnType<typeof setInterval> | null = null;

  get currentUserId(): string | null { return this.authService.currentUserId; }

  get isOrganizer(): boolean {
    return !!this.activity && this.activity.organizerId === this.currentUserId;
  }

  get isParticipant(): boolean {
    if (!this.activity || !this.currentUserId) return false;
    return this.activity.participants.some(p => p.userId === this.currentUserId);
  }

  get canChat(): boolean { return this.isOrganizer || this.isParticipant; }

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
        this.loadChat();
        this.startChatPolling();
      },
      error: () => { this.error = true; this.loading = false; },
    });
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.chatInterval) clearInterval(this.chatInterval);
  }

  join(): void {
    if (!this.activity || this.joining) return;
    this.joining = true;
    this.activityService.join(this.activity.id).subscribe({
      next: () => {
        this.joining = false;
        this.joinSuccess = true;
        setTimeout(() => { this.joinSuccess = false; }, 3000);
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

  // ── Player profile modal ─────────────────────────────────────────────────

  openPlayerProfile(userId: string): void {
    this.playerPanelOpen    = true;
    this.playerPanelUser    = null;
    this.playerPanelStats   = null;
    this.playerPanelLoading = true;

    forkJoin({
      user:  this.userService.getById(userId),
      stats: this.ratingService.getPlayerStats(userId).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ user, stats }) => {
        this.playerPanelUser    = user;
        this.playerPanelStats   = stats;
        this.playerPanelLoading = false;
      },
      error: () => { this.playerPanelLoading = false; },
    });
  }

  closePlayerPanel(): void {
    this.playerPanelOpen = false;
  }

  proficiencyLabel(p: string): string {
    const map: Record<string, string> = {
      BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé', ELITE: 'Élite',
    };
    return map[p] ?? p;
  }

  proficiencyColor(p: string): 'success' | 'warning' | 'error' | 'neutral' {
    if (p === 'ELITE')        return 'error';
    if (p === 'ADVANCED')     return 'warning';
    if (p === 'INTERMEDIATE') return 'success';
    return 'neutral';
  }

  get playerProScoreCircle(): number {
    const score = this.playerPanelStats?.proScore ?? 0;
    const circumference = 2 * Math.PI * 44;
    return circumference - (score / 100) * circumference;
  }

  stars(val: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(val));
  }

  // ── Chat ─────────────────────────────────────────────────────────────────

  private loadChat(): void {
    if (!this.activity) return;
    this.activityService.getMessages(this.activity.id).subscribe({
      next: (msgs) => { this.messages = msgs; },
    });
  }

  private startChatPolling(): void {
    this.chatInterval = setInterval(() => this.loadChat(), 10_000);
  }

  sendMessage(): void {
    const content = this.chatInput.trim();
    if (!content || !this.activity || this.sending) return;
    this.chatError = '';
    this.sending   = true;
    this.activityService.sendMessage(this.activity.id, content).subscribe({
      next: (msg) => {
        this.messages  = [...this.messages, msg];
        this.chatInput = '';
        this.sending   = false;
      },
      error: (err) => {
        this.sending   = false;
        this.chatError = err?.error?.error ?? 'Erreur lors de l\'envoi. Réessaie.';
        setTimeout(() => { this.chatError = ''; }, 4000);
      },
    });
  }

  onChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  isOwnMessage(msg: ActivityMessage): boolean {
    return msg.senderId === this.currentUserId;
  }

  messageSenderInitial(senderId: string): string {
    return senderId.slice(0, 2).toUpperCase();
  }
}
