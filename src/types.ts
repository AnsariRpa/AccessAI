/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProvenanceType = 
  | 'VERIFIED'
  | 'OFFICIAL_SOURCE'
  | 'COMMUNITY_REPORTED'
  | 'AI_INFERRED'
  | 'USER_PROVIDED'
  | 'UNKNOWN';

export type MobilityType =
  | 'wheelchair_manual'
  | 'wheelchair_powered'
  | 'walker'
  | 'crutches_cane'
  | 'stair_limited'
  | 'distance_limited'
  | 'general';

export interface AccessibilityProfile {
  mobility: MobilityType;
  avoidStairs: boolean;
  preferElevators: boolean;
  minimizeWalking: boolean;
  avoidSteepSlopes: boolean;
  avoidDifficultCrossings: boolean;
  maxWalkingMinutes: number;
  requireWideDoors: boolean;
  requireCurbCuts: boolean;
}

export type LegType =
  | 'sidewalk'
  | 'curb_ramp'
  | 'crossing'
  | 'stairs'
  | 'elevator'
  | 'steep_slope'
  | 'entrance'
  | 'transit_platform';

export interface RouteLeg {
  id: string;
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  type: LegType;
  accessibilityStatus: 'passable' | 'hazard' | 'caution' | 'unknown';
  provenance: ProvenanceType;
  details?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
}

export interface RouteHazard {
  type: string;
  severity: 'BLOCKING' | 'CAUTION' | 'INFO';
  description: string;
  provenance: ProvenanceType;
}

export interface EvaluatedRoute {
  id: string;
  name: string;
  summary: string;
  distanceMeters: number;
  durationMinutes: number;
  accessibilityScore: number; // 0 - 100
  isRecommended: boolean;
  confidenceGrade: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  provenanceSummary: string;
  legs: RouteLeg[];
  hazards: RouteHazard[];
  positiveFactors: string[];
  negativeFactors: string[];
  uncertainFactors: string[];
  geminiExplanation?: string;
  waypoints?: { lat: number; lng: number }[];
}

export interface MultimodalAnalysisResult {
  verdict: 'ACCESSIBLE' | 'CAUTION_POTENTIAL_BARRIER' | 'INACCESSIBLE' | 'INSUFFICIENT_EVIDENCE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  visualObservations: string[];
  detectedBarriers: string[];
  detectedFeatures: string[];
  unknownElements: string[];
  cautiousRecommendation: string;
  provenance: ProvenanceType;
  timestamp: string;
}

export type ReportCategory =
  | 'blocked_ramp'
  | 'broken_elevator'
  | 'unexpected_stairs'
  | 'missing_curb_cut'
  | 'steep_incline'
  | 'construction_obstruction'
  | 'accessible_entrance_confirmed';

export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical_blocking';

export interface CommunityReport {
  id: string;
  userId: string;
  authorName: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  category: ReportCategory;
  severity: ReportSeverity;
  description: string;
  imageUrl?: string;
  aiClassification?: {
    detectedObstacle: string;
    aiConfidence: number;
    visualObservations: string[];
  };
  provenance: ProvenanceType;
  status: 'active' | 'resolved';
  createdAt: string;
  upvotes: number;
}

export interface AccessiblePlace {
  id: string;
  name: string;
  category: string;
  address: string;
  distanceKm: number;
  matchScore: number; // 0 - 100%
  entranceStatus: 'verified_accessible' | 'ramp_available' | 'step_access_only' | 'elevator_available' | 'unknown';
  restroomStatus: 'accessible' | 'inaccessible' | 'unknown';
  provenance: ProvenanceType;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  positivePoints: string[];
  cautionPoints: string[];
  location: { lat: number; lng: number };
}

export interface UserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}
