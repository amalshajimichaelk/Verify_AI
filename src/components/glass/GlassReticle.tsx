import React from 'react';
import { Upload } from 'lucide-react';

interface GlassReticleProps {
  isHovered?: boolean;
  size?: number;
  className?: string;
}

export const GlassReticle: React.FC<GlassReticleProps> = ({
  isHovered = false,
  size = 112,
  className = '',
}) => {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Outer Rotating Reticle Ring SVG */}
      <svg
        className={`absolute inset-0 w-full h-full transition-all duration-500 ${
          isHovered ? 'text-orange-400 scale-105 rotate-45' : 'text-orange-400/40 rotate-0'
        }`}
        fill="none"
        viewBox="0 0 120 120"
      >
        <circle
          cx="60"
          cy="60"
          r="54"
          stroke="currentColor"
          strokeDasharray="4 6"
          strokeWidth="1.2"
        />
        <circle cx="60" cy="60" r="42" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" />
        <line stroke="currentColor" strokeWidth="1.5" x1="60" x2="60" y1="0" y2="20" />
        <line stroke="currentColor" strokeWidth="1.5" x1="60" x2="60" y1="100" y2="120" />
        <line stroke="currentColor" strokeWidth="1.5" x1="0" x2="20" y1="60" y2="60" />
        <line stroke="currentColor" strokeWidth="1.5" x1="100" x2="120" y1="60" y2="60" />
        <circle cx="60" cy="60" fill="currentColor" r="4" />
      </svg>

      {/* Inner Lens Shimmer */}
      <div
        className={`w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center transition-transform duration-300 ${
          isHovered ? 'scale-115 bg-orange-500/25 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'scale-100'
        }`}
      >
        <Upload className="w-7 h-7 text-orange-400" />
      </div>
    </div>
  );
};
