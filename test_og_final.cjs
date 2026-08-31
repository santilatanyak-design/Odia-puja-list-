const fs = require('fs');
const html = fs.readFileSync('dist/story/story-962286/index.html', 'utf-8');
console.log('Includes OG Image?', html.includes('og:image'));
console.log('Match:', html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]);
