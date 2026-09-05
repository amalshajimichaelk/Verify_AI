import React from 'react';
import { AnalysisResult } from '../../types';
import { AlertCircle, UserCheck, EyeOff, FileQuestion } from 'lucide-react';
import { GlassPanel } from '../glass/GlassPanel';

interface LimitationsCalloutProps {
  limitations: AnalysisResult['limitations'];
}

export const LimitationsCallout: React.FC<LimitationsCalloutProps> = ({ limitations }) => {
  return (
    <GlassPanel tier={2} className="p-5 flex flex-col gap-4 border-white/8">
      <div className="flex items-center gap-2 text-xs font-mono text-[#e0e0e0]">
        <AlertCircle className="w-4 h-4 text-orange-400" />
        <span className="font-semibold">Evaluative Limitations & Recommended Human Checks</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        {/* Blind Spots */}
        <div className="p-3.5 rounded-lg bg-black/60 border border-white/5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-red-400">
            <EyeOff className="w-3.5 h-3.5" />
            <span className="font-bold">System Blind Spots</span>
          </div>
          <ul className="list-disc list-inside text-[#a3a3a3] text-[11px] leading-relaxed flex flex-col gap-1">
            {limitations.blindSpots.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Unavailable Data */}
        <div className="p-3.5 rounded-lg bg-black/60 border border-white/5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-orange-400">
            <FileQuestion className="w-3.5 h-3.5" />
            <span className="font-bold">Unavailable Evidence</span>
          </div>
          <ul className="list-disc list-inside text-[#a3a3a3] text-[11px] leading-relaxed flex flex-col gap-1">
            {limitations.unavailableData.length > 0 ? (
              limitations.unavailableData.map((item, i) => <li key={i}>{item}</li>)
            ) : (
              <li className="text-[#737373]">All primary container payloads available.</li>
            )}
          </ul>
        </div>

        {/* Recommended Human Checks */}
        <div className="p-3.5 rounded-lg bg-black/60 border border-white/5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <UserCheck className="w-3.5 h-3.5" />
            <span className="font-bold">Human Verification Protocol</span>
          </div>
          <ul className="list-disc list-inside text-[#a3a3a3] text-[11px] leading-relaxed flex flex-col gap-1">
            {limitations.recommendedHumanChecks.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </GlassPanel>
  );
};
