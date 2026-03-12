import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HighlightService, AuthService } from '@momentum/api-client';
import { Comment, Highlight, MediaType } from '@momentum/models';

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

interface FilterDef { id: string; name: string; css: string; }

const FILTERS: FilterDef[] = [
  { id: 'original', name: 'Original', css: 'none' },
  { id: 'vivid',    name: 'Vivid',    css: 'saturate(1.8) contrast(1.1)' },
  { id: 'vintage',  name: 'Vintage',  css: 'sepia(0.5) contrast(1.05) brightness(1.05)' },
  { id: 'frost',    name: 'Frost',    css: 'hue-rotate(195deg) saturate(0.7) brightness(1.1)' },
  { id: 'nb',       name: 'N&B',      css: 'grayscale(1) contrast(1.2)' },
  { id: 'drama',    name: 'Drama',    css: 'contrast(1.6) brightness(0.85) saturate(0.7)' },
  { id: 'sunset',   name: 'Sunset',   css: 'hue-rotate(-20deg) saturate(1.6) brightness(1.05)' },
  { id: 'boost',    name: 'Boost',    css: 'saturate(2.2) brightness(1.1) contrast(1.08)' },
];

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
  private readonly router           = inject(Router);

  highlightOfDay: Highlight | null = null;
  feed: Highlight[] = [];
  loading = true;

  // Like state
  likedIds = new Set<string>();
  likingId: string | null = null;

  // Feed filter
  myFeedOnly = false;

  // Viewer (lightbox)
  viewHighlight: Highlight | null = null;

  // Comments
  comments: Comment[] = [];
  commentsLoading = false;
  newComment = '';
  submittingComment = false;

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

  // Filters
  readonly filters = FILTERS;
  selectedFilter: FilterDef = FILTERS[0];

  readonly allSports = Object.entries(SPORT_META).map(([id, m]) => ({ id, ...m }));

  get currentUserId(): string | null { return this.authService.currentUserId; }
  get isAdmin(): boolean { return this.authService.isAdmin; }

  canDelete(h: Highlight): boolean {
    return !!this.currentUserId && (h.publisherId === this.currentUserId || this.isAdmin);
  }

  // Delete state
  deletingId: string | null = null;
  deleteConfirmId: string | null = null;

  // Context menu (⋯)
  menuOpenId: string | null = null;

  // Edit state
  editingHighlight: Highlight | null = null;
  editCaption = '';
  editSport = '';
  savingEdit = false;
  editError = '';

  // Archive / undo toast
  archivingId: string | null = null;
  archivedHighlight: Highlight | null = null;
  archiveProgress = 100;
  private archiveInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.highlightService.getHighlightOfDay().subscribe({
      next: (h) => { this.highlightOfDay = h ?? null; },
      error: () => {},
    });
    this.highlightService.getFeed().subscribe({
      next: (list) => { this.feed = list ?? []; this.loading = false; },
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

  // ── Viewer (lightbox) ──────────────────────────────────────────────────────

  openViewer(h: Highlight): void {
    this.viewHighlight = h;
    this.newComment = '';
    this.loadComments(h.id);
  }

  closeViewer(): void {
    this.viewHighlight = null;
    this.comments = [];
  }

  // ── Context menu ───────────────────────────────────────────────────────────

  openMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.menuOpenId = this.menuOpenId === id ? null : id;
  }

  closeMenu(): void { this.menuOpenId = null; }

  // ── Edit ────────────────────────────────────────────────────────────────────

  startEdit(h: Highlight): void {
    this.menuOpenId = null;
    this.editingHighlight = h;
    this.editCaption = h.caption;
    this.editSport   = h.sport;
    this.editError   = '';
  }

  cancelEdit(): void {
    this.editingHighlight = null;
    this.editError = '';
  }

  saveEdit(): void {
    if (this.savingEdit || !this.editingHighlight) return;
    const h = this.editingHighlight;
    if (!this.editCaption.trim()) { this.editError = 'La légende ne peut pas être vide.'; return; }
    this.savingEdit = true;
    this.highlightService.update(h.id, this.editCaption.trim(), this.editSport).subscribe({
      next: () => {
        h.caption  = this.editCaption.trim();
        h.sport    = this.editSport;
        (h as any).editedAt = new Date().toISOString();
        if (this.viewHighlight?.id === h.id) {
          this.viewHighlight = { ...this.viewHighlight, caption: h.caption, sport: h.sport, editedAt: (h as any).editedAt };
        }
        this.savingEdit = false;
        this.editingHighlight = null;
      },
      error: () => { this.savingEdit = false; this.editError = 'Erreur lors de la sauvegarde.'; },
    });
  }

  // ── Archive / undo ─────────────────────────────────────────────────────────

  archivePost(h: Highlight): void {
    if (this.archivingId) return;
    this.menuOpenId  = null;
    this.archivingId = h.id;
    this.highlightService.archive(h.id, true).subscribe({
      next: () => {
        this.feed = this.feed.filter(x => x.id !== h.id);
        if (this.viewHighlight?.id === h.id) this.closeViewer();
        this.archivingId = null;
        this.showArchiveToast(h);
      },
      error: () => { this.archivingId = null; },
    });
  }

  private showArchiveToast(h: Highlight): void {
    this.clearArchiveTimer();
    this.archivedHighlight = h;
    this.archiveProgress   = 100;
    let elapsed = 0;
    this.archiveInterval = setInterval(() => {
      elapsed += 100;
      this.archiveProgress = Math.max(0, 100 - (elapsed / 5000) * 100);
      if (elapsed >= 5000) { this.clearArchiveTimer(); this.archivedHighlight = null; }
    }, 100);
  }

  undoArchive(): void {
    if (!this.archivedHighlight) return;
    const h = this.archivedHighlight;
    this.clearArchiveTimer();
    this.archivedHighlight = null;
    this.highlightService.archive(h.id, false).subscribe({
      next: () => { this.feed = [h, ...this.feed]; },
      error: () => {},
    });
  }

  private clearArchiveTimer(): void {
    if (this.archiveInterval) { clearInterval(this.archiveInterval); this.archiveInterval = null; }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  requestDelete(h: Highlight): void {
    this.deleteConfirmId = h.id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  confirmDelete(h: Highlight): void {
    if (this.deletingId) return;
    this.deletingId = h.id;
    this.deleteConfirmId = null;
    this.highlightService.delete(h.id).subscribe({
      next: () => {
        this.feed = this.feed.filter(x => x.id !== h.id);
        if (this.highlightOfDay?.id === h.id) this.highlightOfDay = null;
        if (this.viewHighlight?.id === h.id) this.closeViewer();
        this.deletingId = null;
      },
      error: () => { this.deletingId = null; },
    });
  }

  goToProfile(publisherId: string): void {
    this.closeViewer();
    if (publisherId === this.currentUserId) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/profile', publisherId]);
    }
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  loadComments(id: string): void {
    this.commentsLoading = true;
    this.comments = [];
    this.highlightService.getComments(id).subscribe({
      next: (list) => { this.comments = list ?? []; this.commentsLoading = false; },
      error: () => { this.commentsLoading = false; },
    });
  }

  submitComment(): void {
    if (!this.newComment.trim() || this.submittingComment || !this.viewHighlight) return;
    this.submittingComment = true;
    const content = this.newComment.trim();
    this.highlightService.addComment(this.viewHighlight.id, content).subscribe({
      next: (res) => {
        const c: Comment = {
          id: res.id,
          highlightId: this.viewHighlight!.id,
          authorId: this.currentUserId ?? 'me',
          content,
          createdAt: new Date().toISOString(),
        };
        this.comments = [...this.comments, c];
        this.newComment = '';
        this.submittingComment = false;
        if (this.viewHighlight) {
          this.viewHighlight.commentCount = (this.viewHighlight.commentCount ?? 0) + 1;
        }
      },
      error: () => { this.submittingComment = false; },
    });
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  selectFilter(f: FilterDef): void { this.selectedFilter = f; }

  get previewFilterStyle(): string {
    return this.selectedFilter.css === 'none' ? '' : this.selectedFilter.css;
  }

  private applyFilterToFile(file: File, filterCss: string): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.filter = filterCss;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          blob => resolve(new File([blob!], file.name, { type: 'image/jpeg' })),
          'image/jpeg', 0.92
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

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
    this.selectedFilter  = FILTERS[0];
  }

  closeModal(): void { this.modalOpen = false; }

  // ── File upload ────────────────────────────────────────────────────────────

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.handleFile(input.files[0]);
    input.value = '';
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
    // MOV info: will be transcoded to MP4 server-side
    const name = file.name.toLowerCase();
    if (name.endsWith('.mov') || name.endsWith('.avi') || name.endsWith('.mkv')) {
      this.publishError = '⚙️ Format détecté — conversion MP4 automatique lors de l\'upload (quelques secondes).';
    }
    this.publishError    = '';
    this.selectedFile    = file;
    this.publishMediaUrl = '';
    this.publishType     = file.type.startsWith('video/') ? 'VIDEO' : 'PHOTO';
    this.previewUrl      = null;
    this.selectedFilter  = FILTERS[0];

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
    this.selectedFilter  = FILTERS[0];
  }

  get canPublish(): boolean {
    return !this.publishing && !!this.publishCaption.trim() &&
           (!!this.selectedFile || !!this.publishMediaUrl.trim());
  }

  // ── Publish ────────────────────────────────────────────────────────────────

  async publish(): Promise<void> {
    if (!this.canPublish) return;
    this.publishError = '';
    this.publishing   = true;

    let fileToUpload = this.selectedFile;

    if (fileToUpload && this.publishType === 'PHOTO' && this.selectedFilter.css !== 'none') {
      try {
        fileToUpload = await this.applyFilterToFile(fileToUpload, this.selectedFilter.css);
      } catch { /* use original on error */ }
    }

    if (fileToUpload) {
      this.highlightService.uploadFile(fileToUpload).subscribe({
        next: (url) => { this.publishMediaUrl = url; this.doPublish(); },
        error: (err) => {
          this.publishing   = false;
          this.publishError = err?.error?.error ?? "Erreur lors de l'upload.";
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
    let list = this.feed.filter(h => !this.highlightOfDay || h.id !== this.highlightOfDay.id);
    if (this.myFeedOnly) list = list.filter(h => h.publisherId === this.currentUserId);
    return list;
  }
}