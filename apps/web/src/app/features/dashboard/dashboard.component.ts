import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivityService, HighlightService, AuthService } from '@momentum/api-client';
import { Activity, Highlight } from '@momentum/models';

const SPORT_META: Record<string, { emoji: string; label: string; gradient: string }> = {
  football:   { emoji: '⚽', label: 'Football',   gradient: 'linear-gradient(135deg,#16a34a,#4ade80)' },
  basketball: { emoji: '🏀', label: 'Basketball', gradient: 'linear-gradient(135deg,#ea580c,#fb923c)' },
  tennis:     { emoji: '🎾', label: 'Tennis',     gradient: 'linear-gradient(135deg,#2563eb,#60a5fa)' },
  padel:      { emoji: '🏸', label: 'Padel',      gradient: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
  running:    { emoji: '🏃', label: 'Running',    gradient: 'linear-gradient(135deg,#dc2626,#f87171)' },
  volleyball: { emoji: '🏐', label: 'Volleyball', gradient: 'linear-gradient(135deg,#d97706,#fbbf24)' },
  natation:   { emoji: '🏊', label: 'Natation',   gradient: 'linear-gradient(135deg,#0891b2,#38bdf8)' },
  boxe:       { emoji: '🥊', label: 'Boxe',       gradient: 'linear-gradient(135deg,#9f1239,#fb7185)' },
  cyclisme:   { emoji: '🚴', label: 'Cyclisme',   gradient: 'linear-gradient(135deg,#15803d,#86efac)' },
  fitness:    { emoji: '💪', label: 'Fitness',    gradient: 'linear-gradient(135deg,#6d28d9,#c084fc)' },
};

const LEVEL_META: Record<string, { label: string; color: string }> = {
  BEGINNER:     { label: 'Débutant',      color: '#16a34a' },
  INTERMEDIATE: { label: 'Intermédiaire', color: '#2563eb' },
  ADVANCED:     { label: 'Avancé',        color: '#ea580c' },
  ELITE:        { label: 'Élite',         color: '#7c3aed' },
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private readonly activityService  = inject(ActivityService);
  private readonly highlightService = inject(HighlightService);
  private readonly authService      = inject(AuthService);

  activities: Activity[]   = [];
  highlightOfDay: Highlight | null = null;
  loading = true;

  get currentUserId() { return this.authService.currentUserId; }

  ngOnInit(): void {
    this.activityService.search({ status: 'OPEN', size: 6 }).subscribe({
      next: (data) => { this.activities = data ?? []; this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.highlightService.getHighlightOfDay().subscribe({
      next: (h) => this.highlightOfDay = h ?? null,
      error: () => {},
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  sportMeta(sport: string) {
    return SPORT_META[sport] ?? { emoji: '🏅', label: sport, gradient: 'linear-gradient(135deg,#475569,#94a3b8)' };
  }

  levelMeta(level: string) {
    return LEVEL_META[level] ?? { label: level, color: '#64748b' };
  }

  fillPct(a: Activity): number {
    if (!a.maxParticipants) return 0;
    return Math.min(100, Math.round((a.currentParticipantsCount / a.maxParticipants) * 100));
  }

  spotsLeft(a: Activity): number {
    return Math.max(0, a.maxParticipants - a.currentParticipantsCount);
  }

  spotsLabel(a: Activity): string {
    const n = this.spotsLeft(a);
    if (n === 0) return 'Complet';
    return `${n} place${n > 1 ? 's' : ''} restante${n > 1 ? 's' : ''}`;
  }

  timeUntil(dateStr: string): string {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff < 0) return 'En cours';
    const h = Math.floor(diff / 3_600_000);
    const d = Math.floor(diff / 86_400_000);
    if (h < 1)  return 'Dans moins d\'1h';
    if (h < 24) return `Dans ${h}h`;
    if (d === 1) return 'Demain';
    const days = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
    const dt = new Date(dateStr);
    return `${days[dt.getDay()]} ${dt.getDate()} — ${String(dt.getHours()).padStart(2,'0')}h${String(dt.getMinutes()).padStart(2,'0')}`;
  }

  isSoon(dateStr: string): boolean {
    const diff = new Date(dateStr).getTime() - Date.now();
    return diff > 0 && diff < 3 * 3_600_000;
  }

  isUrgent(a: Activity): boolean {
    return this.spotsLeft(a) <= 2 && this.spotsLeft(a) > 0;
  }

  avatarHue(id: string | null | undefined): number {
    if (!id) return 210;
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffff;
    return Math.abs(h) % 360;
  }
}
