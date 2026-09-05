import React from 'react';
import { Shield, Lock, Eye, Activity, ExternalLink } from 'lucide-react';
import { usePreferences } from '../../hooks/usePreferences';

export const Footer: React.FC = () => {
  const { preferences, toggleReducedMotion, toggleHighContrast } = usePreferences();

  return (
    <footer className="w-full bg-[#050505] border-t border-white/8 mt-auto">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col gap-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Column 1: Forensic Method */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-semibold text-[#e0e0e0]">Forensic Method</span>
            </div>
            <p className="text-xs text-[#a3a3a3] leading-relaxed">
              Evidence under glass. VerifyAI decomposes pixel anomalies, neural synthesis
              signatures, synthetic speech latent spaces, and immutable C2PA manifest history for
              evidentiary certitude.
            </p>
          </div>

          {/* Column 2: Provenance Standards */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#e0e0e0]">
              Provenance Standards
            </span>
            <div className="flex flex-col gap-1.5 text-xs text-[#a3a3a3]">
              <a href="#standards" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                <span>C2PA Specification v2.1</span>
                <ExternalLink className="w-3 h-3 text-[#737373]" />
              </a>
              <a href="#cai" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                <span>Content Authenticity Initiative (CAI)</span>
              </a>
              <a href="#ieee" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                <span>IEEE Media Forensics Benchmark (MFF)</span>
              </a>
              <a href="#iso" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                <span>ISO/IEC JTC 1/SC 29 Standards</span>
              </a>
            </div>
          </div>

          {/* Column 3: Privacy & Custody */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#e0e0e0]">
              Privacy & Custody
            </span>
            <div className="flex flex-col gap-1.5 text-xs text-[#a3a3a3]">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Lock className="w-3.5 h-3.5" />
                <span className="font-semibold">Zero Media Retention Policy</span>
              </div>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                All client visual payloads execute in-memory inside encrypted cryptographic
                enclaves; zero disk persists after session release. Files never train AI models.
              </p>
            </div>
          </div>

          {/* Column 4: Diagnostics & Accessibility */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#e0e0e0]">
              Diagnostics & Accessibility
            </span>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-2 rounded bg-black/60 border border-white/5">
                <span className="text-xs text-[#a3a3a3]">Reduced Motion</span>
                <button
                  type="button"
                  id="toggle-reduced-motion-btn"
                  onClick={toggleReducedMotion}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold transition-colors ${
                    preferences.reducedMotion
                      ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-bold'
                      : 'bg-white/5 text-[#a3a3a3] hover:bg-white/10'
                  }`}
                >
                  {preferences.reducedMotion ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-black/60 border border-white/5">
                <span className="text-xs text-[#a3a3a3]">High Contrast Optics</span>
                <button
                  type="button"
                  id="toggle-high-contrast-btn"
                  onClick={toggleHighContrast}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold transition-colors ${
                    preferences.highContrast
                      ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-bold'
                      : 'bg-white/5 text-[#a3a3a3] hover:bg-white/10'
                  }`}
                >
                  {preferences.highContrast ? 'ACTIVE' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#737373]">
          <span>© 2025 VerifyAI Intelligence Systems Corp. Calibrated Scientific Telemetry.</span>
          <div className="flex items-center gap-4 text-xs">
            <a href="#warranty" className="hover:text-[#e0e0e0] transition-colors">
              Legal Cryptographic Warranty
            </a>
            <span className="text-white/20">•</span>
            <a href="#status" className="hover:text-[#e0e0e0] transition-colors">
              Operational Status: Normal
            </a>
            <span className="text-white/20">•</span>
            <a href="#audits" className="hover:text-[#e0e0e0] transition-colors">
              Audited Pipeline Hash
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
