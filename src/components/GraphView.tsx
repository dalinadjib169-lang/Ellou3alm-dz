import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import * as math from 'mathjs';
import { Calculator, Activity, HelpCircle, Send, Loader2, BookOpen, Trash2, Delete } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

export function GraphView() {
  const [expression, setExpression] = useState('x^2 - 4*x + 3');
  const [paramM, setParamM] = useState('1');
  const [error, setError] = useState('');
  
  const [studyResult, setStudyResult] = useState('');
  const [isStudying, setIsStudying] = useState(false);
  
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<{q: string, a: string}[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  
  const studyEndRef = useRef<HTMLDivElement>(null);
  const qaEndRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    try {
      const scope: Record<string, number> = { m: parseFloat(paramM) || 0 };
      const compiled = math.compile(expression);
      const points = [];
      for (let x = -15; x <= 15; x += 0.1) {
        scope.x = x;
        let y = compiled.evaluate(scope);
        if (Math.abs(y) > 50) y = null; 
        points.push({ x: Number(x.toFixed(2)), y });
      }
      setError('');
      return points;
    } catch (err: any) {
      setError('دالة غير صالحة. يرجى التحقق من العبارة الرياضية.');
      return [];
    }
  }, [expression, paramM]);

  const insertChar = (char: string) => {
    setExpression(prev => prev + char);
  };
  
  const deleteChar = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  const handleStudy = async () => {
    if (!expression) return;
    setIsStudying(true);
    setStudyResult('');
    
    try {
      const res = await fetch('/api/study-function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression, mValue: paramM })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setStudyResult(data.reply || "لم يتم تلقي إجابة.");
    } catch (e: any) {
      console.error(e);
      setStudyResult("حدث خطأ أثناء دراسة الدالة: " + e.message);
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
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      
      setQaHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].a = data.reply;
        return newHistory;
      });
    } catch (e: any) {
      console.error(e);
      setQaHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].a = "حدث خطأ: " + e.message;
        return newHistory;
      });
    } finally {
      setIsAsking(false);
    }
  };

  // Scroll to new QA answers
  useEffect(() => {
    if (qaHistory.length > 0 && qaHistory[qaHistory.length - 1].q) {
      qaEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [qaHistory.length]);
  
  // Scroll to study result when done
  useEffect(() => {
    if (studyResult && !isStudying) {
      studyEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [studyResult, isStudying]);

  const calcKeys = [
    ['x', 'm', '(', ')'],
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', '.', '^', '+']
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Activity className="text-blue-600" size={32} />
            دراسة ورسم دوال
          </h1>
          <p className="text-slate-500 mt-2">قم بإدخال الدالة الرياضية لرسمها ودراستها بالتفصيل خطوة بخطوة.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input and Keyboard */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h2 className="font-bold text-slate-700 flex items-center gap-2">
                  <Calculator className="text-emerald-500" size={20} />
                  عبارة الدالة
                </h2>
                <button 
                  onClick={() => setExpression('')}
                  className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                  title="مسح الكل"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="relative mb-6">
                  <input
                    type="text"
                    value={expression}
                    onChange={(e) => setExpression(e.target.value)}
                    dir="ltr"
                    className="w-full bg-slate-100 border-2 border-transparent focus:border-blue-500 rounded-2xl px-4 py-4 text-left text-2xl font-mono text-slate-800 outline-none transition-colors"
                    placeholder="f(x) ="
                  />
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 font-bold select-none" dir="ltr">
                    = (x)f
                  </div>
                </div>

                {expression.includes('m') && (
                  <div className="mb-6 flex items-center gap-4 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <label className="text-orange-800 font-bold whitespace-nowrap">الوسيط m =</label>
                    <input
                      type="number"
                      value={paramM}
                      onChange={(e) => setParamM(e.target.value)}
                      className="w-24 bg-white border border-orange-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-orange-500"
                      dir="ltr"
                    />
                  </div>
                )}

                {/* Keyboard Grid */}
                <div className="grid gap-2">
                  {calcKeys.map((row, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2">
                      {row.map(key => (
                        <button
                          key={key}
                          onClick={() => insertChar(key)}
                          className={`py-3 text-lg font-bold rounded-xl transition-all active:scale-95 ${
                            ['x', 'm'].includes(key) ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' :
                            ['/', '*', '-', '+', '^', '(', ')'].includes(key) ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' :
                            'bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100'
                          }`}
                          dir="ltr"
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      onClick={deleteChar}
                      className="py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-all flex items-center justify-center"
                    >
                      <Delete size={20} />
                    </button>
                    <button 
                      onClick={() => setExpression('x^2 - 4*x + 3')}
                      className="py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
                    >
                      دالة تجريبية
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleStudy}
                  disabled={isStudying || !expression}
                  className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
                >
                  {isStudying ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      جاري دراسة الدالة...
                    </>
                  ) : (
                    <>
                      <BookOpen size={24} />
                      دراسة الدالة بالتفصيل
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Graph and Results */}
          <div className="lg:col-span-7 space-y-6">
            {/* Graph Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 md:p-6">
              <h2 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
                <Activity className="text-blue-500" size={20} />
                التمثيل البياني
              </h2>
              <div className="h-[300px] md:h-[400px] border border-slate-200 rounded-2xl bg-slate-50 p-2 md:p-4">
                {error ? (
                  <div className="h-full flex items-center justify-center text-red-500 font-bold bg-red-50 rounded-xl">
                    {error}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                      <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} tickCount={11} stroke="#64748b" />
                      <YAxis type="number" domain={[-15, 15]} allowDataOverflow stroke="#64748b" />
                      <Tooltip 
                        formatter={(value: any) => [Number(value).toFixed(2), 'f(x)']}
                        labelFormatter={(label) => `x = ${label}`}
                      />
                      <ReferenceLine x={0} stroke="#334155" strokeWidth={2} />
                      <ReferenceLine y={0} stroke="#334155" strokeWidth={2} />
                      <Line 
                        type="monotone" 
                        dataKey="y" 
                        stroke="#2563eb" 
                        strokeWidth={3} 
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Study Result Card */}
            {(studyResult || isStudying) && (
              <div ref={studyEndRef} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-emerald-50">
                  <h2 className="font-bold text-emerald-800 flex items-center gap-2">
                    <BookOpen className="text-emerald-600" size={20} />
                    نتيجة الدراسة
                  </h2>
                </div>
                <div className="p-6">
                  {isStudying ? (
                    <div className="flex flex-col items-center justify-center py-12 text-emerald-600 space-y-4">
                      <Loader2 className="animate-spin" size={48} />
                      <p className="font-bold">أستاذك يقوم الآن بحساب النهايات والمشتقة...</p>
                    </div>
                  ) : (
                    <div className="prose prose-slate max-w-none prose-headings:text-emerald-700">
                      <MarkdownRenderer content={studyResult} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Q&A Section */}
            {studyResult && !isStudying && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
                <div className="p-6 border-b border-slate-100 bg-orange-50 shrink-0">
                  <h2 className="font-bold text-orange-800 flex items-center gap-2">
                    <HelpCircle className="text-orange-600" size={20} />
                    اسأل الأستاذ عن الدالة
                  </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                  <div className="bg-orange-100 text-orange-800 p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] self-end">
                    هل يوجد شيء لم تفهمه في دراسة هذه الدالة؟ تفضل بسؤالي!
                  </div>
                  
                  {qaHistory.map((qa, i) => (
                    <React.Fragment key={i}>
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none max-w-[85%] self-start shadow-sm ml-auto text-slate-800">
                        {qa.q}
                      </div>
                      {qa.a ? (
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl rounded-tr-none max-w-[95%] shadow-sm overflow-x-hidden">
                          <MarkdownRenderer content={qa.a} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-blue-600 text-sm max-w-[85%] bg-blue-50 p-4 rounded-2xl rounded-tr-none">
                          <Loader2 className="animate-spin" size={16} /> أستاذك يكتب...
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                  <div ref={qaEndRef} />
                </div>

                <form onSubmit={handleAsk} className="p-4 bg-white border-t border-slate-100 shrink-0 flex gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="اكتب سؤالك هنا..."
                    className="flex-1 bg-slate-100 border-2 border-transparent focus:border-orange-500 rounded-xl px-4 py-3 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !question.trim()}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white p-3 rounded-xl transition-colors shadow-sm"
                  >
                    <Send size={24} className="rotate-180" />
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
