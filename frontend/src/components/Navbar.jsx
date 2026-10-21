
export default function Navbar({
  user,
  activeTab,
  onTabChange,
  onSwitchPersona,
  switchingPersona
}) {
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange('templates')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              EmailCraft <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">Studio</span>
            </span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Visual Email Platform</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTabChange('templates')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'templates'
                ? 'bg-slate-800 text-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Templates
          </button>
          <button
            type="button"
            onClick={() => onTabChange('smtp')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'smtp'
                ? 'bg-slate-800 text-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            SMTP Gateway
          </button>
        </nav>
      </div>

      {/* Right: Persona Switcher & Role Badge */}
      <div className="flex items-center gap-3">
        {/* Persona Switcher Pill */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400 pl-2 hidden md:inline">
            Active Persona:
          </span>
          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
            isSuperAdmin
              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
          }`}>
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </span>
          <span className="text-slate-400 font-mono text-[11px] hidden lg:inline max-w-[130px] truncate">
            {user?.email || 'superadmin@example.com'}
          </span>

          {/* 1-Click Persona Switcher */}
          <button
            type="button"
            disabled={switchingPersona}
            onClick={() => onSwitchPersona(isSuperAdmin ? 'admin' : 'super_admin')}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition shadow-sm disabled:opacity-50 flex items-center gap-1"
            title="Switch between Super Admin and Admin test persona"
          >
            {switchingPersona ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            )}
            {isSuperAdmin ? 'Switch to Admin' : 'Switch to Super Admin'}
          </button>
        </div>
      </div>
    </header>
  );
}
