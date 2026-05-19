import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Conversation, Message, SendMessageRequest } from '@momentum/models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/v1/messages';

  sendMessage(req: SendMessageRequest): Observable<Message> {
    return this.http
      .post<ApiResponse<Message>>(this.BASE, req)
      .pipe(map(r => r.data));
  }

  getMyConversations(): Observable<Conversation[]> {
    return this.http
      .get<ApiResponse<Conversation[]>>(`${this.BASE}/conversations`)
      .pipe(map(r => r.data));
  }

  getMessages(conversationId: string, page = 0, size = 40): Observable<Message[]> {
    return this.http
      .get<ApiResponse<Message[]>>(`${this.BASE}/conversations/${conversationId}`, {
        params: { page: page.toString(), size: size.toString() }
      })
      .pipe(map(r => r.data));
  }

  getOrCreateConversation(otherUserId: string): Observable<Conversation> {
    return this.http
      .post<ApiResponse<Conversation>>(`${this.BASE}/conversations/with/${otherUserId}`, {})
      .pipe(map(r => r.data));
  }
}