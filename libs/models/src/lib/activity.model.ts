export type ActivityStatus = 'OPEN' | 'FULL' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface Location {
  latitude: number;
  longitude: number;
  venueName: string;
  city: string;
  country: string;
}

export interface Participant {
  userId: string;
  joinedAt: string;
}

export interface Activity {
  id: string;
  organizerId: string;
  title: string;
  description?: string;
  sport: string;
  requiredLevel: string;
  location: Location;
  scheduledAt: string;
  maxParticipants: number;
  currentParticipantsCount: number;
  status: ActivityStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityRequest {
  title: string;
  sport: string;
  requiredLevel: string;
  latitude: number;
  longitude: number;
  venueName: string;
  city: string;
  country: string;
  scheduledAt: string;
  maxParticipants: number;
  description?: string;
}

export interface ActivityMessage {
  id: string;
  activityId: string;
  senderId: string;
  content: string;
  sentAt: string;
}

export interface ActivitySearchParams {
  sport?: string;
  city?: string;
  status?: ActivityStatus;
  page?: number;
  size?: number;
}