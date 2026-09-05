import React from 'react';
import { MetadataField } from '../../types';
import { GlassPanel } from '../glass/GlassPanel';
import { CheckCircle2, AlertCircle, HelpCircle, XCircle } from 'lucide-react';

interface MetadataTableProps {
  metadata: MetadataField[];
}

export const MetadataTable: React.FC<MetadataTableProps> = ({ metadata }) => {
  const getStatusIcon = (status: MetadataField['status']) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Authenticity
          </span>
        );
      case 'detected':
        return (
          <span className="inline-flex items-center gap-1 text-orange-400 text-[11px] font-mono">
            Detected Header
          </span>
        );
      case 'modified':
        return (
          <span className="inline-flex items-center gap-1 text-orange-400 text-[11px] font-mono">
            <AlertCircle className="w-3.5 h-3.5" /> Re-encoded / Modified
          </span>
        );
      case 'missing':
        return (
          <span className="inline-flex items-center gap-1 text-red-400 text-[11px] font-mono">
            <XCircle className="w-3.5 h-3.5" /> Missing / Stripped
          </span>
        );
      case 'unavailable':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[#737373] text-[11px] font-mono">
            <HelpCircle className="w-3.5 h-3.5" /> Unavailable
          </span>
        );
    }
  };

  return (
    <GlassPanel tier={2} className="w-full overflow-hidden">
      <div className="px-5 py-3 bg-black/80 border-b border-white/8 flex items-center justify-between text-xs font-mono">
        <span className="text-[#e0e0e0] font-semibold">Container Bitstream & Provenance Metadata</span>
        <span className="text-[#737373]">EXIF / C2PA / Sensor Specification</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#121212] text-[#737373] uppercase text-[10px] border-b border-white/8">
            <tr>
              <th className="px-5 py-2.5">Field Specification</th>
              <th className="px-5 py-2.5">Category</th>
              <th className="px-5 py-2.5">Extracted Value</th>
              <th className="px-5 py-2.5">Status Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-[#a3a3a3]">
            {metadata.map((item, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-3 text-[#e0e0e0] font-medium">{item.field}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#737373] text-[10px] border border-white/5">
                    {item.category}
                  </span>
                </td>
                <td className="px-5 py-3 text-orange-400 font-mono break-all">{item.value}</td>
                <td className="px-5 py-3">{getStatusIcon(item.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
};
