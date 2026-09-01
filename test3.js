const fs = require('fs');
let html = fs.readFileSync('dist/index.html', 'utf-8');
const original = html.match(/<meta property="og:image".*?>/);
console.log("Original has og:image:", !!original);

html = html.replace(/<meta property="og:[^>]+>/gi, '');
const after = html.match(/<meta property="og:image".*?>/);
console.log("After replace has og:image:", !!after);
