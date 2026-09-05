/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EvaluatedRoute, RouteLeg, CommunityReport } from '../../types';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { useAccessibility } from '../../context/AccessibilityContext';
import {
  Navigation,
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  Building2,
  Footprints,
  ArrowUpRight,
  ShieldCheck,
  Flag,
  Play,
  Pause,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface ActiveGuidanceModalProps {
  route: EvaluatedRoute;
  destinationName: string;
  onClose: () => void;
  onReportObstacle: (newReport: CommunityReport) => void;
}

export const ActiveGuidanceModal: React.FC<ActiveGuidanceModalProps> = ({
  route,
  destinationName,
  onClose,
  onReportObstacle,
}) => {
  const { speechEnabled, toggleSpeech, speakText } = useAccessibility();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isReportingBarrier, setIsReportingBarrier] = useState(false);
  const [barrierDescription, setBarrierDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const legs = route.legs;
  const currentLeg: RouteLeg | undefined = legs[currentStepIndex];
  const isLastStep = currentStepIndex === legs.length - 1;
  const isArrived = currentStepIndex >= legs.length;

  // Speak step instruction when changing step
  useEffect(() => {
    if (currentLeg && speechEnabled && !isArrived) {
      speakText(
        `Step ${currentStepIndex + 1} of ${legs.length}: ${currentLeg.instruction}. ${currentLeg.details}`
      );
    }
  }, [currentStepIndex, speechEnabled, isArrived]);

  // Simulation timer
  useEffect(() => {
    let timer: any;
    if (isSimulating && !isArrived) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < legs.length - 1) {
            return prev + 1;
          } else {
            setIsSimulating(false);
            return prev + 1; // Mark as arrived
          }
        });
      }, 6000);
    }
    return () => clearInterval(timer);
  }, [isSimulating, isArrived, legs.length]);

  const handleNext = () => {
    if (currentStepIndex < legs.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setCurrentStepIndex(legs.length); // Arrived
      if (speechEnabled) {
        speakText(`You have reached ${destinationName}. Safe travels!`);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleRepeatVoice = () => {
    if (currentLeg) {
      speakText(
        `Step ${currentStepIndex + 1} of ${legs.length}: ${currentLeg.instruction}. ${currentLeg.details}`
      );
    }
  };

  const handleReportCurrentLegObstacle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barrierDescription.trim() || !currentLeg) return;

    setIsSubmittingReport(true);
    try {
      const newReport: CommunityReport = {
        id: `rep-nav-${Date.now()}`,
        userId: 'user-navigator',
        authorName: 'Active Navigator',
        location: {
          lat: 13.0827,
          lng: 80.2707,
          address: currentLeg.instruction,
        },
        category: 'blocked_ramp',
        severity: 'high',
        description: barrierDescription.trim(),
        provenance: 'COMMUNITY_REPORTED',
        status: 'active',
        createdAt: new Date().toISOString(),
        upvotes: 1,
      };

      onReportObstacle(newReport);
      setIsReportingBarrier(false);
      setBarrierDescription('');
      if (speechEnabled) {
        speakText('Barrier report registered. Thank you for keeping the path safe for others.');
      }
    } catch (err) {
      console.error('Failed to submit barrier', err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Calculate remaining distance and time
  const remainingDistance = legs
    .slice(currentStepIndex)
    .reduce((acc, leg) => acc + leg.distanceMeters, 0);
  const remainingTimeSeconds = legs
    .slice(currentStepIndex)
    .reduce((acc, leg) => acc + leg.durationSeconds, 0);
  const remainingMinutes = Math.ceil(remainingTimeSeconds / 60);

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
      case 'entrance':
        return Building2;
      default:
        return Footprints;
    }
  };

  const LegIcon = currentLeg ? getLegIcon(currentLeg.type) : MapPin;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="active-nav-title"
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        id="active-guidance-card"
        className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col my-auto transition-all"
      >
        {/* Top Control Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Turn-by-Turn Accessible Guidance
              </span>
              <h2
                id="active-nav-title"
                className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 truncate max-w-xs sm:max-w-md"
              >
                {destinationName || 'Your Destination'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleSpeech}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                speechEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                  : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
              }`}
              title={speechEnabled ? 'Mute spoken announcements' : 'Enable voice announcements'}
              aria-label={speechEnabled ? 'Mute speech' : 'Enable speech'}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Exit Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
              title="Close navigation"
              aria-label="Exit navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Journey Progress Bar */}
        <div className="w-full bg-stone-100 dark:bg-stone-800 h-2">
          <div
            className="bg-emerald-600 h-full transition-all duration-500 ease-out"
            style={{
              width: isArrived
                ? '100%'
                : `${((currentStepIndex) / legs.length) * 100}%`,
            }}
          />
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-6">
          {isArrived ? (
            /* Arrival Celebration Screen */
            <div className="text-center py-8 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100">
                  You Have Arrived!
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto">
                  You reached <span className="font-bold text-stone-900 dark:text-stone-100">{destinationName}</span> safely along the verified accessible route.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-left max-w-md mx-auto text-xs space-y-2">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Total Distance Covered</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">{route.distanceMeters} m</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Estimated Time</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">{route.durationMinutes} min</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Physical Stairs Encountered</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Zero (100% Step-Free)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
                >
                  Complete Navigation
                </button>
              </div>
            </div>
          ) : currentLeg ? (
            /* Active Step Display */
            <div className="space-y-5">
              {/* Step indicator and telemetry */}
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 border-b border-stone-100 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold">
                    Step {currentStepIndex + 1} of {legs.length}
                  </span>
                  <ProvenanceBadge provenance={currentLeg.provenance} size="sm" />
                </div>
                <div className="flex items-center gap-3 font-semibold">
                  <span>{remainingDistance} m remaining</span>
                  <span>•</span>
                  <span>~{remainingMinutes} min</span>
                </div>
              </div>

              {/* Current Instruction Display */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
                  <LegIcon className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-stone-400 dark:text-stone-500">
                    Current Direction
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 leading-snug">
                    {currentLeg.instruction}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium">
                    {currentLeg.details}
                  </p>
                </div>
              </div>

              {/* Accessibility Feature & Assurance Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-extrabold text-emerald-900 dark:text-emerald-200 block">
                    Accessibility Assessment: {currentLeg.accessibilityStatus.toUpperCase()}
                  </span>
                  <p className="text-emerald-800 dark:text-emerald-300">
                    Confidence grade: <strong className="font-bold">{currentLeg.confidence}</strong>. Verified with physical curb cuts and level transitions suitable for manual/power wheelchairs.
                  </p>
                </div>
              </div>

              {/* Upcoming Next Step Preview */}
              {currentStepIndex < legs.length - 1 && (
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                  <div className="flex items-center gap-2 truncate mr-2">
                    <span className="font-extrabold text-stone-400 dark:text-stone-500 shrink-0">
                      NEXT:
                    </span>
                    <span className="truncate font-medium text-stone-800 dark:text-stone-200">
                      {legs[currentStepIndex + 1].instruction}
                    </span>
                  </div>
                  <span className="shrink-0 font-bold text-stone-500">
                    in {currentLeg.distanceMeters}m
                  </span>
                </div>
              )}

              {/* Barrier Report Sub-form if triggered */}
              {isReportingBarrier && (
                <form
                  onSubmit={handleReportCurrentLegObstacle}
                  className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Report Obstacle on this Step</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsReportingBarrier(false)}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    value={barrierDescription}
                    onChange={(e) => setBarrierDescription(e.target.value)}
                    placeholder="Describe issue (e.g., Construction blocking curb, broken elevator)..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReport || !barrierDescription.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingReport ? 'Submitting Report...' : 'Broadcast Community Alert'}
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </div>

        {/* Bottom Navigation Actions (Always Accessible) */}
        {!isArrived && (
          <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleRepeatVoice}
                className="px-3.5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus-visible:ring-2 ring-emerald-500"
                title="Speak current instruction aloud"
              >
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Repeat</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReportingBarrier(!isReportingBarrier)}
                className="px-3.5 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                title="Report obstacle at current location"
              >
                <Flag className="w-4 h-4 text-amber-600" />
                <span className="whitespace-nowrap">Report Barrier</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSimulating(!isSimulating)}
                className={`px-3.5 py-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  isSimulating
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-400 text-blue-700 dark:text-blue-300'
                    : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                }`}
                title="Automatically step through route"
              >
                {isSimulating ? <Pause className="w-4 h-4 text-blue-600" /> : <Play className="w-4 h-4 text-blue-600" />}
                <span className="hidden sm:inline">{isSimulating ? 'Pause Auto' : 'Auto Walk'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
                className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 disabled:opacity-30 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all focus-visible:ring-2 ring-emerald-500"
              >
                <span>{isLastStep ? 'Complete Journey' : 'Next Step'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
