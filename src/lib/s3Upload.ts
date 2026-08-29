/**
 * AWS S3 Photo & Media Upload Helper
 * Direct integration with AWS S3 Bucket: 'bhakti-ananda-photos' (Region: ap-south-1)
 * Enhanced with Presigned URL Direct Upload, Stream Proxy, and Client Image Optimization.
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

export interface PresignedUrlResponse {
  success: boolean;
  presignedUrl?: string;
  finalUrl: string;
  key: string;
  bucket: string;
  region: string;
  isDirectS3: boolean;
}

/**
 * Optimizes/compresses an image client-side to prevent network bottlenecks and timeouts
 */
export async function optimizeImage(file: File | Blob, maxDim = 1920, quality = 0.85): Promise<Blob> {
  // If file is SVG or GIF or already under 800KB, skip resizing
  if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.size < 800 * 1024) {
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
 * Attempts direct upload via AWS S3 Presigned URL
 */
async function uploadViaPresignedUrl(
  file: Blob,
  presignedUrl: string,
  contentType: string,
  onProgress?: (percent: number, stage?: string) => void
): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.timeout = 30000;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.min(95, Math.round(20 + (event.loaded / event.total) * 75));
        onProgress(percent, 'AWS S3 କୁ ସିଧାସଳଖ ଅପଲୋଡ୍ ହେଉଛି...');
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(true);
      } else {
        console.warn(`[Presigned Upload] Direct S3 PUT failed with status ${xhr.status}`);
        resolve(false);
      }
    };

    xhr.ontimeout = () => {
      console.warn('[Presigned Upload] Direct S3 PUT timed out, falling back to proxy');
      resolve(false);
    };

    xhr.onerror = () => {
      console.warn('[Presigned Upload] Direct S3 PUT network error (likely CORS), falling back to proxy');
      resolve(false);
    };

    xhr.send(file);
  });
}

/**
 * Uploads any image File or Blob directly to AWS S3 bucket: 'bhakti-ananda-photos'
 * Uses multipart streaming backend proxy or presigned direct S3 upload with automatic optimization.
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
  if (onProgress) onProgress(8, 'ଫଟୋ ପ୍ରସ୍ତୁତ ଏବଂ ଅପ୍ଟିମାଇଜ୍ ହେଉଛି...');

  // Step 1: Compress image client-side if needed for instant transfer
  const file = await optimizeImage(rawFile);
  const fileName = (rawFile as File).name || `photo_${Date.now()}.jpg`;
  const mimeType = file.type || 'image/jpeg';

  // Step 2: Try fetching presigned URL first for direct S3 capability
  try {
    if (onProgress) onProgress(18, 'AWS S3 କନେକ୍ସନ୍ ଯାଞ୍ଚ ହେଉଛି...');
    const presignRes = await fetch('/api/upload/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, mimeType, folder }),
    });

    if (presignRes.ok) {
      const presignData: PresignedUrlResponse = await presignRes.json();
      if (presignData.success && presignData.presignedUrl && presignData.isDirectS3) {
        const directSuccess = await uploadViaPresignedUrl(file, presignData.presignedUrl, mimeType, onProgress);
        if (directSuccess) {
          if (onProgress) onProgress(100, 'AWS S3 ଅପଲୋଡ୍ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି!');
          return presignData.finalUrl;
        }
      }
    }
  } catch (e) {
    console.log('[Presign Step] Proceeding with backend stream proxy:', e);
  }

  // Step 3: Backend Server Proxy Endpoint (/api/upload) via fast multipart/form-data
  return new Promise((resolve, reject) => {
    let postUploadTimer: any = null;

    if (onProgress) onProgress(25, 'ସର୍ଭର ପ୍ରକ୍ସି ମାଧ୍ୟମରେ ଅପଲୋଡ୍ ହେଉଛି...');

    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('fileName', fileName);
    formData.append('mimeType', mimeType);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    // 50 seconds timeout for large files
    xhr.timeout = 50000;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.min(85, Math.round(25 + (event.loaded / event.total) * 60));
        onProgress(percent, 'ଫଟୋ ଡାଟା ପଠାଯାଉଛି...');
      }
    };

    xhr.upload.onload = () => {
      if (onProgress) onProgress(88, 'AWS S3 (bhakti-ananda-photos) ରେ ସେଭ୍ ହେଉଛି...');
      let current = 88;
      postUploadTimer = setInterval(() => {
        if (current < 98) {
          current += 1;
          if (onProgress) onProgress(current, 'AWS S3 କ୍ଲାଉଡ୍ ପ୍ରୋସେସ୍ ଚାଲିଛି...');
        }
      }, 250);
    };

    xhr.onload = () => {
      if (postUploadTimer) clearInterval(postUploadTimer);

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data: S3UploadResponse = JSON.parse(xhr.responseText);
          if (data.success && (data.url || data.imageUrl)) {
            const finalUrl = data.url || data.imageUrl;
            if (onProgress) onProgress(100, 'ଅପଲୋଡ୍ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି!');
            console.log(`[AWS S3] Upload successful via backend proxy:`, finalUrl);
            resolve(finalUrl);
          } else {
            reject(new Error(data.message || 'AWS S3 upload did not return a valid URL'));
          }
        } catch (e) {
          reject(new Error('Failed to parse server response from S3 uploader'));
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.ontimeout = () => {
      if (postUploadTimer) clearInterval(postUploadTimer);
      reject(new Error('AWS S3 ଅପଲୋଡ୍ ସମୟ ସମାପ୍ତ (Timeout). ଦୟାକରି ଇଣ୍ଟରନେଟ୍ ଯାଞ୍ଚ କରି ପୁନଃ ଚେଷ୍ଟା କରନ୍ତୁ।'));
    };

    xhr.onerror = () => {
      if (postUploadTimer) clearInterval(postUploadTimer);
      reject(new Error('Network error during AWS S3 photo upload. Please check your connection.'));
    };

    xhr.send(formData);
  });
}

/**
 * Checks if AWS S3 server integration is active
 */
export async function getS3Config(): Promise<{
  bucket: string;
  region: string;
  isConfigured: boolean;
}> {
  try {
    const res = await fetch('/api/s3/config');
    if (res.ok) {
      const data = await res.json();
      return {
        bucket: data.bucket || 'bhakti-ananda-photos',
        region: data.region || 'ap-south-1',
        isConfigured: Boolean(data.isConfigured),
      };
    }
  } catch (e) {
    console.warn('Could not fetch S3 config:', e);
  }
  return {
    bucket: 'bhakti-ananda-photos',
    region: 'ap-south-1',
    isConfigured: false,
  };
}

