import React, { useRef } from 'react';
import { FolderOpen, X, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { GlassReticle } from './GlassReticle';
import { MediaAsset, UploadResponse } from '../../types';

interface GlassUploadZoneProps {
  isDragging: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  uploadedAsset: MediaAsset | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onSelectFile: (file: File) => void;
  onCancel: () => void;
  onRetry: () => void;
  onClear: () => void;
  onInitiateAnalysis?: () => void;
}

export const GlassUploadZone: React.FC<GlassUploadZoneProps> = ({
  isDragging,
  isUploading,
  uploadProgress,
  error,
  uploadedAsset,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelectFile,
  onCancel,
  onRetry,
  onClear,
  onInitiateAnalysis,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        id="optical-chamber-dropzone"
        role="button"
        tabIndex={0}
        aria-label="Upload media for forensic investigation. Drop media or press Enter to browse files."
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative group rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[300px] border ${
          isDragging
            ? 'bg-[#181818]/90 border-orange-400 ring-2 ring-orange-500/40'
            : isUploading
              ? 'bg-[#121212]/90 border-orange-400/40 cursor-wait'
              : 'bg-[#0a0a0a]/80 hover:bg-[#141414]/90 border-white/8 hover:border-orange-500/40 hover:shadow-[0_0_24px_rgba(249,115,22,0.1)]'
        } focus:outline-none focus:ring-2 focus:ring-orange-400`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="file-upload-input"
          className="hidden"
          accept="image/*,video/*,audio/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onSelectFile(e.target.files[0]);
            }
          }}
        />

        <GlassReticle isHovered={isDragging} className="mb-4" />

        <div className="flex flex-col items-center max-w-md">
          <span className="text-lg font-semibold text-[#e0e0e0] tracking-tight">
            {isUploading ? 'Ingesting Payload into Enclave...' : 'Drop media to investigate'}
          </span>
          <p className="text-sm text-[#a3a3a3] mt-1">
            or choose a file from your device{' '}
            <span className="font-mono text-xs text-[#737373]">(Max 250MB)</span>
          </p>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="w-full max-w-xs mt-5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono text-orange-400">
              <span>ENCLAVE ENCRYPTION</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-300 shadow-[0_0_12px_rgba(249,115,22,0.5)] transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <button
              type="button"
              id="cancel-upload-button"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="mt-1 self-center text-xs text-red-300 hover:text-red-200 flex items-center gap-1 font-mono transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel Ingest
            </button>
          </div>
        )}

        {/* Action Button */}
        {!isUploading && (
          <div className="mt-5">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 group-hover:bg-white/10 text-[#e0e0e0] text-xs font-medium transition-colors border border-white/10 shadow-sm">
              <FolderOpen className="w-4 h-4 text-orange-400" />
              Browse Files
            </span>
          </div>
        )}
      </div>

      {/* Error and Retry Banner */}
      {error && (
        <div
          id="upload-error-alert"
          role="alert"
          className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-3 font-mono"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Security Disclaimer */}
      <div className="flex items-center justify-between px-1 text-[11px] font-mono text-[#737373]">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Client-side SHA-256 fingerprinting
        </span>
        <span className="hidden sm:inline text-white/20">•</span>
        <span>Files processed in zero-retention RAM</span>
      </div>
    </div>
  );
};
