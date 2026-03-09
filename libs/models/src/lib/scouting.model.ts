export type RecruitmentStatus = 'OPEN' | 'CONTACTED' | 'SIGNED' | 'NOT_INTERESTED';
export type InterestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface TalentProfile {
  userId: string;
  sport: string;
  proScore: number;
  isVisible: boolean;
  recruitmentStatus: RecruitmentStatus;
  updatedAt: string;
}

export interface RecruiterProfile {
  id: string;
  userId: string;
  organization: string;
  targetSports: string[];
  targetLevel: string;
}

export interface ScoutingInterest {
  id: string;
  recruiterId: string;
  talentId: string;
  status: InterestStatus;
  note?: string;
  createdAt: string;
}

export interface SearchTalentsParams {
  sport?: string;
  minProScore?: number;
  city?: string;
}
