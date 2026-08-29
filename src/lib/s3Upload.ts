/**
 * AWS S3 Photo & Media Upload Helper
 * Direct integration with AWS S3 Bucket: 'bhakti-ananda-photos' (Region: ap-south-1)
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
 * Uploads any image File or Blob directly to AWS S3 bucket: 'bhakti-ananda-photos' with real-time percentage progress
 * @param file The image File or Blob selected by the user
 * @param folder The folder path inside the S3 bucket (e.g. 'posts', 'district', 'temples', 'store', 'slider', 'qr')
 * @param onProgress Optional callback for real-time percentage progress (0 to 100%) and stage description
 * @returns Promise resolving to the permanent S3 URL
 */
export function uploadPhotoToS3(
  file: File | Blob,
  folder: string = 'photos',
  onProgress?: (percent: number, stage?: string) => void
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let postUploadTimer: any = null;

    try {
      if (onProgress) onProgress(5, 'ଫଟୋ ପ୍ରସ୍ତୁତ ହେଉଛି...');

      const base64Data = await fileToBase64(file);
      if (onProgress) onProgress(15, 'ସର୍ଭରକୁ ଡାଟା ପଠାଯାଉଛି...');

      const fileName = (file as File).name || `photo_${Date.now()}.jpg`;
      const mimeType = file.type || 'image/jpeg';

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      // 45 seconds timeout to prevent freezing
      xhr.timeout = 45000;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // Scale bytes progress smoothly from 15% to 85%
          const percent = Math.min(85, Math.round(15 + (event.loaded / event.total) * 70));
          if (onProgress) onProgress(percent, 'ଫଟୋ ଡାଟା ଅପଲୋଡ୍ ହେଉଛି...');
        }
      };

      xhr.upload.onload = () => {
        if (onProgress) onProgress(88, 'AWS S3 (bhakti-ananda-photos) ରେ ସେଭ୍ ହେଉଛି...');
        // Smoothly advance from 88% towards 98% while AWS S3 persists the image
        let current = 88;
        postUploadTimer = setInterval(() => {
          if (current < 97) {
            current += 1;
            if (onProgress) onProgress(current, 'AWS S3 କ୍ଲାଉଡ୍ ପ୍ରୋସେସ୍ ଚାଲିଛି...');
          }
        }, 300);
      };

      xhr.onload = () => {
        if (postUploadTimer) clearInterval(postUploadTimer);

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data: S3UploadResponse = JSON.parse(xhr.responseText);
            if (data.success && (data.url || data.imageUrl)) {
              const finalUrl = data.url || data.imageUrl;
              if (onProgress) onProgress(100, 'ଅପଲୋଡ୍ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି!');
              console.log(`[AWS S3] Uploaded successfully:`, finalUrl);
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

      xhr.send(
        JSON.stringify({
          fileData: base64Data,
          fileName,
          mimeType,
          folder,
        })
      );
    } catch (error: any) {
      if (postUploadTimer) clearInterval(postUploadTimer);
      console.error('Failed to upload photo to AWS S3:', error);
      reject(error);
    }
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

