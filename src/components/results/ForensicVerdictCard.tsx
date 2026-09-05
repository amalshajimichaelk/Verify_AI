import React from 'react';
import { ShieldAlert, ShieldCheck, HelpCircle, Info, Sparkles, AlertCircle, FileCheck2 } from 'lucide-react';
import { AnalysisResult } from '../../types';
import { getClassificationConfig } from '../../services/forensicEngine';
import { GlassPanel } from '../glass/GlassPanel';
import { Badge } from '../ui/Badge';

interface ForensicVerdictCardProps {
  result: AnalysisResult;
  onGenerateReport?: () => void;
  onAddToInvestigation?: () => void;
}

export const ForensicVerdictCard: React.FC<ForensicVerdictCardProps> = ({
  result,
  onGenerateReport,
  onAddToInvestigation,
}) => {
  const config = getClassificationConfig(result.classification);
  const isSynthetic = result.classification === 'LIKELY_AI_GENERATED';
  const isManipulated = result.classification === 'POTENTIAL_MANIPULATION';
  const isAuthentic = result.classification === 'LIKELY_AUTHENTIC';

  return (
    <GlassPanel tier={3} className="p-6 flex flex-col gap-5 border-orange-500/25">
      {/* Top Bar: Assessment Status & Confidence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase text-[#737373] tracking-wider">
              Calibrated Decisional Assessment
            </span>
            {result.isDemoData && (
              <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono text-[10px]">
                CALIBRATED DEMO DATA
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge classification={result.classification} size="md">
              {config.label}
            </Badge>
            <span className="text-xs font-mono text-[#a3a3a3]">
              Strength: <strong className="text-[#e0e0e0]">{result.evidenceStrength}</strong>
            </span>
            <span className="text-xs font-mono text-[#a3a3a3]">
              Coverage:{' '}
              <strong className="text-orange-400">
                {result.coverageRatio.active}/{result.coverageRatio.total} Models
              </strong>
            </span>
          </div>
        </div>

        {/* Confidence Dial / Metric */}
        <div className="flex items-center gap-3 bg-[#0a0a0a]/90 px-4 py-2.5 rounded-xl border border-white/10">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-orange-400 tracking-tight">
              {result.calibratedConfidence}%
            </div>
            <div className="text-[10px] font-mono text-[#737373]">
              Range: [{result.confidenceRange[0]}% – {result.confidenceRange[1]}%]
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-orange-500/30 border-t-orange-400 flex items-center justify-center text-xs font-mono text-orange-400 shrink-0">
            {result.calibratedConfidence}
          </div>
        </div>
      </div>

      {/* Primary Finding Hero Banner with Newsreader editorial serif accent */}
      <div className="p-4 rounded-lg bg-[#0a0a0a]/80 border border-white/8 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-1" />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold font-mono text-[#e0e0e0] tracking-wider uppercase">
            Primary Forensic Finding
          </span>
          <p className="text-sm font-serif italic text-orange-300 leading-relaxed">
            "{result.primaryFinding}"
          </p>
        </div>
      </div>

      {/* Summary Rationale */}
      <div className="text-xs text-[#a3a3a3] leading-relaxed">
        <span className="text-[#e0e0e0] font-medium">Telemetry Synthesis: </span>
        {result.summaryRationale}
      </div>

      {/* Uncertainty & Ethics Disclaimer Box */}
      <div className="p-3 rounded-lg bg-[#141414]/90 border border-white/8 flex items-start gap-2.5 text-[11px] font-mono text-[#737373]">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[#e0e0e0] font-semibold">Honest Uncertainty Calibration</span>
          <p className="text-[#a3a3a3] leading-normal">{result.uncertaintyExplanation}</p>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="pt-2 border-t border-white/8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#737373]">
          <span>Enclave Job ID:</span>
          <code className="text-orange-400 bg-black px-2 py-0.5 rounded border border-white/10">
            {result.jobId}
          </code>
        </div>

        <div className="flex items-center gap-2">
          {onAddToInvestigation && (
            <button
              type="button"
              onClick={onAddToInvestigation}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#e0e0e0] text-xs font-mono border border-white/10 transition-colors"
            >
              Pin to Investigation
            </button>
          )}
          {onGenerateReport && (
            <button
              type="button"
              onClick={onGenerateReport}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-400 to-amber-200 text-black text-xs font-mono font-bold shadow-[0_0_14px_rgba(249,115,22,0.35)] hover:shadow-[0_0_22px_rgba(249,115,22,0.5)] transition-all flex items-center gap-1.5"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Generate Verification Dossier
            </button>
          )}
        </div>
      </div>
    </GlassPanel>
  );
};
