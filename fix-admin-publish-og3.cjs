const fs = require('fs');
let code = fs.readFileSync('server/generateStaticStories.ts', 'utf-8');

const badImgLine = /const imageUrl = story\.imageUrl\.startsWith\('http'\) \? story\.imageUrl : \`\$\{DOMAIN\}\/\$\{story\.imageUrl\.replace\(\/^\/\/\, ''\)\}\`;/g;
if (code.match(badImgLine)) {
  console.log("Found bad image line. Fixing.");
  code = code.replace(badImgLine, `
      const rawImg = story.imageUrl || DEFAULT_BRAND_LOGO;
      const imageUrl = rawImg.startsWith('http') ? rawImg : \`\$\{DOMAIN\}/\$\{rawImg.replace(/^\\//, '')\}\`;
  `);
  fs.writeFileSync('server/generateStaticStories.ts', code);
} else {
  console.log("Could not find bad image line to replace.");
}
