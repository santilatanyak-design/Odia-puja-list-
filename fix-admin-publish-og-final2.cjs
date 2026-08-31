const fs = require('fs');
let code = fs.readFileSync('src/lib/publishStoryHtml.ts', 'utf-8');

code = code.replace(/const rawImg = story\.imageUrl \|\| DEFAULT_BRAND_LOGO;/g, "const rawImg = story.imageUrl || story.image || DEFAULT_BRAND_LOGO;");

fs.writeFileSync('src/lib/publishStoryHtml.ts', code);
