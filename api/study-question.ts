
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
    keys.map(k => k.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\s"']/g, '')).filter(k => k.length > 0)
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
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

    try {
      const { expression, question } = req.body;

      const systemInstruction = `أنت أستاذ جزائري خبير في الرياضيات (Smart prof).
المهمة: الإجابة على أسئلة التلميذ حول الدوال الرياضية وصعوباتها (مثل كيفية إيجاد العدد المشتق، دراسة الإشارة، المناقشة الوسيطية، إلخ).
- اشرح بلهجة جزائرية مبسطة جداً، خطوة بخطوة.
- قدم أمثلة إن لزم الأمر.
- لتفادي الخلط بين المتغير x وعلامة الضرب، قم دائماً بتلوين علامة الضرب هكذا: <span style="color: #ef4444; font-weight: bold;">×</span>، واجعل المتغير x مائلاً: <i>x</i>.
- إجباري جداً جداً لمنع تشوه المعادلات: أي عبارة رياضية أو معادلة (مثلاً f(x) = 3 × x) يجب كتابتها داخل وسم لمنع انقسامها على سطرين هكذا: <span dir="ltr" style="white-space: nowrap; display: inline-block; font-family: sans-serif; margin: 0 4px;">العبارة الرياضية هنا</span>. لا تترك العبارات الرياضية بدون هذا الوسم أبداً!
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
  }
