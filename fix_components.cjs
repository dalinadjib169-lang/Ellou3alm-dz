const fs = require('fs');

let markdown = fs.readFileSync('src/components/MarkdownRenderer.tsx', 'utf8');

if (!markdown.includes("Download")) {
  markdown = markdown.replace(
    "import { Volume2, VolumeX } from 'lucide-react';",
    "import { Volume2, VolumeX, Download } from 'lucide-react';"
  );
}

const originalMermaidReturn = `  return (
    <div className="flex justify-center my-6 overflow-x-auto bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 shadow-sm relative">
      <span className="absolute top-2 right-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">خريطة ذهنية</span>
      {svgContent ? (
        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
      ) : (
        <div className="text-slate-400 text-sm">جاري رسم الخريطة...</div>
      )}
    </div>
  );`;

const newMermaidReturn = `  const handleDownload = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mindmap.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col my-6 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-sm relative">
      <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">خريطة ذهنية</span>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-3 py-1 rounded-full transition-colors"
        >
          <Download size={14} />
          تنزيل الخريطة
        </button>
      </div>
      <div className="p-6 overflow-x-auto flex justify-center">
        {svgContent ? (
          <div dangerouslySetInnerHTML={{ __html: svgContent }} className="dark:invert dark:hue-rotate-180" />
        ) : (
          <div className="text-slate-400 text-sm">جاري رسم الخريطة...</div>
        )}
      </div>
    </div>
  );`;

markdown = markdown.replace(originalMermaidReturn, newMermaidReturn);

// update Markdown renderer styles for dark mode
markdown = markdown.replace(
  'className="relative markdown-body bg-white text-slate-700 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 w-full font-sans leading-loose text-right text-lg"',
  'className="relative markdown-body bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 w-full font-sans leading-loose text-right text-lg"'
);

markdown = markdown.replace(
  'className="bg-orange-100 text-orange-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase"',
  'className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase"'
);

markdown = markdown.replace(
  'className="absolute top-4 left-4 p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors z-10"',
  'className="absolute top-4 left-4 p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"'
);

fs.writeFileSync('src/components/MarkdownRenderer.tsx', markdown);
