const fs = require('fs');

let code = fs.readFileSync('src/components/StudentView.tsx', 'utf-8');

const oldPrompt = "prompt = `مرحباً، أنا طالب جامعي وأريد بناء مؤسسة ناشئة.\\nتخصصي هو: ${startupSpecialty}\\nيرجى اقتراح أفكار مشاريع مؤسسات ناشئة (Startups) تتناسب مع تخصصي، مع شرح مبسط لكل فكرة.`;";
const newPrompt = "prompt = `مرحباً، أنا طالب جامعي وأريد بناء مؤسسة ناشئة.\\nتخصصي هو: ${startupSpecialty}\\nيرجى اقتراح عدة خيارات لمشاريع مؤسسات ناشئة (Startups) مطلوبة وناجحة في السوق الجزائري تتناسب مع تخصصي، مع شرح مفصل لفكرة كل مشروع.`;";

code = code.replace(oldPrompt, newPrompt);

fs.writeFileSync('src/components/StudentView.tsx', code);
console.log('patched prompt');
