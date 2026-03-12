import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin, catchError, of } from 'rxjs';
import { ActivityService, UserService, RatingService } from '@momentum/api-client';
import { AuthService } from '@momentum/api-client';
import { Activity, ActivityMessage, Participant, User } from '@momentum/models';
import { PlayerStats } from '@momentum/models';
import { MnBadgeComponent } from '@momentum/ui';
import { environment } from '../../../../environments/environment';

interface TravelRoute { duration: string; distance: string; isEstimate?: boolean; }
type TravelMode = 'car' | 'bike' | 'walk';

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
  private readonly location        = inject(Location);
  private readonly activityService = inject(ActivityService);
  private readonly authService     = inject(AuthService);
  private readonly userService     = inject(UserService);
  private readonly ratingService   = inject(RatingService);
  private readonly http            = inject(HttpClient);
  private readonly sanitizer       = inject(DomSanitizer);

  activity: Activity | null = null;
  loading  = true;
  error    = false;
  joining   = false;
  completing = false;

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

  // ── Map & itinerary ────────────────────────────────────────────────────
  mapUrl: SafeResourceUrl | null = null;
  userLat: number | null = null;
  userLon: number | null = null;
  userAddress   = '';
  locating      = false;
  locError      = '';
  activeTravelMode: TravelMode = 'car';
  travelRoutes: Partial<Record<TravelMode, TravelRoute>> = {};
  loadingTravel = false;

  // ── Chat ───────────────────────────────────────────────────────────────
  messages: ActivityMessage[] = [];
  chatInput    = '';
  sending      = false;
  chatError    = '';
  private chatInterval:     ReturnType<typeof setInterval> | null = null;
  private activityInterval: ReturnType<typeof setInterval> | null = null;

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
  get isFull(): boolean {
    return this.spotsLeft <= 0 || this.activity?.status === 'FULL';
  }

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

  goBack(): void {
    if (this.location.getState() && (this.location.getState() as any).navigationId > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/activities']);
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/activities']); return; }

    this.activityService.getById(id).subscribe({
      next: (a) => {
        this.activity = a;
        this.loading  = false;
        this.mapUrl   = this.buildMapUrl(a.location.latitude, a.location.longitude);
        this.startCountdown();
        this.loadChat();
        this.startChatPolling();
      },
      error: () => { this.error = true; this.loading = false; },
    });
  }

  ngOnDestroy(): void {
    if (this.countdownInterval)   clearInterval(this.countdownInterval);
    if (this.chatInterval)        clearInterval(this.chatInterval);
    if (this.activityInterval)    clearInterval(this.activityInterval);
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

  get timeUntilTier(): 'now' | 'soon' | 'today' | 'week' | 'future' | 'past' {
    if (!this.activity) return 'future';
    const diff = new Date(this.activity.scheduledAt).getTime() - Date.now();
    if (diff <= 0) return 'past';
    const h = diff / 3_600_000;
    if (h < 2)  return 'now';
    if (h < 12) return 'soon';
    if (h < 24) return 'today';
    if (h < 168) return 'week';
    return 'future';
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

  participantInitial(p: Participant): string {
    if (p.firstName && p.lastName) return (p.firstName[0] + p.lastName[0]).toUpperCase();
    if (p.firstName) return p.firstName.slice(0, 2).toUpperCase();
    return p.userId.slice(0, 2).toUpperCase();
  }

  participantDisplayName(p: Participant, index: number): string {
    if (p.firstName && p.lastName) return `${p.firstName} ${p.lastName[0]}.`;
    if (p.firstName) return p.firstName;
    return `Joueur ${index + 1}`;
  }

  avatarHue(userId: string): number {
    let h = 0;
    for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) & 0xffffff;
    return Math.abs(h) % 360;
  }

  private get participantMap(): Map<string, Participant> {
    const map = new Map<string, Participant>();
    this.activity?.participants.forEach(p => map.set(p.userId, p));
    if (this.activity?.organizerId) {
      // organizer may not be in participants list
      if (!map.has(this.activity.organizerId)) {
        map.set(this.activity.organizerId, { userId: this.activity.organizerId, joinedAt: '' });
      }
    }
    return map;
  }

  messageSenderInitial(msg: ActivityMessage): string {
    if (msg.senderFirstName && msg.senderLastName)
      return (msg.senderFirstName[0] + msg.senderLastName[0]).toUpperCase();
    if (msg.senderFirstName)
      return msg.senderFirstName.slice(0, 2).toUpperCase();
    const p = this.participantMap.get(msg.senderId);
    if (!p) return msg.senderId.slice(0, 2).toUpperCase();
    return this.participantInitial(p);
  }

  messageSenderName(msg: ActivityMessage): string {
    if (msg.senderFirstName) {
      return msg.senderLastName
        ? `${msg.senderFirstName} ${msg.senderLastName[0]}.`
        : msg.senderFirstName;
    }
    const p = this.participantMap.get(msg.senderId);
    if (!p) return 'Joueur';
    if (p.firstName && p.lastName) return `${p.firstName} ${p.lastName[0]}.`;
    if (p.firstName) return p.firstName;
    return 'Joueur';
  }

  get isMatchSheetFull(): boolean {
    return this.activity?.status === 'FULL';
  }

  get isMatchCompleted(): boolean {
    return this.activity?.status === 'COMPLETED';
  }

  get canCompleteMatch(): boolean {
    return this.isOrganizer &&
      (this.activity?.status === 'ONGOING' || this.activity?.status === 'FULL');
  }

  completeMatch(): void {
    if (!this.activity || this.completing) return;
    this.completing = true;
    this.activityService.complete(this.activity.id).subscribe({
      next: (a) => { this.activity = a; this.completing = false; },
      error: () => { this.completing = false; },
    });
  }

  // ── Map & itinerary ──────────────────────────────────────────────────────

  private buildMapUrl(lat: number, lon: number): SafeResourceUrl {
    const d = 0.004;
    const url = `https://www.openstreetmap.org/export/embed.html` +
      `?bbox=${lon - d},${lat - d},${lon + d},${lat + d}` +
      `&layer=mapnik&marker=${lat},${lon}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private reverseGeocode(lat: number, lon: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=16&addressdetails=1`;
    this.http.get<any>(url).subscribe({
      next: (r) => {
        const a = r?.address ?? {};
        const parts = [
          a.road ?? a.pedestrian ?? a.path,
          a.house_number,
          a.suburb ?? a.neighbourhood,
          a.city ?? a.town ?? a.village,
        ].filter(Boolean);
        this.userAddress = parts.length ? parts.slice(0, 3).join(', ') : (r?.display_name?.split(',').slice(0, 2).join(', ') ?? '');
      },
      error: () => { this.userAddress = ''; },
    });
  }

  detectLocation(): void {
    if (!navigator.geolocation) { this.locError = 'Géolocalisation non supportée.'; return; }
    this.locating     = true;
    this.locError     = '';
    this.userAddress  = '';
    this.travelRoutes = {};
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.userLat = pos.coords.latitude;
        this.userLon = pos.coords.longitude;
        this.locating = false;
        this.applyLinearFallback();
        this.loadAllRoutes();
        this.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        this.locating = false;
        this.locError = 'Position introuvable. Vérifie les permissions.';
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  /** Straight-line distance + estimated time — shows instantly while OSRM loads.
   *  A road-detour factor of 1.3 is applied to correct the straight-line underestimate. */
  private applyLinearFallback(): void {
    if (this.userLat == null || !this.activity) return;
    const { latitude: toLat, longitude: toLon } = this.activity.location;
    const straightKm = this.haversineKm(this.userLat, this.userLon!, toLat, toLon);
    // Road is ~30% longer than straight-line
    const roadKm = straightKm * 1.3;
    const estimates: { mode: TravelMode; speed: number }[] = [
      { mode: 'car',  speed: 45 },
      { mode: 'bike', speed: 15 },
      { mode: 'walk', speed: 5  },
    ];
    const routes: Partial<Record<TravelMode, TravelRoute>> = {};
    for (const { mode, speed } of estimates) {
      const secs = (roadKm / speed) * 3600;
      routes[mode] = {
        duration: this.formatDuration(secs),
        distance: this.formatDistance(roadKm * 1000),
        isEstimate: true,
      };
    }
    this.travelRoutes = routes;
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  setTravelMode(mode: TravelMode): void {
    this.activeTravelMode = mode;
  }

  get activeRoute(): TravelRoute | null {
    return this.travelRoutes[this.activeTravelMode] ?? null;
  }

  openDirections(): void {
    if (!this.activity) return;
    const { latitude: toLat, longitude: toLon } = this.activity.location;
    const origin = this.userLat != null ? `${this.userLat},${this.userLon}` : '';
    const dest = `${toLat},${toLon}`;
    const url = origin
      ? `https://www.google.com/maps/dir/${origin}/${dest}`
      : `https://www.google.com/maps/dir//${dest}`;
    window.open(url, '_blank');
  }

  private loadAllRoutes(): void {
    if (this.userLat == null || !this.activity) return;
    const { latitude: toLat, longitude: toLon } = this.activity.location;

    const key = environment.googleMapsApiKey;
    if (key && !key.includes('YOUR-KEY')) {
      this.loadGoogleMapsRoutes(toLat, toLon, key);
    } else {
      this.loadOsrmRoutes(toLat, toLon);
    }
  }

  private loadGoogleMapsRoutes(toLat: number, toLon: number, apiKey: string): void {
    const gmaps = (window as any).google?.maps;
    const doRoute = () => {
      const service = new (window as any).google.maps.DirectionsService();
      const gmModes: { mode: TravelMode; travelMode: string }[] = [
        { mode: 'car',  travelMode: 'DRIVING'   },
        { mode: 'bike', travelMode: 'BICYCLING'  },
        { mode: 'walk', travelMode: 'WALKING'    },
      ];
      gmModes.forEach(({ mode, travelMode }) => {
        service.route({
          origin:      { lat: this.userLat, lng: this.userLon },
          destination: { lat: toLat, lng: toLon },
          travelMode,
        }, (result: any, status: string) => {
          if (status === 'OK' && result?.routes?.[0]?.legs?.[0]) {
            const leg = result.routes[0].legs[0];
            this.travelRoutes = {
              ...this.travelRoutes,
              [mode]: {
                duration:   leg.duration.text,
                distance:   leg.distance.text,
                isEstimate: false,
              },
            };
          }
        });
      });
    };

    if (gmaps?.DirectionsService) {
      doRoute();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=routes&callback=__gmapsReady`;
      script.async = true;
      (window as any).__gmapsReady = () => { doRoute(); };
      document.head.appendChild(script);
    }
  }

  private loadOsrmRoutes(toLat: number, toLon: number): void {
    const coords = `${this.userLon},${this.userLat};${toLon},${toLat}`;
    const modes: { mode: TravelMode; url: string }[] = [
      { mode: 'car',  url: `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`  },
      { mode: 'bike', url: `https://routing.openstreetmap.de/routed-bike/route/v1/cycling/${coords}?overview=false` },
      { mode: 'walk', url: `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coords}?overview=false`   },
    ];
    modes.forEach(({ mode, url }) => {
      this.http.get<any>(url).subscribe({
        next: (res) => {
          const route = res?.routes?.[0];
          if (route?.duration != null && route?.distance != null) {
            this.travelRoutes = {
              ...this.travelRoutes,
              [mode]: {
                duration:   this.formatDuration(route.duration),
                distance:   this.formatDistance(route.distance),
                isEstimate: false,
              },
            };
          }
        },
        error: () => { /* keep straight-line fallback */ },
      });
    });
  }

  private formatDuration(seconds: number): string {
    const m = Math.round(seconds / 60);
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)}h${m % 60 > 0 ? String(m % 60).padStart(2,'0') : ''}`;
  }

  private formatDistance(meters: number): string {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
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
    this.chatInterval     = setInterval(() => this.loadChat(), 10_000);
    // Also refresh the activity itself so participants/status/spots stay current
    this.activityInterval = setInterval(() => this.reload(), 20_000);
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
}
