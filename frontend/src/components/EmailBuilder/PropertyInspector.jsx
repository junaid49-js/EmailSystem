
const COLOR_PRESETS = [
  '#0f172a', '#1e293b', '#334155', '#64748b',
  '#4f46e5', '#3b82f6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#ffffff'
];

export default function PropertyInspector({
  selectedBlock,
  onUpdateBlock,
  templateMeta,
  onUpdateTemplateMeta,
  onDeselect
}) {
  const insertVariable = (variableName, fieldName = 'content') => {
    if (!selectedBlock) return;
    const currentVal = selectedBlock.props?.[fieldName] || selectedBlock[fieldName] || '';
    const updatedVal = `${currentVal} {{${variableName}}}`;
    onUpdateBlock(selectedBlock.id, {
      props: {
        ...(selectedBlock.props || {}),
        [fieldName]: updatedVal
      }
    });
  };

  const handlePropChange = (key, value) => {
    if (!selectedBlock) return;
    onUpdateBlock(selectedBlock.id, {
      props: {
        ...(selectedBlock.props || {}),
        [key]: value
      }
    });
  };

  const props = selectedBlock ? { ...selectedBlock, ...(selectedBlock.props || {}) } : {};

  return (
    <aside className="w-80 bg-slate-900/90 border-l border-slate-800 flex flex-col h-full overflow-hidden shrink-0 select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </span>
          <h3 className="font-semibold text-slate-200 text-sm tracking-wide">
            {selectedBlock ? `${selectedBlock.type.toUpperCase()} Properties` : 'Template Settings'}
          </h3>
        </div>
        {selectedBlock && (
          <button
            onClick={onDeselect}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
          >
            Done
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-slate-300 text-sm">
        {/* If no block is selected, show Template Details */}
        {!selectedBlock ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Template Name
              </label>
              <input
                type="text"
                value={templateMeta.name || ''}
                onChange={e => onUpdateTemplateMeta({ name: e.target.value })}
                placeholder="e.g. Welcome Onboarding Email"
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Subject Line
              </label>
              <input
                type="text"
                value={templateMeta.subject || ''}
                onChange={e => onUpdateTemplateMeta({ subject: e.target.value })}
                placeholder="Welcome to {{companyName}}, {{name}}!"
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={templateMeta.category || 'general'}
                onChange={e => onUpdateTemplateMeta({ category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              >
                <option value="general">General</option>
                <option value="authentication">Authentication</option>
                <option value="marketing">Marketing & Deals</option>
                <option value="notifications">Product Notifications</option>
                <option value="security">Security & Alerts</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Available Variables ({templateMeta.variables?.length || 0})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(templateMeta.variables || ['name', 'loginUrl', 'appName']).map(varName => (
                  <span
                    key={varName}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono"
                  >
                    {`{{${varName}}}`}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Click any block on the canvas to configure its typography, links, and styling.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-xs text-slate-400 leading-relaxed">
              💡 <strong>Pro Tip:</strong> Use drag handles on the canvas to re-order blocks effortlessly. Your changes compile live to bulletproof email HTML.
            </div>
          </div>
        ) : (
          /* BLOCK SPECIFIC INSPECTORS */
          <div className="space-y-4">
            {/* HEADING BLOCK */}
            {selectedBlock.type === 'heading' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Heading Text
                  </label>
                  <textarea
                    rows={2}
                    value={props.text || props.content || ''}
                    onChange={e => handlePropChange('text', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 text-sm font-sans resize-none"
                  />
                  {/* Variable insertion bar */}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(templateMeta.variables || ['name']).map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v, 'text')}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 font-mono"
                      >
                        + {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Heading Size / Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { level: 1, label: 'H1 (26px)' },
                      { level: 2, label: 'H2 (22px)' },
                      { level: 3, label: 'H3 (18px)' }
                    ].map(h => (
                      <button
                        key={h.level}
                        type="button"
                        onClick={() => handlePropChange('level', h.level)}
                        className={`py-1.5 text-xs font-medium rounded-lg border transition ${
                          (props.level || 2) === h.level
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['left', 'center', 'right'].map(align => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => handlePropChange('align', align)}
                        className={`py-1.5 text-xs font-medium rounded-lg border capitalize transition ${
                          (props.align || 'left') === align
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Text Color
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={props.color || '#0f172a'}
                      onChange={e => handlePropChange('color', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={props.color || '#0f172a'}
                      onChange={e => handlePropChange('color', e.target.value)}
                      className="w-28 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handlePropChange('color', c)}
                        className="w-5 h-5 rounded-full border border-slate-700 hover:scale-110 transition shadow-sm"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Bottom Margin: {props.marginBottom !== undefined ? props.marginBottom : 16}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="48"
                    step="4"
                    value={props.marginBottom !== undefined ? props.marginBottom : 16}
                    onChange={e => handlePropChange('marginBottom', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* PARAGRAPH / TEXT BLOCK */}
            {selectedBlock.type === 'text' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Paragraph Content
                  </label>
                  <textarea
                    rows={4}
                    value={props.content || props.text || ''}
                    onChange={e => handlePropChange('content', e.target.value)}
                    placeholder="Enter your email message here..."
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 text-sm font-sans leading-relaxed resize-y"
                  />
                  {/* Insert merge tags */}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(templateMeta.variables || ['name', 'loginUrl']).map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v, 'content')}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 font-mono"
                      >
                        + {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['left', 'center', 'right'].map(align => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => handlePropChange('align', align)}
                        className={`py-1.5 text-xs font-medium rounded-lg border capitalize transition ${
                          (props.align || 'left') === align
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Font Size: {props.fontSize || 15}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="22"
                    step="1"
                    value={props.fontSize || 15}
                    onChange={e => handlePropChange('fontSize', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Text Color
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={props.color || '#334155'}
                      onChange={e => handlePropChange('color', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={props.color || '#334155'}
                      onChange={e => handlePropChange('color', e.target.value)}
                      className="w-28 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handlePropChange('color', c)}
                        className="w-5 h-5 rounded-full border border-slate-700 hover:scale-110 transition shadow-sm"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* BUTTON BLOCK */}
            {selectedBlock.type === 'button' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={props.label || props.text || ''}
                    onChange={e => handlePropChange('label', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Target URL or Variable
                  </label>
                  <input
                    type="text"
                    value={props.url || props.href || ''}
                    onChange={e => handlePropChange('url', e.target.value)}
                    placeholder="https://example.com or {{loginUrl}}"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 text-sm font-mono"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(templateMeta.variables || ['loginUrl', 'actionUrl']).map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handlePropChange('url', `{{${v}}}`)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 font-mono"
                      >
                        Use {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={props.backgroundColor || props.bg || '#4f46e5'}
                      onChange={e => handlePropChange('backgroundColor', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={props.backgroundColor || props.bg || '#4f46e5'}
                      onChange={e => handlePropChange('backgroundColor', e.target.value)}
                      className="w-28 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['#4f46e5', '#2563eb', '#059669', '#d97706', '#dc2626', '#0f172a'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handlePropChange('backgroundColor', c)}
                        className="w-5 h-5 rounded-full border border-slate-700 hover:scale-110 transition shadow-sm"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Corner Rounding
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { r: 0, label: 'Square' },
                      { r: 4, label: 'Small' },
                      { r: 8, label: 'Medium' },
                      { r: 9999, label: 'Pill' }
                    ].map(item => (
                      <button
                        key={item.r}
                        type="button"
                        onClick={() => handlePropChange('borderRadius', item.r)}
                        className={`py-1 text-xs rounded border transition ${
                          (props.borderRadius ?? 8) === item.r
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['left', 'center', 'right'].map(align => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => handlePropChange('align', align)}
                        className={`py-1.5 text-xs font-medium rounded-lg border capitalize transition ${
                          (props.align || 'center') === align
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* IMAGE BLOCK */}
            {selectedBlock.type === 'image' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Image Source URL
                  </label>
                  <input
                    type="text"
                    value={props.src || ''}
                    onChange={e => handlePropChange('src', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Alt Text
                  </label>
                  <input
                    type="text"
                    value={props.alt || ''}
                    onChange={e => handlePropChange('alt', e.target.value)}
                    placeholder="Descriptive image text"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Width: {props.width || 100}%
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={props.width || 100}
                    onChange={e => handlePropChange('width', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Corner Radius: {props.borderRadius ?? 8}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="2"
                    value={props.borderRadius ?? 8}
                    onChange={e => handlePropChange('borderRadius', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* DIVIDER BLOCK */}
            {selectedBlock.type === 'divider' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Line Color
                  </label>
                  <input
                    type="color"
                    value={props.color || '#e2e8f0'}
                    onChange={e => handlePropChange('color', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Thickness: {props.thickness || 1}px
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={props.thickness || 1}
                    onChange={e => handlePropChange('thickness', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Vertical Margin: {props.margin || 24}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="48"
                    step="4"
                    value={props.margin || 24}
                    onChange={e => handlePropChange('margin', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* SPACER BLOCK */}
            {selectedBlock.type === 'spacer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Height: {props.height || 24}px
                </label>
                <input
                  type="range"
                  min="8"
                  max="80"
                  step="4"
                  value={props.height || 24}
                  onChange={e => handlePropChange('height', Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            )}

            {/* 2-COLUMNS BLOCK */}
            {selectedBlock.type === 'columns' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Left Column Content
                  </label>
                  <textarea
                    rows={3}
                    value={props.leftContent || ''}
                    onChange={e => handlePropChange('leftContent', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 text-sm font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Right Column Content
                  </label>
                  <textarea
                    rows={3}
                    value={props.rightContent || ''}
                    onChange={e => handlePropChange('rightContent', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 text-sm font-sans"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
