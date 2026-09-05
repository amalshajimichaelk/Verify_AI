import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ArrowRight, Database, ExternalLink } from 'lucide-react';
import { AnalysisResult } from '../types';
import { historyApi } from '../api/historyApi';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

export const HistoryView: React.FC<{ onInspectCase: (caseId: string) => void }> = ({
  onInspectCase,
}) => {
  const [historyItems, setHistoryItems] = useState<AnalysisResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassification, setSelectedClassification] = useState('ALL');
  const [selectedMediaType, setSelectedMediaType] = useState('ALL');

  useEffect(() => {
    historyApi
      .getHistory({
        query: searchQuery,
        classification: selectedClassification,
        mediaType: selectedMediaType,
      })
      .then((res) => {
        setHistoryItems(res.items);
      });
  }, [searchQuery, selectedClassification, selectedMediaType]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 pb-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono text-xs font-bold uppercase border border-orange-500/30">
            Forensic Case Registry
          </span>
          <span className="text-xs font-mono text-[#737373]">• Historical Case Repository</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#e0e0e0]">
          Verification Case History
        </h1>
        <p className="text-xs sm:text-sm text-[#a3a3a3]">
          Audit log of verified image, audio, and video cases evaluated by VerifyAI enclaves.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-black/60 border border-white/8">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search by case ID, asset, or finding..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto font-mono text-xs">
          <select
            value={selectedClassification}
            onChange={(e) => setSelectedClassification(e.target.value)}
            className="bg-black text-[#e0e0e0] px-3 py-2 rounded-lg border border-white/10"
          >
            <option value="ALL">All Classifications</option>
            <option value="LIKELY_AI_GENERATED">Likely AI-Generated</option>
            <option value="POTENTIAL_MANIPULATION">Potential Manipulation</option>
            <option value="LIKELY_AUTHENTIC">Likely Authentic</option>
            <option value="INCONCLUSIVE">Inconclusive</option>
          </select>

          <select
            value={selectedMediaType}
            onChange={(e) => setSelectedMediaType(e.target.value)}
            className="bg-black text-[#e0e0e0] px-3 py-2 rounded-lg border border-white/10"
          >
            <option value="ALL">All Media Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
          </select>
        </div>
      </div>

      {/* Case List */}
      <div className="flex flex-col gap-3">
        {historyItems.map((item) => (
          <GlassCard
            key={item.jobId}
            interactive
            onClick={() => onInspectCase(item.jobId)}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-orange-500/40"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                <img
                  src={item.asset.url}
                  alt={item.asset.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-orange-400">
                    CASE {item.jobId.toUpperCase()}
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-xs font-semibold text-[#e0e0e0]">{item.asset.name}</span>
                </div>
                <p className="text-xs text-[#a3a3a3] line-clamp-1">{item.primaryFinding}</p>
                <div className="flex items-center gap-3 text-[10px] font-mono text-[#737373]">
                  <span>{new Date(item.generatedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{item.asset.mimeType}</span>
                  <span>•</span>
                  <span>{(item.asset.size / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
              <div className="text-right font-mono">
                <Badge classification={item.classification} size="sm" />
                <div className="text-[11px] text-orange-400 mt-0.5 font-semibold">
                  {item.calibratedConfidence}% Conf
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-white" />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
