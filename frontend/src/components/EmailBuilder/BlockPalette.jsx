const BLOCK_TYPES = [
  {
    type: 'heading',
    label: 'Heading',
    desc: 'Titles and section headers',
    icon: (
      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
      </svg>
    )
  },
  {
    type: 'text',
    label: 'Paragraph / Text',
    desc: 'Formatted body copy with dynamic merge tags',
    icon: (
      <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h12M4 18h8" />
      </svg>
    )
  },
  {
    type: 'button',
    label: 'Action Button',
    desc: 'Call-to-action button with custom link',
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    )
  },
  {
    type: 'image',
    label: 'Image Banner',
    desc: 'Header graphic, hero, or product photo',
    icon: (
      <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    type: 'columns',
    label: '2-Column Section',
    desc: 'Side-by-side grid layout for cards & features',
    icon: (
      <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m0 10V7m0 10a2 2 0 012 2h2a2 2 0 012-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    )
  },
  {
    type: 'divider',
    label: 'Divider Line',
    desc: 'Clean horizontal rule separator',
    icon: (
      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    )
  },
  {
    type: 'spacer',
    label: 'Vertical Spacer',
    desc: 'Breathing room and custom gap height',
    icon: (
      <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18m0 0l-4-4m4 4l4-4" />
      </svg>
    )
  }
];

export default function BlockPalette({ onAddBlock }) {
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ isNew: true, type }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="w-72 bg-slate-900/90 border-r border-slate-800 flex flex-col h-full overflow-hidden shrink-0 select-none">
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </span>
            <h3 className="font-semibold text-slate-200 text-sm tracking-wide">Block Palette</h3>
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
            Drag & Drop
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Drag blocks onto the canvas or click to append to the end.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {BLOCK_TYPES.map(item => (
          <div
            key={item.type}
            draggable
            onDragStart={e => handleDragStart(e, item.type)}
            onClick={() => onAddBlock(item.type)}
            className="group relative flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/90 border border-slate-700/40 hover:border-indigo-500/50 cursor-grab active:cursor-grabbing transition-all duration-200 shadow-sm hover:shadow-indigo-500/5 hover:-translate-y-0.5"
          >
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 group-hover:scale-105 transition-transform shrink-0">
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                  {item.label}
                </h4>
                <span className="opacity-0 group-hover:opacity-100 text-slate-400 text-xs transition-opacity">
                  + Add
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 leading-normal">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <svg className="w-3.5 h-3.5 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Bulletproof HTML Email Output
        </div>
      </div>
    </aside>
  );
}
