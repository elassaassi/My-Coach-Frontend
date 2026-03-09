export type PlayerLevel = 'AMATEUR' | 'SEMI_PRO' | 'PRO' | 'GOAT';

export interface RatePlayerRequest {
  activityId: string;
  ratedUserId: string;
  behavior: number;       // 1-5
  technicality: number;   // 1-5
  teamwork: number;       // 1-5
  level: PlayerLevel;
  isManOfMatch: boolean;
  comment?: string;
}

export interface PlayerStats {
  userId: string;
  sport: string;
  totalRatings: number;
  avgBehavior: number;
  avgTechnicality: number;
  avgTeamwork: number;
  winRate: number;
  manOfMatchCount: number;
  proScore: number;       // 0-100
  level: PlayerLevel;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  proScore: number;
  level: PlayerLevel;
  sport: string;
}

export interface Leaderboard {
  sport: string;
  updatedAt: string;
  entries: LeaderboardEntry[];
}
