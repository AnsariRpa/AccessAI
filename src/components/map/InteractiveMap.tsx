/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EvaluatedRoute, CommunityReport } from '../../types';
import {
  MapPin,
  AlertTriangle,
  Building2,
  ZoomIn,
  ZoomOut,
  LocateFixed,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  X,
  ThumbsUp,
} from 'lucide-react';

interface InteractiveMapProps {
  activeRoute: EvaluatedRoute | null;
  reports: CommunityReport[];
  destinationName: string;
  onSelectHazard?: (report: CommunityReport) => void;
  onUpvoteReport?: (reportId: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  activeRoute,
  reports,
  destinationName,
  onSelectHazard,
  onUpvoteReport,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);
  const [showHazardsLayer, setShowHazardsLayer] = useState(true);
  const [showRampsLayer, setShowRampsLayer] = useState(true);

  // SVG Coordinates for visual simulation of map space (origin to destination)
  // Origin: (80, 360)
  // Destination: (520, 90)
  const isAccessibleRoute = activeRoute?.isRecommended ?? true;
  const isDirectStairsRoute = activeRoute?.hazards.some((h) => h.type.includes('STAIRS'));

  return (
    <div
      id="interactive-map-wrapper"
      className="relative w-full h-[400px] lg:h-full min-h-[380px] bg-stone-100 dark:bg-stone-950 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-inner flex flex-col"
    >
      {/* Map Header Status Overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-stone-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Accessibility Canvas</span>
        </div>

        {activeRoute && (
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm ${
              activeRoute.isRecommended
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300'
            }`}
          >
            {activeRoute.isRecommended ? 'Accessible Path Active' : 'Hazardous Path Selected'}
          </div>
        )}
      </div>

      {/* Layer Controls & Zoom Toolbar */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border border-stone-200 dark:border-stone-800 rounded-xl p-1 shadow-sm flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 2))}
            aria-label="Zoom In Map"
            className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 focus:outline-none"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75))}
            aria-label="Zoom Out Map"
            className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 focus:outline-none"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            aria-label="Reset Map View"
            className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 focus:outline-none"
            title="Recenter"
          >
            <LocateFixed className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Layer Toggles */}
        <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border border-stone-200 dark:border-stone-800 rounded-xl p-2 shadow-sm text-[11px] space-y-1.5">
          <div className="flex items-center gap-1 font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">
            <Layers className="w-3 h-3" />
            <span>Layers</span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-stone-700 dark:text-stone-300">
            <input
              type="checkbox"
              checked={showHazardsLayer}
              onChange={(e) => setShowHazardsLayer(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
            />
            <span>Community Obstacles</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-stone-700 dark:text-stone-300">
            <input
              type="checkbox"
              checked={showRampsLayer}
              onChange={(e) => setShowRampsLayer(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
            />
            <span>Ramps & Elevators</span>
          </label>
        </div>
      </div>

      {/* SVG Vector Map Rendering */}
      <div className="w-full h-full flex-1 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 600 450"
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
          aria-label="Vector map showing routes, obstacles, and accessibility checkpoints"
        >
          {/* Background Grid & Streets */}
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                className="text-stone-200 dark:text-stone-900"
                strokeWidth="1"
              />
            </pattern>
            {/* Striped pattern for stairs/hazardous segment */}
            <pattern id="stairs-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 0 0 L 8 8" stroke="#f43f5e" strokeWidth="2" />
            </pattern>
          </defs>

          <rect width="600" height="450" fill="url(#grid-pattern)" />

          {/* City Road Network */}
          <g stroke="currentColor" className="text-stone-300 dark:text-stone-800" strokeLinecap="round">
            {/* Grand Boulevard */}
            <line x1="40" y1="360" x2="560" y2="360" strokeWidth="18" />
            {/* Central North-South Avenue */}
            <line x1="280" y1="40" x2="280" y2="420" strokeWidth="16" />
            {/* Diagonal Promenade */}
            <line x1="80" y1="360" x2="420" y2="120" strokeWidth="12" />
            {/* Destination Access Ring */}
            <circle cx="520" cy="100" r="45" fill="none" strokeWidth="10" />
            {/* River feature */}
            <path
              d="M 20 180 Q 200 240 380 180 T 580 220"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="10"
              opacity="0.35"
            />
          </g>

          {/* Active Route Polylines */}
          {activeRoute && (
            <g>
              {/* If Recommended Accessible Route is active */}
              {isAccessibleRoute && !isDirectStairsRoute && (
                <>
                  {/* Glowing Accessible Trace */}
                  <path
                    d="M 80 360 L 280 360 L 280 220 L 440 220 L 480 140 L 520 100"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Waypoint pulse dots */}
                  <circle cx="280" cy="360" r="5" fill="#059669" />
                  <circle cx="280" cy="220" r="6" fill="#047857" />
                  <circle cx="440" cy="220" r="5" fill="#059669" />
                  {/* Elevator symbol at 280, 220 */}
                  <rect x="272" y="212" width="16" height="16" rx="3" fill="#047857" />
                  <text x="280" y="224" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                    E
                  </text>
                </>
              )}

              {/* If Direct Route with stairs is selected */}
              {isDirectStairsRoute && (
                <>
                  {/* Conventional path with stairs obstruction */}
                  <path
                    d="M 80 360 L 320 200 L 520 100"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="6"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                  />
                  {/* Red warning circle at stairs (320, 200) */}
                  <circle cx="320" cy="200" r="14" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="3" />
                  <text x="320" y="204" fill="#e11d48" fontSize="11" fontWeight="bold" textAnchor="middle">
                    !
                  </text>
                </>
              )}

              {/* If Scenic Route selected */}
              {!isAccessibleRoute && !isDirectStairsRoute && (
                <path
                  d="M 80 360 Q 150 200 380 180 T 520 100"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="6"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              )}
            </g>
          )}

          {/* Verified Accessible Features Layer */}
          {showRampsLayer && (
            <g>
              {/* Ramp 1 at (180, 360) */}
              <g
                className="cursor-pointer"
                onClick={() =>
                  setSelectedReport({
                    id: 'feat-1',
                    userId: 'official',
                    authorName: 'Municipal Transit',
                    location: { lat: 13.082, lng: 80.271, address: 'Grand Blvd Curb Ramp' },
                    category: 'accessible_entrance_confirmed',
                    severity: 'low',
                    description: 'Dual curb cuts with smooth non-slip aggregate',
                    provenance: 'VERIFIED',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    upvotes: 38,
                  })
                }
              >
                <circle cx="180" cy="360" r="10" fill="#10b981" />
                <path d="M 176 364 L 184 356 M 184 356 L 179 356 M 184 356 L 184 361" stroke="#fff" strokeWidth="1.5" />
              </g>
            </g>
          )}

          {/* Community Hazard Pins Layer */}
          {showHazardsLayer &&
            reports.map((rep, idx) => {
              // Distribute pins visibly across map coords
              const coords = [
                { x: 310, y: 360 },
                { x: 260, y: 220 },
                { x: 440, y: 170 },
                { x: 230, y: 290 },
              ][idx % 4];

              const isBlocking = rep.severity === 'critical_blocking' || rep.severity === 'high';
              const pinBg = isBlocking ? '#e11d48' : '#d97706';

              return (
                <g
                  key={rep.id}
                  className="cursor-pointer transform hover:scale-125 transition-transform"
                  onClick={() => {
                    setSelectedReport(rep);
                    onSelectHazard?.(rep);
                  }}
                >
                  <circle cx={coords.x} cy={coords.y} r="12" fill={pinBg} stroke="#ffffff" strokeWidth="2" />
                  <text x={coords.x} y={coords.y + 4} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                    !
                  </text>
                </g>
              );
            })}

          {/* Origin Marker (Current Location) */}
          <g>
            <circle cx="80" cy="360" r="16" fill="#10b981" opacity="0.2" className="animate-ping" />
            <circle cx="80" cy="360" r="10" fill="#047857" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="80" cy="360" r="4" fill="#ffffff" />
            <text x="80" y="390" fill="currentColor" className="text-stone-800 dark:text-stone-200" fontSize="11" fontWeight="bold" textAnchor="middle">
              You Are Here
            </text>
          </g>

          {/* Destination Marker */}
          <g>
            <circle cx="520" cy="100" r="16" fill="#0284c7" opacity="0.25" />
            <circle cx="520" cy="100" r="11" fill="#0369a1" stroke="#ffffff" strokeWidth="2.5" />
            <path
              d="M 515 96 L 525 96 L 521 101 L 525 106 L 515 106 Z"
              fill="#ffffff"
            />
            <text x="520" y="75" fill="currentColor" className="text-stone-900 dark:text-stone-100 font-extrabold" fontSize="12" textAnchor="middle">
              {destinationName}
            </text>
          </g>
        </svg>
      </div>

      {/* Selected Hazard Card Detail Overlay */}
      {selectedReport && (
        <div className="absolute bottom-3 left-3 right-3 z-30 p-3.5 rounded-xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-300 dark:border-stone-700 shadow-lg text-xs space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  selectedReport.severity === 'high' || selectedReport.severity === 'critical_blocking'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <span className="font-bold text-stone-900 dark:text-stone-100 block">
                  {selectedReport.location.address}
                </span>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider">
                  Category: {selectedReport.category.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              aria-label="Close details"
              className="p-1 rounded-md text-stone-400 hover:text-stone-600 focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-stone-700 dark:text-stone-300 font-medium">
            {selectedReport.description}
          </p>

          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-200 dark:border-stone-800">
            <span>By {selectedReport.authorName}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {selectedReport.upvotes} confirmations
              </span>
              {onUpvoteReport && (
                <button
                  type="button"
                  onClick={() => {
                    onUpvoteReport(selectedReport.id);
                    setSelectedReport((prev) =>
                      prev ? { ...prev, upvotes: prev.upvotes + 1 } : null
                    );
                  }}
                  className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 font-bold flex items-center gap-1 transition-colors"
                  title="Confirm this accessibility report"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Confirm</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
