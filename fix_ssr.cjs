const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// We need to swap the logic in app.get(['/story/*', '/story']...

const replaceBlock = `
      const aws = getAwsConfig();
      if (aws.bucket && aws.region) {
        const s3Urls = [
          \`https://\${aws.bucket}.s3.\${aws.region}.amazonaws.com/posts/story-\${cleanId}.json\`,
          \`https://\${aws.bucket}.s3.\${aws.region}.amazonaws.com/story/\${cleanId}/story.json\`,
          \`https://\${aws.bucket}.s3.\${aws.region}.amazonaws.com/story/\${cleanId}.json\`
        ];
        for (const url of s3Urls) {
          try {
            const fetchRes = await fetch(url);
            if (fetchRes.ok) {
              story = await fetchRes.json();
              console.log(\`[SSR] Found story \${cleanId} from S3!\`);
              break;
            }
          } catch (e) {}
        }
      }

      // Fallback to local posts.json
      if (!story) {
        const postsPath = path.join(process.cwd(), 'posts.json');
        if (fs.existsSync(postsPath)) {
          try {
            const postsRaw = fs.readFileSync(postsPath, 'utf-8');
            const postsData = JSON.parse(postsRaw);
            const posts = Array.isArray(postsData) ? postsData : Object.values(postsData);
            story = posts.find((p) => p && (p.id === cleanId || p.id === \`story-\${cleanId}\` || p.id === \`/story/\${cleanId}\`));
          } catch (e) {
            console.error("Error parsing posts.json in /story route:", e);
          }
        }
      }
`;

// It's easier to just use string replacement on the whole function body.
const startMarker = "let story: any = null;";
const endMarker = "if (story) {";

const idx1 = code.indexOf(startMarker);
const idx2 = code.indexOf(endMarker, idx1);

if (idx1 > 0 && idx2 > idx1) {
  const newCode = code.substring(0, idx1 + startMarker.length) + "\n" + replaceBlock + "\n      " + code.substring(idx2);
  fs.writeFileSync('server.ts', newCode);
  console.log("Fixed SSR logic in server.ts");
} else {
  console.log("Could not find markers in server.ts");
}
