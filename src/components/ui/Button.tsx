import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs font-medium gap-2',
    lg: 'px-6 py-2.5 text-sm font-semibold gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-semibold hover:from-orange-300 hover:to-amber-100 shadow-[0_0_18px_rgba(249,115,22,0.35)] hover:shadow-[0_0_26px_rgba(249,115,22,0.5)] border border-orange-400/40',
    secondary:
      'bg-white/5 text-[#e0e0e0] hover:bg-white/10 hover:text-white border border-white/10',
    glass:
      'bg-white/5 text-[#e0e0e0] hover:bg-white/10 border border-white/10 hover:border-orange-400/40 backdrop-blur-md',
    danger:
      'bg-red-950/40 text-red-300 hover:bg-red-900/60 border border-red-500/30',
    ghost:
      'bg-transparent text-[#a3a3a3] hover:text-[#e0e0e0] hover:bg-white/5 border border-transparent',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
