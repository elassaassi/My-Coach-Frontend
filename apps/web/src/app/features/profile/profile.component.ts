import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { UserService } from '@momentum/api-client';
import { ActivityService } from '@momentum/api-client';
import { RatingService } from '@momentum/api-client';
import { AuthService } from '@momentum/api-client';
import { User, SportLevelDto, Proficiency } from '@momentum/models';
import { Activity } from '@momentum/models';
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

const PROFICIENCY_LABELS: Record<Proficiency, string> = {
  BEGINNER:     'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED:     'Avancé',
  ELITE:        'Élite',
};

const PROFICIENCY_COLOR: Record<Proficiency, string> = {
  BEGINNER:     'neutral',
  INTERMEDIATE: 'info',
  ADVANCED:     'warning',
  ELITE:        'error',
};

const ALL_SPORTS = Object.entries(SPORT_META).map(([id, m]) => ({ id, ...m }));
const ALL_LEVELS: Proficiency[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE'];
const CITIES = [
  { name: 'Casablanca', lat: 33.5731, lon: -7.5898, country: 'Maroc'  },
  { name: 'Rabat',      lat: 34.0209, lon: -6.8416, country: 'Maroc'  },
  { name: 'Marrakech',  lat: 31.6295, lon: -7.9811, country: 'Maroc'  },
  { name: 'Fès',        lat: 34.0181, lon: -5.0078, country: 'Maroc'  },
  { name: 'Tanger',     lat: 35.7595, lon: -5.8340, country: 'Maroc'  },
  { name: 'Agadir',     lat: 30.4278, lon: -9.5981, country: 'Maroc'  },
  { name: 'Paris',      lat: 48.8566, lon:  2.3522, country: 'France' },
  { name: 'Lyon',       lat: 45.7640, lon:  4.8357, country: 'France' },
  { name: 'Marseille',  lat: 43.2965, lon:  5.3698, country: 'France' },
];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MnBadgeComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private readonly userService     = inject(UserService);
  private readonly activityService = inject(ActivityService);
  private readonly ratingService   = inject(RatingService);
  private readonly authService     = inject(AuthService);

  // ── State ─────────────────────────────────────────────────────────────────
  user:       User | null = null;
  stats:      PlayerStats | null = null;
  activities: Activity[] = [];
  loading  = true;
  saving   = false;
  editMode = false;
  saveSuccess = false;

  // ── Edit form state ────────────────────────────────────────────────────────
  editFirstName = '';
  editLastName  = '';
  editCity      = '';
  editSports:   SportLevelDto[] = [];

  // ── Refs ───────────────────────────────────────────────────────────────────
  readonly allSports = ALL_SPORTS;
  readonly allLevels = ALL_LEVELS;
  readonly cities    = CITIES;

  // ── Computed ───────────────────────────────────────────────────────────────
  get initials(): string {
    if (!this.user) return '?';
    return `${this.user.firstName[0]}${this.user.lastName[0]}`.toUpperCase();
  }

  get avatarHue(): number {
    const id = this.user?.id ?? '';
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffff;
    return Math.abs(h) % 360;
  }

  get memberSince(): string {
    if (!this.user) return '';
    const d = new Date(this.user.createdAt);
    const months = Math.max(0, (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months < 1) return 'Nouveau membre';
    if (months < 12) return `Membre depuis ${Math.floor(months)} mois`;
    return `Membre depuis ${Math.floor(months / 12)} an${Math.floor(months / 12) > 1 ? 's' : ''}`;
  }

  get proScoreCircle(): number {
    // SVG circle circumference for r=44 → 2π×44 ≈ 276.46
    const score = this.stats?.proScore ?? 0;
    return 276.46 * (1 - score / 100);
  }

  get proScoreLabel(): string {
    const s = this.stats?.proScore ?? 0;
    if (s >= 80) return 'Potentiel Pro';
    if (s >= 60) return 'Semi-Pro';
    if (s >= 40) return 'Avancé';
    if (s >= 20) return 'Intermédiaire';
    return 'Débutant';
  }

  get upcomingActivities(): Activity[] {
    return this.activities
      .filter(a => new Date(a.scheduledAt) > new Date() && a.status === 'OPEN')
      .slice(0, 3);
  }

  get pastActivities(): Activity[] {
    return this.activities
      .filter(a => new Date(a.scheduledAt) <= new Date() || a.status === 'COMPLETED')
      .slice(0, 3);
  }

  get achievements(): { icon: string; label: string; unlocked: boolean }[] {
    const total = this.activities.length;
    const mom   = this.stats?.manOfMatchCount ?? 0;
    const score = this.stats?.proScore ?? 0;
    return [
      { icon: '⚽', label: 'Première session',   unlocked: total >= 1    },
      { icon: '🏃', label: '5 sessions jouées',  unlocked: total >= 5    },
      { icon: '🏆', label: '10 sessions jouées', unlocked: total >= 10   },
      { icon: '🌟', label: 'Man of the Match',   unlocked: mom  >= 1    },
      { icon: '👑', label: 'Triple MoM',         unlocked: mom  >= 3    },
      { icon: '🚀', label: 'ProScore > 60',      unlocked: score >= 60  },
      { icon: '💎', label: 'Potentiel Pro',       unlocked: score >= 80  },
    ];
  }

  sportMeta(sport: string) { return SPORT_META[sport] ?? { emoji: '🏅', label: sport }; }
  proficiencyLabel(p: string) { return PROFICIENCY_LABELS[p as Proficiency] ?? p; }
  proficiencyColor(p: string): any { return PROFICIENCY_COLOR[p as Proficiency] ?? 'neutral'; }

  stars(val: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(val));
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const userId = this.authService.currentUserId;

    forkJoin({
      user:       this.userService.getMe(),
      activities: this.activityService.getMyActivities(),
      stats:      userId
        ? this.ratingService.getPlayerStats(userId).pipe(catchError(() => of(null)))
        : of(null),
    }).subscribe({
      next: ({ user, activities, stats }) => {
        this.user       = user;
        this.activities = activities;
        this.stats      = stats;
        this.loading    = false;
        this.initEditForm();
      },
      error: () => { this.loading = false; },
    });
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  openEdit(): void {
    this.initEditForm();
    this.editMode = true;
  }

  closeEdit(): void { this.editMode = false; }

  private initEditForm(): void {
    if (!this.user) return;
    this.editFirstName = this.user.firstName;
    this.editLastName  = this.user.lastName;
    this.editCity      = this.user.sportProfile?.city ?? '';
    this.editSports    = (this.user.sportProfile?.sports ?? []).map(s => ({ ...s }));
  }

  addSport(): void {
    this.editSports.push({ sport: 'football', proficiency: 'BEGINNER', yearsExperience: 1 });
  }

  removeSport(i: number): void { this.editSports.splice(i, 1); }

  cityChange(cityName: string): void {
    const c = this.cities.find(c => c.name === cityName);
    this.editCity = cityName;
    // lat/lon stored per city for the PUT request
    this._selectedCity = c ?? null;
  }

  private _selectedCity: { name: string; lat: number; lon: number; country: string } | null = null;

  saveProfile(): void {
    if (this.saving) return;
    this.saving = true;

    const city = this._selectedCity ?? this.cities.find(c => c.name === this.editCity);

    this.userService.updateProfile({
      firstName: this.editFirstName,
      lastName:  this.editLastName,
      city:      this.editCity,
      country:   city?.country ?? '',
      latitude:  city?.lat ?? this.user?.sportProfile?.latitude ?? 0,
      longitude: city?.lon ?? this.user?.sportProfile?.longitude ?? 0,
      sports:    this.editSports,
    }).subscribe({
      next: (updated) => {
        this.user      = updated;
        this.saving    = false;
        this.editMode  = false;
        this.saveSuccess = true;
        setTimeout(() => { this.saveSuccess = false; }, 3000);
      },
      error: () => { this.saving = false; },
    });
  }
}