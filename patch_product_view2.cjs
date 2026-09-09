const fs = require('fs');
let file = fs.readFileSync('src/components/AffiliateProductView.tsx', 'utf-8');

file = file.replace(
  /<div>\s*<span className="text-xl font-black text-slate-900 block">\s*\{product\.discountPrice \|\| product\.price\}\s*<\/span>\s*\{product\.discountPrice && \(\s*<span className="text-sm text-slate-400 line-through">\s*\{product\.price\}\s*<\/span>\s*\)\}\s*<\/div>/,
  ""
);

fs.writeFileSync('src/components/AffiliateProductView.tsx', file);
