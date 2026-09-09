const fs = require('fs');

let blog = fs.readFileSync('src/components/SpiritualBlog.tsx', 'utf-8');
blog = blog.replace(/likesCount: (.*?)\n\s*\}/g, "likesCount: $1,\n      isFeatured: false\n    }");
fs.writeFileSync('src/components/SpiritualBlog.tsx', blog);

let cApi = fs.readFileSync('src/lib/contentApi.ts', 'utf-8');
cApi = cApi.replace(/likesCount: (.*?)\n\s*affiliateAd\?/g, "likesCount: $1,\n    isFeatured: false,\n    affiliateAd?");
fs.writeFileSync('src/lib/contentApi.ts', cApi);
console.log("Fixed isFeatured");
