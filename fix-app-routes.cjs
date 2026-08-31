const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(
  /\`\/story\/\$\{encodeURIComponent\(storyId\)\}\`/g,
  "\`/story/${encodeURIComponent(storyId)}.html\`"
);
fs.writeFileSync('src/App.tsx', code);
