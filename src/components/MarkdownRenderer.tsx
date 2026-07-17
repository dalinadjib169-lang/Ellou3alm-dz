import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';
import { Volume2, VolumeX, Download } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

const MermaidDiagram = ({ chart }: { chart: string }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
    
    // Clean up chart text to avoid parsing errors
    const cleanChart = chart.replace(/^mermaid\n/, '').trim();
    
    mermaid.render(id, cleanChart)
      .then(({ svg }) => {
        setSvgContent(svg);
        setHasError(false);
      })
      .catch((e) => {
        console.error('Mermaid render error:', e);
        setHasError(true);
      });
  }, [chart]);

  if (hasError) {
    return (
      <div className="my-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm text-right">
        عذراً، لم نتمكن من رسم الخريطة الذهنية بشكل صحيح.
        <pre className="mt-2 text-left text-xs text-slate-500 overflow-x-auto bg-white p-2 rounded" dir="ltr">{chart}</pre>
      </div>
    );
  }

  const handleDownload = () => {
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
  );
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const synth = window.speechSynthesis;

  const handleSpeech = () => {
    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
      return;
    }

    // Strip out HTML tags and markdown formatting for speech
    const plainText = content
      .replace(/<[^>]*>?/gm, '') // Remove HTML tags
      .replace(/```mermaid[\\s\\S]*?```/gm, '') // Remove mermaid blocks
      .replace(/[#*`_]/g, ''); // Remove basic markdown symbols

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = 'ar-SA'; // Arabic
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    synth.speak(utterance);
    setIsPlaying(true);
  };

  useEffect(() => {
    return () => {
      synth.cancel(); // Stop on unmount
    };
  }, []);

  return (
    <div className="relative markdown-body bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 w-full font-sans leading-loose text-right text-lg" dir="rtl">
      <div className="absolute top-0 right-0 p-4">
        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase">شرح مفصل</span>
      </div>
      
      <button
        onClick={handleSpeech}
        className="absolute top-4 left-4 p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"
        title="استمع للإجابة"
      >
        {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      <div className="mt-4">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\\w+)/.exec(className || '');
              const isMermaid = match && match[1] === 'mermaid';

              if (!inline && isMermaid) {
                return <MermaidDiagram chart={String(children)} />;
              }
              return !inline ? (
                <pre className="bg-slate-50 p-4 rounded-xl overflow-x-auto text-left border border-slate-100" dir="ltr">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="bg-slate-100 px-2 py-1 rounded-md text-emerald-600 font-mono text-sm border border-slate-200" {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
