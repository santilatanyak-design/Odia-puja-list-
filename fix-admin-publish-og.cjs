const fs = require('fs');

let code = fs.readFileSync('server/generateStaticStories.ts', 'utf-8');
const expectedLine = 'const rawImg = story.imageUrl || DEFAULT_BRAND_LOGO;';
if (!code.includes(expectedLine)) {
  console.log("Missing imageUrl prep logic. Adding it now.");
  const badImgLine = /const imageUrl = story\.imageUrl \? \`\$\{DOMAIN\}\/\$\{story\.imageUrl\}\` : DEFAULT_BRAND_LOGO;/g;
  code = code.replace(badImgLine, `
    const rawImg = story.imageUrl || DEFAULT_BRAND_LOGO;
    const imageUrl = rawImg.startsWith('http') ? rawImg : \`\$\{DOMAIN\}/\$\{rawImg.replace(/^\\//, '')\}\`;
    
    let imageType = 'image/jpeg';
    if (imageUrl.includes('.png')) imageType = 'image/png';
    else if (imageUrl.includes('.webp')) imageType = 'image/webp';
    else if (imageUrl.includes('.svg')) imageType = 'image/svg+xml';
  `);
  fs.writeFileSync('server/generateStaticStories.ts', code);
}
