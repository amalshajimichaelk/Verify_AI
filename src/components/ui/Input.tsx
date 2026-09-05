import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightElement,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[#a3a3a3]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-[#737373] pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full bg-[#0a0a0a]/90 text-[#e0e0e0] placeholder:text-[#737373] text-xs font-mono py-2 rounded-lg border transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 ${
            leftIcon ? 'pl-9' : 'pl-3'
          } ${rightElement ? 'pr-20' : 'pr-3'} ${
            error ? 'border-red-500/60 focus:ring-red-400' : 'border-white/10 hover:border-white/20'
          } ${className}`}
          {...props}
        />
        {rightElement && <div className="absolute right-1.5 flex items-center">{rightElement}</div>}
      </div>
      {error && <span className="text-[11px] text-red-400 font-mono">{error}</span>}
    </div>
  );
};
