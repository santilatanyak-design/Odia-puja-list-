const fs = require('fs');
let code = fs.readFileSync('server/generateStaticStories.ts', 'utf-8');
const searchString = 'const imageUrl = story.imageUrl.startsWith(\'http\') ? story.imageUrl : \`\$\{DOMAIN\}/\$\{story.imageUrl.replace(/^\/\//, \'\')\}\`;';
if (code.includes(searchString)) {
  console.log("Found line exactly!");
  code = code.replace(searchString, `
      const rawImg = story.imageUrl || DEFAULT_BRAND_LOGO;
      const imageUrl = rawImg.startsWith('http') ? rawImg : \`\$\{DOMAIN\}/\$\{rawImg.replace(/^\\//, '')\}\`;
  `);
  fs.writeFileSync('server/generateStaticStories.ts', code);
}
