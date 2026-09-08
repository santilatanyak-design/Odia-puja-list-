const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const regex = /app\.get\("\/api\/stories\/:storyId", async \(req, res\) => {[\s\S]*?return res\.json\({ success: false, error: "Story not found" }\);\n}\);/m;

const replacement = `app.get("/api/stories/:storyId", async (req, res) => {
  const { storyId } = req.params;
  const cleanId = String(storyId).replace(/^(\\/)?story\\//i, '').replace(/\\.html?$/i, '').replace(/\\/$/, '').trim();
  const idWithoutStory = cleanId.replace(/^story-/, '').trim();
  const idWithStory = cleanId.startsWith('story-') ? cleanId : \`story-\${cleanId}\`;

  // 1. Check S3 First
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
          const s3Story = await fetchRes.json();
          return res.json({ success: true, story: s3Story, from: 's3' });
        }
      } catch (e) {}
    }
  }

  // 2. Fallback to local posts.json
  const postsPath = path.join(process.cwd(), 'public', 'posts.json');
  const fallbackPath = path.join(process.cwd(), 'posts.json');
  const target = fs.existsSync(postsPath) ? postsPath : (fs.existsSync(fallbackPath) ? fallbackPath : null);
  if (target) {
    try {
      const raw = fs.readFileSync(target, 'utf-8');
      const data = JSON.parse(raw);
      const list = Array.isArray(data) ? data : Object.values(data);
      const match = list.find((p) => {
        if (!p) return false;
        const pid = String(p.id || '').trim();
        const pCleanId = pid.replace(/^story-/, '').trim();
        return pid === cleanId || pid === idWithStory || pid === idWithoutStory ||
               pCleanId === cleanId || pCleanId === idWithoutStory;
      });
      if (match) {
        return res.json({ success: true, story: match, from: 'local' });
      }
    } catch {}
  }

  return res.json({ success: false, error: "Story not found" });
});`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
console.log("Fixed API logic in server.ts");
