
import { GoogleGenAI } from '@google/genai';

let currentKeyIndex = 0;
function getNextApiKey() {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEYS) {
    keys.push(...process.env.GEMINI_API_KEYS.split(','));
  }
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('GEMINI_API_KEY') && value) {
      keys.push(...value.split(','));
    }
  }
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

export default async function handler(req: any, res: any) {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      } else if (Buffer.isBuffer(body)) {
        body = JSON.parse(body.toString());
      }
      const { message, stage, level, history } = body;

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
- إجباري جداً جداً لمنع تشوه المعادلات: أي عبارة رياضية أو معادلة (مثلاً f(x) = 3 × x) يجب كتابتها داخل وسم لمنع انقسامها على سطرين هكذا: <span dir="ltr" style="white-space: nowrap; display: inline-block; font-family: sans-serif; margin: 0 4px;">العبارة الرياضية هنا</span>. لا تترك العبارات الرياضية بدون هذا الوسم أبداً!
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
  }