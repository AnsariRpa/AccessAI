/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccessibilityProfile, EvaluatedRoute, RouteHazard, RouteLeg, CommunityReport } from '../../src/types';

export interface RouteEvaluationInput {
  destination: string;
  origin?: string;
  rawDistanceMeters: number;
  rawDurationMinutes: number;
  routeTitle: string;
  summary: string;
  legs: RouteLeg[];
  nearbyReports?: CommunityReport[];
}

/**
 * Deterministic Accessibility Scoring Engine
 * Implements transparent arithmetic calculation based on user constraints and verified route hazards.
 */
export function evaluateRouteAccessibility(
  input: RouteEvaluationInput,
  profile: AccessibilityProfile
): EvaluatedRoute {
  let score = 100;
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];
  const uncertainFactors: string[] = [];
  const hazards: RouteHazard[] = [];

  let stairsDetectedCount = 0;
  let steepSlopeCount = 0;
  let elevatorNeededCount = 0;
  let elevatorAvailableCount = 0;
  let difficultCrossingsCount = 0;
  let unverifiedCount = 0;

  // 1. Evaluate leg by leg
  for (const leg of input.legs) {
    if (leg.provenance === 'UNKNOWN') {
      unverifiedCount++;
    }

    if (leg.type === 'stairs') {
      stairsDetectedCount++;
      if (profile.avoidStairs || profile.mobility.startsWith('wheelchair')) {
        score -= 50;
        hazards.push({
          type: 'STAIRS_DETECTED',
          severity: 'BLOCKING',
          description: leg.details || 'Staircase along path without confirmed bypass ramp',
          provenance: leg.provenance,
        });
        negativeFactors.push(`Flight of stairs along path (${leg.details || 'unavoidable'})`);
      } else {
        score -= 15;
        negativeFactors.push('Stair section present');
      }
    }

    if (leg.type === 'steep_slope') {
      steepSlopeCount++;
      if (profile.avoidSteepSlopes) {
        score -= 20;
        hazards.push({
          type: 'STEEP_SLOPE',
          severity: 'CAUTION',
          description: leg.details || 'Slope grade exceeds comfortable standard (approx >6%)',
          provenance: leg.provenance,
        });
        negativeFactors.push('Steep incline gradient along path');
      } else {
        score -= 10;
      }
    }

    if (leg.type === 'elevator') {
      elevatorNeededCount++;
      if (leg.accessibilityStatus === 'hazard') {
        score -= 40;
        hazards.push({
          type: 'ELEVATOR_OUT_OF_SERVICE',
          severity: 'BLOCKING',
          description: 'Elevator reported non-operational',
          provenance: leg.provenance,
        });
        negativeFactors.push('Crucial elevator reported out of service');
      } else {
        elevatorAvailableCount++;
        positiveFactors.push('Operational elevator available for level transition');
      }
    }

    if (leg.type === 'crossing') {
      if (leg.details?.includes('difficult') || leg.accessibilityStatus === 'caution') {
        difficultCrossingsCount++;
        if (profile.avoidDifficultCrossings) {
          score -= 15;
          hazards.push({
            type: 'DIFFICULT_CROSSING',
            severity: 'CAUTION',
            description: leg.details || 'Multi-lane or unsignalized road crossing',
            provenance: leg.provenance,
          });
          negativeFactors.push('Complex street crossing with fast traffic flow');
        }
      } else {
        positiveFactors.push('Signalized pedestrian crossing with audio/visual cues');
      }
    }

    if (leg.type === 'curb_ramp' || (leg.type === 'sidewalk' && leg.details?.includes('curb cut'))) {
      positiveFactors.push('Gradual curb cuts and paved sidewalk');
    }
  }

  // 2. Check nearby community reports
  if (input.nearbyReports && input.nearbyReports.length > 0) {
    for (const report of input.nearbyReports) {
      if (report.status === 'active') {
        if (report.category === 'blocked_ramp' || report.category === 'construction_obstruction') {
          score -= 30;
          hazards.push({
            type: 'COMMUNITY_REPORTED_OBSTRUCTION',
            severity: 'BLOCKING',
            description: `Community report: ${report.description}`,
            provenance: 'COMMUNITY_REPORTED',
          });
          negativeFactors.push(`Active community report: ${report.description}`);
        } else if (report.category === 'broken_elevator') {
          score -= 35;
          hazards.push({
            type: 'BROKEN_ELEVATOR',
            severity: 'BLOCKING',
            description: `Community report: Elevator at ${report.location.address} broken`,
            provenance: 'COMMUNITY_REPORTED',
          });
          negativeFactors.push('Community warning: Inactive elevator on this route');
        }
      }
    }
  }

  // 3. Evaluate walking duration limits
  if (profile.minimizeWalking && input.rawDurationMinutes > profile.maxWalkingMinutes) {
    const excessMinutes = input.rawDurationMinutes - profile.maxWalkingMinutes;
    const distancePenalty = Math.min(25, Math.round(excessMinutes * 2));
    score -= distancePenalty;
    negativeFactors.push(
      `Travel duration (${input.rawDurationMinutes} min) exceeds user preferred limit of ${profile.maxWalkingMinutes} min`
    );
  } else if (input.rawDurationMinutes <= profile.maxWalkingMinutes) {
    positiveFactors.push(`Within preferred travel time duration (${input.rawDurationMinutes} min)`);
  }

  // 4. Uncertainty penalties & provenance check
  if (unverifiedCount > 0) {
    const uncertaintyDeduction = Math.min(15, unverifiedCount * 4);
    score -= uncertaintyDeduction;
    uncertainFactors.push(
      `${unverifiedCount} route segment${unverifiedCount > 1 ? 's have' : ' has'} unverified accessibility information`
    );
  }

  if (stairsDetectedCount === 0 && (profile.avoidStairs || profile.mobility.startsWith('wheelchair'))) {
    positiveFactors.push('Zero detected stairs along path');
  }

  // Clamp score strictly between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let confidenceGrade: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' = 'HIGH';
  if (unverifiedCount >= 3) {
    confidenceGrade = 'LOW';
  } else if (unverifiedCount > 0) {
    confidenceGrade = 'MEDIUM';
  }

  const isRecommended = finalScore >= 70 && !hazards.some(h => h.severity === 'BLOCKING');

  // Deduplicate factors
  const uniquePositive = Array.from(new Set(positiveFactors));
  const uniqueNegative = Array.from(new Set(negativeFactors));
  const uniqueUncertain = Array.from(new Set(uncertainFactors));

  const provenanceSummary = unverifiedCount === 0
    ? 'Verified route infrastructure'
    : `${unverifiedCount} section(s) require verification on arrival`;

  return {
    id: `route-${Math.random().toString(36).substring(2, 9)}`,
    name: input.routeTitle,
    summary: input.summary,
    distanceMeters: input.rawDistanceMeters,
    durationMinutes: input.rawDurationMinutes,
    accessibilityScore: finalScore,
    isRecommended,
    confidenceGrade,
    provenanceSummary,
    legs: input.legs,
    hazards,
    positiveFactors: uniquePositive,
    negativeFactors: uniqueNegative,
    uncertainFactors: uniqueUncertain,
  };
}
