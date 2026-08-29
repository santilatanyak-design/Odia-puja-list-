import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import path from 'path';

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Client) {
    const region = process.env.AWS_REGION || 'ap-south-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey) {
      s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId: accessKeyId.trim(),
          secretAccessKey: secretAccessKey.trim(),
        },
      });
    } else {
      // Fallback to default AWS credential provider chain (IAM role, environment, or config)
      s3Client = new S3Client({ region });
    }
  }
  return s3Client;
}

export interface S3UploadResult {
  success: boolean;
  url: string;
  key: string;
  bucket: string;
  region: string;
  message?: string;
}

/**
 * Uploads a file buffer or base64 string directly to the AWS S3 bucket: bhakti-ananda-photos
 */
export async function uploadToS3(params: {
  buffer: Buffer;
  originalName?: string;
  mimeType?: string;
  folder?: string;
}): Promise<S3UploadResult> {
  const bucket = (process.env.AWS_S3_BUCKET_NAME || 'bhakti-ananda-photos').trim();
  const region = (process.env.AWS_REGION || 'ap-south-1').trim();
  const folder = (params.folder || 'uploads').replace(/^\/+|\/+$/g, '');

  const ext = params.originalName
    ? path.extname(params.originalName)
    : params.mimeType === 'image/png'
    ? '.png'
    : params.mimeType === 'image/webp'
    ? '.webp'
    : params.mimeType === 'image/gif'
    ? '.gif'
    : '.jpg';

  const cleanExt = ext || '.jpg';
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const cleanBaseName = params.originalName
    ? path.basename(params.originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
    : 'photo';

  const s3Key = `${folder}/${timestamp}_${cleanBaseName}_${randomSuffix}${cleanExt}`;
  const contentType = params.mimeType || 'image/jpeg';

  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: s3Key,
    Body: params.buffer,
    ContentType: contentType,
    // Note: If bucket has ACLs enabled, public-read can be used; otherwise S3 Bucket Policy handles public access
    // We set standard caching headers for fast image CDN delivery
    CacheControl: 'public, max-age=31536000',
  });

  await client.send(command);

  // Standard AWS S3 URL format in Mumbai region
  const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

  return {
    success: true,
    url: s3Url,
    key: s3Key,
    bucket,
    region,
  };
}
