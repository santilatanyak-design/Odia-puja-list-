const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// The second s3Urls is in the app.get("/api/stories/:storyId"
const replacementStr = `const nowT = Date.now();
    const s3Urls = [
      \`https://\${aws.bucket}.s3.\${aws.region}.amazonaws.com/posts/story-\${cleanId}.json?t=\${nowT}\`,
      \`https://\${aws.bucket}.s3.\${aws.region}.amazonaws.com/story/\${cleanId}/story.json?t=\${nowT}\`,
      \`https://\${aws.bucket}.s3.\${aws.region}.amazonaws.com/story/\${cleanId}.json?t=\${nowT}\`
    ];`;

const s3block = code.substring(code.lastIndexOf("const s3Urls = ["), code.indexOf("];", code.lastIndexOf("const s3Urls = [")) + 2);
if (s3block.includes("amazonaws")) {
  code = code.replace(s3block, replacementStr);
  fs.writeFileSync('server.ts', code);
  console.log("Fixed API cache buster in server.ts");
} else {
  console.log("Failed to find second s3Urls");
}
