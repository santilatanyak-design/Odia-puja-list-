const fs = require('fs');
let code = fs.readFileSync('server/generateStaticStories.ts', 'utf-8');

// The code currently has:
// const rawImg = story.imageUrl || DEFAULT_BRAND_LOGO;
// but the prop is `story.image` not `story.imageUrl`!

code = code.replace(/const rawImg = story\.imageUrl \|\| DEFAULT_BRAND_LOGO;/g, "const rawImg = story.imageUrl || story.image || DEFAULT_BRAND_LOGO;");

fs.writeFileSync('server/generateStaticStories.ts', code);
