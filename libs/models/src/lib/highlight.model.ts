export type MediaType = 'PHOTO' | 'VIDEO';

export interface Highlight {
  id: string;
  publisherId: string;
  mediaUrl: string;
  mediaType: MediaType;
  caption: string;
  sport: string;
  city?: string;
  likeCount: number;
  commentCount?: number;
  isHighlightOfDay: boolean;
  publishedAt: string;
  archivedAt?: string | null;
  editedAt?: string | null;
  likedByMe?: boolean;
}

export interface PublishHighlightRequest {
  mediaUrl: string;
  mediaType: MediaType;
  caption: string;
  sport: string;
  city?: string;
}

export interface Comment {
  id: string;
  highlightId: string;
  authorId: string;
  content: string;
  createdAt: string;
}