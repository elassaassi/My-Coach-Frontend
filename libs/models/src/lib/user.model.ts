// ── Enums ──────────────────────────────────────────────────────────────────

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type Proficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
export type SportName = 'football' | 'basketball' | 'tennis' | 'padel' | 'running' | string;

// ── Value objects ──────────────────────────────────────────────────────────

export interface SportProfile {
  sport: SportName;
  proficiency: Proficiency;
  yearsOfExperience: number;
}

// ── Aggregate ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  sportProfiles: SportProfile[];
  createdAt: string; // ISO-8601
}

// ── API DTOs ───────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;  // champ retourné par le backend Spring Boot
  userId: string;
}

export interface UserSummary {
  userId: string;
  firstName: string;
  lastName: string;
  primarySport?: string;
  proficiency?: Proficiency;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  sportProfiles?: SportProfile[];
}