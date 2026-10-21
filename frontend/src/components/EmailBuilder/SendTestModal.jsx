import { useState } from 'react';
import api from '../../services/api';

export default function SendTestModal({
  isOpen,
  onClose,
  template,
  compiledHtml,
  subject
}) {
  const [recipient, setRecipient] = useState('demo.recipient@example.com');
  const [variables, setVariables] = useState({
    name: 'Jane Doe',
    loginUrl: 'https://app.example.com/login?demo=1',
    companyName: 'Acme Systems'
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    setError(null);

    try {
      // If template has a slug, use send-templated
      let response;
      if (template?.slug) {
        response = await api.sendTemplatedEmail({
          to: recipient,
          templateSlug: template.slug,
          variables
        });
      } else {
        response = await api.sendTestEmail({
          to: recipient,
          subject: subject || 'Test Email from Visual Studio',
          content: compiledHtml
        });
      }

      setResult(response);
    } catch (err) {
      setError(err.message || 'Failed to dispatch email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </span>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Send Test Email</h3>
              <p className="text-xs text-slate-400">Routes through active Custom Admin SMTP or Platform Default</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Recipient Email Address
            </label>
            <input
              type="email"
              required
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. user@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Merge Variables
            </label>
            <div className="space-y-2">
              {Object.keys(variables).map(key => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-28 text-xs font-mono text-indigo-300 truncate">{`{{${key}}}`}</span>
                  <input
                    type="text"
                    value={variables[key]}
                    onChange={e => setVariables({ ...variables, [key]: e.target.value })}
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Feedback states */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              ⚠️ {error}
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-2">
              <div className="font-semibold flex items-center gap-1.5">
                <span>✓</span> Email dispatched successfully!
              </div>
              <div className="text-slate-400 font-mono text-[11px]">Message ID: {result.messageId}</div>
              {result.previewUrl && (
                <div className="pt-1">
                  <a
                    href={result.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 transition font-medium"
                  >
                    View Ethereal Preview Inbox →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 flex items-center gap-2"
            >
              {sending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Dispatching...
                </>
              ) : (
                'Send Test Email'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
