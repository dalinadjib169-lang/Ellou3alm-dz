import fs from 'fs';
let code = fs.readFileSync('src/components/GraphView.tsx', 'utf8');
code = code.replace(
`            {/* Study Tab */}
            {activeTab === 'study' && (
              <div className="h-full">`,
`            {/* Study Tab */}
            {activeTab === 'study' && (
              <div className="h-full overflow-x-hidden min-w-0">`
);
fs.writeFileSync('src/components/GraphView.tsx', code);
