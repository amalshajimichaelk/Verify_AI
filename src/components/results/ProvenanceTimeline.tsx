import React from 'react';
import { TimelineEvent, SourceMatch } from '../../types';
import { GlassPanel } from '../glass/GlassPanel';
import { Clock, ExternalLink, Globe, ShieldCheck, Share2 } from 'lucide-react';

interface ProvenanceTimelineProps {
  timeline: TimelineEvent[];
  sources: SourceMatch[];
}

export const ProvenanceTimeline: React.FC<ProvenanceTimelineProps> = ({ timeline, sources }) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Reverse Appearance Matches */}
      <GlassPanel tier={2} className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-orange-400" />
            <span className="text-[#e0e0e0] font-semibold">
              Reverse Appearance Graph & Dissemination Crawl
            </span>
          </div>
          <span className="text-[#737373]">{sources.length} indexed instances</span>
        </div>

        <div className="flex flex-col gap-3">
          {sources.map((src) => (
            <div
              key={src.id}
              className="p-3.5 rounded-lg bg-black/70 border border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      src.relationship === 'Earliest source found'
                        ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black'
                        : src.relationship === 'Possible source'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-white/5 text-[#a3a3a3]'
                    }`}
                  >
                    {src.relationship}
                  </span>
                  <span className="text-[#e0e0e0] font-medium">{src.domain}</span>
                  <span className="text-[#737373]">[{src.timestamp}]</span>
                </div>
                <p className="text-[#a3a3a3] text-[11px] leading-relaxed">{src.context}</p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <div className="text-right">
                  <div className="text-orange-400 font-bold">{src.similarityScore}%</div>
                  <div className="text-[9px] text-[#737373]">SIMILARITY</div>
                </div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded bg-white/5 hover:bg-white/10 text-orange-400 border border-white/10 transition-colors"
                  title="Open source URL"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Chronological Dissemination Timeline */}
      <GlassPanel tier={2} className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="text-[#e0e0e0] font-semibold">Provenance Chronology Timeline</span>
        </div>

        <div className="relative pl-6 border-l-2 border-orange-500/30 flex flex-col gap-6 ml-2 font-mono text-xs">
          {timeline.map((event) => (
            <div key={event.id} className="relative flex flex-col gap-1">
              {/* Timeline Dot */}
              <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-orange-400 ring-4 ring-[#050505]" />

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-orange-400 font-bold">{event.timestamp}</span>
                <span className="text-[#737373]">•</span>
                <span className="text-[#e0e0e0] font-medium">{event.title}</span>
                <span className="px-1.5 py-0.2 rounded bg-white/5 text-[9px] text-[#737373] border border-white/5">
                  {event.eventType}
                </span>
              </div>
              <p className="text-[#a3a3a3] text-[11px] leading-relaxed">{event.description}</p>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
};
