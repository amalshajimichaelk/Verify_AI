import React, { useState } from 'react';
import {
  Sparkles,
  Link2,
  Film,
  Image as ImageIcon,
  Mic,
  ShieldCheck,
  FlaskConical,
  ExternalLink,
  Layers,
  ArrowRight,
  Database,
  Cpu,
} from 'lucide-react';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassUploadZone } from '../components/glass/GlassUploadZone';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { BENCHMARK_CASES } from '../mock/mockDatabase';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { MediaAsset } from '../types';

interface HomeConsoleViewProps {
  onStartAnalysis: (asset: MediaAsset, caseId?: string) => void;
  onOpenCase: (caseId: string) => void;
}

export const HomeConsoleView: React.FC<HomeConsoleViewProps> = ({
  onStartAnalysis,
  onOpenCase,
}) => {
  const [activeTab, setActiveTab] = useState<'DROP' | 'URL'>('DROP');
  const [urlInput, setUrlInput] = useState('');

  const {
    isDragging,
    isUploading,
    uploadProgress,
    error,
    uploadedAsset,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    selectFile,
    submitUrl,
    cancelUpload,
    retryUpload,
    clearMedia,
  } = useMediaUpload((res) => {
    onStartAnalysis(res.asset, res.jobId);
  });

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      submitUrl(urlInput.trim());
    }
  };

  const stagedCase4892 = BENCHMARK_CASES['case-4892'];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8">
      {/* Top Welcome & Scientific Statement Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0d0d0d] via-[#121212] to-[#0a0a0a] border border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col gap-1.5 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono text-xs font-bold uppercase tracking-wider border border-orange-500/30">
              Zero-Retention Forensic Enclave
            </span>
            <span className="text-xs font-mono text-[#737373]">• IEEE Media Forensics Benchmark</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#e0e0e0]">
            Deepfake Detection & Media Provenance Engine
          </h1>
          <p className="text-xs sm:text-sm text-[#a3a3a3] leading-relaxed">
            Multi-spectral analysis evaluating synthetic GAN artifacts, diffusion latent noise,
            facial landmark micro-symmetry, voice clone vocoder frequencies, and C2PA cryptographic
            lineage under rigorous honest uncertainty calibration.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0 font-mono text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Enclave Security: Sealed RAM</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#737373]">
            <Cpu className="w-4 h-4 text-orange-400" />
            <span className="text-[#a3a3a3]">10 Neural Signal Families Online</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Chamber (Left 7 cols) & Staged Benchmark Case (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Optical Forensic Chamber (Upload) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <GlassPanel tier={2} className="p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/8">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#e0e0e0]">
                <Layers className="w-4 h-4 text-orange-400" />
                <span>Optical Forensic Chamber</span>
              </div>

              {/* Mode Toggle: Drag / URL */}
              <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 rounded-lg border border-white/8 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('DROP')}
                  className={`px-3 py-1 rounded transition-colors ${
                    activeTab === 'DROP'
                      ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-bold shadow-sm'
                      : 'text-[#a3a3a3] hover:text-white'
                  }`}
                >
                  File Ingest
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('URL')}
                  className={`px-3 py-1 rounded transition-colors ${
                    activeTab === 'URL'
                      ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-bold shadow-sm'
                      : 'text-[#a3a3a3] hover:text-white'
                  }`}
                >
                  Remote URL
                </button>
              </div>
            </div>

            {activeTab === 'DROP' ? (
              <GlassUploadZone
                isDragging={isDragging}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                error={error}
                uploadedAsset={uploadedAsset}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onSelectFile={selectFile}
                onCancel={cancelUpload}
                onRetry={retryUpload}
                onClear={clearMedia}
              />
            ) : (
              <form onSubmit={handleUrlSubmit} className="flex flex-col gap-4 py-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="remote-url-input" className="text-xs font-mono text-[#a3a3a3]">
                    Target Media URL (Image, Video, or Audio stream)
                  </label>
                  <Input
                    id="remote-url-input"
                    placeholder="https://wire.reuters.com/media/press_conference_raw.mp4"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    leftIcon={<Link2 className="w-4 h-4 text-orange-400" />}
                    disabled={isUploading}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-mono text-[#737373]">
                    Supports HTTP/HTTPS • Max 250MB buffer
                  </span>
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    isLoading={isUploading}
                    disabled={!urlInput.trim()}
                  >
                    Ingest & Trace Provenance
                  </Button>
                </div>
              </form>
            )}
          </GlassPanel>
        </div>

        {/* Staged High-Priority Case from Stitch Design */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <GlassPanel tier={2} className="p-6 flex flex-col gap-4 border-orange-500/25">
            <div className="flex items-center justify-between pb-3 border-b border-white/8 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[#e0e0e0] font-semibold">Staged Media File</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                PRIORITY TRIAGE
              </span>
            </div>

            {/* Thumbnail Preview with Anomaly Bounding Box */}
            <div className="relative w-full h-44 rounded-lg overflow-hidden bg-black border border-white/10 group cursor-pointer"
                 onClick={() => onOpenCase('case-4892')}>
              <img
                src={stagedCase4892.asset.url}
                alt="Staged Media Asset"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

              {/* Anomaly Callout Overlay */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs font-mono">
                <span className="text-[#e0e0e0] font-semibold truncate max-w-[200px]">
                  {stagedCase4892.asset.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold">
                  DESYNC: 142ms
                </span>
              </div>
            </div>

            {/* File Details Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#a3a3a3]">
              <div className="p-2 rounded bg-black/60 border border-white/5">
                <span className="text-[#737373] block text-[10px]">FILE SIZE</span>
                <strong className="text-[#e0e0e0]">42.8 MB (HEVC 4K)</strong>
              </div>
              <div className="p-2 rounded bg-black/60 border border-white/5">
                <span className="text-[#737373] block text-[10px]">FRAME SPEC</span>
                <strong className="text-[#e0e0e0]">59.94 FPS / 46.2s</strong>
              </div>
              <div className="p-2 rounded bg-black/60 border border-white/5 col-span-2">
                <span className="text-[#737373] block text-[10px]">BITSTREAM SHA-256 HASH</span>
                <code className="text-orange-400 text-[10px] break-all">
                  {stagedCase4892.asset.hashSha256}
                </code>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => onOpenCase('case-4892')}
                icon={<FlaskConical className="w-4 h-4" />}
              >
                Inspect Case #4892
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => onOpenCase('case-4892')}
              >
                Verify Now
              </Button>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Benchmark Verification Registry Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-[#e0e0e0]">
              Calibrated Benchmark Evaluation Cases
            </span>
          </div>
          <span className="text-[#737373]">Interactive Evaluator Test Records</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Object.entries(BENCHMARK_CASES).map(([caseId, caseData]) => {
            return (
              <GlassCard
                key={caseId}
                interactive
                onClick={() => onOpenCase(caseId)}
                className="flex flex-col gap-3 p-4 hover:border-orange-500/40"
              >
                {/* Image Header */}
                <div className="relative w-full h-36 rounded-lg overflow-hidden bg-black border border-white/8">
                  <img
                    src={caseData.asset.url}
                    alt={caseData.asset.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge classification={caseData.classification} size="sm" />
                  </div>
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/85 backdrop-blur-sm border border-white/10 text-[10px] font-mono font-bold text-orange-400">
                    {caseData.calibratedConfidence}% Conf
                  </div>
                </div>

                {/* Case Info */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#e0e0e0] font-semibold truncate max-w-[180px]">
                      {caseData.asset.name}
                    </span>
                    <span className="text-[10px] text-[#737373] uppercase">
                      {caseData.asset.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#a3a3a3] line-clamp-2 leading-relaxed">
                    {caseData.primaryFinding}
                  </p>
                </div>

                {/* Footer Link */}
                <div className="pt-2 border-t border-white/6 flex items-center justify-between text-[11px] font-mono text-orange-400 group-hover:text-amber-300">
                  <span>Inspect Forensic Signals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
