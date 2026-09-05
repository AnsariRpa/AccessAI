/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CommunityReport, ReportCategory, ReportSeverity } from '../../types';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { api } from '../../services/api';
import {
  AlertTriangle,
  PlusCircle,
  ThumbsUp,
  MapPin,
  Clock,
  ShieldAlert,
  Sparkles,
  Camera,
  X,
} from 'lucide-react';

interface CommunityReportsViewProps {
  reports: CommunityReport[];
  onReportCreated: (newReport: CommunityReport) => void;
  onUpvoteReport: (reportId: string) => void;
}

export const CommunityReportsView: React.FC<CommunityReportsViewProps> = ({
  reports,
  onReportCreated,
  onUpvoteReport,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory>('blocked_ramp');
  const [severity, setSeverity] = useState<ReportSeverity>('high');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description of the accessibility issue.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await api.submitReport({
        category,
        severity,
        description: description.trim(),
        location: {
          lat: 13.0827,
          lng: 80.2707,
          address: address.trim() || 'Near Chennai Central Plaza',
        },
        authorName: 'Community Contributor',
      });
      onReportCreated(created);
      setIsModalOpen(false);
      setDescription('');
      setAddress('');
    } catch (err: any) {
      setError('Failed to submit report. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryLabels: Record<ReportCategory, string> = {
    blocked_ramp: 'Blocked Wheelchair Ramp',
    broken_elevator: 'Broken / Out of Service Elevator',
    unexpected_stairs: 'Unexpected Stairs (No Ramp)',
    missing_curb_cut: 'Missing Curb Cut / High Curb',
    steep_incline: 'Hazardous Steep Incline',
    construction_obstruction: 'Construction Blocking Sidewalk',
    accessible_entrance_confirmed: 'Accessible Level Entrance Confirmed',
  };

  return (
    <div id="community-reports-container" className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Community Accessibility Intelligence</span>
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Real-time conditions reported and confirmed by mobility travelers. Never assumes unverified status.
          </p>
        </div>

        <button
          id="btn-open-report-modal"
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none shrink-0"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>Report Accessibility Issue</span>
        </button>
      </div>

      {/* Reports Feed List */}
      <div className="space-y-3">
        {reports.map((report) => {
          const isBlocking = report.severity === 'critical_blocking' || report.severity === 'high';

          return (
            <div
              key={report.id}
              className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700 transition-shadow space-y-3 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {categoryLabels[report.category] || report.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        isBlocking
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {report.severity.replace(/_/g, ' ')}
                    </span>
                    <ProvenanceBadge provenance={report.provenance} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{report.location.address}</span>
                  </div>
                </div>

                {/* Upvote Button */}
                <button
                  type="button"
                  onClick={() => onUpvoteReport(report.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-semibold transition-colors"
                  title="Confirm this accessibility report"
                >
                  <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{report.upvotes} Confirmations</span>
                </button>
              </div>

              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {report.description}
              </p>

              {/* AI Classification Pill if applicable */}
              {report.aiClassification && (
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs flex items-center gap-2 text-stone-600 dark:text-stone-400">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Gemini AI Verification:</strong>{' '}
                    {report.aiClassification.detectedObstacle} (Confidence:{' '}
                    {Math.round(report.aiClassification.aiConfidence * 100)}%)
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800">
                <span>Reported by {report.authorName}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full p-6 border border-stone-200 dark:border-stone-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
                <span>Submit Accessibility Report</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300 block">
                  Hazard / Feature Category:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReportCategory)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300 block">
                  Severity:
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as ReportSeverity)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="low">Low — Minor inconvenience / Informational</option>
                  <option value="medium">Medium — Requires caution / detour</option>
                  <option value="high">High — Significant barrier for wheelchair</option>
                  <option value="critical_blocking">Critical — Completely impassable</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300 block">
                  Approximate Location or Landmark:
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., Chennai Central Metro Gate 2 Elevator"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300 block">
                  Detailed Description:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the physical condition (e.g., pallets blocking the ramp, elevator displays maintenance code)..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
