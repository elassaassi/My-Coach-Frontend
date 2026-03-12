import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivityService } from '@momentum/api-client';
import { Activity, ActivitySearchParams } from '@momentum/models';

interface CityResult { name: string; region: string; country: string; flag: string; lat: number; lon: number; }

const SPORTS = [
  { id: 'football',   emoji: '⚽', label: 'Football'   },
  { id: 'basketball', emoji: '🏀', label: 'Basketball' },
  { id: 'tennis',     emoji: '🎾', label: 'Tennis'     },
  { id: 'padel',      emoji: '🏸', label: 'Padel'      },
  { id: 'running',    emoji: '🏃', label: 'Running'    },
  { id: 'volleyball', emoji: '🏐', label: 'Volleyball' },
  { id: 'natation',   emoji: '🏊', label: 'Natation'   },
  { id: 'boxe',       emoji: '🥊', label: 'Boxe'       },
  { id: 'cyclisme',   emoji: '🚴', label: 'Cyclisme'   },
  { id: 'fitness',    emoji: '💪', label: 'Fitness'    },
];

const POPULAR_CITIES: CityResult[] = [
  { name: 'Casablanca',   region: 'Grand Casablanca', country: 'Maroc',  flag: '🇲🇦', lat: 33.5731, lon: -7.5898  },
  { name: 'Rabat',        region: 'Rabat-Salé',       country: 'Maroc',  flag: '🇲🇦', lat: 34.0209, lon: -6.8416  },
  { name: 'Marrakech',    region: 'Marrakech-Safi',   country: 'Maroc',  flag: '🇲🇦', lat: 31.6295, lon: -7.9811  },
  { name: 'Fès',          region: 'Fès-Meknès',       country: 'Maroc',  flag: '🇲🇦', lat: 34.0181, lon: -5.0078  },
  { name: 'Tanger',       region: 'Tanger-Tétouan',   country: 'Maroc',  flag: '🇲🇦', lat: 35.7595, lon: -5.8330  },
  { name: 'Agadir',       region: 'Souss-Massa',      country: 'Maroc',  flag: '🇲🇦', lat: 30.4278, lon: -9.5981  },
  { name: 'Oujda',        region: 'Oriental',         country: 'Maroc',  flag: '🇲🇦', lat: 34.6905, lon: -1.9121  },
  { name: 'Meknès',       region: 'Fès-Meknès',       country: 'Maroc',  flag: '🇲🇦', lat: 33.8935, lon: -5.5473  },
  { name: 'Salé',         region: 'Rabat-Salé',       country: 'Maroc',  flag: '🇲🇦', lat: 34.0531, lon: -6.7985  },
  { name: 'Kénitra',      region: 'Rabat-Salé',       country: 'Maroc',  flag: '🇲🇦', lat: 34.2610, lon: -6.5802  },
  { name: 'Tétouan',      region: 'Tanger-Tétouan',   country: 'Maroc',  flag: '🇲🇦', lat: 35.5785, lon: -5.3684  },
  { name: 'Safi',         region: 'Marrakech-Safi',   country: 'Maroc',  flag: '🇲🇦', lat: 32.3008, lon: -9.2270  },
  { name: 'Mohammedia',   region: 'Grand Casablanca', country: 'Maroc',  flag: '🇲🇦', lat: 33.6861, lon: -7.3833  },
  { name: 'El Jadida',    region: 'Casablanca-Settat', country: 'Maroc', flag: '🇲🇦', lat: 33.2316, lon: -8.5007  },
  { name: 'Béni Mellal',  region: 'Béni Mellal',      country: 'Maroc',  flag: '🇲🇦', lat: 32.3372, lon: -6.3498  },
  { name: 'Nador',        region: 'Oriental',         country: 'Maroc',  flag: '🇲🇦', lat: 35.1740, lon: -2.9287  },
  { name: 'Essaouira',    region: 'Marrakech-Safi',   country: 'Maroc',  flag: '🇲🇦', lat: 31.5085, lon: -9.7595  },
  { name: 'Laâyoune',     region: 'Laâyoune-Sakia',  country: 'Maroc',  flag: '🇲🇦', lat: 27.1418, lon: -13.1875 },
  { name: 'Paris',        region: 'Île-de-France',    country: 'France', flag: '🇫🇷', lat: 48.8566, lon: 2.3522   },
  { name: 'Lyon',         region: 'Auvergne-Rhône',   country: 'France', flag: '🇫🇷', lat: 45.7640, lon: 4.8357   },
  { name: 'Marseille',    region: 'PACA',             country: 'France', flag: '🇫🇷', lat: 43.2965, lon: 5.3698   },
  { name: 'Toulouse',     region: 'Occitanie',        country: 'France', flag: '🇫🇷', lat: 43.6047, lon: 1.4442   },
  { name: 'Nice',         region: 'PACA',             country: 'France', flag: '🇫🇷', lat: 43.7102, lon: 7.2620   },
  { name: 'Nantes',       region: 'Pays de la Loire', country: 'France', flag: '🇫🇷', lat: 47.2184, lon: -1.5536  },
  { name: 'Strasbourg',   region: 'Grand Est',        country: 'France', flag: '🇫🇷', lat: 48.5734, lon: 7.7521   },
  { name: 'Montpellier',  region: 'Occitanie',        country: 'France', flag: '🇫🇷', lat: 43.6108, lon: 3.8767   },
  { name: 'Bordeaux',     region: 'Nouvelle-Aquitaine', country: 'France', flag: '🇫🇷', lat: 44.8378, lon: -0.5792 },
  { name: 'Lille',        region: 'Hauts-de-France',  country: 'France', flag: '🇫🇷', lat: 50.6292, lon: 3.0573   },
  { name: 'Rennes',       region: 'Bretagne',         country: 'France', flag: '🇫🇷', lat: 48.1173, lon: -1.6778  },
  { name: 'Reims',        region: 'Grand Est',        country: 'France', flag: '🇫🇷', lat: 49.2583, lon: 4.0317   },
  { name: 'Saint-Étienne',region: 'Auvergne-Rhône',  country: 'France', flag: '🇫🇷', lat: 45.4397, lon: 4.3872   },
  { name: 'Toulon',       region: 'PACA',             country: 'France', flag: '🇫🇷', lat: 43.1242, lon: 5.9280   },
  { name: 'Grenoble',     region: 'Auvergne-Rhône',   country: 'France', flag: '🇫🇷', lat: 45.1885, lon: 5.7245   },
  { name: 'Dijon',        region: 'Bourgogne',        country: 'France', flag: '🇫🇷', lat: 47.3220, lon: 5.0415   },
  { name: 'Angers',       region: 'Pays de la Loire', country: 'France', flag: '🇫🇷', lat: 47.4784, lon: -0.5632  },
];

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.scss']
})
export class ActivityListComponent implements OnInit, OnDestroy {
  private readonly activityService = inject(ActivityService);
  private readonly http            = inject(HttpClient);
  private readonly route           = inject(ActivatedRoute);
  private readonly router          = inject(Router);

  @ViewChild('sentinel', { static: false }) sentinel!: ElementRef<HTMLElement>;
  private observer: IntersectionObserver | null = null;

  activities: Activity[] = [];
  loading    = true;
  loadingMore = false;
  hasMore     = true;
  private currentPage = 0;
  private readonly PAGE_SIZE = 20;

  filters: ActivitySearchParams = {};

  // Sport pills
  readonly sports = SPORTS;
  selectedSport = '';

  // Country filter
  selectedCountry = '';  // '' | 'Maroc' | 'France'

  // Date quick filter
  selectedDatePreset = '';  // '' | 'today' | 'week' | 'month'

  // Sort
  sortAsc = true;

  // City autocomplete
  cityQuery = '';
  citySelected = false;
  citySuggestions: CityResult[] = [];
  showSuggestions = false;
  loadingSuggestions = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    // Restore filters from URL query params (preserves state on back-navigation)
    const p = this.route.snapshot.queryParamMap;
    if (p.has('sport'))   { this.selectedSport    = p.get('sport')!;   this.filters.sport  = this.selectedSport || undefined; }
    if (p.has('country')) { this.selectedCountry  = p.get('country')!; }
    if (p.has('city'))    { this.cityQuery = p.get('city')!; this.citySelected = true; this.filters.city = this.cityQuery; }
    if (p.has('status'))  { this.filters.status   = (p.get('status') as any) || undefined; }
    if (p.has('date'))    { this.selectedDatePreset = p.get('date')!; this.applyDatePreset(this.selectedDatePreset); }
    if (p.has('sort'))    { this.sortAsc = p.get('sort') !== 'desc'; }
    this.search();
  }

  private syncQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        sport:   this.selectedSport   || null,
        country: this.selectedCountry || null,
        city:    this.citySelected ? this.cityQuery : null,
        status:  this.filters.status  || null,
        date:    this.selectedDatePreset || null,
        sort:    this.sortAsc ? null : 'desc',
      },
    });
  }

  private applyDatePreset(preset: string): void {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (preset === 'today') {
      const end = new Date(start); end.setDate(end.getDate() + 1);
      this.filters.dateFrom = start.toISOString(); this.filters.dateTo = end.toISOString();
    } else if (preset === 'week') {
      const end = new Date(start); end.setDate(end.getDate() + 7);
      this.filters.dateFrom = start.toISOString(); this.filters.dateTo = end.toISOString();
    } else if (preset === 'month') {
      const end = new Date(start); end.setMonth(end.getMonth() + 1);
      this.filters.dateFrom = start.toISOString(); this.filters.dateTo = end.toISOString();
    } else {
      this.filters.dateFrom = undefined; this.filters.dateTo = undefined;
    }
  }

  onStatusChange(): void {
    this.syncQueryParams();
    this.search();
  }

  setDatePreset(preset: string): void {
    this.selectedDatePreset = this.selectedDatePreset === preset ? '' : preset;
    this.applyDatePreset(this.selectedDatePreset);
    this.syncQueryParams();
    this.search();
  }

  toggleSort(): void {
    this.sortAsc = !this.sortAsc;
    this.syncQueryParams();
    this.activities = [...this.activities].sort((a, b) => {
      const diff = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      return this.sortAsc ? diff : -diff;
    });
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.observer?.disconnect();
  }

  private setupInfiniteScroll(): void {
    this.observer?.disconnect();
    if (!this.sentinel?.nativeElement) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.loadingMore && this.hasMore) {
          this.loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    this.observer.observe(this.sentinel.nativeElement);
  }

  private loadMore(): void {
    if (this.loadingMore || !this.hasMore) return;
    this.loadingMore = true;
    this.currentPage++;
    this.activityService.search({ ...this.filters, page: this.currentPage, size: this.PAGE_SIZE }).subscribe({
      next: (data) => {
        this.activities = [...this.activities, ...data];
        this.hasMore    = data.length === this.PAGE_SIZE;
        this.loadingMore = false;
      },
      error: () => { this.loadingMore = false; },
    });
  }

  selectSport(id: string): void {
    this.selectedSport = this.selectedSport === id ? '' : id;
    this.filters.sport = this.selectedSport || undefined;
    this.syncQueryParams();
    this.search();
  }

  selectCountry(c: string): void {
    this.selectedCountry = this.selectedCountry === c ? '' : c;
    if (this.citySelected) {
      this.cityQuery = '';
      this.citySelected = false;
      this.filters.city = undefined;
    }
    this.syncQueryParams();
    this.search();
  }

  search(): void {
    this.loading     = true;
    this.currentPage = 0;
    this.hasMore     = true;
    this.activities  = [];
    this.activityService.search({ ...this.filters, page: 0, size: this.PAGE_SIZE }).subscribe({
      next: (data) => {
        this.activities = data;
        this.hasMore    = data.length === this.PAGE_SIZE;
        this.loading    = false;
        // Setup scroll observer after DOM renders the sentinel
        setTimeout(() => this.setupInfiniteScroll(), 100);
      },
      error: () => { this.loading = false; }
    });
  }

  // ── City autocomplete ─────────────────────────────────────────────────────

  onCityFocus(): void {
    const q = this.cityQuery.trim();
    this.citySuggestions = q.length === 0
      ? this.filterLocal('')
      : this.filterLocal(q);
    this.showSuggestions = true;
  }

  onCityInput(): void {
    this.citySelected = false;
    const q = this.cityQuery.trim();
    if (!q) {
      this.citySuggestions = this.filterLocal('');
      this.showSuggestions = true;
      return;
    }
    this.citySuggestions = this.filterLocal(q);
    this.showSuggestions = true;

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (q.length >= 2) {
      this.debounceTimer = setTimeout(() => this.searchNominatim(q), 380);
    }
  }

  onCityBlur(): void {
    setTimeout(() => { this.showSuggestions = false; }, 200);
  }

  selectCity(c: CityResult): void {
    this.cityQuery = c.name;
    this.citySelected = true;
    this.showSuggestions = false;
    this.filters.city = c.name;
    this.syncQueryParams();
    this.search();
  }

  clearCity(): void {
    this.cityQuery = '';
    this.citySelected = false;
    this.citySuggestions = [];
    this.showSuggestions = false;
    this.filters.city = undefined;
    this.syncQueryParams();
    this.search();
  }

  private filterLocal(q: string): CityResult[] {
    const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const nq = norm(q);
    let pool = POPULAR_CITIES;
    if (this.selectedCountry) pool = pool.filter(c => c.country === this.selectedCountry);
    if (!nq) return pool.slice(0, 6);
    return pool.filter(c => norm(c.name).includes(nq) || norm(c.region).includes(nq)).slice(0, 6);
  }

  private searchNominatim(q: string): void {
    this.loadingSuggestions = true;
    const cc = this.selectedCountry === 'France' ? 'fr' : this.selectedCountry === 'Maroc' ? 'ma' : 'ma,fr';
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=${cc}&format=json&limit=6&addressdetails=1`;
    this.http.get<any[]>(url).subscribe({
      next: (results) => {
        const remote: CityResult[] = results.map(r => ({
          name: r.address?.city || r.address?.town || r.address?.village || r.display_name.split(',')[0],
          region: r.address?.state || r.address?.county || '',
          country: r.address?.country_code === 'ma' ? 'Maroc' : 'France',
          flag: r.address?.country_code === 'ma' ? '🇲🇦' : '🇫🇷',
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
        }));
        // Merge: local first, then remote not already present
        const local = this.filterLocal(q);
        const localNames = new Set(local.map(c => c.name.toLowerCase()));
        const merged = [...local, ...remote.filter(c => !localNames.has(c.name.toLowerCase()))].slice(0, 8);
        this.citySuggestions = merged;
        this.loadingSuggestions = false;
      },
      error: () => { this.loadingSuggestions = false; }
    });
  }

  sportEmoji(sport: string): string {
    return SPORTS.find(s => s.id === sport)?.emoji ?? '🏅';
  }

  sportGradient(sport: string): string {
    const gradients: Record<string, string> = {
      football:   'linear-gradient(135deg,#16a34a,#4ade80)',
      basketball: 'linear-gradient(135deg,#ea580c,#fb923c)',
      tennis:     'linear-gradient(135deg,#2563eb,#60a5fa)',
      padel:      'linear-gradient(135deg,#7c3aed,#a78bfa)',
      running:    'linear-gradient(135deg,#dc2626,#f87171)',
      volleyball: 'linear-gradient(135deg,#d97706,#fbbf24)',
      natation:   'linear-gradient(135deg,#0891b2,#38bdf8)',
      boxe:       'linear-gradient(135deg,#9f1239,#fb7185)',
      cyclisme:   'linear-gradient(135deg,#15803d,#86efac)',
      fitness:    'linear-gradient(135deg,#6d28d9,#c084fc)',
    };
    return gradients[sport] ?? 'linear-gradient(135deg,#475569,#94a3b8)';
  }

  levelLabel(level: string): string {
    const map: Record<string, string> = {
      BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé', ELITE: 'Élite',
    };
    return map[level] ?? level;
  }

  fillPct(a: Activity): number {
    if (!a.maxParticipants) return 0;
    return Math.min(100, Math.round((a.currentParticipantsCount / a.maxParticipants) * 100));
  }

  spotsLabel(a: Activity): string {
    const n = Math.max(0, a.maxParticipants - a.currentParticipantsCount);
    if (n === 0) return 'Complet';
    return `${n} place${n > 1 ? 's' : ''}`;
  }
}