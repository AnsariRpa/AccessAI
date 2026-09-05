/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import { Header } from './components/common/Header';
import { DestinationBar } from './components/journey/DestinationBar';
import { RouteComparison } from './components/journey/RouteComparison';
import { RouteTimeline } from './components/journey/RouteTimeline';
import { InteractiveMap } from './components/map/InteractiveMap';
import { ImageInspector } from './components/vision/ImageInspector';
import { CommunityReportsView } from './components/community/CommunityReportsView';
import { PlaceDiscoveryView } from './components/discovery/PlaceDiscoveryView';
import { ProfileModal } from './components/profile/ProfileModal';
import { ActiveGuidanceModal } from './components/journey/ActiveGuidanceModal';
import { api } from './services/api';
import { EvaluatedRoute, CommunityReport } from './types';
import { Compass, CheckCircle2, AlertTriangle, Sparkles, Map } from 'lucide-react';

function AccessAIContent() {
  const { profile, updateProfile, speakText, speechEnabled } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'journey' | 'vision' | 'reports' | 'places'>('journey');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Journey Planner State
  const [destination, setDestination] = useState('Chennai Central');
  const [routes, setRoutes] = useState<EvaluatedRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [activeNavRoute, setActiveNavRoute] = useState<EvaluatedRoute | null>(null);

  // Initial Load: Fetch Community Reports & Initial Sample Route Evaluation
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const initialReports = await api.getReports();
      setReports(initialReports);
      // Run initial evaluation for default destination
      await handleSearchDestination('Chennai Central');
    } catch (e) {
      console.error('Initial load error:', e);
    }
  };

  const handleSearchDestination = async (query: string) => {
    setIsLoadingRoutes(true);
    try {
      // 1. Natural Language Intent Processing via Gemini
      const intentResult = await api.extractIntent(query, profile);

      if (intentResult.updatedProfile) {
        updateProfile(intentResult.updatedProfile);
      }

      const targetDest = intentResult.destination || query;
      setDestination(targetDest);

      if (intentResult.intent === 'DISCOVER_PLACES') {
        setActiveTab('places');
        setIsLoadingRoutes(false);
        return;
      }

      if (intentResult.intent === 'INSPECT_ENTRANCE') {
        setActiveTab('vision');
        setIsLoadingRoutes(false);
        return;
      }

      if (intentResult.intent === 'REPORT_ISSUE') {
        setActiveTab('reports');
        setIsLoadingRoutes(false);
        return;
      }

      // 2. Evaluate Routes Deterministically
      const evaluation = await api.evaluateRoutes(targetDest, 'Current Location', profile);
      setRoutes(evaluation.evaluatedRoutes);
      if (evaluation.evaluatedRoutes.length > 0) {
        setSelectedRouteId(evaluation.evaluatedRoutes[0].id);

        if (speechEnabled) {
          const rec = evaluation.evaluatedRoutes[0];
          speakText(
            `Route evaluated for ${targetDest}. Recommended route scores ${rec.accessibilityScore} out of 100. ${rec.positiveFactors.join('. ')}`
          );
        }
      }
    } catch (err) {
      console.error('Search destination error:', err);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const handleStartNavigation = (route: EvaluatedRoute) => {
    setActiveNavRoute(route);
    setActiveNotification(`Turn-by-turn guidance active along ${route.name}`);
    speakText(`Starting accessible turn-by-turn guidance along ${route.name}. Proceeding to Step 1.`);
    setTimeout(() => setActiveNotification(null), 4000);
  };

  const handleReportCreated = (newReport: CommunityReport) => {
    setReports((prev) => [newReport, ...prev]);
    setActiveNotification('Accessibility report submitted. Thank you for contributing!');
    setTimeout(() => setActiveNotification(null), 4000);
  };

  const handleUpvoteReport = async (reportId: string) => {
    try {
      const upvotes = await api.upvoteReport(reportId);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, upvotes } : r))
      );
    } catch (e) {
      console.error('Failed to upvote report', e);
    }
  };

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0] || null;

  return (
    <div id="accessai-root" className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Floating Notification Toast */}
      {activeNotification && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{activeNotification}</span>
        </div>
      )}

      {/* Main Work Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Tab 1: Journey Planner (Primary Product Loop) */}
        {activeTab === 'journey' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <DestinationBar
              onSearch={handleSearchDestination}
              isLoading={isLoadingRoutes}
              currentDestination={destination}
            />

            {/* Split Screen Layout (Desktop: Side-by-side / Mobile: Stacked) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Route Comparison & Step Breakdown (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {isLoadingRoutes ? (
                  <div className="p-12 text-center text-stone-500 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold text-sm">
                      Evaluating journey alternatives against your mobility profile...
                    </span>
                  </div>
                ) : routes.length > 0 ? (
                  <>
                    <RouteComparison
                      routes={routes}
                      selectedRouteId={selectedRouteId}
                      onSelectRoute={setSelectedRouteId}
                      onStartNavigation={handleStartNavigation}
                    />

                    {selectedRoute && (
                      <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
                        <RouteTimeline
                          legs={selectedRoute.legs}
                          destinationName={destination}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 text-center">
                    <Compass className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                    <span className="text-sm font-bold text-stone-700 dark:text-stone-300 block">
                      No routes evaluated yet
                    </span>
                    <span className="text-xs text-stone-500">
                      Enter a destination above to evaluate accessible alternatives.
                    </span>
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Map Canvas (5 cols sticky) */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 h-[420px] lg:h-[620px]">
                <InteractiveMap
                  activeRoute={selectedRoute}
                  reports={reports}
                  destinationName={destination}
                  onUpvoteReport={handleUpvoteReport}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Multimodal Photo Inspector */}
        {activeTab === 'vision' && <ImageInspector />}

        {/* Tab 3: Community Reports */}
        {activeTab === 'reports' && (
          <CommunityReportsView
            reports={reports}
            onReportCreated={handleReportCreated}
            onUpvoteReport={handleUpvoteReport}
          />
        )}

        {/* Tab 4: Accessible Place Discovery */}
        {activeTab === 'places' && (
          <PlaceDiscoveryView
            onSelectPlaceForNavigation={(placeName) => {
              setDestination(placeName);
              setActiveTab('journey');
              handleSearchDestination(placeName);
            }}
          />
        )}
      </main>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          // Re-evaluate routes with updated profile
          if (destination) {
            handleSearchDestination(destination);
          }
        }}
      />

      {/* Active Turn-by-Turn Guidance Modal */}
      {activeNavRoute && (
        <ActiveGuidanceModal
          route={activeNavRoute}
          destinationName={destination}
          onClose={() => setActiveNavRoute(null)}
          onReportObstacle={handleReportCreated}
        />
      )}

      {/* Footer with Mission Statement & Provenance Legend */}
      <footer className="mt-auto border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 py-6 text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-stone-800 dark:text-stone-200">
              AccessAI
            </span>
            <span>—</span>
            <span>The best journey for the individual person.</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span>Provenance Key:</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">VERIFIED</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">COMMUNITY</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">AI INFERRED</span>
            <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-bold">UNVERIFIED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <AccessAIContent />
    </AccessibilityProvider>
  );
}
