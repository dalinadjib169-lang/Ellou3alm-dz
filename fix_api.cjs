const fs = require('fs');

const fixFile = (filename) => {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replace(/}\s*\);\s*(\/\/[^\n]*\s*)*$/, '}');
  fs.writeFileSync(filename, content);
}

fixFile('api/chat.ts');
fixFile('api/study-function.ts');
fixFile('api/study-question.ts');
