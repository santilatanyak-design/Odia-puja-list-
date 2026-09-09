const fs = require('fs');

let blog = fs.readFileSync('src/components/SpiritualBlog.tsx', 'utf-8');
blog = blog.replace(/setSelectedStory\(\(prev\) => \(prev \? \{ \.\.\.prev\, likesCount: newCount \} : null\)\);\,\n\s*isFeatured\: false\n\s*\}/g, "setSelectedStory((prev) => (prev ? { ...prev, likesCount: newCount } : null));\n      }");
fs.writeFileSync('src/components/SpiritualBlog.tsx', blog);
console.log("Fixed line 611");
