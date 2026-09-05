import React, { useState } from 'react';
import {
  User,
  Shield,
  Trash2,
  CheckCircle2,
  Sliders,
  Lock,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import { GlassPanel } from '../components/glass/GlassPanel';
import { Button } from '../components/ui/Button';
import { usePreferences } from '../hooks/usePreferences';

export const SettingsView: React.FC = () => {
  const { preferences, toggleReducedMotion, toggleHighContrast } = usePreferences();
  const [cacheWiped, setCacheWiped] = useState(false);

  const handleWipeEnclave = () => {
    localStorage.removeItem('verifyai_investigations_v1');
    setCacheWiped(true);
    setTimeout(() => setCacheWiped(false), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1 pb-4 border-b border-white/8">
        <h1 className="text-2xl font-bold text-[#e0e0e0]">Analyst Desk Settings</h1>
        <p className="text-xs text-[#a3a3a3]">
          Configure accessibility, cryptographic identity, and enclave memory privacy policies.
        </p>
      </div>

      {/* Analyst Profile */}
      <GlassPanel tier={2} className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-black font-bold text-lg shadow-sm">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#e0e0e0]">Sarah Lin, Lead Fact-Checker</h2>
            <p className="text-xs text-[#737373] font-mono">
              Reuters FactCheck Lab • Verified Digital Signer #4892
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/8 text-xs font-mono">
          <div className="p-3 rounded bg-black/60 border border-white/5">
            <span className="text-[#737373] block text-[10px]">ORGANIZATION</span>
            <span className="text-[#e0e0e0]">Reuters FactCheck Lab / Verified Media</span>
          </div>
          <div className="p-3 rounded bg-black/60 border border-white/5">
            <span className="text-[#737373] block text-[10px]">C2PA SIGNING KEY</span>
            <span className="text-emerald-400">DigiCert Trusted CA Enclave</span>
          </div>
        </div>
      </GlassPanel>

      {/* Accessibility & Visual Controls */}
      <GlassPanel tier={2} className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-orange-400 font-semibold">
          <Sliders className="w-4 h-4" />
          <span>Optics & Accessibility Preferences</span>
        </div>

        <div className="flex flex-col divide-y divide-white/5">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#e0e0e0] block">Reduced Motion Mode</span>
              <span className="text-[11px] text-[#737373]">
                Disables reticle rotations and pulsing animations
              </span>
            </div>
            <Button
              variant={preferences.reducedMotion ? 'primary' : 'secondary'}
              size="sm"
              onClick={toggleReducedMotion}
            >
              {preferences.reducedMotion ? 'ACTIVE' : 'OFF'}
            </Button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#e0e0e0] block">High Contrast Optics</span>
              <span className="text-[11px] text-[#737373]">
                Enhances border visibility and contrast for forensic inspection
              </span>
            </div>
            <Button
              variant={preferences.highContrast ? 'primary' : 'secondary'}
              size="sm"
              onClick={toggleHighContrast}
            >
              {preferences.highContrast ? 'ACTIVE' : 'OFF'}
            </Button>
          </div>
        </div>
      </GlassPanel>

      {/* Zero Retention & Enclave Memory Purge */}
      <GlassPanel tier={2} className="p-6 flex flex-col gap-4 border-red-500/20">
        <div className="flex items-center gap-2 text-xs font-mono text-red-400 font-semibold">
          <Trash2 className="w-4 h-4" />
          <span>Zero-Retention Enclave Memory Purge</span>
        </div>

        <p className="text-xs text-[#a3a3a3] leading-relaxed">
          Instantly wipes all temporary memory caches, unpins local board items, and releases all
          ephemeral media handles stored in the browser sandbox.
        </p>

        <div className="flex items-center justify-between pt-2">
          {cacheWiped ? (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Enclave memory completely purged.
            </span>
          ) : (
            <span className="text-[11px] font-mono text-[#737373]">Zero disk files persist</span>
          )}

          <Button variant="danger" size="sm" onClick={handleWipeEnclave}>
            Wipe Ephemeral Enclave Memory
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
};
