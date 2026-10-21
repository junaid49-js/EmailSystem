import React, { useState } from 'react';
import { compileBlocksToHtml, substituteVariables } from '../../utils/compiler';

export default function Canvas({
  blocks,
  onBlocksChange,
  selectedBlockId,
  onSelectBlock,
  templateMeta,
  onAddBlockAtIndex
}) {
  const [viewport, setViewport] = useState('desktop'); // 'desktop' (600px) | 'mobile' (375px)
  const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'preview' | 'code'
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [testVariables, setTestVariables] = useState({
    name: 'Alex Johnson',
    loginUrl: 'https://app.example.com/login?token=demo123',
    companyName: 'Acme Technologies',
    actionUrl: 'https://app.example.com/dashboard',
    offerUrl: 'https://app.example.com/offers/vip-2026'
  });
  const [copiedCode, setCopiedCode] = useState(false);

  // Drag-and-drop canvas handlers
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      if (data.isNew && data.type) {
        onAddBlockAtIndex(data.type, dropIndex);
      } else if (data.isReorder && typeof data.fromIndex === 'number') {
        const fromIndex = data.fromIndex;
        if (fromIndex === dropIndex || fromIndex === dropIndex - 1) return;
        const newBlocks = [...blocks];
        const [movedBlock] = newBlocks.splice(fromIndex, 1);
        const targetIndex = dropIndex > fromIndex ? dropIndex - 1 : dropIndex;
        newBlocks.splice(targetIndex, 0, movedBlock);
        onBlocksChange(newBlocks);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const handleReorderDragStart = (e, index) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ isReorder: true, fromIndex: index }));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Block Manipulation Actions
  const moveBlock = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const [temp] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, temp);
    onBlocksChange(newBlocks);
  };

  const duplicateBlock = (index) => {
    const targetBlock = blocks[index];
    const copy = {
      ...targetBlock,
      id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      props: { ...(targetBlock.props || {}) }
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, copy);
    onBlocksChange(newBlocks);
    onSelectBlock(copy.id);
  };

  const deleteBlock = (index) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    onBlocksChange(newBlocks);
  };

  // Compiled output
  const compiledHtml = compileBlocksToHtml(blocks, testVariables);

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-950/80 overflow-hidden relative">
      {/* Canvas Viewport & Mode Toolbar */}
      <div className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur z-20">
        {/* Left: Viewport Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              viewport === 'desktop'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Desktop (600px)
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              viewport === 'mobile'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Mobile (375px)
          </button>
        </div>

        {/* Center: Template Subject summary */}
        <div className="hidden lg:flex items-center gap-2 max-w-sm truncate text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Subject:</span>
          <span className="truncate font-mono text-indigo-300">
            {templateMeta.subject || 'No Subject Specified'}
          </span>
        </div>

        {/* Right: Mode Switcher (Editor | Preview | HTML) */}
        <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              viewMode === 'editor'
                ? 'bg-slate-700 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editor
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              viewMode === 'preview'
                ? 'bg-slate-700 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Rendered Preview
          </button>
          <button
            type="button"
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              viewMode === 'code'
                ? 'bg-slate-700 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            HTML
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        {/* VIEW MODE 1: VISUAL DRAG AND DROP BUILDER */}
        {viewMode === 'editor' && (
          <div
            className={`transition-all duration-300 w-full rounded-2xl shadow-2xl border border-slate-700/60 bg-white text-slate-900 min-h-[500px] overflow-hidden ${
              viewport === 'desktop' ? 'max-w-[620px]' : 'max-w-[390px]'
            }`}
            onDragOver={e => handleDragOver(e, blocks.length)}
            onDrop={e => handleDrop(e, blocks.length)}
          >
            {/* Simulated Email Top Header */}
            <div className="bg-slate-100 border-b border-slate-200 px-5 py-3 text-xs text-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                <span className="text-slate-500 font-medium ml-2">Inbox Preview</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
              </span>
            </div>

            {/* Email Canvas Inner Padding */}
            <div className="p-7 space-y-1">
              {blocks.length === 0 ? (
                /* Empty state invitation */
                <div
                  onDragOver={e => handleDragOver(e, 0)}
                  onDrop={e => handleDrop(e, 0)}
                  className={`p-12 text-center border-2 border-dashed rounded-xl transition ${
                    dragOverIndex === 0
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-300 bg-slate-50/50 hover:border-slate-400'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800">Your canvas is empty</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Drag blocks from the left palette or click any block to start building your email.
                  </p>
                </div>
              ) : (
                /* Blocks List with Drop targets */
                blocks.map((block, idx) => {
                  const p = { ...block, ...(block.props || {}) };
                  const isSelected = selectedBlockId === block.id;
                  const isDropTarget = dragOverIndex === idx;

                  return (
                    <div
                      key={block.id}
                      className={`relative group ${isDropTarget ? 'drop-target-active' : ''}`}
                      onDragOver={e => handleDragOver(e, idx)}
                      onDragLeave={handleDragLeave}
                      onDrop={e => handleDrop(e, idx)}
                    >
                      {/* Block Container */}
                      <div
                        onClick={() => onSelectBlock(block.id)}
                        className={`canvas-block relative p-3 rounded-lg border-2 cursor-pointer ${
                          isSelected
                            ? 'selected bg-indigo-50/20'
                            : 'border-transparent hover:border-indigo-300/60 hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Hover Action Toolbar */}
                        <div className="absolute top-1 right-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 p-1 rounded-md bg-slate-900/90 text-white shadow-lg backdrop-blur">
                          {/* Drag Reorder Handle */}
                          <div
                            draggable
                            onDragStart={e => handleReorderDragStart(e, idx)}
                            className="drag-handle p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Drag to reorder"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>

                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={e => { e.stopPropagation(); moveBlock(idx, -1); }}
                            className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30"
                            title="Move Up"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={idx === blocks.length - 1}
                            onClick={e => { e.stopPropagation(); moveBlock(idx, 1); }}
                            className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30"
                            title="Move Down"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); duplicateBlock(idx); }}
                            className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Duplicate Block"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); deleteBlock(idx); }}
                            className="p-1 rounded hover:bg-rose-900/80 text-rose-300 hover:text-rose-100"
                            title="Delete Block"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Block Type Badge (Left on Hover) */}
                        <span className="absolute -top-2.5 left-2 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-800 text-indigo-300 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                          {block.type}
                        </span>

                        {/* Block Live Visual Preview inside Canvas */}
                        {block.type === 'heading' && (
                          <div
                            style={{
                              textAlign: p.align || 'left',
                              color: p.color || '#0f172a',
                              fontSize: p.fontSize || (p.level === 1 ? '26px' : p.level === 2 ? '22px' : '18px'),
                              fontWeight: 700,
                              marginBottom: `${p.marginBottom !== undefined ? p.marginBottom : 16}px`,
                              lineHeight: 1.3
                            }}
                          >
                            {p.text || p.content || <span className="text-slate-400 italic">Empty Heading</span>}
                          </div>
                        )}

                        {block.type === 'text' && (
                          <div
                            style={{
                              textAlign: p.align || 'left',
                              color: p.color || '#334155',
                              fontSize: `${p.fontSize || 15}px`,
                              lineHeight: p.lineHeight || 1.6,
                              marginBottom: `${p.marginBottom !== undefined ? p.marginBottom : 16}px`
                            }}
                          >
                            {p.content || p.text || <span className="text-slate-400 italic">Empty paragraph text...</span>}
                          </div>
                        )}

                        {block.type === 'button' && (
                          <div
                            style={{
                              textAlign: p.align || 'center',
                              marginBottom: `${p.marginBottom !== undefined ? p.marginBottom : 24}px`
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-block',
                                backgroundColor: p.backgroundColor || p.bg || '#4f46e5',
                                color: p.textColor || '#ffffff',
                                padding: `${p.paddingY || 12}px ${p.paddingX || 28}px`,
                                borderRadius: `${p.borderRadius !== undefined ? p.borderRadius : 8}px`,
                                fontWeight: 600,
                                fontSize: '14px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                            >
                              {p.label || p.text || 'Action Button'}
                            </span>
                          </div>
                        )}

                        {block.type === 'image' && (
                          <div
                            style={{
                              textAlign: p.align || 'center',
                              marginBottom: `${p.marginBottom !== undefined ? p.marginBottom : 20}px`
                            }}
                          >
                            {p.src ? (
                              <img
                                src={p.src}
                                alt={p.alt || 'Template graphic'}
                                style={{
                                  maxWidth: `${p.width || 100}%`,
                                  borderRadius: `${p.borderRadius !== undefined ? p.borderRadius : 8}px`,
                                  display: 'inline-block',
                                  height: 'auto'
                                }}
                              />
                            ) : (
                              <div className="h-32 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                                🖼️ No Image URL Configured
                              </div>
                            )}
                          </div>
                        )}

                        {block.type === 'divider' && (
                          <hr
                            style={{
                              border: 'none',
                              borderTop: `${p.thickness || 1}px solid ${p.color || '#e2e8f0'}`,
                              margin: `${p.margin || 24}px 0`
                            }}
                          />
                        )}

                        {block.type === 'spacer' && (
                          <div
                            style={{
                              height: `${p.height || 24}px`,
                              backgroundColor: 'rgba(99, 102, 241, 0.05)',
                              border: '1px dashed rgba(99, 102, 241, 0.2)',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              color: '#6366f1'
                            }}
                          >
                            Spacer: {p.height || 24}px
                          </div>
                        )}

                        {block.type === 'columns' && (
                          <div
                            className="grid grid-cols-2 gap-4"
                            style={{ marginBottom: `${p.marginBottom !== undefined ? p.marginBottom : 20}px` }}
                          >
                            <div
                              className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: p.leftContent || 'Left content' }}
                            />
                            <div
                              className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: p.rightContent || 'Right content' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW MODE 2: RENDERED EMAIL PREVIEW WITH REAL TEST VARIABLES */}
        {viewMode === 'preview' && (
          <div className="w-full flex flex-col items-center gap-6">
            {/* Variable Overrides Bar */}
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Simulate Dynamic Merge Variables
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.keys(testVariables).map(key => (
                  <div key={key}>
                    <label className="block text-slate-400 font-mono mb-1">{`{{${key}}}`}</label>
                    <input
                      type="text"
                      value={testVariables[key]}
                      onChange={e => setTestVariables({ ...testVariables, [key]: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Email Render Frame */}
            <div
              className={`w-full rounded-2xl shadow-2xl border border-slate-700 bg-white overflow-hidden ${
                viewport === 'desktop' ? 'max-w-[620px]' : 'max-w-[390px]'
              }`}
            >
              <div className="bg-slate-100 border-b border-slate-200 p-4 text-xs text-slate-700">
                <div><strong>Subject:</strong> {substituteVariables(templateMeta.subject || '', testVariables)}</div>
                <div className="text-slate-500 mt-1"><strong>To:</strong> recipient@example.com</div>
              </div>
              <div
                className="p-8"
                dangerouslySetInnerHTML={{
                  __html: blocks.map(b => {
                    const p = { ...b, ...(b.props || {}) };
                    return compileBlocksToHtml([p], testVariables);
                  }).join('')
                }}
              />
            </div>
          </div>
        )}

        {/* VIEW MODE 3: COMPILED EMAIL HTML CODE INSPECTION */}
        {viewMode === 'code' && (
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                <span className="font-mono text-xs text-slate-300">Generated Email HTML (Nodemailer ready)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(compiledHtml);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition"
              >
                {copiedCode ? '✓ Copied to Clipboard!' : 'Copy HTML'}
              </button>
            </div>
            <pre className="p-5 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[600px] leading-relaxed selection:bg-emerald-500/30">
              {compiledHtml}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
