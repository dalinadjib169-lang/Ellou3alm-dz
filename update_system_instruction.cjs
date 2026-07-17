const fs = require('fs');

const updateInstruction = (filename) => {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replace(
    /- إجباري جداً لمنع تشوه المعادلات: أي عبارة رياضية أو معادلة \(مثلاً f\(x\) = 3 × x\) يجب كتابتها داخل وسم لمنع انقسامها على سطرين هكذا: <span dir="ltr" style="white-space: nowrap;">العبارة الرياضية هنا<\/span>\. لا تترك العبارات الرياضية بدون هذا الوسم أبداً!/,
    '- إجباري جداً جداً لمنع تشوه المعادلات: أي عبارة رياضية أو معادلة (مثلاً f(x) = 3 × x) يجب كتابتها داخل وسم لمنع انقسامها على سطرين هكذا: <span dir="ltr" style="white-space: nowrap; display: inline-block; font-family: sans-serif; margin: 0 4px;">العبارة الرياضية هنا</span>. لا تترك العبارات الرياضية بدون هذا الوسم أبداً!'
  );
  fs.writeFileSync(filename, content);
}

updateInstruction('api/chat.ts');
updateInstruction('api/study-function.ts');
updateInstruction('api/study-question.ts');
updateInstruction('server.ts');
