import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Sparkles,
  Sliders,
  Crosshair,
  RotateCcw,
  Eye,
  Info,
} from 'lucide-react';
import { GlassPanel } from '../glass/GlassPanel';

interface ImageViewerProps {
  imageUrl: string;
  imageName: string;
  hasAnomalies?: boolean;
  onBookmarkSignal?: (signalId: string) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  imageUrl,
  imageName,
  hasAnomalies = true,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [overlayMode, setOverlayMode] = useState<'RAW' | 'HEATMAP' | 'ELA' | 'SPLIT'>('HEATMAP');
  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(4, z + 0.5));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, z - 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 2048);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 2048);
    setHoverCoords({ x, y });
  };

  const handleMouseLeave = () => setHoverCoords(null);

  return (
    <GlassPanel tier={2} className="flex flex-col w-full h-full min-h-[460px]">
      {/* Top Chamber Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/80 border-b border-white/8 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-orange-400" />
          <span className="text-[#e0e0e0] font-medium truncate max-w-[200px] sm:max-w-xs">
            {imageName}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-white/5 text-orange-400 border border-white/10 text-[10px]">
            OPTICAL CHAMBER
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-lg border border-white/8">
          <button
            type="button"
            onClick={() => setOverlayMode('RAW')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              overlayMode === 'RAW' ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-bold' : 'text-[#a3a3a3] hover:text-white'
            }`}
          >
            Raw
          </button>
          <button
            type="button"
            onClick={() => setOverlayMode('HEATMAP')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              overlayMode === 'HEATMAP'
                ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-bold'
                : 'text-[#a3a3a3] hover:text-white'
            }`}
          >
            Spectral Heatmap
          </button>
          <button
            type="button"
            onClick={() => setOverlayMode('ELA')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              overlayMode === 'ELA' ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-bold' : 'text-[#a3a3a3] hover:text-white'
            }`}
          >
            ELA
          </button>
          <button
            type="button"
            onClick={() => setOverlayMode('SPLIT')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              overlayMode === 'SPLIT'
                ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-bold'
                : 'text-[#a3a3a3] hover:text-white'
            }`}
          >
            Split
          </button>
        </div>
      </div>

      {/* Main Canvas Stage */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex-1 bg-[#050505] overflow-hidden flex items-center justify-center cursor-crosshair min-h-[360px]"
      >
        {/* Under-the-glass image surface */}
        <div
          className="relative transition-transform duration-100 ease-out select-none"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Base Image */}
          <img
            src={imageUrl}
            alt="Forensic Asset Subject"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            className="max-h-[440px] w-auto object-contain pointer-events-none rounded"
          />

          {/* Heatmap Overlay Simulation */}
          {(overlayMode === 'HEATMAP' || overlayMode === 'SPLIT') && (
            <div
              className={`absolute inset-0 pointer-events-none mix-blend-screen opacity-70 bg-gradient-to-tr from-orange-500/30 via-red-600/30 to-amber-500/40 rounded ${
                overlayMode === 'SPLIT' ? 'overflow-hidden' : ''
              }`}
              style={
                overlayMode === 'SPLIT' ? { clipPath: `inset(0 0 0 ${splitPosition}%)` } : undefined
              }
            >
              {/* Anomaly hotspots */}
              <div className="absolute top-[28%] left-[34%] w-16 h-16 rounded-full bg-red-500/40 blur-md animate-pulse" />
              <div className="absolute top-[28%] left-[54%] w-16 h-16 rounded-full bg-orange-400/40 blur-md animate-pulse" />
              <div className="absolute bottom-[30%] left-[45%] w-24 h-12 rounded-full bg-amber-400/30 blur-lg" />
            </div>
          )}

          {/* ELA Mode Simulation */}
          {overlayMode === 'ELA' && (
            <div className="absolute inset-0 pointer-events-none mix-blend-difference opacity-85 bg-[#121212] p-4">
              <div className="w-full h-full border border-dashed border-orange-400/40 bg-gradient-to-b from-orange-950/20 via-transparent to-amber-900/20" />
            </div>
          )}

          {/* Interactive Bounding Box Annotation: Corneal Highlight Anomaly */}
          {showAnnotations && hasAnomalies && (
            <div
              className="absolute top-[26%] left-[32%] w-[38%] h-[15%] border-2 border-orange-400 bg-orange-500/15 rounded pointer-events-auto group cursor-pointer"
              title="Corneal specular highlight divergence anomaly"
            >
              <div className="absolute -top-6 left-0 px-1.5 py-0.5 bg-orange-500 text-black text-[9px] font-mono font-bold rounded shadow flex items-center gap-1">
                <span>ANOMALY: OCULAR CORNEA</span>
                <span className="bg-black text-orange-400 px-1 rounded text-[8px]">Δ 140°</span>
              </div>
            </div>
          )}
        </div>

        {/* Split Slider Handle */}
        {overlayMode === 'SPLIT' && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-orange-400 z-10 cursor-ew-resize flex items-center justify-center pointer-events-none"
            style={{ left: `${splitPosition}%` }}
          >
            <div className="w-6 h-6 rounded-full bg-orange-400 text-black flex items-center justify-center shadow-lg pointer-events-auto cursor-ew-resize">
              <Sliders className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Floating Zoom & Pan Toolbar */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 bg-[#121212]/90 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-lg text-xs font-mono">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-white/10 text-[#a3a3a3] hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 text-orange-400 min-w-[40px] text-center font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-white/10 text-[#a3a3a3] hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded hover:bg-white/10 text-[#a3a3a3] hover:text-white"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-[1px] bg-white/10 mx-0.5" />
          <button
            type="button"
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`p-1.5 rounded transition-colors ${
              showAnnotations ? 'bg-orange-500/20 text-orange-400' : 'text-[#737373] hover:bg-white/5'
            }`}
            title="Toggle Anomaly Annotations"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Sub-pixel Coordinates HUD */}
        <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded bg-black/90 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#a3a3a3] flex items-center gap-3">
          <span>
            COORD:{' '}
            <strong className="text-orange-400">
              {hoverCoords ? `${hoverCoords.x}px, ${hoverCoords.y}px` : 'RESTING'}
            </strong>
          </span>
          <span className="text-white/20">•</span>
          <span>
            BAND: <strong className="text-emerald-400">2D-FFT SPEC</strong>
          </span>
        </div>
      </div>

      {/* Split Slider Interactive Input when in SPLIT mode */}
      {overlayMode === 'SPLIT' && (
        <div className="px-4 py-2 bg-black/90 border-t border-white/8 flex items-center gap-3 text-xs font-mono text-[#a3a3a3]">
          <span>Raw Photographic Layer</span>
          <input
            type="range"
            min="0"
            max="100"
            value={splitPosition}
            onChange={(e) => setSplitPosition(Number(e.target.value))}
            className="flex-1 accent-orange-500 cursor-ew-resize"
          />
          <span>Spectral Heatmap Layer</span>
        </div>
      )}
    </GlassPanel>
  );
};
