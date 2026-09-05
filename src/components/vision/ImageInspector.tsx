/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { api } from '../../services/api';
import { MultimodalAnalysisResult } from '../../types';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import {
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles,
  ShieldAlert,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';

export const ImageInspector: React.FC = () => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [question, setQuestion] = useState('Can I enter this building using a wheelchair?');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MultimodalAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Curated demo test photos for instant multimodal verification
  const samplePresets = [
    {
      title: 'Entrance with 3 Steps (Hazard)',
      desc: 'Three concrete steps leading to glass door, no ramp in view',
      svgUri:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23e2e8f0"/><rect x="140" y="40" width="120" height="180" fill="%23334155"/><rect x="150" y="50" width="100" height="160" fill="%2364748b"/><rect x="120" y="220" width="160" height="20" fill="%2394a3b8"/><rect x="100" y="240" width="200" height="20" fill="%23cbd5e1"/><rect x="80" y="260" width="240" height="20" fill="%23e2e8f0"/><text x="200" y="280" font-family="sans-serif" font-size="12" fill="%23475569" text-anchor="middle">3 Concrete Steps Visible</text></svg>',
    },
    {
      title: 'Level Ramp Entrance (Accessible)',
      desc: 'Gradual ramp with continuous safety handrails',
      svgUri:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23dcfce7"/><rect x="140" y="40" width="120" height="180" fill="%2314532d"/><polygon points="40,280 140,220 260,220 260,280" fill="%2386efac"/><line x1="40" y1="260" x2="140" y2="200" stroke="%23166534" stroke-width="4"/><text x="180" y="260" font-family="sans-serif" font-size="12" fill="%2314532d" text-anchor="middle">Compliant Gradual Ramp</text></svg>',
    },
    {
      title: 'Blocked Sidewalk Ramp (Obstacle)',
      desc: 'Delivery crates and bollard obstructing ramp passage',
      svgUri:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23fee2e2"/><rect x="80" y="160" width="240" height="100" fill="%23fca5a5"/><rect x="120" y="180" width="60" height="60" fill="%23b91c1c"/><rect x="190" y="190" width="70" height="50" fill="%23991b1b"/><text x="200" y="270" font-family="sans-serif" font-size="12" fill="%237f1d1d" text-anchor="middle">Pallets Blocking Ramp</text></svg>',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.analyzePhoto(imageBase64, 'image/jpeg', question);
      setResult(res);
    } catch (err: any) {
      setError('Failed to analyze image with Gemini. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="image-inspector-container" className="max-w-4xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Camera className="w-6 h-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>Multimodal Entrance & Obstacle Inspector</span>
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Upload an entrance, ramp, elevator, or street photo. Gemini analyzes visible physical features with rigorous epistemic modesty.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Image Selector & Dropzone */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-white dark:bg-stone-900 flex flex-col items-center justify-center min-h-[260px] relative">
            {imageBase64 ? (
              <div className="w-full space-y-3">
                <div className="relative rounded-xl overflow-hidden max-h-[220px] border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 flex items-center justify-center">
                  <img
                    src={imageBase64}
                    alt="Uploaded entrance or physical obstacle"
                    referrerPolicy="no-referrer"
                    className="max-h-[220px] object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImageBase64(null);
                    setResult(null);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center justify-center gap-1 mx-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Choose a different photo</span>
                </button>
              </div>
            ) : (
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 block">
                    Upload an entrance or street photo
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 block">
                    Drag and drop or click to browse (PNG, JPG, WebP)
                  </span>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          {/* Preset Sample Photos */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider block">
              Or test with sample scenarios:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setImageBase64(preset.svgUri);
                    setResult(null);
                  }}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 hover:border-emerald-500 transition-colors text-left flex items-center gap-3"
                >
                  <ImageIcon className="w-5 h-5 text-stone-400 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block truncate">
                      {preset.title}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block truncate">
                      {preset.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* User Query Input */}
          <div className="space-y-1.5">
            <label htmlFor="input-question" className="text-xs font-bold text-stone-700 dark:text-stone-300">
              Specific accessibility question:
            </label>
            <input
              id="input-question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Can I enter this building using a wheelchair?"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Analyze Button */}
          <button
            id="btn-analyze-photo"
            type="button"
            onClick={handleAnalyze}
            disabled={!imageBase64 || isLoading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gemini Analyzing Physical Infrastructure...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Analyze Photo with Gemini</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Structured Evidence-Based Results */}
        <div className="space-y-4">
          {result ? (
            <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    Inspection Verdict:
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                      result.verdict === 'ACCESSIBLE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : result.verdict === 'INACCESSIBLE'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {result.verdict.replace(/_/g, ' ')}
                  </span>
                </div>
                <ProvenanceBadge provenance={result.provenance} size="sm" />
              </div>

              {/* Cautious Recommendation Banner */}
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 dark:text-stone-400 block">
                  Cautious Recommendation (Confidence: {result.confidence})
                </span>
                <p className="text-stone-800 dark:text-stone-200 font-medium leading-relaxed">
                  {result.cautiousRecommendation}
                </p>
              </div>

              {/* Visual Observations (Factual) */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[11px] block">
                  Direct Visual Observations:
                </span>
                <ul className="space-y-1 pl-1">
                  {result.visualObservations.map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-stone-600 dark:text-stone-400">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Detected Physical Barriers */}
              {result.detectedBarriers.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Identified Obstacles & Steps:</span>
                  </span>
                  <ul className="space-y-1 pl-1">
                    {result.detectedBarriers.map((barr, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-stone-700 dark:text-stone-300 font-medium">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{barr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Epistemic Modesty: Unknown Elements */}
              {result.unknownElements.length > 0 && (
                <div className="space-y-1.5 text-xs p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                  <span className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Epistemic Modesty (Unseen / Unconfirmed):</span>
                  </span>
                  <ul className="space-y-1 pl-1">
                    {result.unknownElements.map((un, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-stone-600 dark:text-stone-400">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{un}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-center flex flex-col items-center justify-center min-h-[300px] space-y-3">
              <ShieldAlert className="w-10 h-10 text-stone-400" aria-hidden="true" />
              <div className="space-y-1 max-w-sm">
                <span className="text-sm font-bold text-stone-800 dark:text-stone-200 block">
                  Awaiting Photo Inspection
                </span>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Select a sample photo or upload an image to inspect steps, ramp slopes, automatic door thresholds, and physical blockages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
