import fs from 'fs';
let code = fs.readFileSync('src/components/StudentView.tsx', 'utf8');
code = code.replace(
`      <header className="flex justify-between items-center p-8 shrink-0">
        <div>
          <h1 className="text-4xl font-serif font-black italic text-slate-900">Smart Prof <span className="text-emerald-600">.</span></h1>
          <p className="text-slate-500">التعلم بالمقاربة بالكفاءات - شرح مبسط بالدّارجة</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right ml-4">
            <div className="text-xs text-slate-400 uppercase">الحالة</div>
            <div className="flex items-center gap-2 font-bold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> أستاذك راه واجد
            </div>
          </div>
          <div className="flex gap-2">`,
`      <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-8 shrink-0 gap-4">
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
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">`
);
fs.writeFileSync('src/components/StudentView.tsx', code);
