import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Pin,
  Bookmark,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  ShieldAlert,
  Download,
  Share2,
  FolderOpen,
} from 'lucide-react';
import { Investigation, InvestigationItem } from '../types';
import { investigationApi } from '../api/investigationApi';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const InvestigationBoardView: React.FC<{ onInspectCase?: (caseId: string) => void }> = ({
  onInspectCase,
}) => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [activeInvId, setActiveInvId] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newType, setNewType] = useState<InvestigationItem['type']>('NOTE');

  useEffect(() => {
    investigationApi.listInvestigations().then((list) => {
      setInvestigations(list);
      if (list.length > 0 && !activeInvId) {
        setActiveInvId(list[0].id);
      }
    });
  }, [activeInvId]);

  const activeInvestigation = investigations.find((i) => i.id === activeInvId) || investigations[0];

  const handleAddItem = async () => {
    if (!activeInvestigation || !newTitle.trim()) return;

    await investigationApi.addItem(activeInvestigation.id, {
      title: newTitle.trim(),
      type: newType,
      content: newContent.trim() || 'Analyst observation note.',
      pinned: true,
    });

    const updated = await investigationApi.listInvestigations();
    setInvestigations(updated);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewContent('');
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!activeInvestigation) return;
    await investigationApi.removeItem(activeInvestigation.id, itemId);
    const updated = await investigationApi.listInvestigations();
    setInvestigations(updated);
  };

  const handleExportBoard = () => {
    if (!activeInvestigation) return;
    const blob = new Blob([JSON.stringify(activeInvestigation, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investigation_${activeInvestigation.id}.json`;
    a.click();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono text-xs font-bold uppercase border border-orange-500/30">
              Evidence Workspace
            </span>
            <span className="text-xs font-mono text-[#737373]">• Reuters FactCheck Lab</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#e0e0e0]">
            {activeInvestigation ? activeInvestigation.title : 'Investigation Board'}
          </h1>
          <p className="text-xs text-[#a3a3a3]">
            Interactive cross-verification canvas for linking optical anomalies, metadata findings,
            and dissemination timelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="glass"
            size="sm"
            onClick={handleExportBoard}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export Case JSON
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Evidence Node
          </Button>
        </div>
      </div>

      {/* Workspace Canvas Grid */}
      {activeInvestigation && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeInvestigation.items.map((item) => {
            const isMedia = item.type === 'MEDIA';
            const isEvidence = item.type === 'EVIDENCE';
            const isSource = item.type === 'SOURCE';

            return (
              <GlassCard
                key={item.id}
                className="flex flex-col gap-3 p-4 relative group border-white/8 hover:border-orange-500/40"
              >
                {/* Top Badge & Delete */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isMedia
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        : isEvidence
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : isSource
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-white/5 text-[#a3a3a3] border-white/5'
                    }`}
                  >
                    {item.type}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-[#737373] hover:text-red-400 transition-colors"
                    title="Remove from board"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Media preview thumbnail if applicable */}
                {item.mediaUrl && (
                  <div className="w-full h-32 rounded bg-black overflow-hidden border border-white/10 relative">
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.badge && (
                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-red-300 border border-red-500/30 font-mono text-[9px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-col gap-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-[#e0e0e0]">{item.title}</h3>
                  <p className="text-xs text-[#a3a3a3] leading-relaxed break-words">{item.content}</p>
                </div>

                <div className="pt-2 border-t border-white/6 flex items-center justify-between text-[10px] font-mono text-[#737373]">
                  <span>{new Date(item.createdAt).toLocaleTimeString()} UTC</span>
                  {item.pinned && <span className="text-orange-400 flex items-center gap-1 font-semibold">● Pinned Node</span>}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Add Evidence Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Attach New Evidence Node to Case"
        subtitle="Add notes, source URLs, or analytical observations to this investigation"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddItem} disabled={!newTitle.trim()}>
              Attach Node
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 font-mono text-xs">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="node-type-select" className="text-[#e0e0e0] font-medium">Node Type</label>
            <select
              id="node-type-select"
              value={newType}
              onChange={(e) => setNewType(e.target.value as InvestigationItem['type'])}
              className="bg-black text-[#e0e0e0] p-2.5 rounded-lg border border-white/10 text-xs font-mono"
            >
              <option value="NOTE">Analyst Written Note</option>
              <option value="EVIDENCE">Forensic Signal Evidence</option>
              <option value="SOURCE">External Source / URL Reference</option>
              <option value="HYPOTHESIS">Working Disinformation Hypothesis</option>
            </select>
          </div>

          <Input
            label="Node Headline / Subject"
            placeholder="e.g. Corneal highlight discrepancy across dual eye cameras"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="node-description-input" className="text-[#e0e0e0] font-medium">Details & Rationale</label>
            <textarea
              id="node-description-input"
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Provide technical verification notes or URL context..."
              className="w-full bg-black text-[#e0e0e0] p-3 rounded-lg border border-white/10 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
