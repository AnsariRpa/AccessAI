/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProvenanceType } from '../../types';
import { CheckCheck, ShieldCheck, Users, Sparkles, User, HelpCircle } from 'lucide-react';

interface ProvenanceBadgeProps {
  provenance: ProvenanceType;
  size?: 'sm' | 'md';
  showExplanation?: boolean;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  provenance,
  size = 'md',
  showExplanation = false,
}) => {
  const config = {
    VERIFIED: {
      label: 'VERIFIED',
      icon: CheckCheck,
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
      description: 'Confirmed on-site by certified access survey or multiple trusted sources',
    },
    OFFICIAL_SOURCE: {
      label: 'OFFICIAL SOURCE',
      icon: ShieldCheck,
      bgColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      description: 'Published by venue management or public municipal transit authority',
    },
    COMMUNITY_REPORTED: {
      label: 'COMMUNITY REPORTED',
      icon: Users,
      bgColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
      description: 'Reported directly by community mobility navigators',
    },
    AI_INFERRED: {
      label: 'AI INFERRED',
      icon: Sparkles,
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      description: 'Derived via Gemini multimodal computer vision (requires verification)',
    },
    USER_PROVIDED: {
      label: 'USER PROVIDED',
      icon: User,
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700',
      description: 'Provided as part of user session input',
    },
    UNKNOWN: {
      label: 'UNVERIFIED',
      icon: HelpCircle,
      bgColor: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600',
      description: 'No verified accessibility telemetry available for this section',
    },
  }[provenance] || {
    label: 'UNVERIFIED',
    icon: HelpCircle,
    bgColor: 'bg-stone-100 text-stone-700 border-stone-300',
    description: 'Unknown data origin',
  };

  const Icon = config.icon;
  const isSm = size === 'sm';

  return (
    <div className="inline-flex flex-col gap-0.5" title={config.description}>
      <span
        id={`provenance-${provenance.toLowerCase()}`}
        className={`inline-flex items-center gap-1.5 font-semibold rounded-md border tracking-wider uppercase ${
          isSm ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'
        } ${config.bgColor}`}
      >
        <Icon className={isSm ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} aria-hidden="true" />
        <span>{config.label}</span>
      </span>
      {showExplanation && (
        <span className="text-[11px] text-stone-500 dark:text-stone-400 pl-0.5">
          {config.description}
        </span>
      )}
    </div>
  );
};
