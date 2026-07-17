const fs = require('fs');

let studentView = fs.readFileSync('src/components/StudentView.tsx', 'utf8');
studentView = studentView.replace(/\\n        throw new Error/g, "\n        throw new Error");
fs.writeFileSync('src/components/StudentView.tsx', studentView);

let graphView = fs.readFileSync('src/components/GraphView.tsx', 'utf8');
graphView = graphView.replace(/\\n        throw new Error/g, "\n        throw new Error");
fs.writeFileSync('src/components/GraphView.tsx', graphView);
