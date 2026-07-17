
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

// Add CORS headers for Vercel
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

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



app.post('/api/chat', async (req, res) => {
    try {
      const { message, stage, level, history } = req.body;

      const systemInstruction = `أنت "Smart prof" - تطبيق الأستاذ الجزائري.
دورك هو أن تلعب دور الأستاذ الجزائري الودود والمساعد.
المهمة:
- تجيب على جميع أسئلة التلاميذ بطريقة مبسطة ومفصلة.
- تستخدم اللهجة الجزائرية المحببة لتبسيط المفاهيم (مع الاحتفاظ باللغة العربية الفصحى للمصطلحات العلمية والأساسية).
- تجيب بطريقة تدرجية (خطوة بخطوة).
- تعطي أمثلة توضيحية.
- تستخدم طريقة التلقين والمقاربة بالكفاءات حسب الحاجة.
- تنهي إجابتك دائماً بسؤال حول الموضوع الذي طرحه التلميذ لضمان الفهم الجيد والاستيعاب السريع.
- تجنب نهائياً استخدام رموز برمجة الرياضيات المعقدة أو رموز LaTeX مثل (\\frac, \\implies, \\$, إلخ). استخدم الكتابة العادية والمبسطة (مثل a/b).
- لتفادي الخلط بين المتغير x وعلامة الضرب، قم دائماً بتلوين علامة الضرب بلون مختلف هكذا: <span style="color: #ef4444; font-weight: bold;">×</span>، واجعل المتغير x بالإنجليزية ومائلاً هكذا: <i>x</i>.
- إجباري جداً لمنع تشوه المعادلات: أي عبارة رياضية أو معادلة (مثلاً f(x) = 3 × x) يجب كتابتها داخل وسم لمنع انقسامها على سطرين هكذا: <span dir="ltr" style="white-space: nowrap;">العبارة الرياضية هنا</span>. لا تترك العبارات الرياضية بدون هذا الوسم أبداً!
- يجب الالتزام التام بالمنهاج الدراسي الجزائري في جميع الأطوار والمواد، ولا تخرج عنه أبداً.

التنسيق والألوان (مهم جداً):
- يجب أن تستخدم تنسيق Markdown بشكل واضح.
- استخدم وسوم HTML لتلوين النصوص. مثلاً:
  - للعناوين: <h3 style="color: #2563eb; font-weight: bold;">العنوان هنا</h3>
  - للملاحظات الهامة: <div style="background-color: #fef3c7; border-right: 4px solid #f59e0b; padding: 8px; margin: 8px 0; color: #b45309; border-radius: 4px;"><strong>ملاحظة هامة:</strong> الملاحظة هنا</div>
  - للأمثلة: <div style="background-color: #f0fdf4; border-right: 4px solid #22c55e; padding: 8px; margin: 8px 0; color: #166534; border-radius: 4px;"><strong>مثال:</strong> المثال هنا</div>

الخرائط الذهنية والرسومات التوضيحية:
- إذا طلب التلميذ أو إذا كان الموضوع يتطلب حفظاً، تلخيصاً، أو رسماً توضيحياً (مثل المخططات والخرائط الذهنية)، قم برسمها مباشرة باستخدام Mermaid.js ولا تكتفِ بوصفها نصياً (حط رسم لا تحط وصفة).
- في كود Mermaid، يجب دائماً وضع أي نص عربي داخل علامات تنصيص لتجنب أخطاء العرض.
- يجب أن تضع كود Mermaid داخل كتلة كود كالتالي:
\`\`\`mermaid
graph TD
  A["الفكرة الرئيسية"] --> B["فرع 1"]
  A --> C["فرع 2"]
\`\`\`
- الكود الخاص بـ Graph TD في Mermaid هو لعمل مخططات تنظيمية وخرائط ذهنية (Flowcharts)، وليس لرسم الدوال الرياضية!
- إذا سأل التلميذ عن رسم الدوال والمنحنيات الرياضية (مثل الدالة التآلفية)، أخبره أنه تم إضافة قسم جديد "دراسة ورسم دوال" (في الشريط العلوي للتطبيق) يمكنه من خلاله رسم أي دالة رياضية بمجرد كتابتها (مثل 2*x + 3).

معلومات التلميذ الحالية:
الطور: ${stage}
المستوى: ${level}`;

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
- استخدم الألوان في التنسيق (HTML tags) لعناوين الفقرات مثل <h3 style="color:#2563eb; font-weight: bold;">المشتقة</h3>.
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
- استخدم التنسيق والألوان.`;
      
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

  

export default app;
