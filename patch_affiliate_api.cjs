const fs = require('fs');
let file = fs.readFileSync('src/lib/affiliateApi.ts', 'utf-8');
file = file.replace(/\s*price:\s*string;/, '');
file = file.replace(/\s*discountPrice\?:\s*string;/, '');
fs.writeFileSync('src/lib/affiliateApi.ts', file);
