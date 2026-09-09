import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getClientAwsConfig } from './s3Upload';

export interface AdBanner {
  id: string;
  url: string; // AWS S3 image URL (16:9 aspect ratio)
  title: string;
  subtitle?: string;
  linkUrl: string; // Target affiliate URL (for "Grab Deal" button)
  platform?: 'Amazon' | 'Flipkart' | 'Meesho' | 'Myntra' | 'Brand Store' | 'Other';
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetch live ad banners directly from the AWS backend database / S3.
 * ZERO mock data. If empty, returns strictly [].
 */
export async function fetchAdBanners(): Promise<AdBanner[]> {
  try {
    const res = await fetch(`/api/banners?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.config && Array.isArray(data.config.images)) {
        return data.config.images;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch banners from AWS API:', e);
  }

  // Direct AWS S3 Fallback (if bucket configured)
  const aws = getClientAwsConfig();
  if (aws.region && aws.bucket) {
    try {
      const s3Url = `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/slider/config.json?t=${Date.now()}`;
      const res = await fetch(s3Url);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.images)) {
          return data.images;
        }
      }
    } catch (e) {}
  }

  return [];
}

/**
 * Save ad banners list directly to AWS backend API and AWS S3 bucket.
 * Real HTTP POST request and S3 PutObjectCommand.
 */
export async function saveAdBanners(banners: AdBanner[]): Promise<boolean> {
  let backendSuccess = false;
  const payload = {
    autoSlideIntervalSeconds: 5,
    images: banners,
    updatedAt: new Date().toISOString()
  };

  try {
    const res = await fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      backendSuccess = true;
    }
  } catch (err) {
    console.warn('Error saving banners via API:', err);
  }

  // Direct AWS S3 Sync
  const aws = getClientAwsConfig();
  if (aws.region && aws.bucket && aws.accessKeyId && aws.secretAccessKey) {
    try {
      const s3Client = new S3Client({
        region: aws.region,
        credentials: { 
          accessKeyId: aws.accessKeyId, 
          secretAccessKey: aws.secretAccessKey 
        },
      });
      const bytes = new TextEncoder().encode(JSON.stringify(payload, null, 2));
      await s3Client.send(new PutObjectCommand({
        Bucket: aws.bucket,
        Key: 'slider/config.json',
        Body: bytes,
        ContentType: 'application/json; charset=utf-8',
        CacheControl: 'public, max-age=0, must-revalidate',
      }));
      backendSuccess = true;
    } catch (s3Err) {
      console.warn('Error saving banners to S3:', s3Err);
    }
  }

  return backendSuccess;
}

/**
 * Permanently delete a banner from AWS backend and S3.
 */
export async function deleteAdBanner(id: string, allBanners: AdBanner[]): Promise<boolean> {
  const updated = allBanners.filter(b => b.id !== id);
  try {
    await fetch(`/api/banners/${id}`, { method: 'DELETE' });
  } catch (e) {}

  return await saveAdBanners(updated);
}
