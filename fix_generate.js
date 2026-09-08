const fs = require('fs');
let code = fs.readFileSync('server/generateStaticStories.ts', 'utf-8');
code = code.replace(/<head><script>[\s\S]*?<\/script>/g, '<head>');
fs.writeFileSync('server/generateStaticStories.ts', code);
