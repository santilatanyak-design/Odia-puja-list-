const fs = require('fs');
let code = fs.readFileSync('src/lib/contentApi.ts', 'utf-8');

const regex = /\/\/ Layer 2: Query AWS S3 Direct JSON Files/m;

const replacement = `// ID variants to check in AWS S3 and server
  const idCandidates = Array.from(new Set([cleanId, idWithStory, idWithoutStory, decoded])).filter(
    (id) => Boolean(id) && id.length > 0 && id !== 'all'
  );

  // Layer 2: Query AWS S3 Direct JSON Files`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/lib/contentApi.ts', code);
console.log("Fixed idCandidates in contentApi.ts");
