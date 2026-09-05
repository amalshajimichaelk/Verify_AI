import React from 'react';
import { ArrowRight, CheckCircle2, Shield } from 'lucide-react';

interface StageRibbonProps {
  currentStageNumber?: number; // 1 to 5
}

export const StageRibbon: React.FC<StageRibbonProps> = ({ currentStageNumber = 1 }) => {
  const stages = [
    { num: 'STAGE 01', label: 'DETECT', id: 1 },
    { num: 'STAGE 02', label: 'EXPLAIN', id: 2 },
    { num: 'STAGE 03', label: 'TRACE', id: 3 },
    { num: 'STAGE 04', label: 'VERIFY', id: 4 },
    { num: 'STAGE 05', label: 'DECIDE', id: 5 },
  ];

  return (
    <div className="w-full bg-[#050505]/95 border-b border-white/8 px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 shadow-inner text-[11px] font-mono">
      {/* Stages Flow */}
      <div className="flex items-center flex-wrap gap-2 sm:gap-3">
        {stages.map((st, idx) => {
          const isPassed = currentStageNumber >= st.id;
          const isCurrent = currentStageNumber === st.id;
          return (
            <React.Fragment key={st.num}>
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  isCurrent
                    ? 'text-orange-400 font-semibold'
                    : isPassed
                      ? 'text-emerald-400'
                      : 'text-[#737373]'
                }`}
              >
                <span
                  className={`px-1 rounded text-[9px] font-bold ${
                    isCurrent
                      ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black'
                      : isPassed
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 text-[#737373]'
                  }`}
                >
                  {st.num}
                </span>
                <span>{st.label}</span>
              </div>
              {idx < stages.length - 1 && (
                <ArrowRight className="w-3 h-3 text-[#404040] shrink-0" aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Security Telemetry Status */}
      <div className="hidden md:flex items-center gap-4 text-[#a3a3a3]">
        <span className="flex items-center gap-1 text-orange-400">
          <Shield className="w-3.5 h-3.5" />
          C2PA SHA-256 Validated
        </span>
        <span className="w-1 h-1 rounded-full bg-orange-400" />
        <span className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Zero Media Retention: Active
        </span>
      </div>
    </div>
  );
};
