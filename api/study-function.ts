
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
- إجباري جداً جداً لمنع تشوه المعادلات: أي عبارة رياضية أو معادلة (مثلاً f(x) = 3 × x) يجب كتابتها داخل وسم لمنع انقسامها على سطرين هكذا: <span dir="ltr" style="white-space: nowrap; display: inline-block; font-family: sans-serif; margin: 0 4px;">العبارة الرياضية هنا</span>. لا تترك العبارات الرياضية بدون هذا الوسم أبداً!
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
  }