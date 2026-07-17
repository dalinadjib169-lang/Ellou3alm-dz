const fs = require('fs');

const fixBody = (filename) => {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replace('const { message, stage, level, history } = req.body;', `let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      } else if (Buffer.isBuffer(body)) {
        body = JSON.parse(body.toString());
      }
      const { message, stage, level, history } = body;`);
      
  content = content.replace('const { expression, type, question, history } = req.body;', `let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      } else if (Buffer.isBuffer(body)) {
        body = JSON.parse(body.toString());
      }
      const { expression, type, question, history } = body;`);
      
  content = content.replace('const { expression } = req.body;', `let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      } else if (Buffer.isBuffer(body)) {
        body = JSON.parse(body.toString());
      }
      const { expression } = body;`);

  fs.writeFileSync(filename, content);
}

fixBody('api/chat.ts');
fixBody('api/study-function.ts');
fixBody('api/study-question.ts');
