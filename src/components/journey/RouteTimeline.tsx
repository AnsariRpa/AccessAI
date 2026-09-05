/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RouteLeg } from '../../types';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import {
  Footprints,
  ArrowUpRight,
  AlertTriangle,
  Building2,
  Flag,
  HelpCircle,
} from 'lucide-react';

interface RouteTimelineProps {
  legs: RouteLeg[];
  destinationName: string;
}

export const RouteTimeline: React.FC<RouteTimelineProps> = ({
  legs,
  destinationName,
}) => {
  const getLegIcon = (type: RouteLeg['type']) => {
    switch (type) {
      case 'sidewalk':
        return Footprints;
      case 'curb_ramp':
        return ArrowUpRight;
      case 'elevator':
        return Building2;
      case 'crossing':
        return AlertTriangle;
      case 'stairs':
        return AlertTriangle;
      case 'entrance':
        return Building2;
      default:
        return Footprints;
    }
  };

  const getLegColor = (status: RouteLeg['accessibilityStatus'], type: RouteLeg['type']) => {
    if (type === 'stairs' || status === 'hazard') {
      return 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300';
    }
    if (status === 'caution' || status === 'unknown') {
      return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300';
    }
    return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300';
  };

  return (
    <div id="route-timeline-container" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <span>Your Accessible Journey Breakdown</span>
        </h3>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          {legs.length} verified checkpoints
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800">
        {legs.map((leg, index) => {
          const Icon = getLegIcon(leg.type);
          const colorClass = getLegColor(leg.accessibilityStatus, leg.type);

          return (
            <div key={leg.id || index} className="relative group">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-6 top-1 w-6 h-6 rounded-full border flex items-center justify-center shadow-xs ${colorClass}`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              </div>

              {/* Segment Content */}
              <div className="bg-stone-50 dark:bg-stone-900/60 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-colors space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                    {leg.instruction}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                      {leg.distanceMeters} m
                    </span>
                    <ProvenanceBadge provenance={leg.provenance} size="sm" />
                  </div>
                </div>

                {leg.details && (
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    {leg.details}
                  </p>
                )}

                {leg.type === 'stairs' && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 font-semibold pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Warning: Stairs on this leg cannot be bypassed.</span>
                  </div>
                )}

                {leg.provenance === 'UNKNOWN' && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 pt-1">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Accessibility conditions not yet confirmed for this stretch.</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Destination Arrival Step */}
        <div className="relative">
          <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Flag className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
            <span className="font-bold text-sm block mb-0.5">
              Arrive at {destinationName}
            </span>
            <span>Check in for step-free reception and elevator access</span>
          </div>
        </div>
      </div>
    </div>
  );
};
