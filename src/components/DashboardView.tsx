import React, { useState, useEffect } from 'react';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Settings, Save, Image as ImageIcon, Loader2 } from 'lucide-react';

export function DashboardView() {
  const [welcomeMessage, setWelcomeMessage] = useState('مرحباً بك يا بني! أنا أستاذك الجزائري 🇩🇿. اختر الطور والمستوى واسألني أي سؤال.');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [uploadPreset, setUploadPreset] = useState('ml_default');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
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
  }, []);

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
      setMessage('خطأ في رفع الصورة. تأكد من إعدادات Cloudinary (Upload Preset).');
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
        setMessage('حدث خطأ أثناء الحفظ.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFC] text-[#1A1A1A] py-12 text-right font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-10">
        <div className="flex items-center gap-4 mb-10 pb-8 border-b border-slate-100">
          <Settings className="text-emerald-600" size={32} />
          <h1 className="text-3xl font-serif font-black italic text-slate-900">لوحة تحكم الأستاذ <span className="text-emerald-600">.</span></h1>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes('خطأ') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
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
              className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none bg-[#F9FBFC] text-slate-800 shadow-sm"
              placeholder="اكتب رسالة الترحيب التي تظهر للتلاميذ..."
            />
          </div>

          {/* Profile Picture Upload */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">صورة الحساب (Cloudinary)</label>
            <div className="flex items-center gap-6 bg-[#F9FBFC] p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-24 h-24 rounded-full bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                {profilePicUrl ? (
                  <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-gray-400" size={32} />
                )}
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">اسم Upload Preset (للسماح بالرفع غير الموثق):</label>
                  <input
                    type="text"
                    value={uploadPreset}
                    onChange={(e) => setUploadPreset(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-left bg-white shadow-sm"
                    dir="ltr"
                    placeholder="مثال: ml_default"
                  />
                  <p className="text-xs text-gray-500 mt-1">يجب إعداد هذا في حساب Cloudinary الخاص بك (doaxziqm7).</p>
                </div>
                
                <label className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50 w-fit transition-colors">
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
