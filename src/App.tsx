import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { StageRibbon } from './components/layout/StageRibbon';
import { Footer } from './components/layout/Footer';
import { HomeConsoleView } from './views/HomeConsoleView';
import { AnalysisResultsView } from './views/AnalysisResultsView';
import { InvestigationBoardView } from './views/InvestigationBoardView';
import { ReportsView } from './views/ReportsView';
import { ProvenanceResourcesView } from './views/ProvenanceResourcesView';
import { LiveCheckApiView } from './views/LiveCheckApiView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { TestSuiteModal } from './components/tests/TestSuiteModal';
import { DemoBanner } from './components/ui/DemoBanner';
import { useAnalysis } from './hooks/useAnalysis';
import { MediaAsset } from './types';
import { Loader2, X } from 'lucide-react';
import { BENCHMARK_CASES } from './mock/mockDatabase';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [activeCaseId, setActiveCaseId] = useState<string>('case-4891');
  const [selectedReportId, setSelectedReportId] = useState<string | undefined>();

  const {
    job,
    result,
    isLoading: isAnalysisLoading,
    isPolling,
    error: analysisError,
    startAnalysis,
    cancelAnalysis,
    reset,
  } = useAnalysis();

  // URL Hash synchronization
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      setCurrentPath(hash);
      if (hash.startsWith('/results/')) {
        const id = hash.replace('/results/', '');
        setActiveCaseId(id);
      } else if (hash.startsWith('/reports/')) {
        const id = hash.replace('/reports/', '');
        setSelectedReportId(id);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  const handleOpenCase = (caseId: string) => {
    setActiveCaseId(caseId);
    if (BENCHMARK_CASES[caseId]) {
      startAnalysis(BENCHMARK_CASES[caseId].asset, caseId);
    }
    navigateTo(`/results/${caseId}`);
  };

  const handleStartAnalysis = (asset: MediaAsset, customJobId?: string) => {
    startAnalysis(asset, customJobId);
    navigateTo(`/verify`);
  };

  // Compute active stage number for StageRibbon
  let currentStageNumber = 1;
  if (currentPath.startsWith('/results') || currentPath === '/verify') {
    if (isAnalysisLoading && job) {
      if (job.status === 'INGESTING') currentStageNumber = 1;
      else if (job.status === 'SPECTRAL_SCAN') currentStageNumber = 2;
      else if (job.status === 'NEURAL_PROBING') currentStageNumber = 3;
      else if (job.status === 'PROVENANCE_TRACE') currentStageNumber = 4;
      else currentStageNumber = 5;
    } else {
      currentStageNumber = 5;
    }
  } else if (currentPath === '/investigate') {
    currentStageNumber = 3;
  } else if (currentPath.startsWith('/reports')) {
    currentStageNumber = 5;
  }

  // Active result resolution
  const activeResult = result || BENCHMARK_CASES[activeCaseId] || BENCHMARK_CASES['case-4891'];

  return (
    <div className="min-h-screen flex flex-col bg-[#0f131c] text-[#dfe2ee] font-sans selection:bg-[#4cd7f6]/30 selection:text-[#4cd7f6]">
      {/* Primary Fixed Header */}
      <Header
        currentPath={currentPath}
        onNavigate={navigateTo}
        onOpenQuickCase={handleOpenCase}
        onOpenTests={() => setIsTestModalOpen(true)}
      />

      {/* Main App Canvas: Offset by fixed header height (h-16 to h-20) */}
      <div className="pt-16 sm:pt-20 flex-1 flex flex-col">
        {/* Demo mode indicator */}
        <DemoBanner />

        {/* Stage Ribbon Bar */}
        <StageRibbon currentStageNumber={currentStageNumber} />

        {/* Global Loading Overlay when an analysis is actively running */}
        {isAnalysisLoading && job && job.status !== 'COMPLETED' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[500px]">
            <div className="w-full max-w-md p-6 rounded-2xl bg-[#181c24]/90 backdrop-blur-2xl border border-[#4cd7f6]/30 shadow-2xl flex flex-col items-center text-center gap-5 animate-in fade-in zoom-in-95">
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-2 border-[#4cd7f6]/20 border-t-[#4cd7f6] animate-spin" />
                <Loader2 className="w-8 h-8 text-[#4cd7f6] absolute animate-pulse" />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono text-[#4cd7f6] font-bold uppercase tracking-wider">
                  Enclave Multi-Signal Ingestion
                </span>
                <h3 className="text-base font-semibold text-[#dfe2ee]">{job.currentStage}</h3>
                <span className="text-xs font-mono text-[#869397]">
                  Asset: {job.asset.name} ({job.progressPercent}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-[#0a0e16] rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-[#06b6d4] to-[#4cd7f6] transition-all duration-300"
                  style={{ width: `${job.progressPercent}%` }}
                />
              </div>

              <button
                type="button"
                onClick={cancelAnalysis}
                className="text-xs font-mono text-[#ffb4ab] hover:text-[#ffdad6] flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Abort Enclave Processing
              </button>
            </div>
          </div>
        ) : (
          <main className="flex-1 flex flex-col">
            {/* Router View Switcher */}
            {currentPath === '/' && (
              <HomeConsoleView
                onStartAnalysis={handleStartAnalysis}
                onOpenCase={handleOpenCase}
              />
            )}

            {(currentPath === '/verify' || currentPath.startsWith('/results')) && (
              <AnalysisResultsView
                result={activeResult}
                onBackToConsole={() => navigateTo('/')}
                onOpenReport={(repId) => navigateTo(`/reports/${repId}`)}
                onOpenInvestigation={() => navigateTo('/investigate')}
              />
            )}

            {currentPath === '/investigate' && (
              <InvestigationBoardView onInspectCase={handleOpenCase} />
            )}

            {currentPath.startsWith('/reports') && (
              <ReportsView selectedReportId={selectedReportId} />
            )}

            {currentPath.startsWith('/resources') && <ProvenanceResourcesView />}

            {currentPath === '/live' && <LiveCheckApiView />}

            {currentPath === '/history' && <HistoryView onInspectCase={handleOpenCase} />}

            {currentPath === '/settings' && <SettingsView />}
          </main>
        )}

        {/* Global Footer */}
        <Footer />
      </div>

      {/* Interactive In-Browser Automated Test Suite Modal */}
      <TestSuiteModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
}
