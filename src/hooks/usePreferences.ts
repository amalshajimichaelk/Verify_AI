/**
 * usePreferences Hook
 * Manages user interface accessibility, high-contrast optics, and reduced motion modes.
 */

import { useState, useEffect, useCallback } from 'react';

export interface PreferencesState {
  reducedMotion: boolean;
  highContrast: boolean;
  compactDensity: boolean;
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<PreferencesState>(() => {
    try {
      const saved = localStorage.getItem('verifyai_prefs');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      reducedMotion: false,
      highContrast: false,
      compactDensity: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('verifyai_prefs', JSON.stringify(preferences));
    } catch {
      // Ignore
    }

    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast-mode');
    } else {
      document.documentElement.classList.remove('high-contrast-mode');
    }

    if (preferences.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [preferences]);

  const toggleReducedMotion = useCallback(() => {
    setPreferences((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setPreferences((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  const toggleCompactDensity = useCallback(() => {
    setPreferences((prev) => ({ ...prev, compactDensity: !prev.compactDensity }));
  }, []);

  return {
    preferences,
    toggleReducedMotion,
    toggleHighContrast,
    toggleCompactDensity,
  };
}
