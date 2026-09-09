import { S3Client, PutObjectCommand, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

/**
 * AWS S3 Photo & Media Upload Helper
 * Direct Browser AWS S3 SDK Upload (Amplify compatible) + Fallbacks
 * Targets AWS S3 Bucket: 'bhakti-ananda-photos' (Region: ap-south-1)
 */

export interface S3UploadResponse {
  success: boolean;
  url: string;
  imageUrl: string;
  key?: string;
  bucket?: string;
  region?: string;
  isLocalFallback?: boolean;
  message?: string;
}

/**
 * Tests AWS S3 connection directly on the client using AWS SDK v3
 * Strictly returns:
 * - Success: { success: true, message: "AWS S3 Connected Successfully!" }
 * - Failure: { success: false, error: error.message }
 */
export async function testAwsS3Connection(credentials: {
  accessKeyId: string;
  secretAccessKey: string;
  bucket?: string;
  region?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const { accessKeyId, secretAccessKey, bucket, region } = credentials;

  if (!accessKeyId?.trim() || !secretAccessKey?.trim()) {
    return {
      success: false,
      error: 'AWS Access Key ID and Secret Access Key are required.',
    };
  }

  const cleanBucket = (bucket || 'bhakti-ananda-photos').trim();
  const cleanRegion = (region || 'ap-south-1').trim();

  // 1. Direct Client-Side S3 Probe with AWS SDK v3
  try {
    const s3 = new S3Client({
      region: cleanRegion,
      credentials: {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
      },
      maxAttempts: 1,
    });

    try {
      await s3.send(new HeadBucketCommand({ Bucket: cleanBucket }));
      return {
        success: true,
        message: 'AWS S3 Connected Successfully!',
      };
    } catch (headErr: any) {
      if (headErr?.name === 'NotFound' || headErr?.$metadata?.httpStatusCode === 404) {
        return {
          success: false,
          error: `Bucket "${cleanBucket}" does not exist in region "${cleanRegion}".`,
        };
      }

      // Try ListObjectsV2 (requires only 1 key)
      try {
        await s3.send(new ListObjectsV2Command({ Bucket: cleanBucket, MaxKeys: 1 }));
        return {
          success: true,
          message: 'AWS S3 Connected Successfully!',
        };
      } catch (listErr: any) {
        // Fallback: Safe probe via backend API if client direct call is blocked by browser CORS
        try {
          const res = await fetch('/api/s3/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessKeyId: accessKeyId.trim(),
              secretAccessKey: secretAccessKey.trim(),
              bucket: cleanBucket,
              region: cleanRegion,
            }),
          });

          // Strict content-type validation: NEVER parse HTML as JSON
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data && data.success) {
              return {
                success: true,
                message: data.message || 'AWS S3 Connected Successfully!',
              };
            } else if (data && (data.error || data.message)) {
              return {
                success: false,
                error: data.error || data.message,
              };
            }
          }
        } catch {}

        return {
          success: false,
          error: listErr?.message || headErr?.message || 'AWS S3 connection failed',
        };
      }
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Unexpected connection error',
    };
  }
}

/**
 * Retrieves AWS S3 Credentials and Bucket info from build/runtime environment or localStorage
 */
export function getClientAwsConfig() {
  const env = (import.meta as any).env || {};
  const globalEnv = (typeof window !== 'undefined' && (window as any).__AWS_ENV__) || {};
  let localKeys: any = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem('odia_aws_admin_config') || localStorage.getItem('aws_s3_credentials');
      if (raw) localKeys = JSON.parse(raw);
    } catch {}
  }

  // Priority 1: User's saved credentials in localStorage
  // Priority 2: Injected environment variables
  const accessKeyId = (
    localKeys.accessKeyId ||
    env.MY_AWS_ACCESS_KEY_ID ||
    env.VITE_MY_AWS_ACCESS_KEY_ID ||
    env.AWS_ACCESS_KEY_ID ||
    globalEnv.MY_AWS_ACCESS_KEY_ID ||
    globalEnv.AWS_ACCESS_KEY_ID ||
    ''
  ).trim();

  const secretAccessKey = (
    localKeys.secretAccessKey ||
    env.MY_AWS_SECRET_ACCESS_KEY ||
    env.VITE_MY_AWS_SECRET_ACCESS_KEY ||
    env.AWS_SECRET_ACCESS_KEY ||
    globalEnv.MY_AWS_SECRET_ACCESS_KEY ||
    globalEnv.AWS_SECRET_ACCESS_KEY ||
    ''
  ).trim();

  const region = (
    localKeys.region ||
    env.MY_AWS_REGION ||
    env.VITE_MY_AWS_REGION ||
    env.AWS_REGION ||
    globalEnv.MY_AWS_REGION ||
    globalEnv.AWS_REGION ||
    'ap-south-1'
  ).trim();

  const bucket = (
    localKeys.bucket ||
    env.MY_AWS_S3_BUCKET_NAME ||
    env.VITE_MY_AWS_S3_BUCKET_NAME ||
    env.AWS_S3_BUCKET_NAME ||
    globalEnv.MY_AWS_S3_BUCKET_NAME ||
    globalEnv.AWS_S3_BUCKET_NAME ||
    'bhakti-ananda-photos'
  ).trim();

  const amplifyWebhookUrl = (
    localKeys.amplifyWebhookUrl ||
    env.VITE_AMPLIFY_WEBHOOK_URL ||
    ''
  ).trim();

  return {
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
    amplifyWebhookUrl,
    isDirectReady: Boolean(accessKeyId && secretAccessKey),
  };
}

export function saveClientAwsConfig(config: {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  bucket?: string;
  amplifyWebhookUrl?: string;
}) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const current = getClientAwsConfig();
  const merged = {
    accessKeyId: config.accessKeyId !== undefined ? config.accessKeyId.trim() : current.accessKeyId,
    secretAccessKey: config.secretAccessKey !== undefined ? config.secretAccessKey.trim() : current.secretAccessKey,
    region: config.region !== undefined ? config.region.trim() : (current.region || 'ap-south-1'),
    bucket: config.bucket !== undefined ? config.bucket.trim() : (current.bucket || 'bhakti-ananda-photos'),
    amplifyWebhookUrl: config.amplifyWebhookUrl !== undefined ? config.amplifyWebhookUrl.trim() : current.amplifyWebhookUrl,
  };
  localStorage.setItem('odia_aws_admin_config', JSON.stringify(merged));
  localStorage.setItem('aws_s3_credentials', JSON.stringify(merged));

  // Also sync to server so server-side comments and story storage can write to S3
  try {
    fetch('/api/s3/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged)
    }).catch(() => {});
  } catch {}
}

/**
 * Syncs AWS config from server to client localStorage
 */
export async function syncAwsConfigFromServer() {
  if (typeof window === 'undefined') return getClientAwsConfig();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('/api/s3/config', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.accessKeyId || data.bucket)) {
        saveClientAwsConfig(data);
      }
    }
  } catch {}
  return getClientAwsConfig();
}

/**
 * Triggers Amplify automated rebuild webhook to refresh all static pages across CDN
 */
export async function triggerAmplifyRebuild(customWebhookUrl?: string): Promise<boolean> {
  const config = getClientAwsConfig();
  const webhookUrl = (customWebhookUrl || config.amplifyWebhookUrl || '').trim();
  if (!webhookUrl) return false;

  try {
    console.log('[Amplify Webhook] 🚀 Pinging Amplify incoming build webhook...');
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Amplify webhooks accept POST without CORS headers
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'admin_content_publish', timestamp: new Date().toISOString() }),
    });
    console.log('[Amplify Webhook] ✅ Webhook pinged successfully');
    return true;
  } catch (err) {
    console.warn('[Amplify Webhook] Webhook ping notice:', err);
    return false;
  }
}

/**
 * Optimizes and compresses an image client-side before sending to server/S3
 * Ensures lightweight transfer, eliminates network lag, and speeds up S3 uploads.
 */
export async function optimizeImage(file: File | Blob, maxDim = 1920, quality = 0.85): Promise<Blob> {
  // If file is SVG or GIF or already under 600KB, return as is
  if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.size < 600 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        file.type === 'image/png' ? 'image/jpeg' : file.type || 'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Converts a browser File or Blob to a Base64 data string
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as base64 string'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image directly to AWS S3 using AWS SDK or via Backend API route (/api/upload).
 * Compatible with AWS Amplify Static Hosting and full-stack servers.
 *
 * @param rawFile The image File or Blob selected by the user
 * @param folder The folder path inside the S3 bucket (e.g. 'posts', 'district', 'temples', 'store', 'slider', 'qr')
 * @param onProgress Optional callback for real-time percentage progress (0 to 100%) and stage description
 * @returns Promise resolving to the permanent image URL
 */
export async function uploadPhotoToS3(
  rawFile: File | Blob,
  folder: string = 'photos',
  onProgress?: (percent: number, stage?: string) => void
): Promise<string> {
  if (onProgress) onProgress(10, 'ଫଟୋ ପ୍ରସ୍ତୁତ ଏବଂ ଅପ୍ଟିମାଇଜ୍ ହେଉଛି...');

  // Step 1: Compress and optimize image client-side for rapid transmission
  const file = await optimizeImage(rawFile);
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  const ext = (rawFile as File).name ? (rawFile as File).name.split('.').pop() || 'jpg' : 'jpg';
  const cleanExt = ext.startsWith('.') ? ext : `.${ext}`;
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileName = `${timestamp}_${randomSuffix}${cleanExt}`;
  const s3Key = `${cleanFolder}/${fileName}`;
  const mimeType = file.type || 'image/jpeg';

  let awsConfig = getClientAwsConfig();
  if (!awsConfig.isDirectReady) {
    try {
      awsConfig = await syncAwsConfigFromServer();
    } catch {}
  }

  // Method 1: Direct AWS S3 Client SDK Upload (Fastest, zero-timeout on AWS Amplify)
  if (awsConfig.isDirectReady) {
    try {
      if (onProgress) onProgress(35, 'AWS S3 (bhakti-ananda-photos) କୁ ସିଧାସଳଖ ଅପଲୋଡ୍ ହେଉଛି...');

      const s3Client = new S3Client({
        region: awsConfig.region,
        credentials: {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
        },
        maxAttempts: 2,
      });

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      if (onProgress) onProgress(65, 'କ୍ଲାଉଡ୍ ଷ୍ଟୋରେଜ୍ ପ୍ରୋସେସ୍ ଚାଲିଛି...');

      const command = new PutObjectCommand({
        Bucket: awsConfig.bucket,
        Key: s3Key,
        Body: uint8Array,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000, immutable',
      });

      // Wrap direct S3 upload in an 8-second circuit breaker to prevent hanging
      const uploadPromise = s3Client.send(command);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('S3 Direct Connection Timeout')), 8000)
      );

      await Promise.race([uploadPromise, timeoutPromise]);

      const finalS3Url = `https://${awsConfig.bucket}.s3.${awsConfig.region}.amazonaws.com/${s3Key}`;
      if (onProgress) onProgress(100, 'ଅପଲୋଡ୍ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି!');
      console.log(`[AWS S3 Direct Upload] Success ->`, finalS3Url);
      return finalS3Url;
    } catch (directErr: any) {
      console.warn('[AWS S3 Direct Upload] Direct upload issue, trying backend route:', directErr?.message || directErr);
    }
  }

  // Method 2: Backend API Proxy Upload (/api/upload)
  if (onProgress) onProgress(40, 'ସର୍ଭର API କୁ ପଠାଯାଉଛି...');

  try {
    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('fileName', fileName);
    formData.append('mimeType', mimeType);
    formData.append('folder', cleanFolder);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for file uploads

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data: S3UploadResponse = await res.json();
      if (data.success && (data.url || data.imageUrl)) {
        const finalUrl = data.url || data.imageUrl;
        if (onProgress) onProgress(100, 'ଅପଲୋଡ୍ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି!');
        return finalUrl;
      }
    }
  } catch (apiErr: any) {
    console.warn('[AWS S3 API Upload] Backend route unavailable on static host:', apiErr?.message || apiErr);
  }

  // Method 3: JSON base64 upload fallback to /api/upload
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64String = btoa(binary);

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64: `data:${mimeType};base64,${base64String}`,
        fileName,
        mimeType,
        folder: cleanFolder,
      }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (data.success && (data.url || data.imageUrl)) {
        const finalUrl = data.url || data.imageUrl;
        if (onProgress) onProgress(100, 'ଅପଲୋଡ୍ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି!');
        return finalUrl;
      }
    }
  } catch {}

  // If we reach here, both Direct S3 and API upload failed.
  throw new Error("AWS S3 କ୍ରେଡେନ୍ସିଆଲ୍ ନାହିଁ! ଦୟାକରି ଆଡମିନ୍ ପ୍ୟାନେଲ୍ ସେଟିଂସ୍ ରେ AWS S3 Access Key ଏବଂ Secret Key ଦିଅନ୍ତୁ ନଚେତ୍ ଫଟୋ ସେଭ୍ ହେବ ନାହିଁ।");
}

/**
 * Checks if AWS S3 server or client integration is active
 */
export async function getS3Config(): Promise<{
  bucket: string;
  region: string;
  isConfigured: boolean;
}> {
  const clientConfig = getClientAwsConfig();
  if (clientConfig.isDirectReady) {
    return {
      bucket: clientConfig.bucket,
      region: clientConfig.region,
      isConfigured: true,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('/api/s3/config', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
      const data = await res.json();
      return {
        bucket: data.bucket || 'bhakti-ananda-photos',
        region: data.region || 'ap-south-1',
        isConfigured: Boolean(data.isConfigured),
      };
    }
  } catch (e) {
    // Backend check skipped on static hosts
  }

  return {
    bucket: clientConfig.bucket || 'bhakti-ananda-photos',
    region: clientConfig.region || 'ap-south-1',
    isConfigured: clientConfig.isDirectReady,
  };
}

