import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  tier?: 1 | 2 | 3;
  hairline?: boolean;
  className?: string;
  id?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  tier = 2,
  hairline = true,
  className = '',
  id,
  ...props
}) => {
  const tierClasses = {
    1: 'bg-[#0a0a0a]/95 border-white/6 shadow-lg',
    2: 'bg-[#121212]/85 backdrop-blur-xl border-white/10 shadow-2xl',
    3: 'bg-[#141414]/95 backdrop-blur-2xl border-white/10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.9)]',
  };

  return (
    <div
      id={id}
      className={`relative rounded-xl border overflow-hidden ${tierClasses[tier]} ${
        hairline ? 'hairline-top' : ''
      } ${className}`}
      {...props}
    >
      {hairline && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-400/40 to-transparent pointer-events-none" />
      )}
      {children}
    </div>
  );
};
