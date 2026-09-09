const fs = require('fs');

let contentApi = fs.readFileSync('src/lib/contentApi.ts', 'utf-8');
contentApi = contentApi.replace(/likesCount: number,\n    isFeatured: false,\n    affiliateAd\?/g, "likesCount: number,\n    isFeatured: boolean,\n    affiliateAd?");
fs.writeFileSync('src/lib/contentApi.ts', contentApi);

console.log("Fixed final types");
