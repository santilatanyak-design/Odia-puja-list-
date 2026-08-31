const fs = require('fs');
let code = fs.readFileSync('server/generateStaticStories.ts', 'utf-8');
const searchString = 'const imageUrl = story.imageUrl.startsWith';
console.log("Includes?", code.includes(searchString));
console.log(code.substring(code.indexOf(searchString) - 50, code.indexOf(searchString) + 150));
