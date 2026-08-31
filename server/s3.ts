import dotenv from 'dotenv';
dotenv.config();
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import fs from 'fs';

let s3Client: S3Client | null = null;

export function getAwsConfig() {
  const accessKeyId = (process.env.MY_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID)?.trim();
  const secretAccessKey = (process.env.MY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)?.trim();
  const region = (process.env.MY_AWS_REGION || process.env.AWS_REGION || 'ap-south-1').trim();
  const bucket = (process.env.MY_AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || 'bhakti-ananda-photos').trim();
  return { accessKeyId, secretAccessKey, region, bucket };
}

export function getS3Client(): S3Client | null {
  const { accessKeyId, secretAccessKey, region } = getAwsConfig();

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
      maxAttempts: 3,
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

export interface PresignedUrlResult {
  success: boolean;
  presignedUrl?: string;
  finalUrl: string;
  key: string;
  bucket: string;
  region: string;
  isDirectS3: boolean;
}

/**
 * Creates a Presigned S3 Upload URL for direct frontend-to-S3 uploads,
 * or returns direct proxy target if credentials are not configured.
 */
export async function createPresignedUploadUrl(params: {
  originalName?: string;
  mimeType?: string;
  folder?: string;
  hostOrigin?: string;
}): Promise<PresignedUrlResult> {
  const { bucket, region } = getAwsConfig();
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

  if (client) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      });

      // Presigned URL valid for 15 minutes
      const presignedUrl = await getSignedUrl(client, command, { expiresIn: 900 });
      const finalUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

      return {
        success: true,
        presignedUrl,
        finalUrl,
        key: s3Key,
        bucket,
        region,
        isDirectS3: true,
      };
    } catch (err: any) {
      console.warn('[AWS S3 Presign Warning] Failed to generate presigned URL, falling back to proxy:', err?.message);
    }
  }

  const localUrl = `${params.hostOrigin || ''}/uploads/${folder}/${fileName}`;
  return {
    success: true,
    finalUrl: localUrl,
    key: s3Key,
    bucket,
    region,
    isDirectS3: false,
  };
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
  const { bucket, region } = getAwsConfig();
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

  // 1. Immediately save file to local public persistent storage
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, params.buffer);

  const localPath = `/uploads/${folder}/${fileName}`;
  const fullLocalUrl = params.hostOrigin ? `${params.hostOrigin}${localPath}` : localPath;

  const client = getS3Client();

  // 2. If AWS S3 credentials are configured, attempt fast S3 background upload with 6s timeout
  if (client) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: params.buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      });

      // 6-second timeout handler to prevent hanging
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 6000);

      try {
        await client.send(command, { abortSignal: abortController.signal });
        clearTimeout(timeoutId);

        const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
        console.log(`[AWS S3] Upload successful -> Bucket: ${bucket}, Key: ${s3Key}`);

        return {
          success: true,
          url: s3Url,
          key: s3Key,
          bucket,
          region,
          message: 'Uploaded to AWS S3 (bhakti-ananda-photos)',
        };
      } catch (s3SendError: any) {
        clearTimeout(timeoutId);
        console.warn(`[AWS S3 Upload Warning] S3 send did not complete (${s3SendError?.message || s3SendError}), using persistent server storage: ${localPath}`);
      }
    } catch (s3Error: any) {
      console.warn(`[AWS S3 Upload Warning] S3 upload error:`, s3Error?.message);
    }
  } else {
    console.log(`[AWS S3 Info] AWS credentials not active, stored to server public storage: ${localPath}`);
  }

  return {
    success: true,
    url: fullLocalUrl,
    key: s3Key,
    bucket: bucket || 'bhakti-ananda-photos',
    region: region || 'ap-south-1',
    isLocalFallback: true,
    message: 'Saved to server storage (AWS S3 ready)',
  };
}

