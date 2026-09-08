const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const targetStr = "const s3Urls = [";
const replacementStr = `const nowT = Date.now();
        const s3Urls = [
          \`https://\${aws.bucket}.s3.\${aws.region}.amazonaws.com/posts/story-\${cleanId}.json?t=\${nowT}\`,
          \`https://\${aws.bucket}.s3.\${aws.region}.amazonaws.com/story/\${cleanId}/story.json?t=\${nowT}\`,
          \`https://\${aws.bucket}.s3.\${aws.region}.amazonaws.com/story/\${cleanId}.json?t=\${nowT}\`
        ];`;

// Let's replace the EXACT block in server.ts
const regex = /const s3Urls = \[\s*`https:\/\/\$\{aws\.bucket\}\.s3\.\$\{aws\.region\}\.amazonaws\.com\/posts\/story-\$\{cleanId\}\.json`,\s*`https:\/\/\$\{aws\.bucket\}\.s3\.\$\{aws\.region\}\.amazonaws\.com\/story\/\$\{cleanId\}\/story\.json`,\s*`https:\/\/\$\{aws\.bucket\}\.s3\.\$\{aws\.region\}\.amazonaws\.com\/story\/\$\{cleanId\}\.json`\s*\];/m;

code = code.replace(regex, replacementStr);

const regex2 = /const s3Urls = \[\s*`https:\/\/\$\{aws\.bucket\}\.s3\.\$\{aws\.region\}\.amazonaws\.com\/posts\/story-\$\{cleanId\}\.json`,\s*`https:\/\/\$\{aws\.bucket\}\.s3\.\$\{aws\.region\}\.amazonaws\.com\/story\/\$\{cleanId\}\/story\.json`,\s*`https:\/\/\$\{aws\.bucket\}\.s3\.\$\{aws\.region\}\.amazonaws\.com\/story\/\$\{cleanId\}\.json`\s*\];/m;

if(code.indexOf("const nowT = Date.now();") !== -1) {
  fs.writeFileSync('server.ts', code);
  console.log("Fixed SSR cache buster in server.ts");
} else {
  console.log("Failed to fix SSR cache buster in server.ts");
  // Let's do a more robust replace
  const s3block = code.substring(code.indexOf("const s3Urls = ["), code.indexOf("];", code.indexOf("const s3Urls = [")) + 2);
  code = code.replace(s3block, replacementStr);
  fs.writeFileSync('server.ts', code);
  console.log("Fixed with fallback replace");
}
