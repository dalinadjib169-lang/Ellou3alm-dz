import React, { useState, useRef, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Send, User, Loader2, Moon, Sun, ChevronDown, Menu, Plus, Trash2, Rocket, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useDarkMode } from '../hooks/useDarkMode';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  stage: string;
  level: string;
  updatedAt: number;
}

export function StudentView() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState('التعليم المتوسط');
  const [level, setLevel] = useState('السنة الرابعة');
  const [language, setLanguage] = useState<'AR' | 'FR' | 'EN'>('AR');
  const [welcomeMessage, setWelcomeMessage] = useState('مرحباً ابني/ابنتي، معك الأستاذ دالي نجيب. صلِّ على محمد واطرح سؤالك، سأكون سعيداً بالإجابة عليه.');
  const [teacherPic, setTeacherPic] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useDarkMode();

  // Load chats from localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem('smartTeachChats');
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      if (parsedChats.length > 0) {
        loadChat(parsedChats[0]);
      } else {
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('smartTeachChats', JSON.stringify(chats));
    }
  }, [chats]);

  const currentChat = chats.find(c => c.id === currentChatId);
  const messages = currentChat?.messages || [];

  const createNewChat = (customStage = stage, customLevel = level, starterMessage?: string) => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: 'محادثة جديدة',
      messages: [],
      stage: customStage,
      level: customLevel,
      updatedAt: Date.now(),
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setStage(customStage);
    setLevel(customLevel);
    setIsSidebarOpen(false);
    
    if (starterMessage) {
      setInput(starterMessage);
    }
  };

  const loadChat = (chat: ChatSession) => {
    setCurrentChatId(chat.id);
    setStage(chat.stage);
    setLevel(chat.level);
    setIsSidebarOpen(false);
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newChats = chats.filter(c => c.id !== id);
    setChats(newChats);
    if (newChats.length > 0 && id === currentChatId) {
      loadChat(newChats[0]);
    } else if (newChats.length === 0) {
      createNewChat();
    }
    if (newChats.length === 0) {
      localStorage.removeItem('smartTeachChats');
    }
  };

  const updateCurrentChatMessages = (newMessages: Message[]) => {
    setChats(prev => prev.map(c => {
      if (c.id === currentChatId) {
        return {
          ...c,
          title: newMessages.length > 0 ? newMessages[0].content.substring(0, 30) + '...' : 'محادثة جديدة',
          messages: newMessages,
          stage,
          level,
          updatedAt: Date.now()
        };
      }
      return c;
    }).sort((a, b) => b.updatedAt - a.updatedAt));
  };

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

  const nextLanguage = () => {
    if (language === 'AR') setLanguage('FR');
    else if (language === 'FR') setLanguage('EN');
    else setLanguage('AR');
  };

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
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    updateCurrentChatMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          stage,
          level,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل الاتصال بالخادم');
      }

      const data = await response.json();
      updateCurrentChatMessages([...newMessages, { role: 'model', content: data.reply }]);
    } catch (error: any) {
      console.error(error);
      updateCurrentChatMessages([...newMessages, { role: 'model', content: error?.message || 'عذراً، حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevels = () => {
    switch (stage) {
      case 'التعليم الابتدائي': return ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة', 'السنة الخامسة'];
      case 'التعليم المتوسط': return ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة'];
      case 'التعليم الثانوي': return ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة'];
      case 'التعليم الجامعي': return ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'ماستر 1', 'ماستر 2', 'دكتوراه'];
      default: return [];
    }
  };

  return (
    <div className="flex h-full bg-[#F9FBFC] dark:bg-slate-950 text-[#1A1A1A] dark:text-slate-100 font-sans text-right overflow-hidden transition-colors duration-300 border-4 border-emerald-400 shadow-[inset_0_0_20px_rgba(52,211,153,0.5),0_0_20px_rgba(52,211,153,0.5)] relative" dir="rtl">
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="absolute inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`absolute lg:static inset-y-0 right-0 z-50 w-72 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} flex flex-col border-l border-slate-800`}>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-white">المحادثات السابقة</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <button 
            onClick={() => createNewChat()}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl transition-colors font-bold text-sm"
          >
            <Plus size={18} /> محادثة جديدة
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => loadChat(chat)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${chat.id === currentChatId ? 'bg-slate-800 text-emerald-400' : 'hover:bg-slate-800/50'}`}
            >
              <div className="truncate text-sm flex-1 ml-2">{chat.title}</div>
              <button 
                onClick={(e) => deleteChat(e, chat.id)}
                className="text-slate-500 hover:text-red-400 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Marquee Header */}
        <div className="w-full bg-slate-950 text-emerald-400 overflow-hidden whitespace-nowrap py-1 text-xs font-bold border-b border-emerald-900 relative shrink-0">
          <div className="animate-marquee inline-block">
            سبحان الله وبحمده، سبحان الله العظيم • اللهم صل وسلم وبارك على نبينا محمد • لا حول ولا قوة إلا بالله • استغفر الله العظيم وأتوب إليه • لا إله إلا الله وحده لا شريك له • حسبنا الله ونعم الوكيل • اللهم إنك عفو تحب العفو فاعف عنا • الحمد لله رب العالمين • سبحان الله وبحمده عدد خلقه ورضا نفسه وزنة عرشه ومداد كلماته • 
          </div>
        </div>

        {/* Header */}
        <header className="relative overflow-visible flex flex-col md:flex-row justify-between items-start md:items-center p-2 md:p-4 shrink-0 gap-2 bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-md border-b border-emerald-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <div className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] animate-shine pointer-events-none" />
          
          <div className="flex items-center justify-between w-full md:w-auto gap-2 z-10 relative">
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-700 dark:text-slate-300 p-1">
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-black italic text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] z-10 relative leading-none">Smart Teach <span className="text-white">.</span></h1>
                <p className="text-slate-500 dark:text-slate-400 mt-0 text-[10px] md:text-xs hidden md:block">التعلم بالمقاربة بالكفاءات - شرح مبسط بالدّارجة</p>
              </div>
            </div>
            
            {/* Mobile Dark/Lang Toggle */}
            <div className="flex items-center md:hidden gap-1">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                title="تبديل الوضع المظلم"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={nextLanguage}
                className="px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors font-bold text-xs"
                title="تغيير اللغة"
              >
                {language}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full md:w-auto z-10 relative">
            <button 
              onClick={() => createNewChat('التعليم الجامعي', 'السنة الأولى', 'أريد بناء مؤسسة ناشئة، أرشدني خطوة بخطوة...')}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:from-purple-500 hover:to-indigo-500 transition-all shadow-[0_0_10px_rgba(147,51,234,0.5)] border border-purple-400 whitespace-nowrap"
            >
              <Rocket size={14} /> المؤسسات الناشئة
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-1/2 sm:w-auto flex-1">
                <select 
                  value={stage} 
                  onChange={(e) => {
                    setStage(e.target.value);
                    setLevel('السنة الأولى');
                  }}
                  className="appearance-none w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs pl-6 pr-2 py-1.5 font-bold cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                >
                  <option>التعليم الابتدائي</option>
                  <option>التعليم المتوسط</option>
                  <option>التعليم الثانوي</option>
                  <option>التعليم الجامعي</option>
                </select>
                <ChevronDown className="absolute left-1.5 top-1/2 -translate-y-1/2 text-emerald-200 pointer-events-none" size={14} />
              </div>
              <div className="relative w-1/2 sm:w-auto flex-1">
                <select 
                  value={level} 
                  onChange={(e) => setLevel(e.target.value)}
                  className="appearance-none w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs pl-6 pr-2 py-1.5 font-bold cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700 transition-colors outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {getLevels().map(l => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={14} />
              </div>
            </div>
            
            {/* Desktop Dark/Lang Toggle */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                title="تبديل الوضع المظلم"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={nextLanguage}
                className="px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors font-bold text-xs"
                title="تغيير اللغة"
              >
                {language}
              </button>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 space-y-6 pt-6">
          {messages.length === 0 && (
            <div className="flex justify-center w-full">
              <div className="max-w-4xl w-full flex items-start gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  <img src={teacherPic} alt="الأستاذ" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-lg leading-loose relative">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase">ترحيب</span>
                  </div>
                  <div className="mt-4">{welcomeMessage}</div>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-4xl w-full flex items-start gap-4`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white border-2 border-slate-700 dark:bg-emerald-600 dark:border-emerald-500' : 'border-2 border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'}`}>
                  {msg.role === 'user' ? <User size={20} /> : <img src={teacherPic} alt="الأستاذ" className="w-full h-full object-cover" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  {msg.role === 'user' ? (
                    <div className="bg-slate-900 dark:bg-emerald-600 text-white p-4 md:p-6 rounded-3xl rounded-tl-none shadow-sm text-lg mt-2 inline-block break-words max-w-full">
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
                <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  <img src={teacherPic} alt="الأستاذ" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Loader2 className="animate-spin" size={24} />
                  أستاذك راه يكتب...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 md:px-8 pb-8 pt-2 shrink-0">
          <form onSubmit={handleSubmit} className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-4 flex items-end gap-4 shadow-lg max-w-5xl mx-auto">
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
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shrink-0 flex items-center gap-2"
            >
              إرسال
              <Send size={18} className="rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
