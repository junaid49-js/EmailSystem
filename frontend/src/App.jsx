import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TemplateList from './components/TemplateList';
import SmtpSettings from './components/SmtpSettings';
import EmailBuilder from './components/EmailBuilder/EmailBuilder';
import api from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [switchingPersona, setSwitchingPersona] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  // Auto-login as Super Admin on mount if not already logged in
  useEffect(() => {
    const initAuth = async () => {
      try {
        const me = await api.getMe();
        if (me) {
          setUser(me);
        } else {
          // Default to Super Admin persona for instant testing
          const loginData = await api.switchPersona('super_admin');
          setUser(loginData.admin);
        }
      } catch (err) {
        console.warn('Auto-login fallback:', err);
      } finally {
        setInitLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleSwitchPersona = async (role) => {
    setSwitchingPersona(true);
    try {
      const data = await api.switchPersona(role);
      setUser(data.admin);
      setEditingTemplate(null);
    } catch (err) {
      alert(`Failed to switch to ${role}: ${err.message}`);
    } finally {
      setSwitchingPersona(false);
    }
  };

  const handleOpenBuilder = async (template) => {
    try {
      const fullTemplate = await api.getTemplate(template.id);
      setEditingTemplate(fullTemplate);
    } catch (err) {
      console.error('Failed to open template in builder:', err);
      setEditingTemplate(template);
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate({
      id: null,
      name: 'New Announcement Template',
      subject: 'Special Update for {{name}}',
      category: 'marketing',
      variables: ['name', 'loginUrl', 'actionUrl'],
      slug: `announcement-${Date.now().toString(36)}`,
      effective: {
        designJson: null
      }
    });
  };

  if (initLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <svg className="w-8 h-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm">Initializing EmailCraft Studio...</p>
      </div>
    );
  }

  // If in builder mode, show full-screen drag-and-drop studio
  if (editingTemplate) {
    return (
      <EmailBuilder
        template={editingTemplate}
        user={user}
        onBack={() => {
          setEditingTemplate(null);
        }}
        onSaved={(updated) => {
          setEditingTemplate(updated);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSwitchPersona={handleSwitchPersona}
        switchingPersona={switchingPersona}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'templates' && (
          <TemplateList
            user={user}
            onOpenBuilder={handleOpenBuilder}
            onCreateNew={handleCreateNew}
          />
        )}

        {activeTab === 'smtp' && (
          <SmtpSettings user={user} />
        )}
      </main>
    </div>
  );
}
