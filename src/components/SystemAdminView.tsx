import React, { useState, useEffect } from 'react';
import { Users, Key, Activity, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface KeyStats {
  masked: string;
  count: number;
  lastUsed: string | null;
}

interface LogEntry {
  id: number;
  time: string;
  action: string;
  maskedKey: string;
  status: string;
}

interface AdminData {
  totalUsers: number;
  activeKeysCount: number;
  keys: KeyStats[];
  logs: LogEntry[];
}

export function SystemAdminView() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch admin stats');
      const json = await res.json();
      setData(json);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchData, 3000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading && !data) {
    return <div className="flex h-full items-center justify-center"><Activity className="animate-spin text-blue-500" size={32} /></div>;
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Activity className="text-blue-600" size={32} />
              لوحة تحكم النظام (Vercel / Cloud Run)
            </h1>
            <p className="text-slate-500 mt-2">مراقبة المستخدمين، حالة مفاتيح API، وسجلات التوليد المباشرة.</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded text-blue-600" />
              تحديث تلقائي
            </label>
            <button onClick={fetchData} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors shadow-sm">
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              تحديث الآن
            </button>
          </div>
        </header>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

        {data && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-blue-50 p-4 rounded-xl text-blue-600">
                  <Users size={32} />
                </div>
                <div>
                  <div className="text-sm text-slate-500 font-medium">عدد المستخدمين (النشطين)</div>
                  <div className="text-3xl font-bold text-slate-800">{data.totalUsers}</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600">
                  <Key size={32} />
                </div>
                <div>
                  <div className="text-sm text-slate-500 font-medium">مفاتيح API الشغالة</div>
                  <div className="text-3xl font-bold text-slate-800">{data.activeKeysCount}</div>
                </div>
              </div>
            </div>

            {/* Keys Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Key className="text-emerald-500" />
                  حالة المفاتيح (Key Rotation)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">المفتاح (مشفر)</th>
                      <th className="px-6 py-4">مرات الاستخدام</th>
                      <th className="px-6 py-4">آخر استخدام</th>
                      <th className="px-6 py-4 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.keys.map((k, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-700" dir="ltr">{k.masked}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                            {k.count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500" dir="ltr">
                          {k.lastUsed ? new Date(k.lastUsed).toLocaleTimeString() : 'لم يستخدم بعد'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {k.count > 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                              <CheckCircle size={14} /> نشط
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                              انتظار
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {data.keys.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">لا توجد مفاتيح مسجلة. يرجى إضافة GEMINI_API_KEYS</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="text-blue-500" />
                  سجل التوليد المباشر (Live Logs)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">الوقت</th>
                      <th className="px-6 py-4">نوع الطلب</th>
                      <th className="px-6 py-4">المفتاح المستخدم</th>
                      <th className="px-6 py-4">النتيجة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-500" dir="ltr">{new Date(log.time).toLocaleTimeString()}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">{log.action}</td>
                        <td className="px-6 py-4 font-mono text-slate-500" dir="ltr">{log.maskedKey}</td>
                        <td className="px-6 py-4">
                          {log.status === 'Success' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                              <CheckCircle size={14} /> نجاح
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-lg max-w-xs truncate" title={log.status}>
                              <XCircle size={14} /> {log.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {data.logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">لا توجد عمليات توليد مسجلة حالياً.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </>
        )}
      </div>
    </div>
  );
}
