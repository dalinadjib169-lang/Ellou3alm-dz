const fs = require('fs');

const apiIndex = fs.readFileSync('api/index.ts', 'utf8');
const topCode = apiIndex.substring(0, apiIndex.indexOf("app.post('/api/chat'"));

const createEndpoint = (filename, endpointString, endIndexString) => {
  let startIndex = apiIndex.indexOf(endpointString);
  let endIndex = endIndexString ? apiIndex.indexOf(endIndexString, startIndex) : apiIndex.indexOf('export default app;');
  let routeCode = apiIndex.substring(startIndex, endIndex).trim();
  
  // Replace app.post with export default async function(req, res)
  routeCode = routeCode.replace(/app\.post\('[^']+', async \(req, res\) => \{/, 'export default async function handler(req: any, res: any) {');
  // the last }); needs to be }
  if (routeCode.endsWith('});')) {
    routeCode = routeCode.slice(0, -3) + '}';
  }

  const fileContent = `
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
    keys.map(k => k.replace(/[\\u200B-\\u200D\\uFEFF\\u200E\\u200F\\s]/g, '')).filter(k => k.length > 0)
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

${routeCode}
`;

  fs.writeFileSync(filename, fileContent);
}

createEndpoint('api/chat.ts', "app.post('/api/chat'", "app.post('/api/study-function'");
createEndpoint('api/study-function.ts', "app.post('/api/study-function'", "app.post('/api/study-question'");
createEndpoint('api/study-question.ts', "app.post('/api/study-question'", "export default app;");

