import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  active?: boolean;
  className?: string;
  id?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  interactive = false,
  active = false,
  className = '',
  id,
  ...props
}) => {
  return (
    <div
      id={id}
      className={`rounded-xl bg-[#121212]/70 backdrop-blur-md border border-white/8 p-4 transition-all duration-200 ${
        interactive ? 'hover:bg-[#1a1a1a]/90 hover:border-orange-500/35 hover:shadow-[0_0_20px_rgba(249,115,22,0.12)] cursor-pointer' : ''
      } ${active ? 'border-orange-500 ring-1 ring-orange-500/35 bg-[#1a1a1a]' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
