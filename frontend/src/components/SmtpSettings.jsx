import { useState, useEffect } from 'react';
import api from '../services/api';

export default function SmtpSettings({ user }) {
  const [smtpData, setSmtmData] = useState(null);
  const [platformStatus, setPlatformStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form State
  const [form, setForm] = useState({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: '',
    fromName: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [custom, platform] = await Promise.allSettled([
        api.getSmtpSettings(),
        api.getPlatformSmtpStatus()
      ]);

      if (custom.status === 'fulfilled') {
        setSmtmData(custom.value);
        if (custom.value.customSettings) {
          setForm({
            host: custom.value.customSettings.host || '',
            port: custom.value.customSettings.port || 587,
            secure: Boolean(custom.value.customSettings.secure),
            username: custom.value.customSettings.username || '',
            password: '', // never return ciphertext
            fromEmail: custom.value.customSettings.fromEmail || '',
            fromName: custom.value.customSettings.fromName || ''
          });
        }
      }

      if (platform.status === 'fulfilled') {
        setPlatformStatus(platform.value);
      }
    } catch (err) {
      console.error('Error loading SMTP info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleVerify = async () => {
    setVerifying(true);
    setFeedback(null);
    try {
      const res = await api.verifySmtpSettings(form);
      setFeedback({ type: 'success', message: res.message || 'SMTP Connection verified successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'SMTP verification failed.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await api.saveSmtpSettings(form);
      setFeedback({ type: 'success', message: 'Custom SMTP credentials saved and verified!' });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save SMTP settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (isActive) => {
    try {
      await api.toggleSmtp(isActive);
      setFeedback({
        type: 'success',
        message: isActive ? 'Switched to Custom SMTP.' : 'Switched to Platform Default SMTP.'
      });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to toggle SMTP.' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete your custom SMTP configuration and revert to platform default?')) return;
    try {
      await api.deleteSmtpSettings();
      setFeedback({ type: 'success', message: 'Custom SMTP deleted. Platform default restored.' });
      setForm({
        host: '',
        port: 587,
        secure: false,
        username: '',
        password: '',
        fromEmail: '',
        fromName: ''
      });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete SMTP settings.' });
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
        <svg className="w-6 h-6 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading SMTP settings...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">SMTP Delivery Gateway</h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure your dedicated SMTP server or route through the platform default mailer.
        </p>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{feedback.type === 'success' ? '✓' : '⚠️'} {feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Transporter Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Mailer</span>
            {smtpData?.isUsingCustom ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Custom SMTP Active
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                Platform Default
              </span>
            )}
          </div>
          <div className="text-base font-bold text-slate-100">
            {smtpData?.isUsingCustom ? smtpData.customSettings?.host : platformStatus?.host || 'Ethereal / Default'}
          </div>
          <div className="text-xs text-slate-400">
            Source: <strong className="text-slate-200">{smtpData?.source || 'platform_default'}</strong>
          </div>

          {/* Toggle Button */}
          {smtpData?.hasCustomSmtp && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleToggle(!smtpData.isUsingCustom)}
                className={`w-full py-2 rounded-xl text-xs font-semibold border transition ${
                  smtpData.isUsingCustom
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
                }`}
              >
                {smtpData.isUsingCustom ? 'Switch to Platform Default' : 'Switch to Custom SMTP'}
              </button>
            </div>
          )}
        </div>

        {/* Platform Default Status Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Health</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Connected
            </span>
          </div>
          <div className="text-base font-bold text-slate-100">
            {platformStatus?.host || 'Ethereal Mail Gateway'}
          </div>
          <div className="text-xs text-slate-400">
            Port: <strong className="text-slate-200">{platformStatus?.port || 587}</strong> • Security: AES-256-GCM
          </div>
        </div>
      </div>

      {/* Custom SMTP Configuration Form */}
      <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Custom Admin SMTP Settings</h3>
            <p className="text-xs text-slate-400 mt-0.5">Passwords are encrypted via AES-256-GCM before saving.</p>
          </div>
          {smtpData?.hasCustomSmtp && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 transition"
            >
              Remove Configuration
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">SMTP Host</label>
              <input
                type="text"
                required
                value={form.host}
                onChange={e => setForm({ ...form, host: e.target.value })}
                placeholder="smtp.mailgun.org or smtp.sendgrid.net"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Port</label>
              <input
                type="number"
                required
                value={form.port}
                onChange={e => setForm({ ...form, port: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Password {smtpData?.hasCustomSmtp && <span className="text-slate-500 font-normal">(Leave blank to keep existing)</span>}
              </label>
              <input
                type="password"
                required={!smtpData?.hasCustomSmtp}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={smtpData?.hasCustomSmtp ? '••••••••••••' : 'Enter SMTP password'}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Sender Email ("From")</label>
              <input
                type="email"
                value={form.fromEmail}
                onChange={e => setForm({ ...form, fromEmail: e.target.value })}
                placeholder="noreply@yourdomain.com"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Sender Name ("From Name")</label>
              <input
                type="text"
                value={form.fromName}
                onChange={e => setForm({ ...form, fromName: e.target.value })}
                placeholder="Acme Support"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="secure"
              checked={form.secure}
              onChange={e => setForm({ ...form, secure: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="secure" className="text-slate-300 font-medium">Use TLS/SSL (Port 465)</label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={verifying || !form.host || !form.username}
              onClick={handleVerify}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Test Connection'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Verify Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
