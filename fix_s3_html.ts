import { config } from 'dotenv';
config();
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { buildStoryHtml } from './src/lib/publishStoryHtml.ts';

const AWS_REGION = process.env.VITE_AWS_REGION || process.env.AWS_REGION;
const AWS_BUCKET = process.env.VITE_AWS_BUCKET || process.env.AWS_BUCKET;
const AWS_ACCESS_KEY = process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_KEY = process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

async function run() {
  if (!AWS_REGION || !AWS_BUCKET || !AWS_ACCESS_KEY || !AWS_SECRET_KEY) {
    console.error('Missing AWS credentials in env');
    return;
  }
  const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: { accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY }
  });

  const postsPath = 'posts.json';
  if (!fs.existsSync(postsPath)) return;
  let posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
  if (!Array.isArray(posts)) {
    posts = Object.values(posts);
  }
  
  // Filter unique posts
  const uniquePosts = [];
  const ids = new Set();
  for (const post of posts) {
    if (post && post.id && !ids.has(post.id)) {
      ids.add(post.id);
      uniquePosts.push(post);
    }
  }

  let successCount = 0;
  for (const post of uniquePosts) {
    try {
      post.imageUrl = post.imageUrl || post.image || '';
      const htmlContent = await buildStoryHtml(post);
      const storyId = (post.id || '').replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '');
      const bodyBytes = new TextEncoder().encode(htmlContent);
      
      await Promise.all([
        s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: `story/${storyId}/index.html`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' })),
        s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: `story/${storyId}`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' })),
        s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: `story/${storyId}.html`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' }))
      ]);
      console.log(`Re-uploaded HTML for ${storyId}`);
      successCount++;
    } catch(err) {
       console.error(`Failed to upload ${post.id}`, err);
    }
  }
  console.log(`Successfully uploaded ${successCount} stories`);
}
run();
