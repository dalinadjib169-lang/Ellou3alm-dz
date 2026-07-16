const fs = require('fs');
let code = fs.readFileSync('src/components/StudentView.tsx', 'utf8');
code = code.replace(
`              {msg.role === 'user' ? (
                <div className="bg-slate-900 text-white p-4 md:p-6 rounded-3xl rounded-tl-none shadow-sm text-lg mt-2">
                  {msg.content}
                </div>
              ) : (
                <div className="flex-1 min-w-0"><MarkdownRenderer content={msg.content} /></div>
              )}`,
`              <div className="flex-1 min-w-0">
                {msg.role === 'user' ? (
                  <div className="bg-slate-900 text-white p-4 md:p-6 rounded-3xl rounded-tl-none shadow-sm text-lg mt-2 inline-block">
                    {msg.content}
                  </div>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}
              </div>`
);
fs.writeFileSync('src/components/StudentView.tsx', code);
