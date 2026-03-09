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
  isHighlightOfDay: boolean;
  publishedAt: string;
  likedByMe?: boolean;
}

export interface PublishHighlightRequest {
  mediaUrl: string;
  mediaType: MediaType;
  caption: string;
  sport: string;
  city?: string;
}