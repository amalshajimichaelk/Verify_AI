import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Cpu,
  Shield,
  Layers,
} from 'lucide-react';
import { ForensicSignal, SignalCategory } from '../../types';
import { GlassPanel } from '../glass/GlassPanel';
import { GlassCard } from '../glass/GlassCard';

interface SignalBreakdownListProps {
  signals: ForensicSignal[];
  bookmarkedSignalIds?: string[];
  onToggleBookmark?: (signalId: string) => void;
}

export const SignalBreakdownList: React.FC<SignalBreakdownListProps> = ({
  signals,
  bookmarkedSignalIds = [],
  onToggleBookmark,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(signals[0]?.id || null);

  const categories = [
    { id: 'ALL', label: 'All Signals' },
    { id: 'OPTICAL', label: 'Optical / Pixel' },
    { id: 'ACOUSTIC', label: 'Acoustic / Voice' },
    { id: 'METADATA', label: 'Sensor / CFA' },
    { id: 'PROVENANCE', label: 'C2PA / Provenance' },
  ];

  const filteredSignals =
    selectedCategory === 'ALL'
      ? signals
      : signals.filter((s) => s.category === selectedCategory);

  const getStatusBadge = (status: ForensicSignal['status']) => {
    switch (status) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-300 border border-red-500/30 text-[10px] font-mono font-bold">
            CRITICAL ANOMALY
          </span>
        );
      case 'ANOMALOUS':
        return (
          <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-mono font-bold">
            ANOMALOUS
          </span>
        );
      case 'NORMAL':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
            NORMAL (CONSISTENT)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-white/5 text-[#a3a3a3] border border-white/10 text-[10px] font-mono">
            INCONCLUSIVE
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-bold shadow-sm'
                : 'bg-white/5 text-[#a3a3a3] hover:text-white border border-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Signals List */}
      <div className="flex flex-col gap-2.5">
        {filteredSignals.map((signal) => {
          const isExpanded = expandedSignalId === signal.id;
          const isBookmarked = bookmarkedSignalIds.includes(signal.id);

          return (
            <GlassCard
              key={signal.id}
              className={`flex flex-col p-4 transition-all ${
                isExpanded ? 'border-orange-500/40 bg-[#161616] shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'hover:border-white/20'
              }`}
            >
              {/* Header Row */}
              <div className="flex items-center justify-between gap-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedSignalId(isExpanded ? null : signal.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedSignalId(isExpanded ? null : signal.id);
                    }
                  }}
                  className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <span className="text-xs sm:text-sm font-semibold text-[#e0e0e0]">
                      {signal.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#737373] uppercase">
                      [{signal.category}]
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(signal.status)}
                    <div className="text-right font-mono text-xs text-orange-400">
                      Score: <strong>{signal.score}%</strong>
                    </div>
                  </div>
                </div>

                {/* Bookmark Button */}
                {onToggleBookmark && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(signal.id);
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      isBookmarked
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'text-[#737373] hover:text-[#e0e0e0]'
                    }`}
                    title={isBookmarked ? 'Remove from board' : 'Bookmark to Investigation Board'}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                )}

                {/* Toggle Accordion */}
                <button
                  type="button"
                  onClick={() => setExpandedSignalId(isExpanded ? null : signal.id)}
                  className="p-1 text-[#737373] hover:text-white"
                  aria-label={isExpanded ? 'Collapse signal details' : 'Expand signal details'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Primary finding snapshot */}
              <div className="mt-2 text-xs text-[#a3a3a3] pl-4 border-l-2 border-orange-500/40">
                {signal.primaryFinding}
              </div>

              {/* Expanded Technical Details */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-white/6 flex flex-col gap-3 font-mono text-xs text-[#a3a3a3] animate-in fade-in-50 duration-150">
                  <div className="flex items-start gap-2 bg-black/60 p-3 rounded-lg border border-white/5">
                    <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[#e0e0e0] font-semibold">Technical Telemetry: </span>
                      <span>{signal.technicalDetails}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#869397]">
                    <div className="p-2 rounded bg-[#0a0e16]/40 border border-white/5">
                      <span>Model Version: </span>
                      <strong className="text-[#dfe2ee]">{signal.modelVersion}</strong>
                    </div>
                    <div className="p-2 rounded bg-[#0a0e16]/40 border border-white/5">
                      <span>Ensemble Weight: </span>
                      <strong className="text-[#4cd7f6]">{(signal.weight * 100).toFixed(0)}%</strong>
                    </div>
                    <div className="p-2 rounded bg-[#0a0e16]/40 border border-white/5">
                      <span>Detector Confidence: </span>
                      <strong className="text-[#4fdbc8]">{signal.confidence}%</strong>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
