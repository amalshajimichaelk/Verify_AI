import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  FlaskConical,
  ExternalLink,
  SlidersHorizontal,
  History,
  FileText,
  HelpCircle,
  Menu,
  X,
  CheckCircle,
} from 'lucide-react';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenQuickCase: (caseId: string) => void;
  onOpenTests?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  onOpenQuickCase,
  onOpenTests,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home / Console', path: '/' },
    { label: 'Analysis Workspace', path: '/verify' },
    { label: 'Investigate Board', path: '/investigate' },
    { label: 'Source Provenance', path: '/resources' },
    { label: 'Reports & Export', path: '/reports' },
    { label: 'Live Check API', path: '/live' },
    { label: 'History', path: '/history' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-white/8 shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
      <div className="h-16 sm:h-20 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Emblem & Brand Title */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('/')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate('/')}
          className="flex items-center gap-3 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400 rounded p-1"
        >
          <img
            alt="VerifyAI Forensic Glass Emblem"
            className="h-7 sm:h-8 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1WzfsP-hMh_FQhmICV3lI8Aphpz-Dj0ZvqM1vCWM6xrC8MqdWhr2ixZqy1_RhXbHQ1bZJhSfJp8d13tggp8EhCYeKedx__2RWAmabHfx9arRfkMqd6DYFr5bW1uCfgqxM0B_KBCFDwc87M1M4aK3sS0njkH2CQhtzHTacELZPyuWsdReqStfaJfys-n7H3lkQrm8qkgSBdvYY4YbtOlujhWPd7RbOVCP5mEnkGcQL0fCIeIkVa9iUOeib0"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-semibold tracking-tight text-[#e0e0e0]">
                VerifyAI
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-orange-400 font-mono text-[10px] sm:text-xs border border-white/10">
                v3.4 PROD
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#a3a3a3] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              99.8% model coverage active
            </span>
          </div>
        </div>

        {/* Center: Mandate Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded bg-black/80 border border-white/8">
          <span className="font-mono text-[11px] text-[#a3a3a3] uppercase tracking-wider">
            Evidence, not certainty
          </span>
        </div>

        {/* Navigation Bar */}
        <nav
          aria-label="Main Navigation"
          className="hidden lg:flex items-center gap-1 text-xs font-mono"
        >
          {navLinks.map((link) => {
            const isActive =
              currentPath === link.path ||
              (link.path !== '/' && currentPath.startsWith(link.path));
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => onNavigate(link.path)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-semibold shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                    : 'text-[#a3a3a3] hover:text-[#e0e0e0] hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Evaluator Case Inspection */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              id="header-case-4892-btn"
              onClick={() => onOpenQuickCase('case-4892')}
              className="px-2.5 py-1.5 rounded bg-gradient-to-r from-orange-400 to-amber-200 text-black font-mono text-xs font-semibold shadow-[0_0_12px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all flex items-center gap-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Inspect Case #4892
            </button>

            {onOpenTests && (
              <button
                type="button"
                id="header-run-tests-btn"
                onClick={onOpenTests}
                className="px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-[#e0e0e0] font-mono text-xs transition-colors border border-white/10 flex items-center gap-1.5"
                title="Run in-browser automated test suite"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Run Test Suite
              </button>
            )}
          </div>

          {/* Analyst Desk Profile */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => onNavigate('/settings')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate('/settings')}
            className="flex items-center gap-2 pl-2 border-l border-white/10 cursor-pointer focus:outline-none"
            title="Analyst Profile & Settings"
          >
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-medium text-[#e0e0e0]">Analyst Desk</span>
              <span className="text-[10px] font-mono text-emerald-400">Reuters FactCheck Lab</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-black font-semibold text-xs shadow-md">
              <User className="w-4 h-4" />
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-white/5 text-[#e0e0e0] border border-white/10 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 bg-[#121212] border-b border-white/10 flex flex-col gap-1 text-sm font-mono animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <button
              key={link.path}
              type="button"
              onClick={() => {
                onNavigate(link.path);
                setMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2 rounded-md ${
                currentPath === link.path
                  ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-semibold'
                  : 'text-[#a3a3a3] hover:bg-white/5'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenQuickCase('case-4892');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded bg-gradient-to-r from-orange-400 to-amber-200 text-black font-semibold text-xs flex items-center gap-2"
            >
              <FlaskConical className="w-4 h-4" /> Inspect Case #4892
            </button>
            {onOpenTests && (
              <button
                type="button"
                onClick={() => {
                  onOpenTests();
                  setMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 rounded bg-white/5 text-emerald-400 text-xs flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Run Live Test Suite
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
