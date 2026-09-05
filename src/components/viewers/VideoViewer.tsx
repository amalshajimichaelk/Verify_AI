import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  AlertTriangle,
  Film,
  Layers,
} from 'lucide-react';
import { GlassPanel } from '../glass/GlassPanel';

interface VideoViewerProps {
  videoUrl: string;
  videoName: string;
  durationSeconds?: number;
  anomalyStartSecond?: number;
  anomalyEndSecond?: number;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({
  videoUrl,
  videoName,
  durationSeconds = 46.2,
  anomalyStartSecond = 14.0,
  anomalyEndSecond = 29.5,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(18.4);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showDesyncOverlay, setShowDesyncOverlay] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepFrame = (deltaFrames: number) => {
    const fps = 60;
    const newTime = Math.max(0, Math.min(durationSeconds, currentTime + deltaFrames / fps));
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const isAnomalyRange = currentTime >= anomalyStartSecond && currentTime <= anomalyEndSecond;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  return (
    <GlassPanel tier={2} className="flex flex-col w-full h-full min-h-[460px]">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/80 border-b border-white/8 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-orange-400" />
          <span className="text-[#e0e0e0] font-medium truncate max-w-[220px]">{videoName}</span>
          <span className="px-1.5 py-0.5 rounded bg-white/5 text-orange-400 border border-white/10 text-[10px]">
            4K HEVC @ 59.94 FPS
          </span>
        </div>

        {/* Desync Alert Pill */}
        {isAnomalyRange && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-[10px] font-bold">DESYNC ANOMALY: +142ms</span>
          </div>
        )}
      </div>

      {/* Video Stage with Stitch Face Warp Inspection Overlay */}
      <div className="relative flex-1 bg-[#050505] flex items-center justify-center min-h-[360px] overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-h-[420px] w-auto object-contain rounded"
          crossOrigin="anonymous"
          muted={isMuted}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Fallback Simulation Still when video stream is remote demo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuByJQxRQVTkvz1_CLjHWkY_ELLmFF8Snsnz5pmj5EaiTO5NWkuK58F2PeI5zt2DaE4Bdm2ljEwRnVp2pomeOZaCvXsxsQiSlKlV-Alai5oA8FCK1IObLooHXvyos19Tcifuerc0i5U1RlbjLnDnb5JgsScNzEt1bXBDEuyCmgDmpO3iGbpAeKTJWXGGawPeuToRvuU__DiU7mqiaBT58hXo0fFieFWIrK_ignDoxZ9ojxDV6eHfxBKd4A"
            alt="Video frame keyframe"
            className="max-h-[400px] w-auto object-contain rounded opacity-90"
          />

          {/* Facial Mesh Landmarks Overlay */}
          {showDesyncOverlay && (
            <div className="absolute top-[38%] left-[45%] w-24 h-24 border border-orange-400/60 rounded-full bg-orange-400/10 pointer-events-none flex items-center justify-center">
              <div className="w-16 h-8 border-b-2 border-red-400/80 rounded-b-full animate-pulse" />
              <div className="absolute -bottom-6 px-1 py-0.5 rounded bg-black border border-orange-400 text-[9px] font-mono text-orange-400">
                Lip-Sync Gap: 142ms
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrubbing Timeline & Controls */}
      <div className="p-3 bg-black/90 border-t border-white/8 flex flex-col gap-2.5 font-mono text-xs">
        {/* Timeline Bar with Anomaly Highlight Band */}
        <div className="relative flex flex-col gap-1">
          <div className="relative w-full h-3 bg-[#171717] rounded cursor-pointer overflow-hidden border border-white/5">
            {/* Anomaly span highlight */}
            <div
              className="absolute top-0 bottom-0 bg-red-500/30 border-x border-red-500/80"
              style={{
                left: `${(anomalyStartSecond / durationSeconds) * 100}%`,
                width: `${((anomalyEndSecond - anomalyStartSecond) / durationSeconds) * 100}%`,
              }}
              title="Acoustic phoneme-viseme desynchronization window"
            />
            {/* Playhead fill */}
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-300 opacity-90 pointer-events-none"
              style={{ width: `${(currentTime / durationSeconds) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#737373]">
            <span className="text-orange-400 font-bold">{formatTime(currentTime)}</span>
            <span>GOP Sequence: I-P-B-B (60 FPS)</span>
            <span>{formatTime(durationSeconds)}</span>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 rounded bg-gradient-to-r from-orange-400 to-amber-200 text-black hover:opacity-90 font-semibold transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => handleStepFrame(-1)}
              className="p-1.5 rounded bg-white/5 text-[#a3a3a3] hover:text-white border border-white/8"
              title="Step -1 Frame"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleStepFrame(1)}
              className="p-1.5 rounded bg-white/5 text-[#a3a3a3] hover:text-white border border-white/8"
              title="Step +1 Frame"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentTime(0);
                if (videoRef.current) videoRef.current.currentTime = 0;
              }}
              className="p-1.5 rounded bg-white/5 text-[#a3a3a3] hover:text-white border border-white/8"
              title="Rewind to start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDesyncOverlay(!showDesyncOverlay)}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                showDesyncOverlay ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'text-[#737373]'
              }`}
            >
              Lip Mesh Track
            </button>

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded bg-white/5 text-[#a3a3a3] hover:text-white border border-white/8"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};
