import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getClientAwsConfig } from './s3Upload';

export interface AffiliateProduct {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  affiliateUrl: string;
  platform: 'Amazon' | 'Flipkart' | 'Meesho' | 'Myntra' | 'Other';
  category?: string;
  isFeatured?: boolean;
  inStock?: boolean;
  youtubeUrl?: string;
}

export async function saveAffiliateProductToS3(product: AffiliateProduct): Promise<boolean> {
  const aws = getClientAwsConfig();
  if (!aws.region || !aws.bucket || !aws.accessKeyId || !aws.secretAccessKey) {
    console.error("AWS credentials missing for affiliate product upload");
    return false;
  }

  try {
    const s3Client = new S3Client({
      region: aws.region,
      credentials: {
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey
      }
    });

    const bytes = new TextEncoder().encode(JSON.stringify(product, null, 2));
    await s3Client.send(new PutObjectCommand({
      Bucket: aws.bucket,
      Key: `affiliate/product-${product.id}.json`,
      Body: bytes,
      ContentType: 'application/json; charset=utf-8',
      CacheControl: 'public, max-age=60',
    }));
    
    // Attempt to update the master index
    try {
      const indexUrl = `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/affiliate/index.json?t=${Date.now()}`;
      let products: AffiliateProduct[] = [];
      try {
        const res = await fetch(indexUrl);
        if (res.ok) {
          products = await res.json();
        }
      } catch (e) {}
      
      const existingIdx = products.findIndex(p => p.id === product.id);
      if (existingIdx > -1) {
        products[existingIdx] = product;
      } else {
        products.unshift(product);
      }
      
      const idxBytes = new TextEncoder().encode(JSON.stringify(products, null, 2));
      await s3Client.send(new PutObjectCommand({
        Bucket: aws.bucket,
        Key: `affiliate/index.json`,
        Body: idxBytes,
        ContentType: 'application/json; charset=utf-8',
        CacheControl: 'public, max-age=60',
      }));
    } catch(e) {
      console.warn("Could not update affiliate index", e);
    }
    
    return true;
  } catch (err) {
    console.error("Error saving affiliate product:", err);
    return false;
  }
}

export async function fetchAffiliateProducts(): Promise<AffiliateProduct[]> {
  const aws = getClientAwsConfig();
  if (!aws.region || !aws.bucket) return [];
  
  try {
    const indexUrl = `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/affiliate/index.json?t=${Date.now()}`;
    const res = await fetch(indexUrl);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Error fetching affiliate products", e);
  }
  return [];
}
