import React from 'react';
import { Shield, BookOpen, ExternalLink, Cpu, Lock, CheckCircle2 } from 'lucide-react';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';

export const ProvenanceResourcesView: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1 pb-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono text-xs font-bold uppercase border border-orange-500/30">
            Forensic Reference & Standards
          </span>
          <span className="text-xs font-mono text-[#737373]">• C2PA & Provenance Guidelines</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#e0e0e0]">
          Cryptographic Provenance & Detection Methodology
        </h1>
        <p className="text-xs sm:text-sm text-[#a3a3a3]">
          Comprehensive specifications detailing the mathematics of honest uncertainty calibration,
          zero-retention memory guarantees, and C2PA root-of-trust verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resource Card 1: C2PA Standard */}
        <GlassPanel tier={2} className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-orange-400">
            <Shield className="w-4 h-4" />
            <span className="font-bold">C2PA Specification v2.1</span>
          </div>
          <h2 className="text-base font-semibold text-[#e0e0e0]">
            Hardware Roots-of-Trust & Digital Capture Attestation
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            The Coalition for Content Provenance and Authenticity (C2PA) defines an open technical
            standard providing publishers, creators, and consumers with opt-in tracing of the origin
            and history of digital content. Hardware keystores inside modern camera bodies (Sony,
            Leica, Nikon) sign SHA-256 asset manifests at the exact instant of sensor actuation.
          </p>
          <div className="p-3 rounded bg-black/80 border border-white/6 font-mono text-xs text-emerald-400">
            ✓ Verifies intact DigiCert CA roots-of-trust and rejects stripped metadata containers.
          </div>
        </GlassPanel>

        {/* Resource Card 2: Honest Uncertainty */}
        <GlassPanel tier={2} className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <BookOpen className="w-4 h-4" />
            <span className="font-bold">Honest Uncertainty Calibration</span>
          </div>
          <h2 className="text-base font-semibold text-[#e0e0e0]">
            Avoiding False Certainty in High-Stakes Fact-Checking
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            AI detectors claiming 99.9% certainty on arbitrary web-recompressed images violate basic
            information theory. VerifyAI employs Bayesian confidence bands, penalizing conflicting
            detector signals and insufficient sensor coverage to yield scientifically honest ranges
            (e.g., "88% ±5.5%").
          </p>
          <div className="p-3 rounded bg-black/80 border border-white/6 font-mono text-xs text-amber-400">
            ⚠ When detectors diverge or coverage is partial, results honestly output INCONCLUSIVE.
          </div>
        </GlassPanel>

        {/* Resource Card 3: Zero Retention */}
        <GlassPanel tier={2} className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Lock className="w-4 h-4" />
            <span className="font-bold">Zero Media Retention Guarantee</span>
          </div>
          <h2 className="text-base font-semibold text-[#e0e0e0]">
            Confidential In-Memory Processing for Whistleblowers & Journalists
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            All submitted payloads are loaded strictly into ephemeral memory buffers in secure
            enclaves. Payloads are never stored on persistent disks, never transmitted to third-party
            clouds, and strictly prohibited from training AI models.
          </p>
        </GlassPanel>

        {/* Resource Card 4: Signal Families */}
        <GlassPanel tier={2} className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-orange-400">
            <Cpu className="w-4 h-4" />
            <span className="font-bold">Multi-Signal Ensembles</span>
          </div>
          <h2 className="text-base font-semibold text-[#e0e0e0]">
            10 Independent Neural & Physical Signal Families
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Verification relies on cross-modal triangulation:
          </p>
          <ul className="list-disc list-inside text-xs text-[#a3a3a3] font-mono flex flex-col gap-1">
            <li>2D Fourier Transform (FFT) latent grid analysis</li>
            <li>Corneal ocular ray tracing & specular highlight geometry</li>
            <li>Error Level Analysis (ELA) localized compression deltas</li>
            <li>Bayer Color Filter Array (CFA) sensor demosaicing</li>
            <li>Phoneme-viseme temporal acoustic synchrony (142ms latency checks)</li>
            <li>Vocoder harmonic cutoff probing at 3.4kHz</li>
          </ul>
        </GlassPanel>
      </div>
    </div>
  );
};
