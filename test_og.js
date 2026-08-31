const fs = require('fs');
const html = fs.readFileSync('dist/story/story-631474.html', 'utf-8');
console.log(html.includes('og:image'));
console.log(html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]);
