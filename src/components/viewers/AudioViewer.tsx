import React, { useState } from 'react';
import { Play, Pause, Mic, Radio, Volume2, Sparkles, Activity } from 'lucide-react';
import { GlassPanel } from '../glass/GlassPanel';

interface AudioViewerProps {
  audioUrl?: string;
  audioName: string;
  durationSeconds?: number;
}

export const AudioViewer: React.FC<AudioViewerProps> = ({
  audioName,
  durationSeconds = 34.0,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(42);
  const [showVocoderCutoff, setShowVocoderCutoff] = useState(true);

  // Simulated waveform bar heights
  const bars = [
    24, 38, 52, 60, 48, 72, 85, 90, 68, 44, 30, 65, 80, 95, 70, 50, 35, 60, 78, 88, 55, 40, 28,
    45, 62, 82, 94, 76, 58, 32, 20, 35, 50, 68, 85, 92, 70, 48, 30, 22, 40, 55, 75, 82, 60,
  ];

  return (
    <GlassPanel tier={2} className="flex flex-col w-full h-full min-h-[380px]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/80 border-b border-white/8 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-orange-400" />
          <span className="text-[#e0e0e0] font-medium truncate max-w-[200px]">{audioName}</span>
          <span className="px-1.5 py-0.5 rounded bg-white/5 text-orange-400 border border-white/10 text-[10px]">
            MEL-SPECTRAL FORENSICS
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowVocoderCutoff(!showVocoderCutoff)}
          className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
            showVocoderCutoff
              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
              : 'text-[#737373]'
          }`}
        >
          Vocoder Threshold: 3.4kHz
        </button>
      </div>

      {/* Acoustic Waveform & Spectrogram Stage */}
      <div className="relative flex-1 bg-[#050505] p-6 flex flex-col justify-center gap-4">
        {/* Synthetic Jitter Overlay Banner */}
        <div className="flex items-center justify-between text-xs font-mono text-[#a3a3a3]">
          <span className="flex items-center gap-1.5 text-red-400">
            <Radio className="w-4 h-4" /> Neural Vocoder Trace Detected (Harmonic cutoff at 3.4kHz)
          </span>
          <span>Sample Rate: 48.0 kHz 24-bit</span>
        </div>

        {/* Dynamic Waveform Visualizer */}
        <div className="relative h-32 w-full bg-[#0a0a0a] rounded-lg border border-white/8 p-3 flex items-center gap-1 overflow-hidden">
          {/* Harmonic Cutoff Laser Line */}
          {showVocoderCutoff && (
            <div
              className="absolute left-0 right-0 top-[28%] h-0.5 bg-red-500/80 z-10 border-b border-red-400"
              title="3.4kHz synthetic frequency clamp"
            >
              <span className="absolute right-2 -top-4 text-[9px] font-mono text-red-300 bg-black px-1 rounded border border-red-500/30">
                NYQUIST CUTOFF: 3.4kHz
              </span>
            </div>
          )}

          {/* Interactive Playhead Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-orange-400 z-20 pointer-events-none"
            style={{ left: `${progress}%` }}
          />

          {bars.map((h, i) => {
            const isPlayed = (i / bars.length) * 100 <= progress;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all duration-150"
                style={{
                  height: `${h}%`,
                  backgroundColor: isPlayed ? '#f97316' : '#262626',
                  opacity: isPlayed ? 0.95 : 0.4,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Audio Playback Controls */}
      <div className="px-4 py-3 bg-black/90 border-t border-white/8 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded bg-gradient-to-r from-orange-400 to-amber-200 text-black hover:opacity-90 font-semibold"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <span className="text-orange-400 font-bold">00:14.28</span>
          <span className="text-[#737373]">/ 00:34.00</span>
        </div>

        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-[#a3a3a3]">Pitch Jitter: 4.8 Hz</span>
        </div>
      </div>
    </GlassPanel>
  );
};
