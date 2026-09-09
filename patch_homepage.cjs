const fs = require('fs');
let file = fs.readFileSync('src/components/HomePage.tsx', 'utf-8');

// 1. Remove price from Hero
file = file.replace(
  /<span className="text-2xl font-bold text-slate-900">\s*\{heroProduct\.discountPrice \|\| heroProduct\.price\}\s*<\/span>/,
  ""
);

// 2. Remove price from Trending Grid
file = file.replace(
  /<div>\s*<span className="text-xl font-black text-slate-900 block">\s*\{product\.discountPrice \|\| product\.price\}\s*<\/span>\s*\{product\.discountPrice && \(\s*<span className="text-sm text-slate-400 line-through">\s*\{product\.price\}\s*<\/span>\s*\)\}\s*<\/div>/,
  ""
);

// 3. Rename 'View Deal' to 'Grab Deal'
file = file.replace(/>\s*View Deal\s*<\/button>/, ">\n                    Grab Deal\n                  </button>");

fs.writeFileSync('src/components/HomePage.tsx', file);
