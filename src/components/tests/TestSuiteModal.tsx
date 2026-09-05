import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CheckCircle2, XCircle, Play, Loader2, ShieldCheck, Bug } from 'lucide-react';
import { validateMediaFile, validateMediaUrl } from '../../validation/mediaValidation';
import { calculateCalibratedAssessment } from '../../services/forensicEngine';
import { analysisApi } from '../../api/analysisApi';
import { reportApi } from '../../api/reportApi';
import { investigationApi } from '../../api/investigationApi';

interface TestCase {
  id: string;
  name: string;
  category: 'SECURITY' | 'EVALUATION' | 'FORENSICS' | 'API' | 'ACCESSIBILITY';
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
  durationMs?: number;
  error?: string;
  run: () => Promise<void>;
}

interface TestResultEntry {
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
  ms?: number;
  err?: string;
}

export const TestSuiteModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResultEntry>>({});

  const testDefinitions: TestCase[] = [
    {
      id: 'test-1',
      name: 'Media Ingestion: Reject file exceeding 250MB size threshold',
      category: 'SECURITY',
      status: 'PENDING',
      run: async () => {
        const dummyOversized = new File(['a'.repeat(100)], 'huge_leak.mp4', { type: 'video/mp4' });
        Object.defineProperty(dummyOversized, 'size', { value: 300 * 1024 * 1024 });
        const res = validateMediaFile(dummyOversized);
        if (res.isValid) throw new Error('Failed to reject oversized media');
      },
    },
    {
      id: 'test-2',
      name: 'Media Ingestion: Reject executable payload masquerading as media',
      category: 'SECURITY',
      status: 'PENDING',
      run: async () => {
        const fakeFile = new File(['echo hello'], 'payload.exe.mp4', { type: 'application/x-msdownload' });
        const res = validateMediaFile(fakeFile);
        if (res.isValid) throw new Error('Failed to block non-whitelisted mime type');
      },
    },
    {
      id: 'test-3',
      name: 'URL Validator: Reject malicious protocol scheme (e.g. file://, javascript:)',
      category: 'SECURITY',
      status: 'PENDING',
      run: async () => {
        const res1 = validateMediaUrl('javascript:alert(1)');
        const res2 = validateMediaUrl('file:///etc/passwd');
        if (res1.isValid || res2.isValid) throw new Error('Unsafe URL protocol admitted');
      },
    },
    {
      id: 'test-4',
      name: 'Calibration Engine: Synthetic signals trigger LIKELY_AI_GENERATED',
      category: 'FORENSICS',
      status: 'PENDING',
      run: async () => {
        const signals = [
          { id: '1', name: 'GAN', category: 'OPTICAL' as const, score: 92, confidence: 95, status: 'CRITICAL' as const, weight: 0.5, primaryFinding: '', technicalDetails: '', modelVersion: '' },
          { id: '2', name: 'Corneal', category: 'OPTICAL' as const, score: 88, confidence: 90, status: 'CRITICAL' as const, weight: 0.5, primaryFinding: '', technicalDetails: '', modelVersion: '' },
        ];
        const res = calculateCalibratedAssessment(signals, [], false);
        if (res.classification !== 'LIKELY_AI_GENERATED') {
          throw new Error(`Expected LIKELY_AI_GENERATED, got ${res.classification}`);
        }
      },
    },
    {
      id: 'test-5',
      name: 'Calibration Engine: Sensor consistency triggers LIKELY_AUTHENTIC',
      category: 'FORENSICS',
      status: 'PENDING',
      run: async () => {
        const signals = [
          { id: '1', name: 'PRNU', category: 'OPTICAL' as const, score: 95, confidence: 98, status: 'NORMAL' as const, weight: 0.5, primaryFinding: '', technicalDetails: '', modelVersion: '' },
          { id: '2', name: 'C2PA', category: 'PROVENANCE' as const, score: 99, confidence: 100, status: 'NORMAL' as const, weight: 0.5, primaryFinding: '', technicalDetails: '', modelVersion: '' },
        ];
        const metadata = [{ field: 'Sensor', value: 'Sony ILCE-7M4', status: 'verified' as const, category: 'HARDWARE' as const }];
        const res = calculateCalibratedAssessment(signals, metadata, true);
        if (res.classification !== 'LIKELY_AUTHENTIC') {
          throw new Error(`Expected LIKELY_AUTHENTIC, got ${res.classification}`);
        }
      },
    },
    {
      id: 'test-6',
      name: 'Calibration Engine: Conflicting signals trigger INCONCLUSIVE uncertainty',
      category: 'FORENSICS',
      status: 'PENDING',
      run: async () => {
        const signals = [
          { id: '1', name: 'Detector A', category: 'OPTICAL' as const, score: 90, confidence: 80, status: 'CRITICAL' as const, weight: 0.5, primaryFinding: '', technicalDetails: '', modelVersion: '' },
          { id: '2', name: 'Detector B', category: 'OPTICAL' as const, score: 10, confidence: 80, status: 'NORMAL' as const, weight: 0.5, primaryFinding: '', technicalDetails: '', modelVersion: '' },
        ];
        const res = calculateCalibratedAssessment(signals, [], false);
        if (res.classification !== 'INCONCLUSIVE') {
          throw new Error(`Expected INCONCLUSIVE, got ${res.classification}`);
        }
      },
    },
    {
      id: 'test-7',
      name: 'Benchmark Case #4891: Deepfake Executive Portrait integrity',
      category: 'EVALUATION',
      status: 'PENDING',
      run: async () => {
        const res = await analysisApi.getResult('case-4891');
        if (!res || res.calibratedConfidence !== 88 || res.classification !== 'LIKELY_AI_GENERATED') {
          throw new Error('Case #4891 benchmark parameters mismatch');
        }
      },
    },
    {
      id: 'test-8',
      name: 'Benchmark Case #4892: Speech Lip-Sync Desync integrity',
      category: 'EVALUATION',
      status: 'PENDING',
      run: async () => {
        const res = await analysisApi.getResult('case-4892');
        if (!res || res.calibratedConfidence !== 76 || res.classification !== 'POTENTIAL_MANIPULATION') {
          throw new Error('Case #4892 benchmark parameters mismatch');
        }
      },
    },
    {
      id: 'test-9',
      name: 'Benchmark Case #4893: C2PA Hardware-Verified Convoy integrity',
      category: 'EVALUATION',
      status: 'PENDING',
      run: async () => {
        const res = await analysisApi.getResult('case-4893');
        if (!res || res.calibratedConfidence !== 94 || res.classification !== 'LIKELY_AUTHENTIC') {
          throw new Error('Case #4893 benchmark parameters mismatch');
        }
      },
    },
    {
      id: 'test-10',
      name: 'Report Generation: Valid JSON-LD ClaimReview Schema compliance',
      category: 'API',
      status: 'PENDING',
      run: async () => {
        const sample = await analysisApi.getResult('case-4891');
        const rep = await reportApi.generateReport(sample, 'Analyst Test', 'VerifyAI');
        const parsed = JSON.parse(rep.jsonLdExport);
        if (parsed['@type'] !== 'ClaimReview') throw new Error('Invalid JSON-LD ClaimReview type');
      },
    },
    {
      id: 'test-11',
      name: 'Investigation Board: Create case and pin evidence item',
      category: 'API',
      status: 'PENDING',
      run: async () => {
        const inv = await investigationApi.createInvestigation('Test Board', 'Automated Verification Case');
        const item = await investigationApi.addItem(inv.id, {
          title: 'Specular Corneal Anomaly Node',
          type: 'EVIDENCE',
          content: 'Discontinuous light reflections confirm synthetic origin.',
          pinned: true,
        });
        if (!item.id) throw new Error('Failed to attach evidence node');
      },
    },
    {
      id: 'test-12',
      name: 'Zero Media Retention: Ensure in-memory payload lifecycle',
      category: 'SECURITY',
      status: 'PENDING',
      run: async () => {
        // Confirm no persistent files in local storage leaks
        const storageKeys = Object.keys(localStorage);
        const leakedRawMedia = storageKeys.some((k) => k.startsWith('media_blob_'));
        if (leakedRawMedia) throw new Error('Raw media blob was illegally persisted to localStorage');
      },
    },
  ];

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const test of testDefinitions) {
      setTestResults((prev) => ({ ...prev, [test.id]: { status: 'RUNNING' } }));
      const start = performance.now();
      try {
        await test.run();
        const duration = Math.round(performance.now() - start);
        setTestResults((prev) => ({
          ...prev,
          [test.id]: { status: 'PASSED', ms: duration },
        }));
      } catch (err) {
        const duration = Math.round(performance.now() - start);
        setTestResults((prev) => ({
          ...prev,
          [test.id]: { status: 'FAILED', ms: duration, err: err instanceof Error ? err.message : 'Error' },
        }));
      }
    }
    setIsRunningAll(false);
  };

  const resultsList = Object.values(testResults) as TestResultEntry[];
  const passedCount = resultsList.filter((r) => r.status === 'PASSED').length;
  const failedCount = resultsList.filter((r) => r.status === 'FAILED').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="VerifyAI Automated Test Suite"
      subtitle="Evaluates Code Quality, Security Enclaves, Calibration Math & C2PA Provenance"
      icon={<ShieldCheck className="w-5 h-5 text-orange-400" />}
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between w-full font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-semibold">Passed: {passedCount}</span>
            <span className="text-red-400 font-semibold">Failed: {failedCount}</span>
            <span className="text-[#737373]">Total: {testDefinitions.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={runAllTests}
              isLoading={isRunningAll}
              icon={<Play className="w-3.5 h-3.5" />}
            >
              Run All Tests
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3 font-mono text-xs">
        <div className="p-3 rounded-lg bg-black/80 border border-white/8 flex items-center justify-between">
          <span className="text-[#a3a3a3]">
            12 Comprehensive Production Tests across Security Boundaries, Calibration Physics & Benchmarks
          </span>
          <Button
            variant="glass"
            size="sm"
            onClick={runAllTests}
            isLoading={isRunningAll}
            icon={<Play className="w-3.5 h-3.5 text-orange-400" />}
          >
            Execute Suite
          </Button>
        </div>

        <div className="flex flex-col divide-y divide-white/5 border border-white/8 rounded-lg overflow-hidden bg-black/40">
          {testDefinitions.map((test) => {
            const res = testResults[test.id];
            const isPassed = res?.status === 'PASSED';
            const isFailed = res?.status === 'FAILED';
            const isRunning = res?.status === 'RUNNING';

            return (
              <div
                key={test.id}
                className="p-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 text-orange-400 animate-spin shrink-0" />
                  ) : isPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isFailed ? (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                  )}
                  <span className="text-[#e0e0e0] font-medium">{test.name}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-[#737373] border border-white/5">
                    {test.category}
                  </span>
                  {res?.ms !== undefined && (
                    <span className="text-[11px] text-orange-400 font-bold">{res.ms}ms</span>
                  )}
                  {isFailed && (
                    <span className="text-[10px] text-red-400 max-w-xs truncate">{res.err}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
