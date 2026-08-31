const fs = require('fs');
let code = fs.readFileSync('src/components/SpiritualBlog.tsx', 'utf-8');
code = code.replace(
  /const targetUrl = \`\/story\/\$\{encodeURIComponent\(selectedStory.id\)\}\`;/g,
  "const targetUrl = \`/story/${encodeURIComponent(selectedStory.id)}.html\`;"
);
fs.writeFileSync('src/components/SpiritualBlog.tsx', code);
