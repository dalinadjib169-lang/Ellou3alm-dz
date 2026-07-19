import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot } from 'lucide-react';

const ADHKAR = [
  "سبحان الله وبحمده، سبحان الله العظيم",
  "اللهم صل وسلم على نبينا محمد",
  "لا إله إلا الله وحده لا شريك له",
  "استغفر الله العظيم وأتوب إليه",
  "لا حول ولا قوة إلا بالله",
  "الحمد لله حمداً كثيراً طيباً مباركاً فيه"
];

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [dhikrIndex, setDhikrIndex] = useState(0);

  useEffect(() => {
    const dhikrInterval = setInterval(() => {
      setDhikrIndex(prev => (prev + 1) % ADHKAR.length);
    }, 2500);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + Math.floor(Math.random() * 8) + 2;
      });
    }, 150);

    return () => {
      clearInterval(dhikrInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white" dir="rtl">
      {/* App Logo Placeholder */}
      <div className="mb-12 flex flex-col items-center">
        <div className="w-28 h-28 bg-[#0f172a] rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.4)] mb-6 relative overflow-hidden border-4 border-emerald-500/20">
           <Bot size={60} className="text-emerald-400" />
           <div className="absolute top-2 right-2 bg-white rounded overflow-hidden w-8 h-5 shadow-md flex flex-col transform rotate-12">
             <div className="h-1/2 w-full bg-green-600"></div>
             <div className="h-1/2 w-full bg-white flex items-center justify-center relative">
               <span className="text-[6px] text-red-500 leading-none absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>☪</span>
             </div>
           </div>
        </div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-300">Smart Teach</h1>
        <p className="text-emerald-500/70 text-sm mt-1">ذكاء اصطناعي يساعد التلاميذ</p>
      </div>

      {/* Progress Bar */}
      <div className="w-64 relative mb-12">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear", duration: 0.15 }}
          />
        </div>
        <div className="text-center mt-3 text-emerald-400 font-bold font-mono text-xl">
          {Math.min(progress, 100)}%
        </div>
      </div>
      
      {/* Adhkar */}
      <div className="h-16 flex items-center justify-center px-4 w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.p
            key={dhikrIndex}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="text-amber-400 font-bold text-xl md:text-2xl text-center leading-relaxed drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]"
          >
            {ADHKAR[dhikrIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-slate-500 text-sm">مطور: dali nadjib © 2026</p>
      </div>
    </div>
  );
}
