import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { MatchingService } from '@momentum/api-client';
import { UserService } from '@momentum/api-client';
import { MatchRequest, MatchRequestCommand, MatchStatus } from '@momentum/models';
import { User } from '@momentum/models';

type ActiveTab = 'search' | 'history';

interface SportOption {
  value: string;
  label: string;
  emoji: string;
}

interface LevelOption {
  value: string;
  label: string;
  color: string;
}

const SPORTS: SportOption[] = [
  { value: 'football', label: 'Football', emoji: '⚽' },
  { value: 'basketball', label: 'Basketball', emoji: '🏀' },
  { value: 'tennis', label: 'Tennis', emoji: '🎾' },
  { value: 'padel', label: 'Padel', emoji: '🏓' },
  { value: 'running', label: 'Running', emoji: '🏃' },
  { value: 'swimming', label: 'Natation', emoji: '🏊' },
  { value: 'volleyball', label: 'Volleyball', emoji: '🏐' },
  { value: 'cycling', label: 'Cyclisme', emoji: '🚴' },
  { value: 'boxing', label: 'Boxe', emoji: '🥊' },
  { value: 'fitness', label: 'Fitness', emoji: '💪' },
];

const LEVELS: LevelOption[] = [
  { value: 'BEGINNER', label: 'Débutant', color: '#22c55e' },
  { value: 'INTERMEDIATE', label: 'Intermédiaire', color: '#3b82f6' },
  { value: 'ADVANCED', label: 'Avancé', color: '#f59e0b' },
  { value: 'ELITE', label: 'Élite', color: '#FF3A00' },
];

const DISTANCES = [5, 10, 20, 30, 50];

@Component({
  selector: 'app-matching',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './matching.component.html',
  styleUrl: './matching.component.scss',
})
export class MatchingComponent implements OnInit, OnDestroy {
  private readonly matchingService = inject(MatchingService);
  private readonly userService = inject(UserService);
  private pollSub?: Subscription;

  readonly sports = SPORTS;
  readonly levels = LEVELS;
  readonly distances = DISTANCES;

  activeTab: ActiveTab = 'search';

  // Form state
  selectedSport = '';
  selectedLevel = '';
  selectedDistance = 20;
  latitude = 33.5731;   // Casablanca by default
  longitude = -7.5898;
  geoLoading = false;

  // Search result state
  searchState: 'idle' | 'searching' | 'polling' | 'found' | 'no_match' | 'error' = 'idle';
  currentRequest: MatchRequest | null = null;
  matchedUser: User | null = null;
  errorMessage = '';

  // History
  history: MatchRequest[] = [];
  historyUsers = new Map<string, User>();
  historyLoading = false;

  ngOnInit(): void {
    this.detectLocation();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  detectLocation(): void {
    if (!navigator.geolocation) return;
    this.geoLoading = true;
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.latitude = pos.coords.latitude;
        this.longitude = pos.coords.longitude;
        this.geoLoading = false;
      },
      () => { this.geoLoading = false; }
    );
  }

  selectSport(sport: string): void {
    this.selectedSport = this.selectedSport === sport ? '' : sport;
  }

  selectLevel(level: string): void {
    this.selectedLevel = this.selectedLevel === level ? '' : level;
  }

  get canSearch(): boolean {
    return !!this.selectedSport && !!this.selectedLevel && this.searchState !== 'searching' && this.searchState !== 'polling';
  }

  search(): void {
    if (!this.canSearch) return;
    this.searchState = 'searching';
    this.currentRequest = null;
    this.matchedUser = null;
    this.errorMessage = '';
    this.pollSub?.unsubscribe();

    const cmd: MatchRequestCommand = {
      sport: this.selectedSport,
      proficiency: this.selectedLevel,
      latitude: this.latitude,
      longitude: this.longitude,
      maxDistanceKm: this.selectedDistance,
    };

    this.matchingService.requestMatch(cmd).subscribe({
      next: req => {
        this.currentRequest = req;
        if (req.status === 'FOUND') {
          this.handleFound(req);
        } else if (req.status === 'NO_MATCH' || req.status === 'CANCELLED' || req.status === 'EXPIRED') {
          this.searchState = 'no_match';
        } else {
          this.searchState = 'polling';
          this.startPolling(req.id);
        }
      },
      error: () => {
        this.searchState = 'error';
        this.errorMessage = 'Impossible de lancer la recherche. Réessaie plus tard.';
      },
    });
  }

  private startPolling(requestId: string): void {
    this.pollSub = interval(3000)
      .pipe(
        switchMap(() => this.matchingService.getById(requestId)),
        takeWhile(req => req.status === 'PENDING', true)
      )
      .subscribe({
        next: req => {
          this.currentRequest = req;
          if (req.status === 'FOUND') {
            this.handleFound(req);
          } else if (req.status !== 'PENDING') {
            this.searchState = 'no_match';
          }
        },
        error: () => {
          this.searchState = 'error';
          this.errorMessage = 'Erreur lors de la recherche. Réessaie.';
        },
      });
  }

  private handleFound(req: MatchRequest): void {
    this.searchState = 'found';
    if (req.matchedUserId) {
      this.userService.getById(req.matchedUserId).subscribe({
        next: user => { this.matchedUser = user; },
        error: () => { /* show match without profile */ },
      });
    }
  }

  reset(): void {
    this.pollSub?.unsubscribe();
    this.searchState = 'idle';
    this.currentRequest = null;
    this.matchedUser = null;
    this.errorMessage = '';
  }

  // ── History tab ────────────────────────────────────────────────────────────

  switchTab(tab: ActiveTab): void {
    this.activeTab = tab;
    if (tab === 'history') this.loadHistory();
  }

  loadHistory(): void {
    this.historyLoading = true;
    this.matchingService.getMyMatches().subscribe({
      next: matches => {
        this.history = matches.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.historyLoading = false;
        this.prefetchHistoryUsers();
      },
      error: () => { this.historyLoading = false; },
    });
  }

  private prefetchHistoryUsers(): void {
    const ids = [...new Set(
      this.history.filter(m => m.matchedUserId).map(m => m.matchedUserId!)
    )];
    ids.forEach(id => {
      if (!this.historyUsers.has(id)) {
        this.userService.getById(id).subscribe({
          next: u => this.historyUsers.set(id, u),
          error: () => {},
        });
      }
    });
  }

  // ── View helpers ───────────────────────────────────────────────────────────

  scoreWidth(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  scoreColor(score: number): string {
    if (score >= 0.8) return '#22c55e';
    if (score >= 0.5) return '#f59e0b';
    return '#FF3A00';
  }

  statusLabel(status: MatchStatus): string {
    const labels: Record<MatchStatus, string> = {
      PENDING: 'En recherche',
      FOUND: 'Partenaire trouvé',
      NO_MATCH: 'Aucun match',
      CANCELLED: 'Annulé',
      EXPIRED: 'Expiré',
    };
    return labels[status] ?? status;
  }

  statusClass(status: MatchStatus): string {
    const map: Record<MatchStatus, string> = {
      FOUND: 'badge--success',
      PENDING: 'badge--warning',
      NO_MATCH: 'badge--muted',
      CANCELLED: 'badge--muted',
      EXPIRED: 'badge--muted',
    };
    return map[status] ?? '';
  }

  relativeDate(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "À l'instant";
    if (m < 60) return `il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
  }

  sportEmoji(sport: string): string {
    return SPORTS.find(s => s.value === sport)?.emoji ?? '🏅';
  }

  sportLabel(sport: string): string {
    return SPORTS.find(s => s.value === sport)?.label ?? sport;
  }

  levelLabel(level: string): string {
    return LEVELS.find(l => l.value === level)?.label ?? level;
  }

  userInitials(user: User | undefined): string {
    if (!user) return '?';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
}