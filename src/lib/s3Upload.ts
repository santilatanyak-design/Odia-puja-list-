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
 * @param onProgress Optional callback for real-time percentage progress (0 to 100%)
 * @returns Promise resolving to the permanent S3 URL
 */
export function uploadPhotoToS3(
  file: File | Blob,
  folder: string = 'photos',
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      if (onProgress) onProgress(8);

      const base64Data = await fileToBase64(file);
      if (onProgress) onProgress(20);

      const fileName = (file as File).name || `photo_${Date.now()}.jpg`;
      const mimeType = file.type || 'image/jpeg';

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // Scale progress smoothly from 20% to 92%
          const percent = Math.min(92, Math.round(20 + (event.loaded / event.total) * 72));
          if (onProgress) onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data: S3UploadResponse = JSON.parse(xhr.responseText);
            if (data.success && data.url) {
              if (onProgress) onProgress(100);
              console.log(`[AWS S3] Uploaded successfully to bhakti-ananda-photos:`, data.url);
              resolve(data.url);
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

      xhr.onerror = () => {
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

