const fs = require('fs');
let code = fs.readFileSync('src/lib/publishStoryHtml.ts', 'utf-8');
const start = code.indexOf('const redirectScript');
const end = code.indexOf('return finalHtml;');
if (start !== -1 && end !== -1) {
  code = code.substring(0, start) + "\n  " + code.substring(end);
}
fs.writeFileSync('src/lib/publishStoryHtml.ts', code);
