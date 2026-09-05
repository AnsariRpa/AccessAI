/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EvaluatedRoute } from '../../types';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Navigation,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface RouteComparisonProps {
  routes: EvaluatedRoute[];
  selectedRouteId: string;
  onSelectRoute: (routeId: string) => void;
  onStartNavigation: (route: EvaluatedRoute) => void;
}

export const RouteComparison: React.FC<RouteComparisonProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  onStartNavigation,
}) => {
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700';
    if (score >= 60) return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700';
    return 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700';
  };

  return (
    <div id="route-comparison-container" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>Evaluated Journey Alternatives</span>
        </h2>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          Ranked by personalized accessibility score
        </span>
      </div>

      {/* Routes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const scoreClass = getScoreColor(route.accessibilityScore);

          return (
            <button
              key={route.id}
              type="button"
              onClick={() => onSelectRoute(route.id)}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none ${
                isSelected
                  ? 'border-emerald-600 dark:border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-md ring-1 ring-emerald-600'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              {route.isRecommended && (
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
                  RECOMMENDED
                </span>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-sm text-stone-900 dark:text-stone-100 line-clamp-1">
                    {route.name}
                  </span>
                  <div
                    className={`px-2 py-1 rounded-lg border font-black text-sm shrink-0 ${scoreClass}`}
                  >
                    {route.accessibilityScore}/100
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-600 dark:text-stone-400 mb-3">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {route.durationMinutes} min
                  </span>
                  <span>•</span>
                  <span>{(route.distanceMeters / 1000).toFixed(1)} km</span>
                </div>

                <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 line-clamp-2">
                  {route.summary}
                </p>
              </div>

              {/* Major Factor Pills */}
              <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                {route.hazards.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-medium">
                    <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="line-clamp-1">{route.hazards[0].description}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Zero known stairs</span>
                  </div>
                )}

                {route.uncertainFactors.length > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="line-clamp-1">{route.uncertainFactors[0]}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Route Deep-Dive & Gemini Explanation */}
      {selectedRoute && (
        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                  {selectedRoute.name}
                </h3>
                <ProvenanceBadge
                  provenance={
                    selectedRoute.uncertainFactors.length > 0 ? 'UNKNOWN' : 'VERIFIED'
                  }
                  size="sm"
                />
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {selectedRoute.summary}
              </p>
            </div>

            <button
              id="btn-start-journey"
              type="button"
              onClick={() => onStartNavigation(selectedRoute)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none shrink-0"
            >
              <span>Start Journey</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Gemini Explainability Callout */}
          {selectedRoute.geminiExplanation && (
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs tracking-wider uppercase">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Why AccessAI recommends this evaluation</span>
              </div>
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {selectedRoute.geminiExplanation}
              </p>
            </div>
          )}

          {/* Factor Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            {/* Positive Factors */}
            <div className="space-y-2">
              <span className="font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Accessible Advantages ({selectedRoute.positiveFactors.length})</span>
              </span>
              <ul className="space-y-1.5">
                {selectedRoute.positiveFactors.map((fact, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-stone-600 dark:text-stone-400"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hazards & Uncertainties */}
            <div className="space-y-2">
              <span className="font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
                <span>Identified Hazards & Cautions ({selectedRoute.hazards.length + selectedRoute.uncertainFactors.length})</span>
              </span>
              <ul className="space-y-1.5">
                {selectedRoute.hazards.map((h, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-2 font-medium ${
                      h.severity === 'BLOCKING'
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      {h.description}{' '}
                      <span className="text-[10px] uppercase tracking-wide opacity-80">
                        [{h.provenance}]
                      </span>
                    </span>
                  </li>
                ))}
                {selectedRoute.uncertainFactors.map((u, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-stone-500 dark:text-stone-400"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{u}</span>
                  </li>
                ))}
                {selectedRoute.hazards.length === 0 && selectedRoute.uncertainFactors.length === 0 && (
                  <li className="text-stone-400 italic">No obstacles detected</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
