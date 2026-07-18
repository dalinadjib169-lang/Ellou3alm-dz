const fs = require('fs');
let code = fs.readFileSync('src/components/StudentView.tsx', 'utf-8');

// Add language state
code = code.replace(
  `const [level, setLevel] = useState('السنة الرابعة');`,
  `const [level, setLevel] = useState('السنة الرابعة');\n  const [language, setLanguage] = useState<'AR' | 'FR' | 'EN'>('AR');`
);

const nextLangFunc = `
  const nextLanguage = () => {
    if (language === 'AR') setLanguage('FR');
    else if (language === 'FR') setLanguage('EN');
    else setLanguage('AR');
  };
`;
code = code.replace(`const scrollToBottom = () => {`, nextLangFunc + `\n  const scrollToBottom = () => {`);

// Main container neon border
code = code.replace(
  `<div className="flex flex-col h-full bg-[#F9FBFC] dark:bg-slate-950 text-[#1A1A1A] dark:text-slate-100 font-sans text-right overflow-x-hidden transition-colors duration-300" dir="rtl">`,
  `<div className="flex flex-col h-full bg-[#F9FBFC] dark:bg-slate-950 text-[#1A1A1A] dark:text-slate-100 font-sans text-right overflow-x-hidden transition-colors duration-300 border-4 border-emerald-400 shadow-[inset_0_0_20px_rgba(52,211,153,0.5),0_0_20px_rgba(52,211,153,0.5)]" dir="rtl">
      {/* Marquee Header */}
      <div className="w-full bg-slate-950 text-emerald-400 overflow-hidden whitespace-nowrap py-2 text-sm font-bold border-b border-emerald-900 relative">
        <div className="animate-marquee inline-block">
           سبحان الله وبحمده، سبحان الله العظيم • اللهم صل وسلم وبارك على نبينا محمد • لا حول ولا قوة إلا بالله • استغفر الله العظيم وأتوب إليه • 
        </div>
      </div>`
);

// Header with shine and background
code = code.replace(
  `<header className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-8 shrink-0 gap-4">`,
  `<header className="relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-8 shrink-0 gap-4 bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-md border-b border-emerald-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] animate-shine" />`
);

// Smart Teach gold text
code = code.replace(
  `<h1 className="text-4xl font-serif font-black italic text-slate-900 dark:text-white">Smart Prof <span className="text-emerald-600">.</span></h1>`,
  `<h1 className="text-4xl font-serif font-black italic text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] z-10 relative">Smart Teach <span className="text-white">.</span></h1>`
);

// Language button
code = code.replace(
  `<div className="flex items-center gap-4">`,
  `<div className="flex items-center gap-4 z-10 relative">`
);

code = code.replace(
  `{isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>`,
  `{isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={nextLanguage}
            className="px-3 py-1 ml-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors font-bold text-sm"
            title="تغيير اللغة"
          >
            {language}
          </button>`
);

// Select elements wrappers
code = code.replace(
  `<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">`,
  `<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto z-10 relative">`
);

code = code.replace(
  `<div className="relative w-full sm:w-auto">
              <select 
                value={stage}`,
  `<div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">اختار الطور:</span>
              <div className="relative w-full sm:w-auto flex-1">
                <select 
                  value={stage}`
);

code = code.replace(
  `</select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200 pointer-events-none" size={16} />
            </div>
            <div className="relative w-full sm:w-auto">
              <select 
                value={level}`,
  `</select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200 pointer-events-none" size={16} />
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">اختار المستوى:</span>
              <div className="relative w-full sm:w-auto flex-1">
                <select 
                  value={level}`
);

code = code.replace(
  `</select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
            </div>`,
  `</select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
              </div>
            </div>`
);


fs.writeFileSync('src/components/StudentView.tsx', code);
console.log('patched');
