/**
 * TypeScript interfaces for Strava mock data
 * Used in Phase 2 for testing Lit Protocol oracle integration
 */

export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile_medium: string;
  profile: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number; // in meters
  moving_time: number; // in seconds
  elapsed_time: number; // in seconds
  total_elevation_gain: number; // in meters
  type: string; // "Run", "Walk", "Ride", etc.
  start_date: string; // ISO 8601 format
  start_date_local: string; // ISO 8601 format
  timezone: string;
  utc_offset: number; // in seconds
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map: {
    id: string;
    summary_polyline: string;
    resource_state: number;
  };
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  gear_id: string | null;
  from_accepted_tag: boolean;
  average_speed: number; // meters per second
  max_speed: number; // meters per second
  average_cadence: number;
  average_watts: number;
  weighted_average_watts: number;
  kilojoules: number;
  device_watts: boolean;
  has_heartrate: boolean;
  average_heartrate: number;
  max_heartrate: number;
  max_watts: number;
  pr_count: number;
  total_photo_count: number;
  has_kudoed: boolean;
  suffer_score: number;
}

export interface VerificationCriteria {
  challengeId: number;
  targetDistance: number; // in meters
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
  requiredActivityType: string; // "Run", "Walk", etc.
  minDistance?: number; // Optional minimum distance
  maxDistance?: number; // Optional maximum distance
}

export interface VerificationResult {
  success: boolean;
  reason?: string;
  activityId?: number;
  distance?: number;
  activityType?: string;
  timestamp?: number;
  isValidDistance: boolean;
  isValidType: boolean;
  isValidTimestamp: boolean;
}

export interface MockStravaConfig {
  port: number;
  baseUrl: string;
  activities: StravaActivity[];
  athletes: StravaAthlete[];
  delayMs?: number; // Simulate network delay
  errorRate?: number; // 0-1, probability of returning error
}

export interface LitActionParams {
  challengeId: number;
  userAddress: string;
  contractAddress: string;
  mockActivityData?: StravaActivity;
  stravaAccessToken?: string; // For future real API integration
}

export interface LitActionResponse {
  success: boolean;
  reason?: string;
  signature?: string;
  txData?: string;
  verificationResult?: VerificationResult;
}

export interface PKPConfig {
  pkpPublicKey: string;
  pkpTokenId: string;
  pkpEthAddress: string;
  network: string;
  funded: boolean;
  createdAt: string;
}

// Helper types for testing
export type ActivityType = "Run" | "Walk" | "Ride" | "Swim" | "Workout";
export type VerificationStatus = "pending" | "valid" | "invalid" | "error";

// Mock data generators
export interface MockActivityOptions {
  type?: ActivityType;
  distance?: {
    min: number;
    max: number;
  };
  timestamp?: {
    start: Date;
    end: Date;
  };
  includeInvalid?: boolean; // Generate activities that fail validation
}
