import logoImg from '../assets/images/pro_dali_ai_logo_1784536036157.jpg';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, BookOpen, GraduationCap, Phone, CheckCircle2, Bot } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface StudentAuthProps {
  onLogin: (user: any) => void;
}

const STAGES = ['الابتدائي', 'المتوسط', 'الثانوي', 'الجامعي', 'التكوين المهني'];
const LEVELS: Record<string, string[]> = {
  'الابتدائي': ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة', 'السنة الخامسة'],
  'المتوسط': ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة'],
  'الثانوي': ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة'],
  'الجامعي': ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'ماستر 1', 'ماستر 2', 'دكتوراه'],
  'التكوين المهني': ['المستوى الأول', 'المستوى الثاني', 'المستوى الثالث', 'المستوى الرابع', 'المستوى الخامس'],
};

export function StudentAuthView({ onLogin }: StudentAuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [stage, setStage] = useState(STAGES[0]);
  const [level, setLevel] = useState(LEVELS[STAGES[0]][0]);
  const [rememberMe, setRememberMe] = useState(true);

  // Auto-update level when stage changes
  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value;
    setStage(newStage);
    setLevel(LEVELS[newStage][0]);
  };

  const formatEmail = (input: string) => {
    if (input.includes('@')) return input.trim();
    // If it's just a phone number or username, append a dummy domain for Firebase Auth
    return `${input.trim().replace(/[^0-9a-zA-Z_]/g, '')}@smarteach.dz`;
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetSuccess('');
    try {
      if (identifier.includes('@')) {
        await sendPasswordResetEmail(auth, identifier.trim());
        setResetSuccess('تم إرسال رابط استعادة كلمة السر إلى بريدك الإلكتروني. تفقد بريدك.');
      } else {
        // Simulate phone number SMS
        await new Promise(resolve => setTimeout(resolve, 1500));
        setResetSuccess('تم إرسال كود الاسترجاع في رسالة SMS إلى رقم هاتفك. (محاكاة)');
      }
      setTimeout(() => setIsResetMode(false), 5000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') setError('هذا الحساب غير مسجل.');
      else setError('حدث خطأ أثناء إرسال الرابط.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Set persistence based on remember me
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      const emailToUse = formatEmail(identifier);

      if (isLogin) {
        // Login
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
        onLogin(userCredential.user);
      } else {
        // Register
        if (!name.trim()) throw new Error('الرجاء إدخال الاسم الكامل');
        
        const userCredential = await createUserWithEmailAndPassword(auth, emailToUse, password);
        
        // Save extra user data to Firestore
        await setDoc(doc(db, 'students', userCredential.user.uid), {
          name,
          stage,
          level,
          originalIdentifier: identifier,
          createdAt: new Date().toISOString(),
          questionsLimit: 10,
          questionsUsed: 0
        });

        onLogin(userCredential.user);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('هذا الحساب موجود مسبقاً. يرجى تسجيل الدخول.');
      else if (err.code === 'auth/invalid-credential') setError('معلومات الدخول غير صحيحة.');
      else if (err.code === 'auth/weak-password') setError('كلمة السر ضعيفة جداً. استخدم 6 أحرف على الأقل.');
      else setError(err.message || 'حدث خطأ أثناء العملية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden dir-rtl">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
<div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="absolute text-emerald-500/10 font-mono text-4xl symbol-float"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-${Math.random() * 20 + 10}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${Math.random() * 10 + 15}s`
            }}
          >
            {['∑', '∫', 'π', '∞', '∆', 'Ω', 'μ', 'θ', '√', 'E=mc²', 'H₂O', 'O₂', 'CO₂', '⚡', '⚛', 'DNA'][Math.floor(Math.random() * 16)]}
          </div>
        ))}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-4">
          <div className="w-24 h-24 bg-[#0f172a] rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.3)] relative overflow-hidden border-2 border-amber-500/30">
             <img src={logoImg} alt="pro dali ai logo" className="w-full h-full object-cover" />
             <div className="absolute bottom-0 right-0 text-3xl drop-shadow-md transform translate-x-1/4 translate-y-1/4 z-20">🇩🇿</div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-right text-4xl tracking-tight">
              <span className="gold-text-shiny font-serif font-black italic drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">pro dali ai</span>
            </h2>
            <p className="text-emerald-500/80 text-sm font-medium mt-1 text-right">مساعدك الذكي</p>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          {isLogin 
            ? 'مرحباً بعودتك! يمكنك الدخول باستخدام رقم هاتفك أو بريدك الإلكتروني.' 
            : 'يمكنك إنشاء حساب برقم هاتفك أو الإيميل. يوفر التطبيق حماية تامة لحسابات الطلبة. يمكن استرجاع كلمة السر لاحقاً عبر إرسال كود للهاتف أو الإيميل.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-700/50">
          {isResetMode ? (
          <form className="space-y-6" onSubmit={handleResetSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">البريد الإلكتروني أو رقم الهاتف لاسترجاع الحساب</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {identifier.includes('@') ? <Mail className="h-5 w-5 text-slate-500" /> : <Phone className="h-5 w-5 text-slate-500" />}
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pr-10 pl-3 py-3 border-slate-600 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all border"
                  placeholder="email@example.com أو 0612345678"
                  dir="ltr"
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">سيتم إرسال كود الاسترجاع إلى هاتفك أو بريدك الإلكتروني.</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center gap-2">
                {error}
              </motion.div>
            )}
            
            {resetSuccess && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-emerald-900/50 border border-emerald-500/50 rounded-xl text-emerald-200 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {resetSuccess}
              </motion.div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال رابط الاسترجاع'}
              </button>
            </div>
            <div className="text-center">
              <button type="button" onClick={() => setIsResetMode(false)} className="text-sm font-medium text-slate-400 hover:text-white">العودة لتسجيل الدخول</button>
            </div>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">الاسم الكامل</label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        required={!isLogin}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pr-10 pl-3 py-3 border-slate-600 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all border"
                        placeholder="محمد الأمين"
                      />
                    </div>
                  </div>

                  {/* Stage and Level */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">الطور</label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <GraduationCap className="h-5 w-5 text-slate-500" />
                        </div>
                        <select
                          value={stage}
                          onChange={handleStageChange}
                          className="block w-full pr-10 pl-3 py-3 border-slate-600 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all border appearance-none"
                        >
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">المستوى الدراسي</label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <BookOpen className="h-5 w-5 text-slate-500" />
                        </div>
                        <select
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          className="block w-full pr-10 pl-3 py-3 border-slate-600 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all border appearance-none"
                        >
                          {LEVELS[stage].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email/Phone Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">البريد الإلكتروني أو رقم الهاتف (لحماية حسابك يفضل استخدام إيميل حقيقي)</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {identifier.includes('@') ? <Mail className="h-5 w-5 text-slate-500" /> : <Phone className="h-5 w-5 text-slate-500" />}
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pr-10 pl-3 py-3 border-slate-600 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all border"
                  placeholder="0612345678 أو email@example.com"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">كلمة السر</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pr-10 pl-10 py-3 border-slate-600 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all border"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-emerald-500 focus:ring-emerald-500 border-slate-600 rounded bg-slate-800"
                />
                <label htmlFor="remember-me" className="mr-2 block text-sm text-slate-300">
                  تذكرني لحفظ الدخول
                </label>
              </div>

              {isLogin && (
                <div className="text-sm">
                  <button type="button" onClick={() => { setIsResetMode(true); setError(''); setResetSuccess(''); }} className="font-medium text-emerald-500 hover:text-emerald-400">
                    نسيت كلمة السر؟
                  </button>
                </div>
              )}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="p-3 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                {error}
              </motion.div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'
                )}
              </button>
            </div>
          </form>
        )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">أو</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="w-full flex justify-center py-3 px-4 border border-slate-600 rounded-xl shadow-sm text-sm font-medium text-slate-300 bg-slate-900/50 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-900 transition-all"
              >
                {isLogin ? 'ليس لديك حساب؟ أنشئ حساباً جديداً' : 'لديك حساب بالفعل؟ سجل دخولك'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center pb-8">
          <p className="text-slate-500 text-sm font-medium">مطور: dali nadjib © 2026</p>
        </div>
      </div>
    </div>
  );
}
