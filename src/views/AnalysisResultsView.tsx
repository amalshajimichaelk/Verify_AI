import React, { useState } from 'react';
import {
  ArrowLeft,
  FileCheck2,
  Bookmark,
  Share2,
  ShieldCheck,
  Cpu,
  Layers,
  Clock,
  ExternalLink,
  Download,
  AlertCircle,
} from 'lucide-react';
import { AnalysisResult, MediaAsset } from '../types';
import { ImageViewer } from '../components/viewers/ImageViewer';
import { VideoViewer } from '../components/viewers/VideoViewer';
import { AudioViewer } from '../components/viewers/AudioViewer';
import { ForensicVerdictCard } from '../components/results/ForensicVerdictCard';
import { SignalBreakdownList } from '../components/results/SignalBreakdownList';
import { MetadataTable } from '../components/results/MetadataTable';
import { ProvenanceTimeline } from '../components/results/ProvenanceTimeline';
import { LimitationsCallout } from '../components/results/LimitationsCallout';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { reportApi } from '../api/reportApi';
import { investigationApi } from '../api/investigationApi';

interface AnalysisResultsViewProps {
  result: AnalysisResult;
  onBackToConsole: () => void;
  onOpenReport?: (reportId: string) => void;
  onOpenInvestigation?: () => void;
}

export const AnalysisResultsView: React.FC<AnalysisResultsViewProps> = ({
  result,
  onBackToConsole,
  onOpenReport,
  onOpenInvestigation,
}) => {
  const [activeTab, setActiveTab] = useState<string>('SIGNALS');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [analystNotes, setAnalystNotes] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);
  const [bookmarkedSignals, setBookmarkedSignals] = useState<string[]>([]);
  const [pinnedNotification, setPinnedNotification] = useState<string | null>(null);

  const tabs = [
    { id: 'SIGNALS', label: 'Signals & Verdict', count: result.signals.length },
    { id: 'METADATA', label: 'Metadata & C2PA', count: result.metadata.length },
    { id: 'PROVENANCE', label: 'Provenance Graph', count: result.sources.length },
    { id: 'LIMITATIONS', label: 'Limitations & Protocol' },
  ];

  const handleToggleBookmark = (signalId: string) => {
    setBookmarkedSignals((prev) =>
      prev.includes(signalId) ? prev.filter((id) => id !== signalId) : [...prev, signalId]
    );
  };

  const handlePinAssetToInvestigation = async () => {
    try {
      const invs = await investigationApi.listInvestigations();
      const targetInv = invs[0] || (await investigationApi.createInvestigation({ title: 'Active Case Board', description: 'Default board' }));
      await investigationApi.addItem(targetInv.id, {
        title: `Asset: ${result.asset.name}`,
        type: 'MEDIA',
        content: `Classification: ${result.classification} (${result.calibratedConfidence}%) - ${result.primaryFinding}`,
        mediaUrl: result.asset.url,
        badge: `${result.classification} (${result.calibratedConfidence}%)`,
        pinned: true,
      });
      setPinnedNotification('Asset pinned to Reuters FactCheck Lab Investigation Board!');
      setTimeout(() => setPinnedNotification(null), 3500);
    } catch {
      // ignore
    }
  };

  const handleCreateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const rep = await reportApi.generateReport(result, {
        name: 'Sarah Lin',
        organization: 'Reuters FactCheck Lab',
        notes: analystNotes,
      });
      setGeneratedReportId(rep.id);
      setIsReportModalOpen(false);
      if (onOpenReport) {
        onOpenReport(rep.id);
      }
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToConsole}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Console
          </Button>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-[#e0e0e0] truncate max-w-xs sm:max-w-md">
                {result.asset.name}
              </span>
              <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono text-[10px] border border-orange-500/30">
                CASE {result.jobId.toUpperCase()}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#737373] truncate max-w-sm sm:max-w-xl">
              SHA-256: {result.asset.hashSha256}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="glass"
            size="sm"
            onClick={handlePinAssetToInvestigation}
            icon={<Bookmark className="w-3.5 h-3.5" />}
          >
            Pin to Board
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsReportModalOpen(true)}
            icon={<FileCheck2 className="w-3.5 h-3.5" />}
          >
            Generate Dossier
          </Button>
        </div>
      </div>

      {/* Pinned Toast Notification */}
      {pinnedNotification && (
        <div className="p-3 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>{pinnedNotification}</span>
          {onOpenInvestigation && (
            <button
              type="button"
              onClick={onOpenInvestigation}
              className="underline text-white font-bold hover:text-amber-200"
            >
              View Board →
            </button>
          )}
        </div>
      )}

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Forensic Media Viewer (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-24">
          {result.asset.type === 'video' ? (
            <VideoViewer
              videoUrl={result.asset.url}
              videoName={result.asset.name}
              durationSeconds={result.asset.durationSeconds}
            />
          ) : result.asset.type === 'audio' ? (
            <AudioViewer
              audioUrl={result.asset.url}
              audioName={result.asset.name}
              durationSeconds={result.asset.durationSeconds}
            />
          ) : (
            <ImageViewer
              imageUrl={result.asset.url}
              imageName={result.asset.name}
              hasAnomalies={result.classification !== 'LIKELY_AUTHENTIC'}
            />
          )}

          {/* Quick Enclave Telemetry Pill */}
          <div className="p-3 rounded-lg bg-black/80 border border-white/6 flex items-center justify-between text-xs font-mono text-[#737373]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Enclave Ingestion Sealed
            </span>
            <span>Bit Depth: 24-bit Non-Retained</span>
          </div>
        </div>

        {/* Right Column: Forensic Results & Tabs (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Main Verdict Summary Card */}
          <ForensicVerdictCard
            result={result}
            onGenerateReport={() => setIsReportModalOpen(true)}
            onAddToInvestigation={handlePinAssetToInvestigation}
          />

          {/* Tab Navigation */}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {/* Tab Contents */}
          {activeTab === 'SIGNALS' && (
            <SignalBreakdownList
              signals={result.signals}
              bookmarkedSignalIds={bookmarkedSignals}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {activeTab === 'METADATA' && <MetadataTable metadata={result.metadata} />}

          {activeTab === 'PROVENANCE' && (
            <ProvenanceTimeline timeline={result.timeline} sources={result.sources} />
          )}

          {activeTab === 'LIMITATIONS' && (
            <LimitationsCallout limitations={result.limitations} />
          )}
        </div>
      </div>

      {/* Generate Verification Dossier Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Generate Forensic Verification Dossier"
        subtitle={`Case ${result.jobId} • Legal-grade audit trail with JSON-LD ClaimReview`}
        icon={<FileCheck2 className="w-5 h-5 text-orange-400" />}
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-mono text-[#737373]">
              Digitally signed by Reuters FactCheck Lab Enclave
            </span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsReportModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateReport}
                isLoading={isGeneratingReport}
              >
                Compile & Sign Dossier
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4 font-mono text-xs">
          <div className="p-3 rounded-lg bg-black border border-white/6 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#e0e0e0] font-semibold">Subject Asset:</span>
              <span className="text-orange-400">{result.asset.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#e0e0e0] font-semibold">Classification:</span>
              <span className="text-orange-400 font-bold">{result.classification} ({result.calibratedConfidence}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#e0e0e0] font-semibold">C2PA Manifest:</span>
              <span className="text-[#737373]">{result.c2paValidation?.isValid ? 'VALID' : 'MISSING / INVALID'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="analyst-notes-input" className="text-[#e0e0e0] font-medium">
              Analyst Endorsement & Contextual Notes (Optional)
            </label>
            <textarea
              id="analyst-notes-input"
              rows={4}
              value={analystNotes}
              onChange={(e) => setAnalystNotes(e.target.value)}
              placeholder="e.g. Reviewed corneal lighting angles against studio architectural blueprints. Endorse synthetic classification with high confidence."
              className="w-full bg-black text-[#e0e0e0] p-3 rounded-lg border border-white/10 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
