const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

async function run() {
  let cfg = {};
  if (fs.existsSync('aws-config.json')) {
    cfg = JSON.parse(fs.readFileSync('aws-config.json', 'utf-8'));
  }
  
  const region = cfg.region || 'ap-south-1';
  const bucket = cfg.bucket || 'bhakti-ananda-photos';
  const accessKeyId = cfg.accessKeyId;
  const secretAccessKey = cfg.secretAccessKey;

  if (!accessKeyId || !secretAccessKey) {
    console.log("No AWS keys found in aws-config.json");
    return;
  }

  const s3Client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey }
  });

  if (fs.existsSync('posts.json')) {
    const raw = fs.readFileSync('posts.json', 'utf-8');
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: 'posts.json',
      Body: raw,
      ContentType: 'application/json; charset=utf-8',
      CacheControl: 'public, max-age=0, must-revalidate',
    }));
    console.log("Uploaded posts.json");

    const data = JSON.parse(raw);
    const uniqueStories = {};
    for (const key of Object.keys(data)) {
       const story = data[key];
       if (story && story.id) {
           uniqueStories[story.id] = story;
       }
    }

    for (const story of Object.values(uniqueStories)) {
       const cleanId = story.id.replace('story-', '');
       const storyBytes = new TextEncoder().encode(JSON.stringify(story, null, 2));
       await s3Client.send(new PutObjectCommand({
         Bucket: bucket,
         Key: `posts/story-${cleanId}.json`,
         Body: storyBytes,
         ContentType: 'application/json; charset=utf-8',
         CacheControl: 'public, max-age=0, must-revalidate',
       }));
       console.log(`Uploaded JSON for ${story.id}`);
    }
  }
}
run();
