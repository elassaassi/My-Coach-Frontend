export type MatchStatus = 'PENDING' | 'FOUND' | 'NO_MATCH' | 'CANCELLED' | 'EXPIRED';

export interface MatchRequest {
  id: string;
  requesterId: string;
  sport: string;
  proficiency: string;
  latitude: number;
  longitude: number;
  maxDistanceKm: number;
  status: MatchStatus;
  matchedUserId: string | null;
  matchScore: number;
  createdAt: string;
}

export interface MatchRequestCommand {
  sport: string;
  proficiency: string;
  latitude: number;
  longitude: number;
  maxDistanceKm: number;
}