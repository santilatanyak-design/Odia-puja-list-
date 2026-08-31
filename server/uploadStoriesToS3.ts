import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getAwsConfig } from './s3';
import fs from 'fs';
import path from 'path';

export async function uploadAllStoryHtmlToS3() {
  const { accessKeyId, secretAccessKey, region, bucket } = getAwsConfig();
  if (!accessKeyId || !secretAccessKey) {
    console.log('[S3 HTML Sync] AWS Credentials not present in environment.');
    return;
  }

  const s3 = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const distStoryDir = path.join(process.cwd(), 'dist', 'story');
  if (!fs.existsSync(distStoryDir)) {
    console.log('[S3 HTML Sync] dist/story directory does not exist yet.');
    return;
  }

  const entries = fs.readdirSync(distStoryDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const storyId = entry.name;
      const htmlPath = path.join(distStoryDir, storyId, 'index.html');
      if (fs.existsSync(htmlPath)) {
        const body = fs.readFileSync(htmlPath, 'utf-8');

        // 1. Upload to story/[storyId]/index.html
        try {
          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: `story/${storyId}/index.html`,
              Body: body,
              ContentType: 'text/html; charset=utf-8',
              CacheControl: 'public, max-age=0, must-revalidate',
            })
          );
          // 2. Upload to story/[storyId] (direct object key for clean URLs)
          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: `story/${storyId}`,
              Body: body,
              ContentType: 'text/html; charset=utf-8',
              CacheControl: 'public, max-age=0, must-revalidate',
            })
          );
          console.log(`[S3 HTML Sync] 🚀 Uploaded static HTML for story: ${storyId} to s3://${bucket}`);
        } catch (err: any) {
          console.warn(`[S3 HTML Sync] Failed to upload ${storyId}:`, err?.message);
        }
      }
    }
  }
}

if (process.argv[1] && process.argv[1].includes('uploadStoriesToS3')) {
  uploadAllStoryHtmlToS3().then(() => {
    console.log('[S3 HTML Sync] Complete.');
    process.exit(0);
  });
}
