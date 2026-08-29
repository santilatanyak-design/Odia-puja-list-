import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs';

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client | null {
  const region = (process.env.AWS_REGION || 'ap-south-1').trim();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      maxAttempts: 2,
    });
  }
  return s3Client;
}

export interface S3UploadResult {
  success: boolean;
  url: string;
  key: string;
  bucket: string;
  region: string;
  isLocalFallback?: boolean;
  message?: string;
}

/**
 * Uploads a file buffer directly to AWS S3 bucket: bhakti-ananda-photos
 * With robust timeout protection and local file fallback to prevent freezes.
 */
export async function uploadToS3(params: {
  buffer: Buffer;
  originalName?: string;
  mimeType?: string;
  folder?: string;
  hostOrigin?: string;
}): Promise<S3UploadResult> {
  const bucket = (process.env.AWS_S3_BUCKET_NAME || 'bhakti-ananda-photos').trim();
  const region = (process.env.AWS_REGION || 'ap-south-1').trim();
  const folder = (params.folder || 'photos').replace(/^\/+|\/+$/g, '');

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

  const fileName = `${timestamp}_${cleanBaseName}_${randomSuffix}${cleanExt}`;
  const s3Key = `${folder}/${fileName}`;
  const contentType = params.mimeType || 'image/jpeg';

  const client = getS3Client();

  // If AWS S3 Client is available with valid credentials, attempt direct S3 upload with timeout
  if (client) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: params.buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      });

      // 18-second timeout handler to prevent hanging
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 18000);

      try {
        await client.send(command, { abortSignal: abortController.signal });
      } finally {
        clearTimeout(timeoutId);
      }

      const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
      console.log(`[AWS S3] Upload successful -> Bucket: ${bucket}, Key: ${s3Key}`);

      return {
        success: true,
        url: s3Url,
        key: s3Key,
        bucket,
        region,
        message: 'Uploaded to AWS S3',
      };
    } catch (s3Error: any) {
      console.warn(`[AWS S3 Upload Warning] S3 upload failed (${s3Error?.message || s3Error}), activating persistent local storage fallback:`, s3Error);
    }
  } else {
    console.log(`[AWS S3 Info] AWS credentials not detected in environment, storing to persistent local public directory for bucket ${bucket}`);
  }

  // Fallback: Save file to public/uploads directory
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, params.buffer);

  const localPath = `/uploads/${folder}/${fileName}`;
  const fullLocalUrl = params.hostOrigin ? `${params.hostOrigin}${localPath}` : localPath;

  console.log(`[Local Upload Fallback] File saved at: ${localPath}`);

  return {
    success: true,
    url: fullLocalUrl,
    key: s3Key,
    bucket: bucket || 'bhakti-ananda-photos',
    region: region || 'ap-south-1',
    isLocalFallback: true,
    message: 'Saved to persistent storage (AWS S3 ready)',
  };
}

