import React, { useState, useRef, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function StudentView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState('التعليم المتوسط');
  const [level, setLevel] = useState('السنة الرابعة');
  const [welcomeMessage, setWelcomeMessage] = useState('مرحباً بك يا بني! أنا أستاذك الجزائري 🇩🇿. اختر الطور والمستوى واسألني أي سؤال.');
  const [teacherPic, setTeacherPic] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTeacherConfig = async () => {
      try {
        const docRef = doc(db, 'config', 'teacherProfile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.welcomeMessage) setWelcomeMessage(data.welcomeMessage);
          if (data.profilePicUrl) setTeacherPic(data.profilePicUrl);
        }
      } catch (error: any) {
        if (error.code !== 'unavailable') {
          console.error("Error fetching teacher config:", error);
        }
      }
    };
    fetchTeacherConfig();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          stage,
          level,
          history: messages
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل في الاتصال بالخادم');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: error?.message || 'عذراً، حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F9FBFC] text-[#1A1A1A] font-sans text-right overflow-x-hidden" dir="rtl">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-8 shrink-0 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-black italic text-slate-900">Smart Prof <span className="text-emerald-600">.</span></h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">التعلم بالمقاربة بالكفاءات - شرح مبسط بالدّارجة</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">
          <div className="text-right sm:ml-4 hidden sm:block">
            <div className="text-xs text-slate-400 uppercase">الحالة</div>
            <div className="flex items-center gap-2 font-bold text-emerald-600 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> أستاذك راه واجد
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select 
              value={stage} 
              onChange={(e) => setStage(e.target.value)}
              className="bg-emerald-600 text-white rounded-lg text-sm px-4 py-2 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option>التعليم الابتدائي</option>
              <option>التعليم المتوسط</option>
              <option>التعليم الثانوي</option>
            </select>
            <select 
              value={level} 
              onChange={(e) => setLevel(e.target.value)}
              className="bg-white text-slate-700 rounded-lg text-sm px-4 py-2 shadow-sm border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option>السنة الأولى</option>
              <option>السنة الثانية</option>
              <option>السنة الثالثة</option>
              <option>السنة الرابعة</option>
              <option>السنة الخامسة</option>
            </select>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 space-y-6">
        <div className="flex justify-center w-full">
          <div className="max-w-4xl w-full flex items-start gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
               <img src={teacherPic} alt="الأستاذ" className="w-full h-full object-cover" />
            </div>
            <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 text-slate-700 text-lg leading-loose relative">
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">ترحيب</span>
              </div>
              <div className="mt-4">{welcomeMessage}</div>
            </div>
          </div>
        </div>

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-4xl w-full flex items-start gap-4`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white border-2 border-slate-700' : 'border-2 border-emerald-500 bg-emerald-100'}`}>
                {msg.role === 'user' ? <User size={20} /> : <img src={teacherPic} alt="الأستاذ" className="w-full h-full object-cover" />}
              </div>
              
              <div className="flex-1 min-w-0">
                {msg.role === 'user' ? (
                  <div className="bg-slate-900 text-white p-4 md:p-6 rounded-3xl rounded-tl-none shadow-sm text-lg mt-2 inline-block break-words max-w-full">
                    {msg.content}
                  </div>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center w-full">
            <div className="max-w-4xl w-full flex items-start gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                <img src={teacherPic} alt="الأستاذ" className="w-full h-full object-cover" />
              </div>
              <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 flex items-center gap-3 text-emerald-600 font-medium">
                <Loader2 className="animate-spin" size={24} />
                أستاذك راه يكتب...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 md:px-8 pb-8 pt-2">
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl p-4 flex items-end gap-4 shadow-lg max-w-5xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="سقسي أستاذك واش ما فهمتش..."
            className="bg-transparent flex-grow text-white text-right outline-none text-lg resize-none min-h-[44px] max-h-[150px] py-2 px-2"
            dir="rtl"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-400 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shrink-0 flex items-center gap-2"
          >
            إرسال
            <Send size={18} className="rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
}
