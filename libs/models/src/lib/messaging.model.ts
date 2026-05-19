export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: MessageStatus;
  sentAt: string;
}

export interface Conversation {
  id: string;
  participantA: string;
  participantB: string;
  otherParticipantId: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface SendMessageRequest {
  recipientId: string;
  content: string;
}