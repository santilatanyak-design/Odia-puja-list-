/**
 * AWS S3 Photo & Media Upload Helper
 * Routes all image uploads directly through our backend server API route (/api/upload)
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
 * Optimizes and compresses an image client-side before sending to server
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
 * Uploads any image File or Blob directly through our backend server API route (/api/upload).
 * The server securely forwards and persists the photo to AWS S3 (bhakti-ananda-photos).
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
  const fileName = (rawFile as File).name || `photo_${Date.now()}.jpg`;
  const mimeType = file.type || 'image/jpeg';

  if (onProgress) onProgress(25, 'ସର୍ଭର API କୁ ପଠାଯାଉଛି...');

  // Step 2: Send directly to our backend server API endpoint via FormData / Binary Stream
  return new Promise((resolve, reject) => {
    let progressTimer: any = null;

    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('fileName', fileName);
    formData.append('mimeType', mimeType);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.timeout = 45000;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.min(80, Math.round(25 + (event.loaded / event.total) * 55));
        onProgress(percent, 'ଫଟୋ ଡାଟା ସର୍ଭରକୁ ଅପଲୋଡ୍ ହେଉଛି...');
      }
    };

    xhr.upload.onload = () => {
      if (onProgress) onProgress(85, 'AWS S3 (bhakti-ananda-photos) ରେ ସେଭ୍ ହେଉଛି...');
      let current = 85;
      progressTimer = setInterval(() => {
        if (current < 98) {
          current += 1;
          if (onProgress) onProgress(current, 'AWS S3 କ୍ଲାଉଡ୍ ପ୍ରୋସେସ୍ ଚାଲିଛି...');
        }
      }, 150);
    };

    xhr.onload = () => {
      if (progressTimer) clearInterval(progressTimer);

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data: S3UploadResponse = JSON.parse(xhr.responseText);
          if (data.success && (data.url || data.imageUrl)) {
            const finalUrl = data.url || data.imageUrl;
            if (onProgress) onProgress(100, 'ଅପଲୋଡ୍ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି!');
            console.log(`[AWS S3] Upload successful via backend API:`, finalUrl);
            resolve(finalUrl);
          } else {
            reject(new Error(data.message || 'Server upload failed to return a valid URL'));
          }
        } catch (e) {
          reject(new Error('Failed to parse server response from upload route'));
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
      if (progressTimer) clearInterval(progressTimer);
      reject(new Error('ଅପଲୋଡ୍ ସମୟ ସମାପ୍ତ (Timeout). ଦୟାକରି ପୁନଃ ଚେଷ୍ଟା କରନ୍ତୁ।'));
    };

    xhr.onerror = () => {
      if (progressTimer) clearInterval(progressTimer);
      reject(new Error('Network error during photo upload. Please check your connection.'));
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

