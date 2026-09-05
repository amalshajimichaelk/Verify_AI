import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Copy,
  Download,
  Check,
  ShieldCheck,
  ExternalLink,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { VerificationReport } from '../types';
import { reportApi } from '../api/reportApi';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const ReportsView: React.FC<{ selectedReportId?: string }> = ({
  selectedReportId,
}) => {
  const [reports, setReports] = useState<VerificationReport[]>([]);
  const [activeReport, setActiveReport] = useState<VerificationReport | null>(null);
  const [copiedJsonLd, setCopiedJsonLd] = useState<boolean>(false);

  useEffect(() => {
    reportApi.listReports().then((list) => {
      setReports(list);
      if (selectedReportId) {
        const found = list.find((r) => r.id === selectedReportId);
        if (found) setActiveReport(found);
      } else if (list.length > 0 && !activeReport) {
        setActiveReport(list[0]);
      }
    });
  }, [selectedReportId, activeReport]);

  const handleCopyJsonLd = () => {
    if (activeReport?.jsonLdExport) {
      navigator.clipboard.writeText(activeReport.jsonLdExport);
      setCopiedJsonLd(true);
      setTimeout(() => setCopiedJsonLd(false), 2500);
    }
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono text-xs font-bold uppercase border border-orange-500/30">
              Forensic Dossier Registry
            </span>
            <span className="text-xs font-mono text-[#737373]">• Schema.org ClaimReview Compatible</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#e0e0e0]">
            Verification Reports & Legal Audit Trails
          </h1>
          <p className="text-xs text-[#a3a3a3]">
            Compiled cryptographic dossiers suitable for legal proceedings, newsroom fact-checking,
            and platform disinformation remediation.
          </p>
        </div>

        {activeReport && (
          <div className="flex items-center gap-2">
            <Button
              variant="glass"
              size="sm"
              onClick={handleCopyJsonLd}
              icon={copiedJsonLd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedJsonLd ? 'Copied ClaimReview' : 'Copy JSON-LD'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrintDossier}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Print / Export Dossier
            </Button>
          </div>
        )}
      </div>

      {/* 2-Column: Left reports list (4 cols) & Right active dossier (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Reports Index */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <span className="text-xs font-mono text-[#737373] uppercase">Compiled Dossiers</span>
          <div className="flex flex-col gap-2">
            {reports.map((r) => {
              const isSelected = activeReport?.id === r.id;
              return (
                <GlassCard
                  key={r.id}
                  interactive
                  onClick={() => setActiveReport(r)}
                  className={`flex flex-col gap-1.5 p-3.5 ${
                    isSelected ? 'border-orange-500 bg-[#121212]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-orange-400 font-bold">{r.caseNumber}</span>
                    <Badge classification={r.classification} size="sm" />
                  </div>
                  <h3 className="text-xs font-semibold text-[#e0e0e0] truncate">{r.title}</h3>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#737373] pt-1 border-t border-white/5">
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    <span>Confidence: {r.confidence}%</span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Detailed Dossier View */}
        <div className="lg:col-span-8">
          {activeReport ? (
            <GlassPanel tier={3} className="p-6 sm:p-8 flex flex-col gap-6 print:bg-white print:text-black">
              {/* Header Dossier Seal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/8">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-mono text-orange-400">OFFICIAL FORENSIC VERIFICATION</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#e0e0e0]">{activeReport.title}</h2>
                  <span className="text-xs font-mono text-[#737373]">
                    Dossier ID: {activeReport.id} • Issued: {new Date(activeReport.createdAt).toUTCString()}
                  </span>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1 font-mono">
                  <Badge classification={activeReport.classification} size="md" />
                  <span className="text-xs text-[#737373]">Calibrated: {activeReport.confidence}%</span>
                </div>
              </div>

              {/* Bitstream Security Hashes */}
              <div className="p-3.5 rounded-lg bg-black/80 border border-white/8 flex flex-col gap-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#737373]">SHA-256 Bitstream Hash:</span>
                  <code className="text-orange-400 break-all">{activeReport.sha256Hash}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#737373]">C2PA Cryptographic Signature:</span>
                  <span className={activeReport.c2paValid ? 'text-emerald-400' : 'text-red-400'}>
                    {activeReport.c2paValid ? 'VALID ENCLAVE SEAL' : 'MISSING / UNTRUSTED'}
                  </span>
                </div>
              </div>

              {/* Summary Section */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-mono font-bold text-[#e0e0e0] uppercase">
                  Executive Forensic Summary
                </h3>
                <p className="text-xs sm:text-sm text-[#a3a3a3] leading-relaxed">
                  {activeReport.summary}
                </p>
              </div>

              {/* Key Evidentiary Findings */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-mono font-bold text-[#e0e0e0] uppercase">
                  Evidentiary Signal Findings
                </h3>
                <ul className="list-disc list-inside text-xs text-[#a3a3a3] flex flex-col gap-1.5 font-mono">
                  {activeReport.keyFindings.map((finding, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Analyst Endorsement */}
              <div className="p-4 rounded-lg bg-[#0f0f0f] border border-white/8 flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-[#e0e0e0]">
                  Lead Analyst Sign-Off & Attestation
                </span>
                <p className="text-xs text-[#a3a3a3] leading-relaxed italic">
                  "{activeReport.analystNotes}"
                </p>
                <div className="pt-2 border-t border-white/6 flex items-center justify-between text-xs font-mono text-[#737373]">
                  <span className="text-orange-400">{activeReport.analystName}</span>
                  <span>{activeReport.analystOrganization}</span>
                </div>
              </div>

              {/* Embedded JSON-LD ClaimReview Schema Box */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#e0e0e0] font-bold">Schema.org ClaimReview JSON-LD</span>
                  <button
                    type="button"
                    onClick={handleCopyJsonLd}
                    className="text-orange-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    {copiedJsonLd ? 'Copied' : 'Copy Payload'}
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-black border border-white/8 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48">
                  {activeReport.jsonLdExport}
                </pre>
              </div>
            </GlassPanel>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-[#869397]">
              No report selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
