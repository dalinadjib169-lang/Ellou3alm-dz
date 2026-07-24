import React, { useState } from 'react';
import { SystemAdminView } from './SystemAdminView';
import { DashboardView } from './DashboardView';

export function AdminPanelView() {
  const [activeTab, setActiveTab] = useState<'stats' | 'settings'>('stats');

  return (
    <div className="min-h-screen bg-[#F9FBFC] flex flex-col font-sans" dir="rtl">
      <div className="bg-white border-b border-slate-200 shadow-sm p-4 flex justify-center gap-4">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-2 rounded-xl font-bold transition-colors ${activeTab === 'stats' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          إحصائيات ومستخدمين
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-2 rounded-xl font-bold transition-colors ${activeTab === 'settings' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          إعدادات التطبيق
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {activeTab === 'stats' ? <SystemAdminView /> : <DashboardView />}
      </div>
    </div>
  );
}
