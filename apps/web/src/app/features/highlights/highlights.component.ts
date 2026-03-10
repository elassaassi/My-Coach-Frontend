import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HighlightService, AuthService } from '@momentum/api-client';
import { Highlight, MediaType } from '@momentum/models';

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

@Component({
  selector: 'app-highlights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './highlights.component.html',
  styleUrls: ['./highlights.component.scss'],
})
export class HighlightsComponent implements OnInit {
  private readonly highlightService = inject(HighlightService);
  private readonly authService      = inject(AuthService);

  highlightOfDay: Highlight | null = null;
  feed: Highlight[] = [];
  loading = true;

  // Like state (local toggle)
  likedIds = new Set<string>();
  likingId: string | null = null;

  // Publish modal
  modalOpen       = false;
  publishMediaUrl = '';
  publishType: MediaType = 'PHOTO';
  publishCaption  = '';
  publishSport    = 'football';
  publishing      = false;
  publishError    = '';

  // Upload state
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  dragOver = false;

  readonly allSports = Object.entries(SPORT_META).map(([id, m]) => ({ id, ...m }));

  get currentUserId(): string | null { return this.authService.currentUserId; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.highlightService.getHighlightOfDay().subscribe({
      next: (h) => { this.highlightOfDay = h; },
      error: () => {},
    });
    this.highlightService.getFeed().subscribe({
      next: (list) => { this.feed = list; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  // ── Like ───────────────────────────────────────────────────────────────────

  toggleLike(h: Highlight): void {
    if (this.likingId) return;
    const nowLiked = !this.likedIds.has(h.id);
    this.likingId = h.id;
    this.highlightService.like(h.id, nowLiked).subscribe({
      next: () => {
        if (nowLiked) {
          this.likedIds.add(h.id);
          h.likeCount++;
        } else {
          this.likedIds.delete(h.id);
          h.likeCount = Math.max(0, h.likeCount - 1);
        }
        this.likingId = null;
      },
      error: () => { this.likingId = null; },
    });
  }

  isLiked(id: string): boolean { return this.likedIds.has(id); }

  // ── Publish modal ──────────────────────────────────────────────────────────

  openModal(): void {
    this.modalOpen       = true;
    this.publishError    = '';
    this.publishMediaUrl = '';
    this.publishCaption  = '';
    this.publishSport    = 'football';
    this.publishType     = 'PHOTO';
    this.selectedFile    = null;
    this.previewUrl      = null;
    this.dragOver        = false;
  }

  closeModal(): void { this.modalOpen = false; }

  // ── File upload ────────────────────────────────────────────────────────────

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.handleFile(input.files[0]);
    input.value = '';   // reset input so same file can be re-selected
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }

  handleFile(file: File): void {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      this.publishError = 'Seules les images et vidéos sont acceptées.';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.publishError = 'Fichier trop volumineux (max 50 Mo).';
      return;
    }
    this.publishError    = '';
    this.selectedFile    = file;
    this.publishMediaUrl = '';
    this.publishType     = file.type.startsWith('video/') ? 'VIDEO' : 'PHOTO';
    this.previewUrl      = null;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => this.previewUrl = e.target?.result as string;
      reader.readAsDataURL(file);
    } else {
      this.generateVideoThumbnail(file);
    }
  }

  private generateVideoThumbnail(file: File): void {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted   = true;
    video.playsInline = true;

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(0.5, video.duration / 2);
    }, { once: true });

    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width  = video.videoWidth  || 320;
      canvas.height = video.videoHeight || 180;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.previewUrl = canvas.toDataURL('image/jpeg', 0.85);
      URL.revokeObjectURL(objectUrl);
    }, { once: true });

    video.src = objectUrl;
  }

  removeFile(): void {
    this.selectedFile    = null;
    this.previewUrl      = null;
    this.publishMediaUrl = '';
    this.publishError    = '';
  }

  get canPublish(): boolean {
    return !this.publishing && !!this.publishCaption.trim() &&
           (!!this.selectedFile || !!this.publishMediaUrl.trim());
  }

  // ── Publish ────────────────────────────────────────────────────────────────

  publish(): void {
    if (!this.canPublish) return;
    this.publishError = '';
    this.publishing   = true;

    if (this.selectedFile) {
      this.highlightService.uploadFile(this.selectedFile).subscribe({
        next: (url) => { this.publishMediaUrl = url; this.doPublish(); },
        error: (err) => {
          this.publishing   = false;
          this.publishError = err?.error?.error ?? 'Erreur lors de l\'upload.';
        },
      });
    } else {
      this.doPublish();
    }
  }

  private doPublish(): void {
    this.highlightService.publish({
      mediaUrl:  this.publishMediaUrl.trim(),
      mediaType: this.publishType,
      caption:   this.publishCaption.trim(),
      sport:     this.publishSport,
    }).subscribe({
      next: () => {
        this.publishing = false;
        this.closeModal();
        this.load();
      },
      error: (err) => {
        this.publishing   = false;
        this.publishError = err?.error?.error ?? 'Erreur lors de la publication.';
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  sportMeta(sport: string) { return SPORT_META[sport] ?? { emoji: '🏅', label: sport }; }

  avatarHue(id: string | null | undefined): number {
    if (!id) return 0;
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffff;
    return Math.abs(h) % 360;
  }

  avatarInitial(id: string | null | undefined): string {
    return id ? id.slice(0, 2).toUpperCase() : '??';
  }

  isImage(url: string): boolean {
    return /\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i.test(url);
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60_000);
    const h = Math.floor(diff / 3_600_000);
    const d = Math.floor(diff / 86_400_000);
    if (m < 1)  return 'à l\'instant';
    if (m < 60) return `il y a ${m}min`;
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${d}j`;
  }

  feedWithoutHod(): Highlight[] {
    if (!this.highlightOfDay) return this.feed;
    return this.feed.filter(h => h.id !== this.highlightOfDay!.id);
  }
}