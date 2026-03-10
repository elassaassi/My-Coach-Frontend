// ── Enums ──────────────────────────────────────────────────────────────────

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type Proficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
export type SportName = 'football' | 'basketball' | 'tennis' | 'padel' | 'running' | string;

// ── Nested DTOs (matches backend UserResult) ───────────────────────────────

export interface SportLevelDto {
  sport: SportName;
  proficiency: Proficiency;
  yearsExperience: number;
}

export interface SportProfileDto {
  sports: SportLevelDto[];
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

// ── User aggregate (matches backend UserResult) ────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  status: UserStatus;
  sportProfile: SportProfileDto;
  createdAt: string;
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
  accessToken: string;
  userId: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  sports?: SportLevelDto[];
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

export interface UserSummary {
  userId: string;
  firstName: string;
  lastName: string;
  primarySport?: string;
  proficiency?: Proficiency;
}