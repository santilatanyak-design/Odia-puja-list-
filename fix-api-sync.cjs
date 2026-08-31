const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

// Ensure that api/sync-story-html accepts the generated HTML
// and actually uploads it if S3 keys are available on the backend
const backendUpload = `
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
`;

if (!code.includes('@aws-sdk/client-s3')) {
  code = backendUpload + code;
}

const syncRouteRegex = /app\.post\('\/api\/sync-story-html',.*?\}\);/s;
const newSyncRoute = `app.post('/api/sync-story-html', async (req, res) => {
  try {
    const { story, html } = req.body;
    if (!story || !html) return res.status(400).json({ error: 'Missing data' });
    
    // Also save to posts.json just in case
    const postsPath = path.join(process.cwd(), 'posts.json');
    if (fs.existsSync(postsPath)) {
      let posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
      if (Array.isArray(posts)) {
        posts = [story, ...posts.filter(p => p.id !== story.id)];
        fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
      }
    }

    const AWS_REGION = process.env.VITE_AWS_REGION || process.env.AWS_REGION;
    const AWS_BUCKET = process.env.VITE_AWS_BUCKET || process.env.AWS_BUCKET;
    const AWS_ACCESS_KEY = process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const AWS_SECRET_KEY = process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    
    if (AWS_REGION && AWS_BUCKET && AWS_ACCESS_KEY && AWS_SECRET_KEY) {
      console.log('[Backend] Uploading received static HTML to S3 for', story.id);
      const s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY,
          secretAccessKey: AWS_SECRET_KEY,
        }
      });
      const storyId = (story.id || '').replace(/^(\\/)?story\\//i, '');
      const bodyBytes = new TextEncoder().encode(html);
      
      await Promise.all([
        s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: \`story/\${storyId}/index.html\`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' })),
        s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: \`story/\${storyId}\`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' })),
        s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: \`story/\${storyId}.html\`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' }))
      ]);
      console.log('[Backend] ✅ S3 static upload complete for', storyId);
    } else {
      console.log('[Backend] S3 keys missing on server, cannot upload static html.');
    }
    
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error in sync-story-html:', err);
    res.status(500).json({ error: err.message });
  }
});`;

if (code.match(syncRouteRegex)) {
  code = code.replace(syncRouteRegex, newSyncRoute);
} else {
  code = code.replace('app.listen(', newSyncRoute + '\\n\\n  app.listen(');
}

fs.writeFileSync('server.ts', code);
