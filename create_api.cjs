const fs = require('fs');
const serverCode = fs.readFileSync('server.ts', 'utf8');

const topCode = serverCode.substring(
  serverCode.indexOf('let currentKeyIndex = 0;'),
  serverCode.indexOf('async function startServer()')
);

// Find the start of the first app.post
const firstPostIndex = serverCode.indexOf("app.post('/api/chat'");
// Find the end of the last app.post (before the Vite middleware setup)
const viteSetupIndex = serverCode.indexOf('// Vite middleware for development');

const routesCode = serverCode.substring(firstPostIndex, viteSetupIndex);

const apiCode = `
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

` + topCode + `

` + routesCode + `

export default app;
`;

fs.writeFileSync('api/index.ts', apiCode);
