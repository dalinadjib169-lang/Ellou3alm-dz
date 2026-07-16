import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function testModel(modelName) {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "hello",
    });
    console.log(`[SUCCESS] ${modelName}: ${response.text}`);
    return true;
  } catch (err) {
    console.log(`[FAILED] ${modelName}: ${err.message}`);
    return false;
  }
}
async function run() {
  const models = [
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro',
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
    'gemini-2.0-flash-lite-001',
    'gemini-flash-lite-latest',
    'gemma-4-26b-a4b-it'
  ];
  for (const model of models) {
    await testModel(model);
  }
}
run();
