import fs from 'fs';
let code = fs.readFileSync('src/components/GraphView.tsx', 'utf8');
code = code.replace(
`                          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl rounded-tl-none">
                            <MarkdownRenderer content={qa.a} />
                          </div>`,
`                          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl rounded-tl-none overflow-x-hidden min-w-0">
                            <MarkdownRenderer content={qa.a} />
                          </div>`
);
fs.writeFileSync('src/components/GraphView.tsx', code);
