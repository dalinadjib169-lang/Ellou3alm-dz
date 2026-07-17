import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || Object.values(process.env).find(v => typeof v === 'string' && v.startsWith('AIza')) });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: 'Hello'
    });
    console.log(response.text);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();
