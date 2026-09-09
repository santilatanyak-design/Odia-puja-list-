const fs = require('fs');

let blog = fs.readFileSync('src/components/SpiritualBlog.tsx', 'utf-8');
blog = blog.replace(/likesCount: (.*?),\,\n/g, "likesCount: $1,\n");
fs.writeFileSync('src/components/SpiritualBlog.tsx', blog);
console.log("Fixed comma");
