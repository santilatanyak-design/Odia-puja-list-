import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
  createdAt?: string;
  updatedAt?: string;
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

    const payload: AffiliateProduct = {
      ...product,
      updatedAt: new Date().toISOString(),
      createdAt: product.createdAt || new Date().toISOString()
    };

    const bytes = new TextEncoder().encode(JSON.stringify(payload, null, 2));
    await s3Client.send(new PutObjectCommand({
      Bucket: aws.bucket,
      Key: `affiliate/product-${payload.id}.json`,
      Body: bytes,
      ContentType: 'application/json; charset=utf-8',
      CacheControl: 'public, max-age=60',
    }));
    
    // Update the AWS S3 master index
    try {
      const indexUrl = `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/affiliate/index.json?t=${Date.now()}`;
      let products: AffiliateProduct[] = [];
      try {
        const res = await fetch(indexUrl);
        if (res.ok) {
          products = await res.json();
        }
      } catch (e) {}
      
      const existingIdx = products.findIndex(p => p.id === payload.id);
      if (existingIdx > -1) {
        products[existingIdx] = payload;
      } else {
        products.unshift(payload);
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

export async function deleteAffiliateProductFromS3(productId: string): Promise<boolean> {
  const aws = getClientAwsConfig();
  if (!aws.region || !aws.bucket || !aws.accessKeyId || !aws.secretAccessKey) {
    console.error("AWS credentials missing for affiliate product deletion");
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

    // Delete single product file
    await s3Client.send(new DeleteObjectCommand({
      Bucket: aws.bucket,
      Key: `affiliate/product-${productId}.json`,
    }));

    // Update master index
    try {
      const indexUrl = `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/affiliate/index.json?t=${Date.now()}`;
      let products: AffiliateProduct[] = [];
      try {
        const res = await fetch(indexUrl);
        if (res.ok) {
          products = await res.json();
        }
      } catch (e) {}

      const updated = products.filter(p => p.id !== productId);
      const idxBytes = new TextEncoder().encode(JSON.stringify(updated, null, 2));
      await s3Client.send(new PutObjectCommand({
        Bucket: aws.bucket,
        Key: `affiliate/index.json`,
        Body: idxBytes,
        ContentType: 'application/json; charset=utf-8',
        CacheControl: 'public, max-age=60',
      }));
    } catch(e) {
      console.warn("Could not update affiliate index after delete", e);
    }

    return true;
  } catch (err) {
    console.error("Error deleting affiliate product:", err);
    return false;
  }
}

export async function saveAffiliateProduct(product: AffiliateProduct): Promise<boolean> {
  const payload: AffiliateProduct = {
    ...product,
    updatedAt: new Date().toISOString(),
    createdAt: product.createdAt || new Date().toISOString()
  };

  let backendSuccess = false;

  // 1. Real AWS API POST Request
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      backendSuccess = true;
      console.log('[AWS API] Successfully saved product via AWS API POST endpoint');
    }
  } catch (apiErr) {
    console.warn('[AWS API] Error posting to /api/products:', apiErr);
  }

  // 2. Direct AWS S3 Client sync if browser credentials available
  let directS3Success = false;
  try {
    directS3Success = await saveAffiliateProductToS3(payload);
  } catch (s3Err) {
    console.warn('[AWS S3 Direct] Error saving directly to S3:', s3Err);
  }

  return backendSuccess || directS3Success;
}

export async function updateAffiliateProduct(productId: string, product: Partial<AffiliateProduct>): Promise<boolean> {
  const payload = {
    ...product,
    id: productId,
    updatedAt: new Date().toISOString(),
  };

  let backendSuccess = false;

  // 1. Real AWS API PUT Request
  try {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      backendSuccess = true;
      console.log(`[AWS API] Successfully updated product ${productId} via PUT endpoint`);
    }
  } catch (apiErr) {
    console.warn(`[AWS API] Error updating via PUT /api/products/${productId}:`, apiErr);
  }

  // 2. Direct AWS S3 Client sync if browser credentials available
  try {
    await saveAffiliateProductToS3(payload as AffiliateProduct);
  } catch (s3Err) {
    console.warn('[AWS S3 Direct] Error updating directly in S3:', s3Err);
  }

  return backendSuccess;
}

export async function deleteAffiliateProduct(productId: string): Promise<boolean> {
  let backendSuccess = false;

  // 1. Real AWS API DELETE Request
  try {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      backendSuccess = true;
    }
  } catch (apiErr) {
    console.warn('[AWS API] Error deleting via /api/products:', apiErr);
  }

  // 2. Direct AWS S3 delete
  await deleteAffiliateProductFromS3(productId).catch(() => {});

  return backendSuccess;
}

export async function fetchAffiliateProductById(productId: string): Promise<AffiliateProduct | null> {
  // 1. Try real AWS backend API endpoint with retry
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`/api/products/${productId}?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.product || data.id)) {
          return data.product || data;
        }
      }
    } catch (e) {
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 400));
        continue;
      }
    }
  }

  // 2. Direct AWS S3 fallback (if accessible)
  const aws = getClientAwsConfig();
  if (aws.region && aws.bucket) {
    try {
      const s3Url = `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/affiliate/product-${productId}.json?t=${Date.now()}`;
      const res = await fetch(s3Url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
  }

  return null;
}

export async function fetchAffiliateProducts(retries = 2): Promise<AffiliateProduct[]> {
  // 1. Fetch live data directly from the AWS backend API with automatic retry
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (apiErr) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
    }
  }

  // 2. Fallback to direct AWS S3 Master Index (if accessible)
  const aws = getClientAwsConfig();
  if (aws.region && aws.bucket) {
    try {
      const indexUrl = `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/affiliate/index.json?t=${Date.now()}`;
      const res = await fetch(indexUrl);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (e) {
      // Direct S3 fallback handled gracefully
    }
  }

  return [];
}
