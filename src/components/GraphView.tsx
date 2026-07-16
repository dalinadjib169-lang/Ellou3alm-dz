import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import * as math from 'mathjs';
import { Calculator, Sigma, Activity, HelpCircle, Send, Loader2, BookOpen } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

export function GraphView() {
  const [expression, setExpression] = useState('x^2 - 4*x + 3');
  const [pointX, setPointX] = useState('');
  const [paramM, setParamM] = useState('1');
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'graph' | 'study' | 'qa'>('graph');
  
  const [studyResult, setStudyResult] = useState('');
  const [isStudying, setIsStudying] = useState(false);
  
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<{q: string, a: string}[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const data = useMemo(() => {
    try {
      const scope = { m: parseFloat(paramM) || 0 };
      const compiled = math.compile(expression);
      const points = [];
      for (let x = -10; x <= 10; x += 0.5) {
        scope.x = x;
        const y = compiled.evaluate(scope);
        points.push({ x, y });
      }
      setError('');
      return points;
    } catch (err: any) {
      setError('دالة غير صالحة للرسم. يرجى التحقق من العبارة الرياضية.');
      return [];
    }
  }, [expression, paramM]);

  const insertChar = (char: string) => {
    setExpression(prev => prev + char);
  };

  const keyboardKeys = [
    { label: 'x', val: 'x', color: 'bg-slate-700 text-white shadow-sm border-slate-800' },
    { label: 'm', val: 'm', color: 'bg-slate-700 text-white shadow-sm border-slate-800' },
    { label: '(', val: '(', color: 'bg-slate-200 text-slate-800 shadow-sm border-slate-300' },
    { label: ')', val: ')', color: 'bg-slate-200 text-slate-800 shadow-sm border-slate-300' },
    { label: '7', val: '7', color: 'bg-white text-slate-800 shadow-sm border-slate-200' },
    { label: '8', val: '8', color: 'bg-white text-slate-800 shadow-sm border-slate-200' },
    { label: '9', val: '9', color: 'bg-white text-slate-800 shadow-sm border-slate-200' },
    { label: '÷', val: '/', color: 'bg-orange-500 text-white shadow-sm border-orange-600' },
    { label: '4', val: '4', color: 'bg-white text-slate-800 shadow-sm border-slate-200' },
    { label: '5', val: '5', color: 'bg-white text-slate-800 shadow-sm border-slate-200' },
    { label: '6', val: '6', color: 'bg-white text-slate-800 shadow-sm border-slate-200' },
    { label: '×', val: '*', color: 'bg-orange-500 text-white shadow-sm border-orange-600' },
    { label: '1', val: '1', color: 'bg-white text-slate-800 shadow-sm border-slate-200' },
    { label: '2', val: '2', color: 'bg-white text-slate-800 shadow-sm border-slate-200' },
    { label: '3', val: '3', color: 'bg-white text-slate-800 shadow-sm border-slate-200' },
    { label: '-', val: '-', color: 'bg-orange-500 text-white shadow-sm border-orange-600' },
    { label: '0', val: '0', color: 'bg-white text-slate-800 shadow-sm border-slate-200' },
    { label: '.', val: '.', color: 'bg-white text-slate-800 shadow-sm border-slate-200' },
    { label: '^', val: '^', color: 'bg-slate-200 text-slate-800 shadow-sm border-slate-300' },
    { label: '+', val: '+', color: 'bg-orange-500 text-white shadow-sm border-orange-600' },
    { label: '√', val: 'sqrt(', color: 'bg-slate-100 text-slate-600 shadow-sm border-slate-200' },
    { label: 'sin', val: 'sin(', color: 'bg-slate-100 text-slate-600 shadow-sm border-slate-200' },
    { label: 'cos', val: 'cos(', color: 'bg-slate-100 text-slate-600 shadow-sm border-slate-200' },
    { label: 'tan', val: 'tan(', color: 'bg-slate-100 text-slate-600 shadow-sm border-slate-200' },
    { label: 'ln', val: 'log(', color: 'bg-slate-100 text-slate-600 shadow-sm border-slate-200' },
    { label: 'e', val: 'e', color: 'bg-slate-100 text-slate-600 shadow-sm border-slate-200' },
    { label: 'π', val: 'pi', color: 'bg-slate-100 text-slate-600 shadow-sm border-slate-200' },
    { label: 'C', val: 'clear', color: 'bg-red-500 text-white col-span-1 shadow-sm border-red-600' },
  ];

  const handleStudy = async () => {
    if (!expression) return;
    setActiveTab('study');
    setIsStudying(true);
    try {
      const res = await fetch('/api/study-function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression, mValue: paramM, pointX })
      });
      const data = await res.json();
      setStudyResult(data.reply);
    } catch (e) {
      setStudyResult('حدث خطأ أثناء محاولة دراسة الدالة.');
    } finally {
      setIsStudying(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;
    const userQ = question;
    setQuestion('');
    setQaHistory(prev => [...prev, { q: userQ, a: '' }]);
    setIsAsking(true);
    try {
      const res = await fetch('/api/study-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression, question: userQ })
      });
      const data = await res.json();
      setQaHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].a = data.reply;
        return newHistory;
      });
    } catch (e) {
      setQaHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].a = 'حدث خطأ في الاتصال.';
        return newHistory;
      });
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F9FBFC] p-4 lg:p-8 overflow-y-auto overflow-x-hidden" dir="rtl">
      <header className="mb-6 shrink-0">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Sigma className="text-emerald-600" size={32} />
          دراسة ورسم الدوال
        </h1>
        <p className="text-slate-500 mt-2">لوحة مفاتيح مخصصة لكتابة الدوال، دراسة شاملة، ومساعد ذكي للإجابة عن أسئلتك.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Panel: Inputs and Keyboard */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calculator size={20} className="text-emerald-500" />
              إدخال الدالة
            </h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border-2 border-emerald-100 shadow-sm focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-50 transition-all">
                <label className="text-xl font-serif italic font-bold text-emerald-600 shrink-0">f(x) = </label>
                <input
                  type="text"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  className="w-full bg-transparent text-left text-xl font-mono text-slate-800 outline-none"
                  dir="ltr"
                  placeholder="x^2 - 4*x + 3"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center bg-white rounded-xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-50 transition-all shadow-sm overflow-hidden">
                  <label className="bg-slate-50 text-xs font-bold text-slate-600 px-3 py-3 border-l border-slate-200 whitespace-nowrap">
                    نقطة المماس <span className="font-serif italic ml-1 text-emerald-600">x₀</span>
                  </label>
                  <input
                    type="text"
                    value={pointX}
                    onChange={(e) => setPointX(e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-left font-mono text-slate-800 outline-none"
                    dir="ltr"
                    placeholder="مثال: 0"
                  />
                </div>
                
                <div className="flex-1 flex items-center bg-white rounded-xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-50 transition-all shadow-sm overflow-hidden">
                  <label className="bg-slate-50 text-xs font-bold text-slate-600 px-3 py-3 border-l border-slate-200 whitespace-nowrap">
                    الوسيط <span className="font-serif italic ml-1 text-emerald-600">m</span>
                  </label>
                  <input
                    type="text"
                    value={paramM}
                    onChange={(e) => setParamM(e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-left font-mono text-slate-800 outline-none"
                    dir="ltr"
                    placeholder="مثال: 1"
                  />
                </div>
              </div>

              <button
                onClick={handleStudy}
                disabled={isStudying || !expression}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 mt-2 shadow-md disabled:opacity-50"
              >
                {isStudying ? <Loader2 className="animate-spin" size={20} /> : <BookOpen size={20} />}
                دراسة الدالة بالتفصيل
              </button>
            </div>

            {/* Keyboard */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-400 mb-3">لوحة المفاتيح العلمية</h3>
              <div className="grid grid-cols-4 gap-2">
                {keyboardKeys.map((k, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (k.val === 'clear') setExpression('');
                      else insertChar(k.val);
                    }}
                    className={`${k.color} font-mono font-bold py-2 rounded-xl border hover:brightness-95 active:scale-95 transition-all`}
                    dir="ltr"
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Tabs for Graph, Study, QA */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          
          <div className="flex bg-slate-50 border-b border-slate-100 shrink-0">
            <button
              onClick={() => setActiveTab('graph')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'graph' ? 'text-emerald-600 bg-white border-b-2 border-emerald-500' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Activity size={18} /> رسم المنحنى
            </button>
            <button
              onClick={() => setActiveTab('study')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'study' ? 'text-blue-600 bg-white border-b-2 border-blue-500' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <BookOpen size={18} /> دراسة الدالة
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'qa' ? 'text-orange-600 bg-white border-b-2 border-orange-500' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <HelpCircle size={18} /> مساعد الدوال
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 relative">
            
            {/* Graph Tab */}
            {activeTab === 'graph' && (
              <div className="h-full min-h-[400px] flex flex-col">
                {error ? (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center m-auto">{error}</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} tickCount={21} stroke="#94a3b8" />
                      <YAxis type="number" domain={['auto', 'auto']} stroke="#94a3b8" />
                      <Tooltip 
                        formatter={(value: number) => [value.toFixed(2), 'f(x)']}
                        labelFormatter={(label) => `x = ${label}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <ReferenceLine x={0} stroke="#475569" strokeWidth={2} />
                      <ReferenceLine y={0} stroke="#475569" strokeWidth={2} />
                      <Line 
                        type="monotone" 
                        dataKey="y" 
                        stroke="#059669" 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 8, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* Study Tab */}
            {activeTab === 'study' && (
              <div className="h-full overflow-x-hidden min-w-0">
                {isStudying ? (
                  <div className="flex flex-col items-center justify-center h-full text-emerald-600 gap-4">
                    <Loader2 className="animate-spin" size={48} />
                    <p className="font-bold text-lg">جاري دراسة الدالة خطوة بخطوة...</p>
                  </div>
                ) : studyResult ? (
                  <MarkdownRenderer content={studyResult} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                    <BookOpen size={48} className="opacity-20" />
                    <p>اضغط على زر "دراسة الدالة بالتفصيل" لعرض جدول التغيرات والمشتقة.</p>
                  </div>
                )}
              </div>
            )}

            {/* Q&A Tab */}
            {activeTab === 'qa' && (
              <div className="flex flex-col h-full">
                <div className="bg-orange-50 text-orange-800 p-4 rounded-2xl text-sm mb-4 border border-orange-100 flex items-start gap-3">
                  <HelpCircle className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <strong>واش مفهمتش في الدالة؟</strong>
                    <p>سقسي على أي حاجة (كيفاش نحسب المشتقة، كيفاش ندرس الإشارة، كيفاش نلقى معادلة المماس...) وأستاذك راح يجاوبك.</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {qaHistory.length === 0 ? (
                    <div className="text-center text-slate-400 my-8">لا توجد أسئلة بعد.</div>
                  ) : (
                    qaHistory.map((qa, i) => (
                      <div key={i} className="space-y-3">
                        <div className="bg-slate-100 p-4 rounded-2xl rounded-tr-none max-w-[85%] self-end">
                          {qa.q}
                        </div>
                        {qa.a ? (
                          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl rounded-tl-none overflow-x-hidden min-w-0">
                            <MarkdownRenderer content={qa.a} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-blue-600 text-sm">
                            <Loader2 className="animate-spin" size={16} /> أستاذك يكتب...
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAsk} className="flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="اكتب سؤالك هنا..."
                    className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !question.trim()}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white p-3 rounded-xl transition-colors flex items-center justify-center shrink-0"
                  >
                    <Send size={20} className="rotate-180" />
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
