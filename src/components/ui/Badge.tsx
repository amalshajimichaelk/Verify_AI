import React from 'react';
import { ClassificationType } from '../../types';
import { getClassificationConfig } from '../../services/forensicEngine';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'warning' | 'error' | 'neutral' | 'classification';
  classification?: ClassificationType;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  classification,
  dot = true,
  size = 'md',
  className = '',
}) => {
  if (classification) {
    const config = getClassificationConfig(classification);
    return (
      <span
        role="status"
        aria-label={`Forensic Status: ${config.label}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border backdrop-blur-md ${config.badgeStyle} ${className}`}
      >
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />}
        <span>{children || config.label}</span>
      </span>
    );
  }

  const variantStyles = {
    primary: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    secondary: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    error: 'bg-red-500/20 text-red-300 border-red-500/30',
    neutral: 'bg-white/5 text-[#a3a3a3] border-white/10',
  };

  const dotStyles = {
    primary: 'bg-orange-400',
    secondary: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-red-400',
    neutral: 'bg-[#737373]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono border ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};
