const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const s3 = new S3Client({
    region: process.env.VITE_AWS_REGION || process.env.AWS_REGION || process.env.MY_AWS_REGION,
    credentials: {
      accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || process.env.MY_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || process.env.MY_AWS_SECRET_ACCESS_KEY,
    }
  });

  const bucket = process.env.VITE_AWS_BUCKET || process.env.AWS_BUCKET || process.env.MY_AWS_S3_BUCKET_NAME;
  console.log("Bucket:", bucket);

  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: 'test_acl.html',
      Body: '<html><body>Test</body></html>',
      ContentType: 'text/html',
      ACL: 'public-read'
    }));
    console.log("Uploaded with public-read ACL!");
  } catch(e) {
    console.error("ACL upload failed:", e.message);
  }

  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: 'test_no_acl.html',
      Body: '<html><body>Test</body></html>',
      ContentType: 'text/html'
    }));
    console.log("Uploaded without ACL!");
  } catch(e) {
    console.error("No ACL upload failed:", e.message);
  }
}
run();
