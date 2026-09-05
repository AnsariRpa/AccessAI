/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AccessibilityProfile,
  CommunityReport,
  EvaluatedRoute,
  MultimodalAnalysisResult,
  AccessiblePlace,
} from '../types';

export const api = {
  async extractIntent(
    query: string,
    currentProfile: AccessibilityProfile
  ): Promise<{
    intent: 'NAVIGATE' | 'DISCOVER_PLACES' | 'INSPECT_ENTRANCE' | 'REPORT_ISSUE' | 'GENERAL_QUERY';
    destination?: string;
    category?: string;
    updatedProfile?: Partial<AccessibilityProfile>;
    confidence: number;
    extractedReasoning: string;
  }> {
    const res = await fetch('/api/ai/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, currentProfile }),
    });
    if (!res.ok) throw new Error('Failed to extract intent');
    return res.json();
  },

  async evaluateRoutes(
    destination: string,
    origin: string,
    profile: AccessibilityProfile
  ): Promise<{
    destination: string;
    profileUsed: AccessibilityProfile;
    evaluatedRoutes: EvaluatedRoute[];
  }> {
    const res = await fetch('/api/routes/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, origin, profile }),
    });
    if (!res.ok) throw new Error('Failed to evaluate routes');
    return res.json();
  },

  async analyzePhoto(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
    userQuestion?: string
  ): Promise<MultimodalAnalysisResult> {
    const res = await fetch('/api/ai/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType, userQuestion }),
    });
    if (!res.ok) throw new Error('Failed to analyze photo');
    return res.json();
  },

  async explainRoute(
    route: EvaluatedRoute,
    profile: AccessibilityProfile
  ): Promise<string> {
    const res = await fetch('/api/ai/explain-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route, profile }),
    });
    if (!res.ok) throw new Error('Failed to explain route');
    const data = await res.json();
    return data.explanation;
  },

  async getReports(): Promise<CommunityReport[]> {
    const res = await fetch('/api/reports');
    if (!res.ok) throw new Error('Failed to fetch reports');
    const data = await res.json();
    return data.reports;
  },

  async submitReport(reportData: {
    category: string;
    severity: string;
    description: string;
    location?: { lat: number; lng: number; address: string };
    authorName?: string;
    imageBase64?: string;
  }): Promise<CommunityReport> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    if (!res.ok) throw new Error('Failed to submit report');
    const data = await res.json();
    return data.report;
  },

  async upvoteReport(id: string): Promise<number> {
    const res = await fetch(`/api/reports/${id}/upvote`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to upvote report');
    const data = await res.json();
    return data.upvotes;
  },

  async searchPlaces(query?: string, category?: string): Promise<AccessiblePlace[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category) params.append('category', category);

    const res = await fetch(`/api/places/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search places');
    const data = await res.json();
    return data.places;
  },
};
