import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Conversation, Message, SendMessageRequest } from '@momentum/models';

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/v1/messages';

  sendMessage(req: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>(this.BASE, req);
  }

  getMyConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.BASE}/conversations`);
  }

  getMessages(conversationId: string, page = 0, size = 40): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.BASE}/conversations/${conversationId}`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getOrCreateConversation(otherUserId: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.BASE}/conversations/with/${otherUserId}`, {});
  }
}