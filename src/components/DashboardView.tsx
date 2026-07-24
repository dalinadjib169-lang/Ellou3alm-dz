import React, { useState, useEffect } from 'react';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import defaultTeacherPic from '../assets/images/teacher_profile.jpg';
import { Settings, Save, Image as ImageIcon, Loader2, LogIn, LogOut, AlertCircle } from 'lucide-react';

export function DashboardView() {
  const [welcomeMessage, setWelcomeMessage] = useState('مرحباً ابني/ابنتي، معك الأستاذ دالي نجيب. صلِّ على محمد واطرح سؤالك، سأكون سعيداً بالإجابة عليه.');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [uploadPreset, setUploadPreset] = useState('ml_default');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const allowedEmails = ['dalinadjib1990@gmail.com', 'dalinadjib169@gmail.com'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && allowedEmails.includes(user.email)) {
      const fetchConfig = async () => {
        try {
          const docRef = doc(db, 'config', 'teacherProfile');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.welcomeMessage) setWelcomeMessage(data.welcomeMessage);
            if (data.profilePicUrl) setProfilePicUrl(data.profilePicUrl);
            if (data.uploadPreset) setUploadPreset(data.uploadPreset);
          }
        } catch (error: any) {
          if (error.code !== 'unavailable') {
            console.error("Error loading config:", error);
          }
        }
      };
      fetchConfig();
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/unauthorized-domain') {
        setMessage("هذا الرابط غير مصرح له في Firebase. يرجى إضافته في إعدادات Authentication > Authorized domains.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        setMessage("تم إلغاء تسجيل الدخول.");
      } else {
        setMessage("حدث خطأ أثناء تسجيل الدخول.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage('');
    try {
      const url = await uploadImageToCloudinary(file, uploadPreset);
      setProfilePicUrl(url);
      setMessage('تم رفع الصورة بنجاح!');
    } catch (error: any) {
      if (error.message && error.message.includes('whitelisted for unsigned uploads')) {
        setMessage('خطأ: الـ Upload Preset المكتوب غير مصرح له بالرفع المباشر. اذهب إلى Cloudinary -> Settings -> Upload واجعل הـ Signing Mode لـ Preset الخاص بك "Unsigned".');
      } else {
        setMessage('خطأ في رفع الصورة. تأكد من إعدادات Cloudinary (Upload Preset).');
      }
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'config', 'teacherProfile'), {
        welcomeMessage,
        profilePicUrl,
        uploadPreset,
        updatedAt: new Date().toISOString()
      });
      setMessage('تم حفظ الإعدادات بنجاح!');
    } catch (error: any) {
      if (error.code === 'unavailable') {
        setMessage('تعذر الحفظ: لا يوجد اتصال بقاعدة البيانات.');
      } else {
        console.error("Error saving:", error);
        setMessage('حدث خطأ أثناء الحفظ. ربما لا تملك الصلاحيات (Firestore Rules).');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-full bg-slate-50 text-[#1A1A1A] flex items-center justify-center font-sans" dir="rtl">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full bg-slate-50 text-[#1A1A1A] flex items-center justify-center font-sans p-4" dir="rtl">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full text-center">
          <Settings className="text-emerald-600 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold mb-2">لوحة تحكم الأستاذ</h1>
          <p className="text-gray-600 mb-8">يرجى تسجيل الدخول للوصول إلى لوحة التحكم.</p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-colors"
          >
            <LogIn size={20} />
            تسجيل الدخول بحساب Google
          </button>
        </div>
      </div>
    );
  }

  if (!allowedEmails.includes(user.email)) {
    return (
      <div className="h-full bg-slate-50 text-[#1A1A1A] flex items-center justify-center font-sans p-4" dir="rtl">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold mb-2 text-red-600">غير مصرح لك</h1>
          <p className="text-gray-600 mb-8">هذا الحساب ({user.email}) غير مصرح له بالدخول إلى لوحة تحكم الأستاذ.</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl font-bold transition-colors"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 text-[#1A1A1A] py-12 overflow-y-auto text-right font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-10 relative">
        <button
          onClick={handleLogout}
          className="absolute top-10 left-10 text-slate-500 hover:text-red-600 flex items-center gap-2 text-sm font-bold bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          تسجيل الخروج
        </button>

        <div className="flex items-center gap-4 mb-10 pb-8 border-b border-slate-100">
          <Settings className="text-emerald-600" size={32} />
          <h1 className="text-3xl font-serif font-black italic text-slate-900">لوحة تحكم الأستاذ <span className="text-emerald-600">.</span></h1>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes('خطأ') || message.includes('تعذر') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="space-y-8">
          {/* Welcome Message */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">الرسالة الترحيبية</label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none bg-[#F9FBFC] text-slate-800 shadow-sm outline-none"
              placeholder="اكتب رسالة الترحيب التي تظهر للتلاميذ..."
            />
          </div>

          {/* Profile Picture Upload */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">صورة الحساب (Cloudinary)</label>
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#F9FBFC] p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-24 h-24 rounded-full bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                {profilePicUrl ? (
                  <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = defaultTeacherPic; }} />
                ) : (
                  <ImageIcon className="text-gray-400" size={32} />
                )}
              </div>
              
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Upload Preset (للسماح بالرفع غير الموثق):</label>
                  <input
                    type="text"
                    value={uploadPreset}
                    onChange={(e) => setUploadPreset(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-left bg-white shadow-sm outline-none"
                    dir="ltr"
                    placeholder="مثال: ml_default"
                  />
                  <p className="text-xs text-gray-500 mt-1">إذا واجهت خطأ في الرفع، تأكد من كتابة اسم الـ Preset الصحيح.</p>
                </div>
                
                <label className="flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50 w-full sm:w-fit transition-colors">
                  {isUploading ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />}
                  <span>اختر صورة جديدة</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:bg-emerald-400 mt-8 shadow-md"
          >
            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
}
