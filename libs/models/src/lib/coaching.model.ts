export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DONE';
export type TargetAudience = 'INDIVIDUAL' | 'ENTERPRISE';

export interface Coach {
  id: string;
  userId: string;
  bio: string;
  sports: string[];
  certifications: string[];
  hourlyRate: number;
  currency: string;
  isAvailable: boolean;
  averageRating: number;
}

export interface CoachingOffer {
  id: string;
  coachId: string;
  title: string;
  description: string;
  targetAudience: TargetAudience;
  sport: string;
  durationMin: number;
  price: number;
  currency: string;
}

export interface CoachingBooking {
  id: string;
  offerId: string;
  clientId: string;
  scheduledAt: string;
  status: BookingStatus;
  createdAt: string;
}

export interface SearchCoachesParams {
  sport?: string;
  maxHourlyRate?: number;
  minRating?: number;
  targetAudience?: TargetAudience;
}
