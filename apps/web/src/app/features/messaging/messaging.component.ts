import {
  Component, ElementRef, OnDestroy, OnInit, ViewChild, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, MessagingService, UserService } from '@momentum/api-client';
import { Conversation, Message, User } from '@momentum/models';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messaging.component.html',
  styleUrls: ['./messaging.component.scss']
})
export class MessagingComponent implements OnInit, OnDestroy {
  private readonly messagingService = inject(MessagingService);
  private readonly userService      = inject(UserService);
  private readonly authService      = inject(AuthService);

  @ViewChild('messagesList') messagesList!: ElementRef<HTMLElement>;

  readonly currentUserId = this.authService.currentUserId;

  conversations: Conversation[]      = [];
  selectedConversation: Conversation | null = null;
  messages: Message[]                = [];
  userCache                          = new Map<string, User>();

  loadingConversations = true;
  loadingMessages      = false;
  sending              = false;
  draft                = '';

  private pollInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadConversations(): void {
    this.loadingConversations = true;
    this.messagingService.getMyConversations().subscribe({
      next: convs => {
        this.conversations    = convs;
        this.loadingConversations = false;
        convs.forEach(c => this.prefetchUser(c.otherParticipantId));
      },
      error: () => { this.loadingConversations = false; }
    });
  }

  selectConversation(conv: Conversation): void {
    if (this.selectedConversation?.id === conv.id) return;
    this.selectedConversation = conv;
    this.messages             = [];
    this.loadMessages(conv.id);
    this.startPolling(conv.id);
  }

  send(): void {
    const content = this.draft.trim();
    if (!content || !this.selectedConversation || this.sending) return;

    this.sending = true;
    this.messagingService.sendMessage({
      recipientId: this.selectedConversation.otherParticipantId,
      content
    }).subscribe({
      next: msg => {
        this.draft   = '';
        this.sending = false;
        this.messages = [...this.messages, msg];
        this.updateConvPreview(this.selectedConversation!.id, content);
        this.scrollToBottom();
      },
      error: () => { this.sending = false; }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  isOwn(msg: Message): boolean {
    return msg.senderId === this.currentUserId;
  }

  displayName(userId: string): string {
    const u = this.userCache.get(userId);
    return u ? `${u.firstName} ${u.lastName}` : '…';
  }

  initials(userId: string): string {
    const u = this.userCache.get(userId);
    return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '?';
  }

  avatarUrl(userId: string): string | null {
    return this.userCache.get(userId)?.avatarUrl ?? null;
  }

  relativeTime(iso: string): string {
    const diff  = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60_000);
    if (mins < 1)  return 'à l\'instant';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  timeLabel(iso: string): string {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private loadMessages(conversationId: string): void {
    this.loadingMessages = true;
    this.messagingService.getMessages(conversationId).subscribe({
      next: msgs => {
        // backend renvoie les plus récents en premier → on inverse pour affichage chrono
        this.messages        = [...msgs].reverse();
        this.loadingMessages = false;
        this.scrollToBottom();
      },
      error: () => { this.loadingMessages = false; }
    });
  }

  private startPolling(conversationId: string): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      if (this.selectedConversation?.id !== conversationId) return;
      this.messagingService.getMessages(conversationId).subscribe({
        next: msgs => {
          const refreshed = [...msgs].reverse();
          if (refreshed.length > this.messages.length) {
            this.messages = refreshed;
            this.scrollToBottom();
          }
        }
      });
    }, 5_000);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private prefetchUser(userId: string): void {
    if (this.userCache.has(userId)) return;
    this.userService.getById(userId).subscribe({
      next: u => this.userCache.set(u.id, u)
    });
  }

  private updateConvPreview(convId: string, preview: string): void {
    this.conversations = this.conversations.map(c =>
      c.id === convId
        ? { ...c, lastMessagePreview: preview, lastMessageAt: new Date().toISOString() }
        : c
    );
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesList?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }
}