import { useState, useEffect } from 'react';
import api from '../services/api';

export default function TemplateList({
  user,
  onOpenBuilder,
  onCreateNew
}) {
  const isSuperAdmin = user?.role === 'super_admin';
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [error, setError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.listTemplates();
      setTemplates(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  // Quick toggle customization rollback from the card
  const handleToggle = async (templateId, currentIsActive) => {
    try {
      await api.toggleCustomization(templateId, !currentIsActive);
      setActionNotice(
        !currentIsActive
          ? 'Custom version activated.'
          : 'Rolled back to Platform Default. Custom version preserved.'
      );
      setTimeout(() => setActionNotice(null), 3500);
      fetchTemplates();
    } catch (err) {
      alert(err.message || 'Failed to toggle customization');
    }
  };

  // Delete canonical template (Super Admin)
  const handleDeleteTemplate = async (templateId, name) => {
    if (!window.confirm(`Delete canonical template "${name}"? This removes it for all admins.`)) return;
    try {
      await api.deleteDefaultTemplate(templateId);
      setActionNotice(`Canonical template "${name}" deleted.`);
      setTimeout(() => setActionNotice(null), 3500);
      fetchTemplates();
    } catch (err) {
      alert(err.message || 'Failed to delete template');
    }
  };

  const filtered = templates.filter(t => {
    if (filterCategory === 'all') return true;
    return t.category === filterCategory;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Email Templates</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {templates.length} Available
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Visual drag-and-drop templates with tiered multi-tenant customization and soft-rollback.
          </p>
        </div>

        {/* Super Admin Create Button */}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Canonical Template
          </button>
        )}
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center justify-between animate-fade-in">
          <span>✓ {actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      {/* Categories Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs">
        {['all', 'authentication', 'marketing', 'notifications', 'security', 'general'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
              filterCategory === cat
                ? 'bg-slate-800 text-indigo-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Templates */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
          <svg className="w-6 h-6 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading templates...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center border border-slate-800 rounded-2xl bg-slate-900/40">
          <p className="text-sm text-slate-400">No templates found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(t => {
            const hasCustom = t.hasCustomization;
            const isCustomActive = t.isCustomActive;
            const isRolledBack = t.isRolledBack;

            return (
              <div
                key={t.id}
                className="group relative flex flex-col rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-200 shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 overflow-hidden"
              >
                {/* Card Header & Status Badges */}
                <div className="p-5 border-b border-slate-800/60 bg-slate-950/30">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60">
                      {t.category}
                    </span>

                    {/* Multi-tenant tier status */}
                    {isSuperAdmin ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        Canonical
                      </span>
                    ) : isCustomActive ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Custom Active
                      </span>
                    ) : isRolledBack ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        Rolled Back
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                        Default
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-slate-100 text-base group-hover:text-indigo-300 transition-colors">
                    {t.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {t.description || 'No description provided.'}
                  </p>
                </div>

                {/* Subject & Variables */}
                <div className="p-5 flex-1 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Subject:</span>
                    <span className="text-slate-200 font-mono text-[11px] block truncate bg-slate-800/40 px-2 py-1 rounded border border-slate-700/40">
                      {t.effectiveSubject}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">Variables:</span>
                    <div className="flex flex-wrap gap-1">
                      {(t.variables || []).map(v => (
                        <span
                          key={v}
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px] border border-slate-700"
                        >
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-2">
                  {/* Soft Rollback Toggle on card (for Admin) */}
                  {!isSuperAdmin && hasCustom && (
                    <button
                      type="button"
                      onClick={() => handleToggle(t.id, isCustomActive)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                        isCustomActive
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                      title={isCustomActive ? 'Soft rollback to super admin default' : 'Reactivate custom version'}
                    >
                      {isCustomActive ? 'Rollback' : 'Restore Custom'}
                    </button>
                  )}

                  {/* Super Admin Delete */}
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(t.id, t.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete canonical template"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  <div className="ml-auto">
                    <button
                      type="button"
                      onClick={() => onOpenBuilder(t)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      {isSuperAdmin ? 'Edit Default' : hasCustom ? 'Edit Custom Version' : 'Customize with DND'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
