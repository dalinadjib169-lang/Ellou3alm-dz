import React, { useState, useRef, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Send, User, Loader2, Moon, Sun, ChevronDown, Menu, Plus, Trash2, Rocket, X, Hammer, LogOut } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { db } from '../lib/firebase';
import { useDarkMode } from '../hooks/useDarkMode';
import defaultTeacherPic from '../assets/images/teacher_profile.jpg';
import defaultStudentPic from '../assets/images/student_profile.jpg';


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

interface StudentViewProps {
  user?: any;
}

export function StudentView({ user }: StudentViewProps) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [isStartupModalOpen, setIsStartupModalOpen] = useState(false);
  const [isCraftModalOpen, setIsCraftModalOpen] = useState(false);
  const [craftSpecialty, setCraftSpecialty] = useState('');
  const [startupMode, setStartupMode] = useState<'suggest' | 'study'>('suggest');
  const [startupSpecialty, setStartupSpecialty] = useState('');
  const [startupProject, setStartupProject] = useState('');

  const [currentChatId, setCurrentChatId] = useState<string>('');
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState('التعليم المتوسط');
  const [level, setLevel] = useState('السنة الرابعة');
  const [studentName, setStudentName] = useState('التلميذ');
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [questionsLimit, setQuestionsLimit] = useState(10);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeStep, setPasswordChangeStep] = useState(0); // 0: input old pass to re-auth, 1: send code, 2: enter code, 3: enter new password
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [language, setLanguage] = useState<'AR' | 'FR' | 'EN'>('AR');
  const [welcomeMessage, setWelcomeMessage] = useState('مرحباً ابني/ابنتي، معك الأستاذ دالي نجيب. صلِّ على محمد واطرح سؤالك، سأكون سعيداً بالإجابة عليه.');
  const [teacherPic, setTeacherPic] = useState(defaultTeacherPic);
  const [studentPic, setStudentPic] = useState(defaultStudentPic);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useDarkMode();


  // Load user profile from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const docRef = doc(db, 'students', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.name) setStudentName(data.name);
            if (data.stage) setStage(data.stage);
            if (data.level) setLevel(data.level);
            if (data.questionsUsed !== undefined) setQuestionsUsed(data.questionsUsed);
            if (data.questionsLimit !== undefined) setQuestionsLimit(data.questionsLimit);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Load chats from localStorage

  useEffect(() => {
    const chatKey = user?.uid ? `smartTeachChats_${user.uid}` : 'smartTeachChats';
    let savedChats = null;
    try {
      savedChats = localStorage.getItem(chatKey);
    } catch (e) {
      console.warn("localStorage is not available");
    }
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
      const chatKey = user?.uid ? `smartTeachChats_${user.uid}` : 'smartTeachChats';
      try {
        localStorage.setItem(chatKey, JSON.stringify(chats));
      } catch (e) {
        console.warn("Could not save to localStorage", e);
      }
    }
  }, [chats]);

  const currentChat = chats.find(c => c.id === currentChatId);
  const messages = currentChat?.messages || [];

  const createNewChat = (customStage = stage, customLevel = level, starterMessage?: string) => {
    const newChat: ChatSession = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
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
      try {
        localStorage.removeItem('smartTeachChats');
        if (user?.uid) localStorage.removeItem(`smartTeachChats_${user.uid}`);
      } catch (e) {}
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
          if (data.profilePicUrl && !data.profilePicUrl.includes('dicebear')) setTeacherPic(data.profilePicUrl);
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



  const handleCraftSubmit = () => {
    setIsCraftModalOpen(false);
    const prompt = `أنا حرفي/بطال مهنتي أو اختصاصي هو: ${craftSpecialty}\nيرجى اقتراح أحسن المشاريع الناجحة في الجزائر التي تتناسب مع حرفتي برأس مال صغير.\nلكل مشروع مقترح، قدم دراسة شاملة تتضمن: الفئة المستهدفة، المداخيل والمصاريف التقريبية، والعوائق المتوقعة لكل مشروع.`;
    
    const newId = Date.now().toString() + Math.random().toString(36).substring(7);
    const newChat: ChatSession = {
      id: newId,
      title: 'مشاريع الحرفي: ' + craftSpecialty,
      messages: [{ role: 'user', content: prompt }],
      stage: 'أصحاب الحرف',
      level: 'عام',
      updatedAt: Date.now(),
    };
    
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newId);
    setStage('أصحاب الحرف');
    setLevel('عام');
    setIsSidebarOpen(false);
    setInput('');
    
    setIsLoading(true);
    
    fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
    })
      .then(res => res.json())
      .then(data => {
        setChats(prev => prev.map(chat => {
          if (chat.id === newId) {
            return { ...chat, messages: [...chat.messages, { role: 'model', content: data.text }] };
          }
          return chat;
        }));
      })
      .catch(err => {
        console.error(err);
        setChats(prev => prev.map(chat => {
          if (chat.id === newId) {
            return { ...chat, messages: [...chat.messages, { role: 'model', content: "عذراً، حدث خطأ أثناء معالجة طلبك." }] };
          }
          return chat;
        }));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleStartupSubmit = () => {
    setIsStartupModalOpen(false);
    let prompt = '';
    if (startupMode === 'suggest') {
      prompt = `أنا طالب جامعي وأريد بناء مؤسسة ناشئة.\nتخصصي هو: ${startupSpecialty}\nيرجى اقتراح عدة خيارات لمشاريع مؤسسات ناشئة (Startups) مطلوبة وناجحة في السوق الجزائري تتناسب مع تخصصي، مع شرح مفصل لفكرة كل مشروع. يرجى توضيح القيمة الاقتصادية المرجوة، الفئة المستهدفة، العوائق، استراتيجيات العمل القانوني، والمخرجات والمداخيل لكل مشروع مقترح.`;
    } else {
      prompt = `أنا طالب جامعي ولدي فكرة لمؤسسة ناشئة.\nالفكرة هي: ${startupProject}\nيرجى تقديم دراسة شاملة لمشروعي ليكون مشروع ناجح 100%، تتضمن: المخطط العام، دراسة الجدوى، القيمة الاقتصادية المرجوة، الفئة المستهدفة، العوائق المحتملة، استراتيجيات العمل القانوني، المخرجات والمداخيل، والنقاط الإيجابية والسلبية، والتقييم النهائي.`;
    }
    
    const newId = Date.now().toString() + Math.random().toString(36).substring(7);
    const newChat: ChatSession = {
      id: newId,
      title: prompt.substring(0, 30) + '...',
      messages: [{ role: 'user', content: prompt }],
      stage: 'التعليم الجامعي',
      level: 'السنة الأولى',
      updatedAt: Date.now(),
    };
    
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newId);
    setStage('التعليم الجامعي');
    setLevel('السنة الأولى');
    setIsSidebarOpen(false);
    setInput('');
    
    setIsLoading(true);
    
    if (questionsUsed >= questionsLimit) {
      setShowAdModal(true);
      return;
    }
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        stage: 'التعليم الجامعي',
        level: 'السنة الأولى',
        history: [],
        language
      }),
    }).then(async res => {
      if (!res.ok) throw new Error('فشل الاتصال');
      const data = await res.json();
      
      // Update limits
      const newUsed = questionsUsed + 1;
      setQuestionsUsed(newUsed);
      if (user?.uid) {
        updateDoc(doc(db, 'students', user.uid), { questionsUsed: newUsed }).catch(e => console.error(e));
      }

      setChats(prev => prev.map(c => {
         if (c.id === newId) {
           return { ...c, messages: [...c.messages, { role: 'model', content: data.reply }], updatedAt: Date.now() };
         }
         return c;
      }));
    }).catch(err => {
      setChats(prev => prev.map(c => {
         if (c.id === newId) {
           return { ...c, messages: [...c.messages, { role: 'model', content: 'عذراً، حدث خطأ أثناء الاتصال.' }], updatedAt: Date.now() };
         }
         return c;
      }));
    }).finally(() => {
      setIsLoading(false);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (questionsUsed >= questionsLimit) {
      setShowAdModal(true);
      return;
    }

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
          language
        }),
      });

      if (!response.ok) {
        throw new Error('فشل الاتصال بالخادم');
      }

      const data = await response.json();
      updateCurrentChatMessages([...newMessages, { role: 'model', content: data.reply }]);
      
      // Update limits
      const newUsed = questionsUsed + 1;
      setQuestionsUsed(newUsed);
      if (user?.uid) {
        updateDoc(doc(db, 'students', user.uid), { questionsUsed: newUsed }).catch(e => console.error("Error updating credits", e));
      }
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

  
  const handlePasswordChangeSubmit = async () => {
    setProfileMsg({ type: '', text: '' });
    if (passwordChangeStep === 1) {
      if (verificationCode !== '1234') {
        setProfileMsg({ type: 'error', text: 'الكود خاطئ. (للتجربة أدخل 1234)' });
        return;
      }
      setPasswordChangeStep(2);
    } else if (passwordChangeStep === 2) {
      if (newPassword !== confirmPassword) {
        setProfileMsg({ type: 'error', text: 'كلمات المرور غير متطابقة' });
        return;
      }
      if (newPassword.length < 6) {
        setProfileMsg({ type: 'error', text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
        return;
      }
      try {
        if (user) {
          await updatePassword(user, newPassword);
          setProfileMsg({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
          setTimeout(() => {
            setIsChangingPassword(false);
            setPasswordChangeStep(0);
            setNewPassword('');
            setConfirmPassword('');
            setVerificationCode('');
            setProfileMsg({ type: '', text: '' });
          }, 3000);
        }
      } catch (err: any) {
        if (err.code === 'auth/requires-recent-login') {
           setProfileMsg({ type: 'error', text: 'يجب تسجيل الخروج والدخول مجدداً لتغيير كلمة المرور لدواعي أمنية.' });
        } else {
           setProfileMsg({ type: 'error', text: err.message || 'حدث خطأ أثناء تغيير كلمة المرور' });
        }
      }
    }
  };

  const handleRequestCode = async () => {
    setProfileMsg({ type: 'success', text: 'تم إرسال كود من 4 أرقام (للتجربة أدخل 1234)' });
    setPasswordChangeStep(1);
  };

return (
    <>
    {showProfileModal && (
      <div className="fixed inset-0 z-[100] bg-black/80 flex justify-center items-center p-4 backdrop-blur-sm" dir="rtl">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <User size={24} className="text-emerald-500" />
              لوحة التلميذ
            </h2>
            <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-emerald-500 flex items-center justify-center text-4xl mb-3 shadow-lg shadow-emerald-500/20">
                🎓
              </div>
              <h3 className="text-2xl font-bold text-white">{studentName}</h3>
              <p className="text-slate-400 text-sm mt-1">{user?.email || 'بدون بريد'}</p>
              
              <div className="mt-4 flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                <span className="text-emerald-400 font-bold">{questionsLimit - questionsUsed}</span>
                <span className="text-slate-300 text-sm">أسئلة متبقية</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6 space-y-4">
              {!isChangingPassword ? (
                <>
                  <button 
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition-colors font-medium flex justify-between items-center"
                  >
                    تغيير كلمة السر
                    <ChevronDown size={18} className="transform -rotate-90" />
                  </button>
                  <button 
                    onClick={() => { signOut(auth); setShowProfileModal(false); }}
                    className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl transition-colors font-bold flex justify-center items-center gap-2"
                  >
                    <LogOut size={20} />
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <h4 className="font-bold text-white mb-4">تغيير كلمة السر</h4>
                  
                  {profileMsg.text && (
                    <div className={`p-3 rounded-lg mb-4 text-sm ${profileMsg.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                      {profileMsg.text}
                    </div>
                  )}

                  {passwordChangeStep === 0 && (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-300">لتغيير كلمة السر، سنقوم بإرسال كود تأكيد إلى وسيلة الاتصال الخاصة بك.</p>
                      <button 
                        onClick={handleRequestCode}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-bold"
                      >
                        إرسال الكود
                      </button>
                    </div>
                  )}

                  {passwordChangeStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">أدخل الكود (4 أرقام)</label>
                        <input 
                          type="text" 
                          maxLength={4}
                          value={verificationCode}
                          onChange={e => setVerificationCode(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-center text-xl tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="••••"
                        />
                      </div>
                      <button 
                        onClick={handlePasswordChangeSubmit}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-bold"
                      >
                        تأكيد الكود
                      </button>
                    </div>
                  )}

                  {passwordChangeStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">كلمة السر الجديدة</label>
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">تأكيد كلمة السر</label>
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <button 
                        onClick={handlePasswordChangeSubmit}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-bold"
                      >
                        حفظ كلمة السر الجديدة
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => { setIsChangingPassword(false); setPasswordChangeStep(0); setProfileMsg({type:'', text:''}); }}
                    className="w-full mt-3 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    {showAdModal && (
      <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">نفذ رصيدك المجاني</h3>
            <p className="text-slate-400 text-sm">
              لقد استهلكت جميع أسئلتك ({questionsLimit}/{questionsLimit}).
              <br/><br/>
              شاهد إعلاناً قصيراً للحصول على 10 أسئلة إضافية مجاناً.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                // Placeholder for ad logic. For now, simulate adding limits.
                const newLimit = questionsLimit + 10;
                setQuestionsLimit(newLimit);
                if (user?.uid) {
                  updateDoc(doc(db, 'students', user.uid), { questionsLimit: newLimit });
                }
                setShowAdModal(false);
              }}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              شاهد الإعلان
            </button>
            <button 
              onClick={() => setShowAdModal(false)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    )}
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
        <div className="w-full bg-black text-[#FFD700] overflow-hidden whitespace-nowrap py-0.5 text-[10px] font-bold border-y border-[#b8860b] relative shrink-0 shadow-[0_0_10px_rgba(255,215,0,0.2)]">
          <div className="animate-marquee-reverse inline-block">
            سبحان الله وبحمده، سبحان الله العظيم • اللهم صل وسلم وبارك على نبينا محمد • لا حول ولا قوة إلا بالله • استغفر الله العظيم وأتوب إليه • لا إله إلا الله وحده لا شريك له • حسبنا الله ونعم الوكيل • اللهم إنك عفو تحب العفو فاعف عنا • الحمد لله رب العالمين • سبحان الله وبحمده عدد خلقه ورضا نفسه وزنة عرشه ومداد كلماته • لا إله إلا أنت سبحانك إني كنت من الظالمين • اللهم آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار • يا مقلب القلوب ثبت قلبي على دينك • أستغفر الله الذي لا إله إلا هو الحي القيوم وأتوب إليه • رضينا بالله ربا وبالإسلام دينا وبمحمد صلى الله عليه وسلم نبيا ورسولا • 
          </div>
        </div>

        {/* Header */}
        <header className="relative overflow-visible flex flex-col sm:flex-row justify-between items-center p-2 shrink-0 gap-2 bg-slate-100/10 dark:bg-slate-900/20 backdrop-blur-sm border-b border-emerald-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
          <div className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] animate-shine pointer-events-none" />
          
          <div className="flex items-center justify-between w-full sm:w-auto gap-2 z-10 relative">
            <div className="flex items-center gap-1.5">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-700 dark:text-slate-300 p-1">
                <Menu size={18} />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-serif font-black italic gold-text-shiny drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] z-10 relative leading-none">pro dali ai</h1>
              </div>
            </div>
            
            {/* Mobile Dark/Lang Toggle */}
            <div className="flex items-center sm:hidden gap-1">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button
                onClick={nextLanguage}
                className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors font-bold text-[10px]"
              >
                {language}
              </button>
            </div>
          </div>

          <div className="flex flex-row gap-1.5 items-center w-full sm:w-auto z-10 relative">
            <button 
              onClick={() => setIsStartupModalOpen(true)}
              className="flex items-center justify-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2 py-1 rounded border border-purple-400 text-[10px] font-bold shadow-sm whitespace-nowrap"
            >
              <Rocket size={12} /> <span className="hidden sm:inline">المؤسسات الناشئة</span><span className="sm:hidden">مشاريع</span>
            </button>

            <div className="flex items-center gap-1 flex-1 sm:flex-initial">
              <div className="relative w-1/2 sm:w-28 flex-1">
                <select 
                  value={stage} 
                  onChange={(e) => {
                    setStage(e.target.value);
                    setLevel('السنة الأولى');
                  }}
                  className="appearance-none w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] pl-5 pr-1.5 py-1 font-bold cursor-pointer transition-colors outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                >
                  <option>التعليم الابتدائي</option>
                  <option>التعليم المتوسط</option>
                  <option>التعليم الثانوي</option>
                  <option>التعليم الجامعي</option>
                </select>
                <ChevronDown className="absolute left-1 top-1/2 -translate-y-1/2 text-emerald-200 pointer-events-none" size={12} />
              </div>
              <div className="relative w-1/2 sm:w-24 flex-1">
                <select 
                  value={level} 
                  onChange={(e) => setLevel(e.target.value)}
                  className="appearance-none w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] pl-5 pr-1.5 py-1 font-bold cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700 transition-colors outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {getLevels().map(l => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={12} />
              </div>
            </div>
            
            {/* Desktop Dark/Lang Toggle */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button
                onClick={nextLanguage}
                className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors font-bold text-[10px]"
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
                  <img src={teacherPic} alt="الأستاذ" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = defaultTeacherPic; }} />
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-lg leading-loose relative">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase">ترحيب</span>
                  </div>
                  <div className="mt-4">{welcomeMessage.replace(/Smart prof/gi, 'pro dali ai')}</div>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-4xl w-full flex items-start gap-4`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white border-2 border-slate-700 dark:bg-emerald-600 dark:border-emerald-500' : 'border-2 border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'}`}>
                  {msg.role === 'user' ? <img src={studentPic} alt="الطالب" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = defaultStudentPic; }} /> : <img src={teacherPic} alt="الأستاذ" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = defaultTeacherPic; }} />}
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
                  <img src={teacherPic} alt="الأستاذ" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = defaultTeacherPic; }} />
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
    
      {/* Startup Modal */}
      
      {isCraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm rtl">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative">
            <button onClick={() => setIsCraftModalOpen(false)} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={24} />
            </button>
            
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">أصحاب الحرف والبطالين</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 text-right">ما هي حرفتك أو اختصاصك؟</label>
                <input 
                  type="text" 
                  value={craftSpecialty}
                  onChange={(e) => setCraftSpecialty(e.target.value)}
                  placeholder="مثال: نجارة، حلاقة، خياطة..."
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-slate-900 dark:text-white text-right"
                  dir="rtl"
                />
              </div>

              <button 
                onClick={handleCraftSubmit}
                disabled={!craftSpecialty.trim() || isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Hammer size={20} />}
                اقتراح مشاريع تناسبني
              </button>
            </div>
          </div>
        </div>
      )}

      {isStartupModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-emerald-500/30 relative">
            <button onClick={() => setIsStartupModalOpen(false)} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Rocket size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">المؤسسات الناشئة</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">أرشدني في رحلتي الريادية</p>
              </div>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6">
              <button
                onClick={() => setStartupMode('suggest')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${startupMode === 'suggest' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                اقتراح مشاريع
              </button>
              <button
                onClick={() => setStartupMode('study')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${startupMode === 'study' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                دراسة مشروعي
              </button>
            </div>

            {startupMode === 'suggest' ? (
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">ما هو تخصصك الجامعي؟</label>
                <input
                  type="text"
                  value={startupSpecialty}
                  onChange={(e) => setStartupSpecialty(e.target.value)}
                  placeholder="مثال: إعلام آلي، هندسة معمارية، بيولوجيا..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">ما هي فكرة مشروعك؟</label>
                <textarea
                  value={startupProject}
                  onChange={(e) => setStartupProject(e.target.value)}
                  placeholder="اشرح فكرتك باختصار..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] resize-none"
                />
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={handleStartupSubmit}
                disabled={startupMode === 'suggest' ? !startupSpecialty.trim() : !startupProject.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Send size={18} className="rotate-180" />
                {startupMode === 'suggest' ? 'اقترح علي مشاريع' : 'ادرس مشروعي'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
}
