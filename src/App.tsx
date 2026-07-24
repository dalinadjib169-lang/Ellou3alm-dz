/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StudentView } from './components/StudentView';
import { DashboardView } from './components/DashboardView';
import { GraphView } from './components/GraphView';
import { StudentAuthView } from './components/StudentAuthView';
import { LoadingScreen } from './components/LoadingScreen';
import { GraduationCap, LayoutDashboard, LineChart as ChartIcon, Sigma } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { SystemAdminView } from './components/SystemAdminView';
import { AdminPanelView } from './components/AdminPanelView';

export default function App() {
  const [currentView, setCurrentView] = useState<'student' | 'dashboard' | 'graph' | 'admin'>('student');
  const [user, setUser] = useState<any>(null);
  const [loadingApp, setLoadingApp] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = user?.email?.toLowerCase() === 'dalinadjib1990@gmail.com' || user?.email?.toLowerCase() === 'dalinadjib169@gmail.com';

  const handleLoadingComplete = () => {
    setLoadingApp(false);
  };

  // Only show loading screen initially when loading app
  if (loadingApp) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  // If we are in student view and auth is initialized but no user, show Auth View
  if (currentView === 'student' && authInitialized && !user) {
    return (
      <div className="flex flex-col h-screen overflow-hidden font-sans bg-slate-900">
        <nav className="bg-slate-900 text-white p-3 flex flex-wrap justify-center gap-3 text-sm font-medium z-50 shadow-lg border-b border-slate-800">
          <button 
            onClick={() => setCurrentView('student')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-sm ${currentView === 'student' ? 'bg-emerald-600 shadow-emerald-900/50 scale-105' : 'bg-slate-800 hover:bg-slate-700'}`}
          >
            <GraduationCap size={18} />
            <span>تطبيق التلميذ</span>
          </button>
          <button 
            onClick={() => setCurrentView('graph')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-sm ${currentView === 'graph' ? 'bg-emerald-600 shadow-emerald-900/50 scale-105' : 'bg-slate-800 hover:bg-slate-700'}`}
          >
            <Sigma size={18} />
            <span>دراسة ورسم دوال</span>
          </button>
          {isAdmin && (
            <button 
              onClick={() => setCurrentView('admin')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-sm ${currentView === 'admin' || currentView === 'dashboard' ? 'bg-emerald-600 shadow-emerald-900/50 scale-105' : 'bg-slate-800 hover:bg-slate-700'}`}
            >
              <LayoutDashboard size={18} />
              <span>لوحة التحكم</span>
            </button>
          )}
      </nav>
        <div className="flex-1 overflow-y-auto">
          <StudentAuthView onLogin={(user) => setUser(user)} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans">
      {/* App Navigation Navigation - strictly for switching roles for testing */}
      <nav className="bg-slate-900 text-white p-3 flex flex-wrap justify-center gap-3 text-sm font-medium z-50 shadow-lg border-b border-slate-800">
        <button 
          onClick={() => setCurrentView('student')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-sm ${currentView === 'student' ? 'bg-emerald-600 shadow-emerald-900/50 scale-105' : 'bg-slate-800 hover:bg-slate-700'}`}
        >
          <GraduationCap size={18} />
          <span>تطبيق التلميذ</span>
        </button>
        <button 
          onClick={() => setCurrentView('graph')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-sm ${currentView === 'graph' ? 'bg-emerald-600 shadow-emerald-900/50 scale-105' : 'bg-slate-800 hover:bg-slate-700'}`}
        >
          <Sigma size={18} />
          <span>دراسة ورسم دوال</span>
        </button>
        {isAdmin && (
          <button 
            onClick={() => setCurrentView('admin')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-sm ${currentView === 'admin' || currentView === 'dashboard' ? 'bg-emerald-600 shadow-emerald-900/50 scale-105' : 'bg-slate-800 hover:bg-slate-700'}`}
          >
            <LayoutDashboard size={18} />
            <span>لوحة التحكم</span>
          </button>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'student' && <StudentView user={user} />}
        {currentView === 'dashboard' && <AdminPanelView />}
        {currentView as string === 'graph' && <GraphView />}
        {currentView === 'admin' && <AdminPanelView />}
      </main>
    </div>
  );
}
