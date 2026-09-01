import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { initializeApp, getApps, getApp } from 'firebase/app';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get("/api/s3/config", (req, res) => {
  res.json({
    region: process.env.VITE_AWS_REGION || process.env.AWS_REGION || process.env.MY_AWS_REGION,
    bucket: process.env.VITE_AWS_BUCKET || process.env.AWS_BUCKET || process.env.MY_AWS_S3_BUCKET_NAME,
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || process.env.MY_AWS_SECRET_ACCESS_KEY,
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/sync-story-html', async (req, res) => {
  try {
    const { story, html } = req.body;
    if (!story || !html) return res.status(400).json({ error: 'Missing data' });
    
    // Also save to posts.json just in case
    const postsPath = path.join(process.cwd(), 'posts.json');
    if (fs.existsSync(postsPath)) {
      let posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
      if (Array.isArray(posts)) {
        posts = [story, ...posts.filter((p: any) => p.id !== story.id)];
        fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
      }
    }

    const AWS_REGION = process.env.VITE_AWS_REGION || process.env.AWS_REGION || process.env.MY_AWS_REGION;
    const AWS_BUCKET = process.env.VITE_AWS_BUCKET || process.env.AWS_BUCKET || process.env.MY_AWS_S3_BUCKET_NAME;
    const AWS_ACCESS_KEY = process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || process.env.MY_AWS_ACCESS_KEY_ID;
    const AWS_SECRET_KEY = process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || process.env.MY_AWS_SECRET_ACCESS_KEY;
    
    if (AWS_REGION && AWS_BUCKET && AWS_ACCESS_KEY && AWS_SECRET_KEY) {
      console.log('[Backend] Uploading received static HTML to S3 for', story.id);
      const s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY,
          secretAccessKey: AWS_SECRET_KEY,
        }
      });

      const storyId = (story.id || '').replace(/^(\/)?story\//i, '');
      const bodyBytes = new TextEncoder().encode(html);
      
      await Promise.all([
        s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: `story/${storyId}/index.html`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' })),
        s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: `story/${storyId}`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' })),
        s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: `story/${storyId}.html`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' }))
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
});

app.get('/api/district-items', (req, res) => {
  const { districtId } = req.query;
  const items: any[] = [];
  if (districtId && districtId !== 'all') {
    return res.json({ success: true, items: items.filter((i: any) => i.districtId === districtId) });
  }
  return res.json({ success: true, items });
});

app.get("/api/pujaris", (req, res) => res.json([]));
app.get("/api/lists", (req, res) => res.json([]));
app.get("/api/lists/search", (req, res) => res.json([]));
app.get("/api/payments", (req, res) => res.json([]));
app.get("/api/qr-config", (req, res) => res.json({}));
app.get("/api/templates", (req, res) => res.json([]));
app.get("/api/temples", (req, res) => res.json([]));
app.get("/api/stories", (req, res) => res.json([]));
app.post("/api/stories", (req, res) => res.json({success: true}));

// Serve SPA index.html for direct story URLs so latest JS assets load and app interface renders immediately
app.get(['/story/*', '/story'], (req, res, next) => {
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|json)$/)) {
    return next();
  }
  const distPath = path.join(process.cwd(), 'dist');
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
