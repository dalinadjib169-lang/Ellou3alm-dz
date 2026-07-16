/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudentView } from './components/StudentView';
import { DashboardView } from './components/DashboardView';
import { GraphView } from './components/GraphView';
import { GraduationCap, LayoutDashboard, LineChart as ChartIcon, Sigma } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'student' | 'dashboard' | 'graph'>('student');

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
        {currentView === 'student' && <StudentView />}
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'graph' && <GraphView />}
      </main>
    </div>
  );
}
