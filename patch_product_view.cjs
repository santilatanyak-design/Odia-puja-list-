const fs = require('fs');
let file = fs.readFileSync('src/components/AffiliateProductView.tsx', 'utf-8');

// 1. Remove price section
file = file.replace(
  /<div className="flex items-baseline gap-4 mb-8">\s*<span className="text-4xl font-black text-slate-900">\s*\{product\.discountPrice \|\| product\.price\}\s*<\/span>\s*\{product\.discountPrice && \(\s*<span className="text-xl text-slate-400 line-through font-medium">\s*\{product\.price\}\s*<\/span>\s*\)\}\s*<\/div>/,
  ""
);

// 2. Rename CTA
file = file.replace(
  /Buy Now Securely/,
  "Buy Now"
);

fs.writeFileSync('src/components/AffiliateProductView.tsx', file);
