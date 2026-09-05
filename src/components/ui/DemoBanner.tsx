/**
 * Demo Mode Banner
 *
 * Displayed when the app is running in demo mode.
 * NEVER disguises demo results as real forensic analysis.
 * This banner is persistent and clearly labeled.
 */

import React from 'react';
import { FlaskConical, X } from 'lucide-react';

const IS_DEMO = 
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true') ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEMO_MODE === 'true') || 
  true; // Default to demo when no backend

export const DemoBanner: React.FC = () => {
  const [dismissed, setDismissed] = React.useState(false);

  if (!IS_DEMO || dismissed) return null;

  return (
    <div
      role="banner"
      className="w-full bg-gradient-to-r from-amber-950/90 via-yellow-950/90 to-amber-950/90 border-b border-amber-500/30 px-4 py-2"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <FlaskConical className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span className="text-amber-300 font-bold uppercase tracking-wide">⚗ Demo Mode</span>
          <span className="text-amber-200/70 hidden sm:inline">
            — All analysis results are deterministic samples and do NOT represent real forensic
            findings. Configure real providers and set{' '}
            <code className="text-amber-400">ENABLE_REAL_ANALYSIS=true</code> for production use.
          </span>
          <span className="text-amber-200/70 sm:hidden">Results are demo samples only.</span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-amber-500/60 hover:text-amber-300 transition-colors shrink-0"
          aria-label="Dismiss demo mode banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
