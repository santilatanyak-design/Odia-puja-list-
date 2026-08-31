const fs = require('fs');
let code = fs.readFileSync('server/generateStaticStories.ts', 'utf-8');
const start = code.indexOf('const redirectScript');
const end = code.indexOf('// Write to each target directory');
if (start !== -1 && end !== -1) {
  code = code.substring(0, start) + "\n      " + code.substring(end);
}
fs.writeFileSync('server/generateStaticStories.ts', code);
