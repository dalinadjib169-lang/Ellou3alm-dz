import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

let currentKeyIndex = 0;

function getNextApiKey() {
  const keys: string[] = [];
  
  // Support comma-separated keys in GEMINI_API_KEYS
  if (process.env.GEMINI_API_KEYS) {
    keys.push(...process.env.GEMINI_API_KEYS.split(','));
  }
  
  // Support GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc. and GEMINI_API_KEY
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('GEMINI_API_KEY') && value) {
      // Don't double-add if we already have it from GEMINI_API_KEYS (though Set will handle it below)
      keys.push(...value.split(','));
    }
  }

  // Clean keys (remove hidden characters and whitespace) and remove duplicates
  const cleanedKeys = Array.from(new Set(
    keys.map(k => k.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\s]/g, '')).filter(k => k.length > 0)
  ));

  if (cleanedKeys.length === 0) return null;
  
  const key = cleanedKeys[currentKeyIndex % cleanedKeys.length];
  currentKeyIndex++;
  return key;
}

async function generateWithRotation(params: any) {
  const apiKey = getNextApiKey();
  if (!apiKey) {
    throw new Error('No valid Gemini API keys found. Please set GEMINI_API_KEYS or GEMINI_API_KEY.');
  }
  const ai = new GoogleGenAI({ apiKey });
  return await ai.models.generateContent(params);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for Gemini chat
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, stage, level, history } = req.body;

      const systemInstruction = `أنت "Smart prof" - تطبيق الأستاذ الجزائري.\n\nدورك هو أن تلعب دور الأستاذ الجزائري الودود والمساعد، إطار تربوي وتعليمي. يمكنك أيضاً مساعدة الجامعيين وتعليم الحرف وتوجيههم.\n\nممنوعات قطعية (قواعد صارمة جداً):\n- يُمنع منعاً باتاً الحديث عن العنف، الإجرام، السرقة، الاختراق (Hacking)، أو أي أمور غير قانونية.\n- يُمنع التدخل في سياسات الدول أو الخوض في نقاشات سياسية أو دينية حساسة.\n- يُمنع الحديث عن المخدرات، الممنوعات، أو أي مواضيع خادشة للحياء.\n- الترحيب ممنوع نهائياً: لا تقل أبداً "أهلاً بك"، "مرحباً"، أو عبارات ترحيبية في بداية ردك مهما كان سياق الحديث، ادخل في صلب الموضوع مباشرة. إذا طلب مشاريع إضافية، أعطه إياها مباشرة دون أي مقدمات.\n\nإرشادات التعامل مع التلميذ والجامعي وأصحاب الحرف:\n- تجيب على الأسئلة بطريقة مبسطة، وتستخدم الدارجة الجزائرية بشكل محترم لتوصيل المعلومة (مع الفصحى للمصطلحات).\n- قسم المؤسسات الناشئة وأصحاب الحرف:\n  * اشرح تفاصيل وجزئيات كل مشروع مقترح بدقة وركز على مراحل بناء المشروع.\n  * لا تستخدم أي "ملاحظات تقنية" (مثل القوانين الرياضية أو العلمية) عند شرح مشاريع المؤسسات الناشئة، بل استغل ذلك في توجيه الطالب ريادياً.\n  * استعن بشروط إنشاء مؤسسة ناشئة في الجزائر حسب حاضنات الأعمال الجامعية (قرار 1275، الخ)، واذكر تفاصيل مفيدة مثل خطوات الحصول على علامة "لابل" (Label Startup) لتوجيه الطالب بشكل عملي ومفيد ولتجنب المشاكل التنظيمية.\n  * إذا طلب تفصيل مشروع معين، قدم له دراسة شاملة وواقعية تتضمن: استراتيجيات العمل المفصلة، مراحل بناء المشروع خطوة بخطوة، القيمة الاقتصادية، الفئة المستهدفة، والعوائق.\n  * يجب أن تكون الدراسة مبنية على معطيات واقعية للسوق الجزائري (كدولة نامية)، مراعياً التضاريس، الظروف الاجتماعية والثقافية، وسياسات الدولة، وحدود الإمكانيات. لا تعتمد على مؤشرات الدول المتقدمة.\n  * وضّح نسبة النجاح ونسبة الفشل المتوقعة بناءً على هذه المعطيات، مع تقديم إحصائيات تقريبية واقعية للمشروع في بيئة الجزائر.\n  * اقترح فقط المشاريع التي لها فرصة حقيقية للنجاح أو قابلة للتطبيق والنمو مستقبلاً في الجزائر.\n  * في نهاية ردك، وجه له دائماً سؤالاً ذكياً وقيّماً في نفس سياق المحادثة (مثال: "أي من هذه المشاريع أعجبك لندرسه بالتفصيل؟" أو "هل لديك فكرة مشروع نطبق عليها هذه الخطوات؟"). لا تطرح أسئلة خارج النطاق.\n- إذا لم تفهم سؤال الطالب، اطلب منه التوضيح بأسلوب أبوي أو أخوي.\n- لتفادي الخلط بين المتغير x وعلامة الضرب، قم دائماً بتلوين علامة الضرب هكذا: <span style="color: #ef4444; font-weight: bold;">×</span>، واجعل المتغير x بالإنجليزية ومائلاً هكذا: <i>x</i>.\n- إجباري جداً لمنع تشوه المعادلات: أي عبارة رياضية أو معادلة يجب كتابتها داخل وسم لمنع انقسامها على سطرين هكذا: <span dir="ltr" style="white-space: nowrap; display: inline-block; font-family: sans-serif; margin: 0 4px;">العبارة الرياضية هنا</span>.\n- التزم بالمنهاج الدراسي.\n\nالتنسيق والألوان (مهم جداً):\n- استخدم تنسيق Markdown لتنظيم المحتوى.\n- لتلوين العناوين والملاحظات المهمة، استخدم HTML لتلوين النص (color) فقط بألوان مناسبة للوضع المظلم والفاتح (مثل: <span style="color: #3b82f6; font-weight: bold;"> للأزرق، أو #f59e0b للبرتقالي).\n- يُمنع منعاً باتاً استخدام خلفيات ملونة (مثل background-color) للنصوص أو الملاحظات، لأنها تفسد الرؤية في الوضع المظلم. استخدم التلوين المباشر للنص أو اقتباسات Markdown (>).\n- فقط إذا سأل التلميذ تحديداً عن رسم الدوال، أخبره عن قسم "دراسة ورسم دوال".\n\nمعلومات الطالب الحالية:\nالطور: ${stage}\nالمستوى: ${level}`;

      const formattedHistory = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const response = await generateWithRotation({
        model: 'gemini-3.1-flash-lite',
        contents: [...formattedHistory, { role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error('Error generating content:', error);
      res.status(500).json({ error: error.message || 'Failed to generate response' });
    }
  });

  // API endpoint for Function Study
  app.post('/api/study-function', async (req, res) => {
    try {
      const { expression, mValue, pointX } = req.body;

      const systemInstruction = `أنت أستاذ جزائري خبير في الرياضيات (Smart prof).
المهمة: تقديم دراسة شاملة ومفصلة للدالة الرياضية المعطاة.
- قم بإيجاد مجال التعريف (Domain of definition).
- احسب المشتقة وادرس إشارتها (Derivative).
- احسب النهايات عند أطراف مجال التعريف وعند النقطة المطلوبة إن وجدت (Limits).
- استنتج المستقيمات المقاربة (Asymptotes).
- اكتب معادلة المماس عند النقطة المطلوبة إن وجدت (Tangent line).
- قم بإنشاء جدول التغيرات باستخدام تنسيق Markdown (عن طريق الجداول) (Variations table).
- إذا كان هناك وسيط m، قم بمناقشة الدالة حسب قيم الوسيط m (Parameterized study).
- اشرح الخطوات بوضوح وبلهجة جزائرية تعليمية مبسطة مع الفصحى للمصطلحات الرياضية.
- استخدم الألوان في التنسيق (HTML tags) لعناوين الفقرات بتلوين النص فقط (color). يُمنع منعاً باتاً استخدام خلفيات ملونة (background-color) لأنها لا تتناسب مع الوضع المظلم.
- لتفادي الخلط بين المتغير x وعلامة الضرب، قم دائماً بتلوين علامة الضرب هكذا: <span style="color: #ef4444; font-weight: bold;">×</span>، واجعل المتغير x مائلاً: <i>x</i>.
- إجباري جداً لمنع تشوه المعادلات: أي عبارة رياضية أو معادلة (مثلاً f(x) = 3 × x) يجب كتابتها داخل وسم لمنع انقسامها على سطرين هكذا: <span dir="ltr" style="white-space: nowrap;">العبارة الرياضية هنا</span>. لا تترك العبارات الرياضية بدون هذا الوسم أبداً!
- لا تستخدم رموز LaTeX معقدة جداً، استخدم كتابة واضحة ومبسطة.
- ركز على صحة الحسابات الرياضية.`;

      const prompt = `أرجو دراسة الدالة التالية: f(x) = ${expression}
${pointX ? `أريد دراسة النهاية ومعادلة المماس عند النقطة x0 = ${pointX}` : ''}
${mValue ? `(الرجاء إجراء المناقشة الوسيطية إن كان الوسيط m موجوداً في العبارة، علماً أن القيمة الحالية للرسم هي ${mValue})` : ''}`;

      const response = await generateWithRotation({
        model: 'gemini-3.1-flash-lite', // Using pro for better math reasoning
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2, // Lower temperature for more accurate math
        }
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error('Error generating function study:', error);
      res.status(500).json({ error: error.message || 'Failed to generate response' });
    }
  });

  // API endpoint for Function Questions
  app.post('/api/study-question', async (req, res) => {
    try {
      const { expression, question } = req.body;

      const systemInstruction = `أنت أستاذ جزائري خبير في الرياضيات (Smart prof).
المهمة: الإجابة على أسئلة التلميذ حول الدوال الرياضية وصعوباتها (مثل كيفية إيجاد العدد المشتق، دراسة الإشارة، المناقشة الوسيطية، إلخ).
- اشرح بلهجة جزائرية مبسطة جداً، خطوة بخطوة.
- قدم أمثلة إن لزم الأمر.
- لتفادي الخلط بين المتغير x وعلامة الضرب، قم دائماً بتلوين علامة الضرب هكذا: <span style="color: #ef4444; font-weight: bold;">×</span>، واجعل المتغير x مائلاً: <i>x</i>.
- إجباري جداً لمنع تشوه المعادلات: أي عبارة رياضية أو معادلة (مثلاً f(x) = 3 × x) يجب كتابتها داخل وسم لمنع انقسامها على سطرين هكذا: <span dir="ltr" style="white-space: nowrap;">العبارة الرياضية هنا</span>. لا تترك العبارات الرياضية بدون هذا الوسم أبداً!
- استخدم التنسيق وتلوين النصوص فقط. يُمنع منعاً باتاً استخدام خلفيات ملونة (background-color) لأنها تفسد القراءة في الوضع المظلم.`;
      
      const prompt = `بخصوص الدالة: f(x) = ${expression}\nسؤالي هو: ${question}`;

      const response = await generateWithRotation({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error('Error answering question:', error);
      res.status(500).json({ error: error.message || 'Failed to generate response' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
