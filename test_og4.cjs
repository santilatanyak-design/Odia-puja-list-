const fs = require('fs');
const html = fs.readFileSync('dist/story/story-631474/index.html', 'utf-8');
console.log('OG Image:', html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]);
