/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { MobilityType } from '../../types';
import {
  SlidersHorizontal,
  Check,
  ShieldCheck,
  X,
  RotateCcw,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, setMobility, updateProfile, resetToDefaults } = useAccessibility();

  if (!isOpen) return null;

  const mobilityOptions: { type: MobilityType; title: string; desc: string }[] = [
    {
      type: 'wheelchair_manual',
      title: 'Manual Wheelchair',
      desc: 'Requires ramp gradients, zero stairs, curb cuts, and wide doors.',
    },
    {
      type: 'wheelchair_powered',
      title: 'Power Wheelchair',
      desc: 'Requires wide elevators, level threshold entries, and paved walkways.',
    },
    {
      type: 'walker',
      title: 'Walker / Rollator',
      desc: 'Requires level or ramp access, avoiding step-only stairwells.',
    },
    {
      type: 'crutches_cane',
      title: 'Crutches / Cane',
      desc: 'Prefers handrails, avoids long steep flights of stairs, minimizes distance.',
    },
    {
      type: 'stair_limited',
      title: 'Stair Limited',
      desc: 'Able to walk flat ground comfortably; cannot safely climb stairs.',
    },
    {
      type: 'distance_limited',
      title: 'Distance / Fatigue Limited',
      desc: 'Strictly prioritizes minimal walking time and resting areas.',
    },
  ];

  return (
    <div
      id="profile-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    >
      <div
        id="profile-modal-content"
        className="bg-white dark:bg-stone-900 rounded-2xl max-w-xl w-full p-6 border border-stone-200 dark:border-stone-800 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-bold text-lg text-stone-900 dark:text-stone-100">
              Personal Accessibility Profile
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobility Category Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
            Primary Mobility Requirement:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {mobilityOptions.map((opt) => {
              const isSelected = profile.mobility === opt.type;

              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setMobility(opt.type)}
                  className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{opt.title}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Route Constraints */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
            Mandatory Route Constraints:
          </label>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/40">
              <div className="flex flex-col">
                <span className="font-bold text-stone-900 dark:text-stone-100">Avoid Stairs</span>
                <span className="text-stone-500">Excludes routes with step-only bridges and underpasses</span>
              </div>
              <input
                type="checkbox"
                checked={profile.avoidStairs}
                onChange={(e) => updateProfile({ avoidStairs: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/40">
              <div className="flex flex-col">
                <span className="font-bold text-stone-900 dark:text-stone-100">Prefer Elevators</span>
                <span className="text-stone-500">Route via transit elevators where floor transitions exist</span>
              </div>
              <input
                type="checkbox"
                checked={profile.preferElevators}
                onChange={(e) => updateProfile({ preferElevators: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/40">
              <div className="flex flex-col">
                <span className="font-bold text-stone-900 dark:text-stone-100">Avoid Steep Incline Sections</span>
                <span className="text-stone-500">Flags paths with slopes exceeding comfortable grade (&gt;6%)</span>
              </div>
              <input
                type="checkbox"
                checked={profile.avoidSteepSlopes}
                onChange={(e) => updateProfile({ avoidSteepSlopes: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/40">
              <div className="flex flex-col">
                <span className="font-bold text-stone-900 dark:text-stone-100">Avoid Difficult Street Crossings</span>
                <span className="text-stone-500">Prefers signalized crossings with pedestrian countdowns</span>
              </div>
              <input
                type="checkbox"
                checked={profile.avoidDifficultCrossings}
                onChange={(e) => updateProfile({ avoidDifficultCrossings: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </div>
        </div>

        {/* Max Walking Duration Slider */}
        <div className="space-y-2 pt-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Maximum Acceptable Walking Time:
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {profile.maxWalkingMinutes} minutes
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={profile.maxWalkingMinutes}
            onChange={(e) => updateProfile({ maxWalkingMinutes: parseInt(e.target.value, 10) })}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-stone-400">
            <span>5 min (minimal)</span>
            <span>30 min</span>
            <span>60 min</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={resetToDefaults}
            className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard Wheelchair</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
          >
            Save & Apply Profile
          </button>
        </div>
      </div>
    </div>
  );
};
