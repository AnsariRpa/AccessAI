/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import {
  Compass,
  SlidersHorizontal,
  Contrast,
  Volume2,
  VolumeX,
  Camera,
  AlertTriangle,
  MapPin,
  Building,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'journey' | 'vision' | 'reports' | 'places';
  setActiveTab: (tab: 'journey' | 'vision' | 'reports' | 'places') => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
}) => {
  const { profile, highContrast, toggleHighContrast, speechEnabled, toggleSpeech } =
    useAccessibility();

  const getMobilityLabel = () => {
    switch (profile.mobility) {
      case 'wheelchair_manual':
        return 'Manual Wheelchair';
      case 'wheelchair_powered':
        return 'Power Wheelchair';
      case 'walker':
        return 'Walker / Rollator';
      case 'crutches_cane':
        return 'Crutches / Cane';
      case 'stair_limited':
        return 'Stair Limited';
      case 'distance_limited':
        return 'Distance Limited';
      default:
        return 'Accessible Profile';
    }
  };

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <Compass className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-stone-900 dark:text-stone-50">
                  AccessAI
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  AI-Native
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
                Navigate the world with confidence
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav
            id="app-navigation"
            aria-label="Main Navigation"
            className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none"
          >
            <button
              id="tab-journey"
              onClick={() => setActiveTab('journey')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none ${
                activeTab === 'journey'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Compass className="w-4 h-4" aria-hidden="true" />
              <span>Journey Planner</span>
            </button>

            <button
              id="tab-vision"
              onClick={() => setActiveTab('vision')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none ${
                activeTab === 'vision'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Camera className="w-4 h-4" aria-hidden="true" />
              <span>Photo Inspector</span>
            </button>

            <button
              id="tab-reports"
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none ${
                activeTab === 'reports'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              <span>Reports</span>
            </button>

            <button
              id="tab-places"
              onClick={() => setActiveTab('places')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none ${
                activeTab === 'places'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Building className="w-4 h-4" aria-hidden="true" />
              <span>Accessible Places</span>
            </button>
          </nav>

          {/* Accessibility Profile Pill & Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Contrast Mode Toggle */}
            <button
              id="btn-toggle-contrast"
              onClick={toggleHighContrast}
              aria-label={highContrast ? 'Switch to Standard Contrast' : 'Switch to High Contrast'}
              className={`p-2 rounded-lg border transition-colors focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none ${
                highContrast
                  ? 'bg-amber-400 text-stone-950 border-amber-500 font-bold'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
              }`}
              title="Toggle High Contrast Mode (WCAG AAA)"
            >
              <Contrast className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Audio Spoken Guide Toggle */}
            <button
              id="btn-toggle-speech"
              onClick={toggleSpeech}
              aria-label={speechEnabled ? 'Disable Audio Voice Output' : 'Enable Audio Voice Output'}
              className={`p-2 rounded-lg border transition-colors focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none ${
                speechEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
              }`}
              title="Screen Reader & Voice Journey Audio"
            >
              {speechEnabled ? (
                <Volume2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {/* Profile Selector Trigger */}
            <button
              id="btn-open-profile"
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[120px] sm:max-w-none">
                  {getMobilityLabel()}
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  {profile.avoidStairs ? 'No stairs' : 'All paths'} •{' '}
                  {profile.maxWalkingMinutes}m limit
                </span>
              </div>
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400 ml-1 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
