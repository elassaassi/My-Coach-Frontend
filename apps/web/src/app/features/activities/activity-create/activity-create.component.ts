import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivityService } from '@momentum/api-client';
import type { CreateActivityRequest } from '@momentum/models';

const SPORTS = [
  { id: 'football',   emoji: '⚽', label: 'Football',   active: 47 },
  { id: 'basketball', emoji: '🏀', label: 'Basketball', active: 23 },
  { id: 'tennis',     emoji: '🎾', label: 'Tennis',     active: 18 },
  { id: 'padel',      emoji: '🏸', label: 'Padel',      active: 31 },
  { id: 'running',    emoji: '🏃', label: 'Running',    active: 34 },
  { id: 'volleyball', emoji: '🏐', label: 'Volleyball', active: 12 },
  { id: 'natation',   emoji: '🏊', label: 'Natation',   active: 9  },
  { id: 'boxe',       emoji: '🥊', label: 'Boxe',       active: 15 },
  { id: 'cyclisme',   emoji: '🚴', label: 'Cyclisme',   active: 22 },
  { id: 'fitness',    emoji: '💪', label: 'Fitness',    active: 41 },
];

const LEVELS = [
  { id: 'BEGINNER',     label: 'Débutant',      desc: 'Je joue pour le fun'  },
  { id: 'INTERMEDIATE', label: 'Intermédiaire', desc: 'Bon niveau de club'   },
  { id: 'ADVANCED',     label: 'Avancé',        desc: 'Compétition amateur'  },
  { id: 'ELITE',        label: 'Élite',          desc: 'Niveau semi-pro'     },
];

const CITIES = [
  { name: 'Casablanca', lat: 33.5731, lon: -7.5898, country: 'Maroc'  },
  { name: 'Rabat',      lat: 34.0209, lon: -6.8416, country: 'Maroc'  },
  { name: 'Marrakech',  lat: 31.6295, lon: -7.9811, country: 'Maroc'  },
  { name: 'Fès',        lat: 34.0181, lon: -5.0078, country: 'Maroc'  },
  { name: 'Tanger',     lat: 35.7595, lon: -5.8340, country: 'Maroc'  },
  { name: 'Agadir',     lat: 30.4278, lon: -9.5981, country: 'Maroc'  },
  { name: 'Meknès',     lat: 33.8935, lon: -5.5473, country: 'Maroc'  },
  { name: 'Oujda',      lat: 34.6805, lon: -1.9069, country: 'Maroc'  },
  { name: 'Paris',      lat: 48.8566, lon:  2.3522, country: 'France' },
  { name: 'Lyon',       lat: 45.7640, lon:  4.8357, country: 'France' },
  { name: 'Marseille',  lat: 43.2965, lon:  5.3698, country: 'France' },
];

const CONFETTI_COLORS = ['#FF3A00','#F5C400','#22C55E','#3B82F6','#FF6B3D','#FCD34D','#A78BFA','#ffffff'];

@Component({
  selector: 'app-activity-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activity-create.component.html',
  styleUrls: ['./activity-create.component.scss'],
})
export class ActivityCreateComponent {
  private readonly activityService = inject(ActivityService);
  private readonly router          = inject(Router);

  readonly sports = SPORTS;
  readonly levels = LEVELS;
  readonly cities = CITIES;

  // ── Wizard state ─────────────────────────────────────────────────────────
  step = 1;

  // Step 1
  sport = '';
  level = '';

  // Step 2
  selectedCity    = 'Casablanca';
  venueName       = '';
  date            = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  time            = '18:00';
  maxParticipants = 10;
  readonly minDate = new Date().toISOString().slice(0, 10);

  // Step 3
  title       = '';
  description = '';
  private titleManuallyEdited = false;

  // Submit
  submitting        = false;
  error             = '';
  success           = false;
  createdActivityId = '';

  // Confetti (deterministic — no Math.random for SSR safety)
  readonly confetti = Array.from({ length: 24 }, (_, i) => ({
    left:     (i * 4.3) % 98,
    color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay:    (i * 0.065),
    duration: 1.6 + (i % 5) * 0.3,
    width:    8  + (i % 4) * 3,
    height:   12 + (i % 3) * 5,
    rotate:   (i * 47) % 360,
  }));

  // ── Computed ─────────────────────────────────────────────────────────────
  get progressPct(): number { return Math.round((this.step / 3) * 100); }

  get canNext1(): boolean { return !!this.sport && !!this.level; }
  get canNext2(): boolean {
    return !!this.selectedCity && !!this.venueName.trim()
        && !!this.date && !!this.time && this.maxParticipants >= 2;
  }
  get canSubmit(): boolean { return !!this.title.trim() && !this.submitting; }

  get fomoMessage(): string {
    const s = SPORTS.find(x => x.id === this.sport);
    return s
      ? `⚡ ${s.active} joueurs de ${s.label} cherchent un match ce soir près de toi`
      : '⚡ Des centaines de joueurs cherchent une session ce soir';
  }

  get sportEmoji(): string  { return SPORTS.find(x => x.id === this.sport)?.emoji ?? '🏅'; }
  get levelLabel(): string  { return LEVELS.find(x => x.id === this.level)?.label ?? '—'; }

  get spotsArray(): number[] {
    return Array.from({ length: Math.min(this.maxParticipants, 12) });
  }

  get previewDate(): string {
    if (!this.date || !this.time) return '—';
    try {
      const dt = new Date(`${this.date}T${this.time}`);
      const days   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
      const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
      return `${days[dt.getDay()]} ${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()} à ${this.time}`;
    } catch { return '—'; }
  }

  // ── Sport selection ───────────────────────────────────────────────────────
  selectSport(id: string): void {
    this.sport = id;
    if (!this.titleManuallyEdited) this.autoTitle();
  }

  // ── City / time change ────────────────────────────────────────────────────
  onCityChange(): void  { if (!this.titleManuallyEdited) this.autoTitle(); }
  onTimeChange(): void  { if (!this.titleManuallyEdited) this.autoTitle(); }
  onTitleInput(): void  { this.titleManuallyEdited = true; }

  private autoTitle(): void {
    const s = SPORTS.find(x => x.id === this.sport);
    if (!s) return;
    this.title = `${s.label} ${this.timeLabel()} - ${this.selectedCity}`;
  }

  private timeLabel(): string {
    const h = parseInt(this.time?.split(':')[0] ?? '18', 10);
    if (h >= 6  && h < 12) return 'Matin';
    if (h >= 12 && h < 17) return 'Après-midi';
    if (h >= 17 && h < 22) return 'Soir';
    return 'Nuit';
  }

  // ── Participants stepper ──────────────────────────────────────────────────
  inc(): void { if (this.maxParticipants < 50) this.maxParticipants++; }
  dec(): void { if (this.maxParticipants > 2)  this.maxParticipants--; }

  // ── Navigation ───────────────────────────────────────────────────────────
  goNext(): void {
    if (this.step === 1 && this.canNext1) {
      this.autoTitle();
      this.step = 2;
    } else if (this.step === 2 && this.canNext2) {
      if (!this.titleManuallyEdited) this.autoTitle();
      this.step = 3;
    }
  }

  goBack(): void {
    if (this.step > 1) {
      this.step--;
    } else {
      this.router.navigate(['/activities']);
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  submit(): void {
    if (!this.canSubmit) return;
    this.submitting = true;
    this.error = '';

    const city = CITIES.find(c => c.name === this.selectedCity) ?? CITIES[0];
    const req: CreateActivityRequest = {
      title:           this.title.trim(),
      sport:           this.sport,
      requiredLevel:   this.level,
      latitude:        city.lat,
      longitude:       city.lon,
      venueName:       this.venueName.trim(),
      city:            this.selectedCity,
      country:         city.country,
      scheduledAt:     new Date(`${this.date}T${this.time}:00`).toISOString(),
      maxParticipants: this.maxParticipants,
      ...(this.description.trim() ? { description: this.description.trim() } : {}),
    };

    this.activityService.create(req).subscribe({
      next: (a) => { this.createdActivityId = a.id; this.success = true; this.submitting = false; },
      error: ()  => { this.error = 'Une erreur est survenue. Vérifie ta connexion et réessaie.'; this.submitting = false; },
    });
  }

  viewActivity(): void   { this.router.navigate(['/activities', this.createdActivityId]); }
  goToActivities(): void { this.router.navigate(['/activities']); }
}