const fs = require('fs');

const fixApi = (filename) => {
  let content = fs.readFileSync(filename, 'utf8');

  // Strip quotes from keys
  content = content.replace(
    /k\.replace\(\/\\[\\u200B-\\u200D\\uFEFF\\u200E\\u200F\\s\]\/g, ''\)/g,
    "k.replace(/[\\u200B-\\u200D\\uFEFF\\u200E\\u200F\\s\"']/g, '')"
  );

  // Handle OPTIONS request
  if (!content.includes("if (req.method === 'OPTIONS')")) {
    content = content.replace(
      'export default async function handler(req: any, res: any) {',
      `export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
`
    );
  }

  // Graceful body parsing
  content = content.replace(
    'let body = req.body;',
    'let body = req.body || {};'
  );

  // For chat.ts
  if (content.includes('history.map')) {
    content = content.replace(
      'const formattedHistory = history.map',
      'const formattedHistory = (history || []).map'
    );
  }

  fs.writeFileSync(filename, content);
};

fixApi('api/chat.ts');
fixApi('api/study-function.ts');
fixApi('api/study-question.ts');

// Also update the client error handling to show actual error
let studentView = fs.readFileSync('src/components/StudentView.tsx', 'utf8');
studentView = studentView.replace(
  "throw new Error('فشل في الاتصال بالخادم');",
  "const errData = await response.json().catch(() => ({}));\n        throw new Error(errData.error || 'فشل في الاتصال بالخادم');"
);
fs.writeFileSync('src/components/StudentView.tsx', studentView);

let graphView = fs.readFileSync('src/components/GraphView.tsx', 'utf8');
graphView = graphView.replace(
  "throw new Error('فشل في الاتصال بالخادم');",
  "const errData = await response.json().catch(() => ({}));\n        throw new Error(errData.error || 'فشل في الاتصال بالخادم');"
);
fs.writeFileSync('src/components/GraphView.tsx', graphView);

