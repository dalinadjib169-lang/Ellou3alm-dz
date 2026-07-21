import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Volume2, VolumeX } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const synth = window.speechSynthesis;

  const handleSpeech = () => {
    if (!synth) return;
    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
      return;
    }

    // Strip out HTML tags and markdown formatting for speech
    const plainText = content
      .replace(/<[^>]*>?/gm, '') // Remove HTML tags
      .replace(/[#*`_]/g, ''); // Remove basic markdown symbols

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = 'ar-SA'; // Arabic
    
    // Try to find a male Arabic voice, or just a clear voice
    const voices = synth.getVoices();
    const arabicVoices = voices.filter(v => v.lang.startsWith('ar'));
    if (arabicVoices.length > 0) {
      // Some platforms have 'Male' in the name, or we just pick the first which is usually default.
      // Often Google Arabic is a female voice, but we can't perfectly control gender in all browsers.
      // We will tweak pitch and rate to sound more confident and clear.
      utterance.voice = arabicVoices.find(v => v.name.toLowerCase().includes('male')) || arabicVoices[0];
    }
    
    utterance.pitch = 0.8; // slightly lower pitch for a more masculine/confident tone
    utterance.rate = 0.9;  // slightly slower for clarity
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    synth.speak(utterance);
    setIsPlaying(true);
  };

  useEffect(() => {
    return () => {
      if (synth) synth.cancel(); // Stop on unmount
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
              return !inline ? (
                <pre className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl overflow-x-auto text-left border border-slate-100 dark:border-slate-700" dir="ltr">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-emerald-600 dark:text-emerald-400 font-mono text-sm border border-slate-200 dark:border-slate-700" {...props}>
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
