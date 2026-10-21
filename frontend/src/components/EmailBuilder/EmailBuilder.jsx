import React, { useState, useEffect } from 'react';
import BlockPalette from './BlockPalette';
import Canvas from './Canvas';
import PropertyInspector from './PropertyInspector';
import SendTestModal from './SendTestModal';
import { createBlock, compileBlocksToHtml } from '../../utils/compiler';
import api from '../../services/api';

export default function EmailBuilder({
  template,
  user,
  onBack,
  onSaved
}) {
  const isSuperAdmin = user?.role === 'super_admin';

  // Initialize blocks from template's designJson or default blocks
  const [blocks, setBlocks] = useState(() => {
    const dj = template?.effective?.designJson || template?.designJson;
    if (dj && Array.isArray(dj.blocks) && dj.blocks.length > 0) {
      return dj.blocks;
    }
    // Default starter blocks
    return [
      createBlock('heading'),
      createBlock('text'),
      createBlock('button'),
      createBlock('divider')
    ];
  });

  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [templateMeta, setTemplateMeta] = useState({
    name: template?.name || 'Untitled Email Template',
    subject: template?.effective?.subject || template?.subject || 'Welcome to Our Platform!',
    category: template?.category || 'general',
    variables: template?.variables || ['name', 'loginUrl', 'companyName'],
    slug: template?.slug || ''
  });

  const [hasCustomization, setHasCustomization] = useState(
    Boolean(template?.status?.hasCustomization)
  );
  const [isCustomActive, setIsCustomActive] = useState(
    Boolean(template?.status?.isCustomActive)
  );
  const [isRolledBack, setIsRolledBack] = useState(
    Boolean(template?.status?.isRolledBack)
  );

  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);

  // Sync if template prop changes
  useEffect(() => {
    if (template) {
      const dj = template?.effective?.designJson || template?.designJson;
      if (dj && Array.isArray(dj.blocks) && dj.blocks.length > 0) {
        setBlocks(dj.blocks);
      }
      setTemplateMeta({
        name: template.name || 'Untitled Email Template',
        subject: template.effective?.subject || template.subject || '',
        category: template.category || 'general',
        variables: template.variables || ['name', 'loginUrl', 'companyName'],
        slug: template.slug || ''
      });
      setHasCustomization(Boolean(template.status?.hasCustomization));
      setIsCustomActive(Boolean(template.status?.isCustomActive));
      setIsRolledBack(Boolean(template.status?.isRolledBack));
    }
  }, [template]);

  // Block handlers
  const handleAddBlock = (type) => {
    const newBlock = createBlock(type);
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleAddBlockAtIndex = (type, index) => {
    const newBlock = createBlock(type);
    setBlocks(prev => {
      const copy = [...prev];
      copy.splice(index, 0, newBlock);
      return copy;
    });
    setSelectedBlockId(newBlock.id);
  };

  const handleUpdateBlock = (blockId, updates) => {
    setBlocks(prev =>
      prev.map(b => (b.id === blockId ? { ...b, ...updates } : b))
    );
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  // Save as Super Admin (canonical default) or Admin (per-admin customization)
  const handleSave = async (saveAsDefault = false) => {
    setSaving(true);
    setSaveSuccessMsg(null);
    setErrorMsg(null);

    const compiledHtml = compileBlocksToHtml(blocks);
    const designJson = { blocks };

    try {
      let result;
      if (isSuperAdmin && (saveAsDefault || !template?.id)) {
        // Super Admin Canonical Save
        if (template?.id) {
          result = await api.updateDefaultTemplate(template.id, {
            name: templateMeta.name,
            subject: templateMeta.subject,
            category: templateMeta.category,
            variables: templateMeta.variables,
            bodyHtml: compiledHtml,
            designJson
          });
        } else {
          result = await api.createDefaultTemplate({
            slug: templateMeta.slug || `template-${Date.now()}`,
            name: templateMeta.name,
            subject: templateMeta.subject,
            category: templateMeta.category,
            variables: templateMeta.variables,
            bodyHtml: compiledHtml,
            designJson
          });
        }
        setSaveSuccessMsg('Canonical Super Admin template saved successfully!');
      } else {
        // Admin Customization Save
        result = await api.saveAdminCustomization(template.id, {
          subject: templateMeta.subject,
          bodyHtml: compiledHtml,
          designJson,
          isActive: true
        });
        setHasCustomization(true);
        setIsCustomActive(true);
        setIsRolledBack(false);
        setSaveSuccessMsg('Custom version saved and activated for your admin account!');
      }

      setTimeout(() => setSaveSuccessMsg(null), 3500);
      if (onSaved) onSaved(result);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save email template');
    } finally {
      setSaving(false);
    }
  };

  // Soft Rollback Toggle
  const handleToggleCustomization = async (targetActive) => {
    if (!template?.id) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await api.toggleCustomization(template.id, targetActive);
      setIsCustomActive(targetActive);
      setIsRolledBack(!targetActive);
      setSaveSuccessMsg(
        targetActive
          ? 'Custom version restored and active!'
          : 'Rolled back to Platform Default. Your custom version is preserved.'
      );
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      if (onSaved) onSaved(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to toggle customization');
    } finally {
      setSaving(false);
    }
  };

  // Discard Customization Permanently
  const handleDiscardCustomization = async () => {
    if (!window.confirm('Are you sure you want to permanently discard your custom version and revert to the default template?')) {
      return;
    }
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await api.discardCustomization(template.id);
      setHasCustomization(false);
      setIsCustomActive(false);
      setIsRolledBack(false);
      // Reload default template blocks
      if (res?.defaultVersion?.designJson?.blocks) {
        setBlocks(res.defaultVersion.designJson.blocks);
      }
      setSaveSuccessMsg('Customization removed. Default template restored.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      if (onSaved) onSaved(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to discard customization');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Application Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between z-30 shrink-0">
        {/* Left: Back & Template Title */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Templates
          </button>

          <div className="h-5 w-px bg-slate-800"></div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">
                {templateMeta.name || 'Untitled Template'}
              </h1>

              {/* Status Badge */}
              {isSuperAdmin ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Super Admin Default
                </span>
              ) : isCustomActive ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Your Custom Version (Active)
                </span>
              ) : isRolledBack ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Rolled Back to Default (Custom Preserved)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300">
                  Platform Default
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Slug: {templateMeta.slug || 'new-template'} • Category: {templateMeta.category}
            </p>
          </div>
        </div>

        {/* Center: Feedback alerts */}
        <div className="hidden md:flex items-center">
          {saveSuccessMsg && (
            <div className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30 animate-pulse">
              ✓ {saveSuccessMsg}
            </div>
          )}
          {errorMsg && (
            <div className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30">
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Admin Soft Rollback Toggle */}
          {!isSuperAdmin && hasCustomization && (
            <div className="flex items-center gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
              <span className="text-[11px] font-medium text-slate-400 pl-2">
                {isCustomActive ? 'Using Custom' : 'Using Default'}
              </span>
              <button
                type="button"
                onClick={() => handleToggleCustomization(!isCustomActive)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  isCustomActive
                    ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/40 border border-amber-500/30'
                    : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/30'
                }`}
                title={isCustomActive ? 'Soft rollback to super admin default' : 'Reactivate your custom version'}
              >
                {isCustomActive ? 'Rollback to Default' : 'Restore Custom'}
              </button>
              <button
                type="button"
                onClick={handleDiscardCustomization}
                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700 transition"
                title="Permanently discard custom version"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}

          {/* Test Email Button */}
          <button
            type="button"
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send Test
          </button>

          {/* Save Button */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : isSuperAdmin ? (
              'Save Canonical Default'
            ) : (
              'Save Custom Version'
            )}
          </button>
        </div>
      </header>

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Drag-and-Drop Block Palette */}
        <BlockPalette onAddBlock={handleAddBlock} />

        {/* Center: Visual Email Canvas */}
        <Canvas
          blocks={blocks}
          onBlocksChange={setBlocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          templateMeta={templateMeta}
          onAddBlockAtIndex={handleAddBlockAtIndex}
        />

        {/* Right: Block & Template Property Inspector */}
        <PropertyInspector
          selectedBlock={selectedBlock}
          onUpdateBlock={handleUpdateBlock}
          templateMeta={templateMeta}
          onUpdateTemplateMeta={updates => setTemplateMeta(prev => ({ ...prev, ...updates }))}
          onDeselect={() => setSelectedBlockId(null)}
        />
      </div>

      {/* Test Email Dispatch Modal */}
      <SendTestModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        template={template}
        compiledHtml={compileBlocksToHtml(blocks)}
        subject={templateMeta.subject}
      />
    </div>
  );
}
