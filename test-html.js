import fs from 'fs';
const html = fs.readFileSync('dist/index.html', 'utf-8');
console.log(html.substring(0, 1500));
