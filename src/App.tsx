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

export default function App() {
  const [currentView, setCurrentView] = useState<'student' | 'dashboard' | 'graph'>('student');
  const [user, setUser] = useState<any>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

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
        <nav className="bg-gray-900 text-white p-2 flex justify-center gap-4 text-sm z-50 shadow-md">
          <button 
            onClick={() => setCurrentView('student')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${currentView === 'student' ? 'bg-emerald-600' : 'hover:bg-gray-800'}`}
          >
            <GraduationCap size={18} />
            <span>تطبيق التلميذ</span>
          </button>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${currentView === 'dashboard' ? 'bg-emerald-600' : 'hover:bg-gray-800'}`}
          >
            <LayoutDashboard size={18} />
            <span>لوحة الأستاذ</span>
          </button>
          <button 
            onClick={() => setCurrentView('graph')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${currentView === 'graph' ? 'bg-emerald-600' : 'hover:bg-gray-800'}`}
          >
            <Sigma size={18} />
            <span>دراسة ورسم دوال</span>
          </button>
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
      <nav className="bg-gray-900 text-white p-2 flex justify-center gap-4 text-sm z-50 shadow-md">
        <button 
          onClick={() => setCurrentView('student')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${currentView === 'student' ? 'bg-emerald-600' : 'hover:bg-gray-800'}`}
        >
          <GraduationCap size={18} />
          <span>تطبيق التلميذ</span>
        </button>
        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${currentView === 'dashboard' ? 'bg-emerald-600' : 'hover:bg-gray-800'}`}
        >
          <LayoutDashboard size={18} />
          <span>لوحة الأستاذ</span>
        </button>
        <button 
          onClick={() => setCurrentView('graph')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${currentView === 'graph' ? 'bg-emerald-600' : 'hover:bg-gray-800'}`}
        >
          <Sigma size={18} />
          <span>دراسة ورسم دوال</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'student' && <StudentView user={user} />}
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'graph' && <GraphView />}
      </main>
    </div>
  );
}
