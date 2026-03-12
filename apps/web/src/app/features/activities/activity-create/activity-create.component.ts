import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ActivityService } from '@momentum/api-client';
import type { CreateActivityRequest } from '@momentum/models';

export interface CityResult {
  name: string;
  region: string;
  country: string;
  flag: string;
  lat: number;
  lon: number;
}

export interface AddressResult {
  label: string;
  full: string;
  lat: number;
  lon: number;
}

export interface NearbyVenue {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  distance?: number;  // km
  sportTag?: string;
}

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
  { id: 'ELITE',        label: 'Élite',         desc: 'Niveau semi-pro'      },
];

export interface RegionResult {
  name: string;
  capital: string;  // main city, shown as hint
  country: string;
  flag: string;
  lat: number;
  lon: number;
}

const REGIONS_MA: RegionResult[] = [
  { name: 'Casablanca-Settat',          capital: 'Casablanca',  country: 'Maroc',  flag: '🇲🇦', lat: 33.5731, lon: -7.5898  },
  { name: 'Rabat-Salé-Kénitra',         capital: 'Rabat',       country: 'Maroc',  flag: '🇲🇦', lat: 34.0209, lon: -6.8416  },
  { name: 'Marrakech-Safi',             capital: 'Marrakech',   country: 'Maroc',  flag: '🇲🇦', lat: 31.6295, lon: -7.9811  },
  { name: 'Fès-Meknès',                 capital: 'Fès',         country: 'Maroc',  flag: '🇲🇦', lat: 34.0181, lon: -5.0078  },
  { name: 'Tanger-Tétouan-Al Hoceïma', capital: 'Tanger',      country: 'Maroc',  flag: '🇲🇦', lat: 35.7595, lon: -5.8330  },
  { name: 'Souss-Massa',                capital: 'Agadir',      country: 'Maroc',  flag: '🇲🇦', lat: 30.4278, lon: -9.5981  },
  { name: 'Oriental',                   capital: 'Oujda',       country: 'Maroc',  flag: '🇲🇦', lat: 34.6905, lon: -1.9121  },
  { name: 'Béni Mellal-Khénifra',       capital: 'Béni Mellal', country: 'Maroc',  flag: '🇲🇦', lat: 32.3372, lon: -6.3498  },
  { name: 'Drâa-Tafilalet',             capital: 'Ouarzazate',  country: 'Maroc',  flag: '🇲🇦', lat: 30.9335, lon: -6.9370  },
  { name: 'Guelmim-Oued Noun',          capital: 'Guelmim',     country: 'Maroc',  flag: '🇲🇦', lat: 28.9863, lon: -10.0572 },
  { name: 'Laâyoune-Sakia El Hamra',   capital: 'Laâyoune',    country: 'Maroc',  flag: '🇲🇦', lat: 27.1253, lon: -13.1625 },
  { name: 'Dakhla-Oued Ed-Dahab',       capital: 'Dakhla',      country: 'Maroc',  flag: '🇲🇦', lat: 23.6847, lon: -15.9570 },
];

const REGIONS_FR: RegionResult[] = [
  { name: 'Île-de-France',              capital: 'Paris',       country: 'France', flag: '🇫🇷', lat: 48.8566, lon:  2.3522  },
  { name: 'Auvergne-Rhône-Alpes',       capital: 'Lyon',        country: 'France', flag: '🇫🇷', lat: 45.7640, lon:  4.8357  },
  { name: "Provence-Alpes-Côte d'Azur", capital: 'Marseille',   country: 'France', flag: '🇫🇷', lat: 43.2965, lon:  5.3698  },
  { name: 'Occitanie',                  capital: 'Toulouse',    country: 'France', flag: '🇫🇷', lat: 43.6047, lon:  1.4442  },
  { name: 'Nouvelle-Aquitaine',         capital: 'Bordeaux',    country: 'France', flag: '🇫🇷', lat: 44.8378, lon: -0.5792  },
  { name: 'Grand Est',                  capital: 'Strasbourg',  country: 'France', flag: '🇫🇷', lat: 48.5734, lon:  7.7521  },
  { name: 'Hauts-de-France',            capital: 'Lille',       country: 'France', flag: '🇫🇷', lat: 50.6292, lon:  3.0573  },
  { name: 'Normandie',                  capital: 'Rouen',       country: 'France', flag: '🇫🇷', lat: 49.4432, lon:  1.0993  },
  { name: 'Bretagne',                   capital: 'Rennes',      country: 'France', flag: '🇫🇷', lat: 48.1173, lon: -1.6778  },
  { name: 'Pays de la Loire',           capital: 'Nantes',      country: 'France', flag: '🇫🇷', lat: 47.2184, lon: -1.5536  },
  { name: 'Centre-Val de Loire',        capital: 'Orléans',     country: 'France', flag: '🇫🇷', lat: 47.9029, lon:  1.9039  },
  { name: 'Bourgogne-Franche-Comté',    capital: 'Dijon',       country: 'France', flag: '🇫🇷', lat: 47.3220, lon:  5.0415  },
  { name: 'Corse',                      capital: 'Ajaccio',     country: 'France', flag: '🇫🇷', lat: 41.9192, lon:  8.7386  },
];

const CONFETTI_COLORS = ['#FF3A00','#F5C400','#22C55E','#3B82F6','#FF6B3D','#FCD34D','#A78BFA','#ffffff'];

@Component({
  selector: 'app-activity-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activity-create.component.html',
  styleUrls: ['./activity-create.component.scss'],
})
export class ActivityCreateComponent implements OnDestroy {
  private readonly activityService = inject(ActivityService);
  private readonly router          = inject(Router);
  private readonly http            = inject(HttpClient);
  private readonly sanitizer       = inject(DomSanitizer);


  readonly sports = SPORTS;
  readonly levels = LEVELS;

  // ── Wizard state ─────────────────────────────────────────────────────────
  step = 1;

  // Step 1
  sport = '';
  level = '';

  // Step 2 — pays + région
  selectedCountry  = '';   // 'Maroc' | 'France'
  regionQuery      = '';
  regionSelected   = false;
  regionSuggestions: RegionResult[] = [];
  showRegionSuggestions = false;

  selectedCity    = '';
  selectedLat     = 0;
  selectedLon     = 0;

  mapSafeUrl: SafeResourceUrl | null = null;

  // Step 2 — nearby venues (Overpass API)
  nearbyVenues: NearbyVenue[] = [];
  loadingVenues  = false;
  venueSearchErr = '';
  userLat: number | null = null;
  userLon: number | null = null;
  locating  = false;
  locError  = '';
  selectedNearbyId: string | null = null;

  // Step 2 — venue address autocomplete
  venueQuery       = '';
  venueSelected    = false;
  venueSuggestions: AddressResult[] = [];
  showVenueSuggestions = false;
  loadingVenue     = false;
  private venueDebounce: ReturnType<typeof setTimeout> | null = null;
  private overpassSub: any = null;
  private static readonly venueCache = new Map<string, NearbyVenue[]>();

  // Resolved address data
  venueName        = '';
  venueLat: number | null = null;
  venueLon: number | null = null;

  // Step 2 — autres
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

  // Confetti
  readonly confetti = Array.from({ length: 24 }, (_, i) => ({
    left:     (i * 4.3) % 98,
    color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay:    (i * 0.065),
    duration: 1.6 + (i % 5) * 0.3,
    width:    8  + (i % 4) * 3,
    height:   12 + (i % 3) * 5,
    rotate:   (i * 47) % 360,
  }));

  ngOnDestroy(): void {
    if (this.venueDebounce) clearTimeout(this.venueDebounce);
  }

  // ── Overpass sport tag mapping ─────────────────────────────────────────────
  private sportToOsm(sport: string): string {
    const map: Record<string, string> = {
      football: 'soccer', basketball: 'basketball', tennis: 'tennis',
      padel: 'padel', volleyball: 'volleyball', natation: 'swimming',
      boxe: 'boxing', cyclisme: 'cycling', fitness: 'fitness', running: 'running',
    };
    return map[sport] || 'soccer';
  }

  // ── Haversine distance (km) ────────────────────────────────────────────────
  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ── Computed ─────────────────────────────────────────────────────────────
  get progressPct(): number { return Math.round((this.step / 3) * 100); }

  get canNext1(): boolean { return !!this.sport && !!this.level; }
  get canNext2(): boolean {
    return !!this.selectedCountry && this.regionSelected && this.venueSelected
        && !!this.date && !!this.time && this.maxParticipants >= 2;
  }
  get canSubmit(): boolean { return !!this.title.trim() && !this.submitting; }

  get fomoMessage(): string {
    const s = SPORTS.find(x => x.id === this.sport);
    return s
      ? `⚡ ${s.active} joueurs de ${s.label} cherchent un match ce soir près de toi`
      : '⚡ Des centaines de joueurs cherchent une session ce soir';
  }

  get sportEmoji(): string { return SPORTS.find(x => x.id === this.sport)?.emoji ?? '🏅'; }
  get levelLabel(): string { return LEVELS.find(x => x.id === this.level)?.label ?? '—'; }

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

  get timeUntil(): { label: string; sublabel: string; tier: 'now' | 'soon' | 'today' | 'week' | 'future' } | null {
    if (!this.date || !this.time) return null;
    try {
      const dt      = new Date(`${this.date}T${this.time}`);
      const diffMs  = dt.getTime() - Date.now();
      if (diffMs <= 0) return { label: 'Maintenant', sublabel: 'Session imminente', tier: 'now' };
      const diffMin = Math.floor(diffMs / 60_000);
      const diffH   = Math.floor(diffMin / 60);
      const diffD   = Math.floor(diffH   / 24);
      if (diffH < 2) {
        const m = diffMin % 60;
        return { label: `${diffH}h${m > 0 ? m + 'min' : ''}`, sublabel: 'Urgent — crée maintenant !', tier: 'now' };
      }
      if (diffH < 12) return { label: `${diffH}h`, sublabel: 'Aujourd\'hui, action rapide', tier: 'soon' };
      if (diffH < 24) return { label: `${diffH}h`, sublabel: 'Ce soir ou cette nuit', tier: 'today' };
      if (diffD < 7)  return { label: `${diffD}j`, sublabel: diffD === 1 ? 'Demain' : `Dans ${diffD} jours`, tier: 'week' };
      const w = Math.floor(diffD / 7);
      return { label: `${w} sem.`, sublabel: `Dans ${diffD} jours`, tier: 'future' };
    } catch { return null; }
  }

  // ── Sport ─────────────────────────────────────────────────────────────────
  selectSport(id: string): void {
    this.sport = id;
    if (!this.titleManuallyEdited) this.autoTitle();
  }

  // ── Pays ──────────────────────────────────────────────────────────────────
  selectCountry(c: string): void {
    this.selectedCountry = c;
    // Reset region when switching country
    this.regionQuery = '';
    this.regionSelected = false;
    this.selectedCity = '';
    this.selectedLat = 0;
    this.selectedLon = 0;
    this.mapSafeUrl = null;
    // Reset venue too
    this.venueQuery = '';
    this.venueSelected = false;
    this.venueName = '';
    this.venueLat = null;
    this.venueLon = null;
    if (!this.titleManuallyEdited) this.autoTitle();
    // Show regions immediately
    this.regionSuggestions = this.regionsFor(c);
    this.showRegionSuggestions = true;
  }

  // ── Région autocomplete ───────────────────────────────────────────────────
  onRegionFocus(): void {
    this.regionSuggestions = this.filterRegions(this.regionQuery);
    this.showRegionSuggestions = true;
  }

  onRegionInput(): void {
    this.regionSelected = false;
    this.regionSuggestions = this.filterRegions(this.regionQuery);
    this.showRegionSuggestions = true;
  }

  onRegionBlur(): void {
    setTimeout(() => { this.showRegionSuggestions = false; }, 200);
  }

  selectRegion(r: RegionResult): void {
    this.regionQuery    = r.name;
    this.selectedCity   = r.name;
    this.selectedLat    = r.lat;
    this.selectedLon    = r.lon;
    this.regionSelected = true;
    this.showRegionSuggestions = false;
    this.mapSafeUrl = this.buildMapUrl(r.lat, r.lon, 0.6);
    if (!this.titleManuallyEdited) this.autoTitle();
    // Reset venue + search nearby
    this.venueQuery = '';
    this.venueSelected = false;
    this.venueName = '';
    this.venueLat = null;
    this.venueLon = null;
    this.selectedNearbyId = null;
    const searchLat = this.userLat ?? r.lat;
    const searchLon = this.userLon ?? r.lon;
    this.searchNearbyVenues(searchLat, searchLon);
  }

  // ── Nearby venues (Overpass) ──────────────────────────────────────────────

  useMyLocation(): void {
    if (!navigator.geolocation) { this.locError = 'Géolocalisation non disponible'; return; }
    this.locating  = true;
    this.locError  = '';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.locating = false;
        this.userLat  = pos.coords.latitude;
        this.userLon  = pos.coords.longitude;
        this.searchNearbyVenues(this.userLat, this.userLon);
        // Update map to user location
        this.mapSafeUrl = this.buildMapUrl(this.userLat, this.userLon, 0.05);
      },
      () => { this.locating = false; this.locError = 'Position refusée ou indisponible'; },
      { timeout: 8000, maximumAge: 60_000 }
    );
  }

  searchNearbyVenues(lat: number, lon: number): void {
    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)},${this.sport}`;
    const cached = ActivityCreateComponent.venueCache.get(cacheKey);
    if (cached) {
      this.nearbyVenues = cached;
      if (cached.length === 0) {
        this.venueSearchErr = 'Aucun terrain trouvé dans cette zone. Saisir une adresse manuellement.';
      }
      return;
    }

    const osmSport = this.sportToOsm(this.sport);
    const radius   = 10000; // 10 km — tighter radius for faster response
    const query =
      `[out:json][timeout:10];` +
      `(node["leisure"="pitch"]["sport"="${osmSport}"](around:${radius},${lat},${lon});` +
      ` way["leisure"="pitch"]["sport"="${osmSport}"](around:${radius},${lat},${lon});` +
      ` node["leisure"="sports_centre"](around:${radius},${lat},${lon});` +
      ` way["leisure"="sports_centre"](around:${radius},${lat},${lon});` +
      `);out center 20;`;

    this.loadingVenues  = true;
    this.venueSearchErr = '';
    this.nearbyVenues   = [];

    if (this.overpassSub) { this.overpassSub.unsubscribe(); }

    const encodedQuery = encodeURIComponent(query);
    this.overpassSub = this.http
      .get<any>(`https://overpass-api.de/api/interpreter?data=${encodedQuery}`)
      .pipe(
        timeout(10000),
        catchError(() =>
          this.http.post<any>(
            'https://overpass.kumi.systems/api/interpreter',
            query,
            { headers: { 'Content-Type': 'text/plain' } }
          ).pipe(timeout(10000), catchError(() => of(null)))
        )
      )
      .subscribe({
        next: (res) => {
          if (!res) {
            this.loadingVenues  = false;
            this.venueSearchErr = 'Aucun terrain trouvé dans cette zone.';
            ActivityCreateComponent.venueCache.set(cacheKey, []);
            return;
          }
          const venues = this.parseOverpassResult(res, lat, lon);
          const sorted = venues
            .sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99))
            .slice(0, 20);
          ActivityCreateComponent.venueCache.set(cacheKey, sorted);
          this.nearbyVenues  = sorted;
          this.loadingVenues = false;
          if (sorted.length === 0) {
            this.venueSearchErr = 'Aucun terrain trouvé dans cette zone. Saisir une adresse manuellement.';
          }
        },
      });
  }

  private parseOverpassResult(res: any, refLat: number, refLon: number): NearbyVenue[] {
    const seen = new Set<string>();
    return (res.elements ?? [])
      .filter((e: any) => {
        const eLat = e.type === 'way' ? e.center?.lat : e.lat;
        const eLon = e.type === 'way' ? e.center?.lon : e.lon;
        return eLat != null && eLon != null;
      })
      .map((e: any): NearbyVenue | null => {
        const eLat    = e.type === 'way' ? e.center.lat : e.lat;
        const eLon    = e.type === 'way' ? e.center.lon : e.lon;
        const t       = e.tags ?? {};
        const houseNo = (t['addr:housenumber'] ?? '').trim();
        const street  = (t['addr:street']      ?? '').trim();
        const city    = (t['addr:city']        ?? '').trim();
        const addrStr = [houseNo, street].filter(Boolean).join(' ');
        const fullAddr = [addrStr, city].filter(Boolean).join(', ');
        const name = t.name?.trim() || t.operator?.trim() || (addrStr || null);
        if (!name) return null;
        // Dedup by rounded coordinates (within ~100m)
        const geoKey = `${eLat.toFixed(3)},${eLon.toFixed(3)}`;
        if (seen.has(geoKey)) return null;
        seen.add(geoKey);
        const address = (name === addrStr && city) ? city
                      : (name !== fullAddr && fullAddr) ? fullAddr
                      : '';
        return {
          id: `${e.type}-${e.id}`,
          name,
          address,
          lat: eLat,
          lon: eLon,
          distance: this.haversine(refLat, refLon, eLat, eLon),
          sportTag: t.sport,
        };
      })
      .filter((v: NearbyVenue | null): v is NearbyVenue => v !== null);
  }

  selectNearbyVenue(v: NearbyVenue): void {
    this.selectedNearbyId = v.id;
    this.venueName        = v.name;
    this.venueLat         = v.lat;
    this.venueLon         = v.lon;
    this.venueSelected    = true;
    this.venueQuery       = '';
    this.mapSafeUrl       = this.buildMapUrl(v.lat, v.lon, 0.004);
    if (!this.titleManuallyEdited) this.autoTitle();
  }

  formatDist(km: number | undefined): string {
    if (km === undefined) return '';
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }

  venueIcon(v: NearbyVenue): string {
    const tag = (v.sportTag ?? this.sport ?? '').toLowerCase();
    const map: Record<string, string> = {
      football: '⚽', soccer: '⚽', basketball: '🏀', tennis: '🎾',
      padel: '🏸', volleyball: '🏐', swimming: '🏊', natation: '🏊',
      boxing: '🥊', boxe: '🥊', cycling: '🚴', cyclisme: '🚴',
      running: '🏃', fitness: '💪',
    };
    return map[tag] ?? '🏟️';
  }

  private regionsFor(country: string): RegionResult[] {
    return country === 'France' ? REGIONS_FR : REGIONS_MA;
  }

  private filterRegions(q: string): RegionResult[] {
    const pool = this.regionsFor(this.selectedCountry);
    if (!q.trim()) return pool;
    const lq = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return pool.filter(r =>
      r.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(lq) ||
      r.capital.toLowerCase().includes(lq)
    );
  }

  // ── Venue address autocomplete ────────────────────────────────────────────

  onVenueFocus(): void {
    if (this.venueSuggestions.length > 0) this.showVenueSuggestions = true;
  }

  onVenueInput(): void {
    this.venueSelected = false;
    const q = this.venueQuery.trim();
    this.showVenueSuggestions = false;

    if (this.venueDebounce) clearTimeout(this.venueDebounce);
    if (q.length >= 3) {
      this.loadingVenue = true;
      this.venueDebounce = setTimeout(() => this.searchNominatimAddress(q), 450);
    } else {
      this.loadingVenue = false;
      this.venueSuggestions = [];
    }
  }

  onVenueBlur(): void {
    setTimeout(() => { this.showVenueSuggestions = false; }, 200);
  }

  selectVenue(a: AddressResult): void {
    this.venueQuery            = a.label;
    this.venueName             = a.label;
    this.venueLat              = a.lat;
    this.venueLon              = a.lon;
    this.venueSelected         = true;
    this.showVenueSuggestions  = false;
    // Show address-level map (tight zoom)
    this.mapSafeUrl = this.buildMapUrl(a.lat, a.lon, 0.004);
  }

  private searchNominatimAddress(q: string): void {
    const cc = this.selectedCountry === 'France' ? 'fr' : this.selectedCountry === 'Maroc' ? 'ma' : 'ma,fr';
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6` +
      `&countrycodes=${cc}&accept-language=fr`;

    this.http.get<any[]>(url).subscribe({
      next: (results) => {
        this.venueSuggestions = results.map(r => {
          const a = r.address ?? {};
          const num    = a.house_number ? `${a.house_number} ` : '';
          const road   = a.road || a.pedestrian || a.footway || '';
          const post   = a.postcode ? `${a.postcode} ` : '';
          const city   = a.city || a.town || a.village || a.suburb || '';
          const label  = [num + road, post + city].filter(Boolean).join(', ') || r.display_name.split(',').slice(0,3).join(',');
          return { label: label.trim(), full: r.display_name, lat: parseFloat(r.lat), lon: parseFloat(r.lon) };
        }).filter(r => !!r.label);
        this.loadingVenue = false;
        this.showVenueSuggestions = this.venueSuggestions.length > 0;
      },
      error: () => { this.loadingVenue = false; },
    });
  }

  private buildMapUrl(lat: number, lon: number, delta = 0.07): SafeResourceUrl {
    const url = `https://www.openstreetmap.org/export/embed.html` +
      `?bbox=${lon - delta},${lat - delta},${lon + delta},${lat + delta}` +
      `&layer=mapnik&marker=${lat},${lon}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // ── Time / title helpers ──────────────────────────────────────────────────
  onTimeChange(): void  { if (!this.titleManuallyEdited) this.autoTitle(); }
  onTitleInput(): void  { this.titleManuallyEdited = true; }

  private autoTitle(): void {
    const s = SPORTS.find(x => x.id === this.sport);
    if (!s) return;
    this.title = `${s.label} ${this.timeLabel()} — ${this.selectedCity}`;
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

    const req: CreateActivityRequest = {
      title:           this.title.trim(),
      sport:           this.sport,
      requiredLevel:   this.level,
      latitude:        this.venueLat ?? this.selectedLat,
      longitude:       this.venueLon ?? this.selectedLon,
      venueName:       this.venueName.trim(),
      city:            this.selectedCity,
      country:         this.selectedCountry || 'Maroc',
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