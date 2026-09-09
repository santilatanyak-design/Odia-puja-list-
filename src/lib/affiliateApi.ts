import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getClientAwsConfig } from './s3Upload';
import { autoPublishDealHtmlToS3 } from './publishDealHtml';

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

    // Automatically generate and upload static HTML for WhatsApp and Facebook social media scrapers
    try {
      await autoPublishDealHtmlToS3(payload);
    } catch (htmlErr) {
      console.warn("Could not auto-publish deal HTML to S3:", htmlErr);
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

    // Delete single product JSON and static HTML files from S3
    const safeDelete = async (key: string) => {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: aws.bucket,
          Key: key,
        }));
      } catch {}
    };

    await safeDelete(`affiliate/product-${productId}.json`);
    await safeDelete(`deal/${productId}.html`);
    await safeDelete(`deal/${productId}`);
    await safeDelete(`deal/${productId}/index.html`);
    await safeDelete(`product/${productId}.html`);
    await safeDelete(`product/${productId}`);
    await safeDelete(`affiliate/product-${productId}.html`);

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
  const rawId = (productId || '').replace(/\.html?$/i, '').replace(/^(\/)?deal\//i, '').replace(/^(\/)?product\//i, '').trim();
  const idWithoutProd = rawId.replace(/^prod_/, '');
  const idWithProd = rawId.startsWith('prod_') ? rawId : `prod_${rawId}`;

  // 1. Check window.__PRELOADED_STATE__ from S3 HTML SSR
  if (typeof window !== 'undefined' && (window as any).__PRELOADED_STATE__?.deal) {
    const preloaded = (window as any).__PRELOADED_STATE__.deal;
    if (preloaded.id === rawId || preloaded.id === idWithProd || preloaded.id === idWithoutProd) {
      return preloaded;
    }
  }

  // 2. Check localStorage cache
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem('odia_affiliate_products_v2') || localStorage.getItem('affiliate-products');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const match = list.find(p => p && (p.id === rawId || p.id === idWithProd || p.id === idWithoutProd));
          if (match) return match;
        }
      }
    } catch {}
  }

  // 3. Try live domain CloudFront / S3 JSON endpoints directly
  const LIVE_DOMAIN = 'https://www.bhaktianandaodiatvofficial.blog';
  const targetIds = Array.from(new Set([rawId, idWithProd, idWithoutProd]));
  for (const tid of targetIds) {
    try {
      const directUrl = `${LIVE_DOMAIN}/affiliate/product-${tid}.json?t=${Date.now()}`;
      const res = await fetch(directUrl);
      if (res.ok) {
        const item = await res.json();
        if (item && item.id) return item;
      }
    } catch {}
  }

  // 4. Try real AWS backend API endpoint with retry
  for (const tid of targetIds) {
    try {
      const res = await fetch(`/api/products/${tid}?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.product || data.id)) {
          return data.product || data;
        }
      }
    } catch {}
  }

  // 5. Direct AWS S3 bucket endpoint (if configured)
  const aws = getClientAwsConfig();
  if (aws.region && aws.bucket) {
    for (const tid of targetIds) {
      try {
        const s3Url = `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/affiliate/product-${tid}.json?t=${Date.now()}`;
        const res = await fetch(s3Url);
        if (res.ok) {
          return await res.json();
        }
      } catch {}
    }
  }

  // 6. Master index search across all products
  try {
    const all = await fetchAffiliateProducts();
    const match = all.find(p => p && (p.id === rawId || p.id === idWithProd || p.id === idWithoutProd));
    if (match) return match;
  } catch {}

  return null;
}

export async function fetchAffiliateProducts(retries = 2): Promise<AffiliateProduct[]> {
  // 1. Fetch live data from AWS backend API or CloudFront live master index
  const LIVE_DOMAIN = 'https://www.bhaktianandaodiatvofficial.blog';
  
  // Try direct CloudFront master index first
  try {
    const liveIndexRes = await fetch(`${LIVE_DOMAIN}/affiliate/index.json?t=${Date.now()}`);
    if (liveIndexRes.ok) {
      const data = await liveIndexRes.json();
      if (Array.isArray(data) && data.length > 0) {
        try {
          localStorage.setItem('odia_affiliate_products_v2', JSON.stringify(data));
        } catch {}
        return data;
      }
    }
  } catch {}

  // Try real AWS API endpoint with retry
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          try {
            localStorage.setItem('odia_affiliate_products_v2', JSON.stringify(data));
          } catch {}
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

  // Fallback to direct AWS S3 Master Index
  const aws = getClientAwsConfig();
  if (aws.region && aws.bucket) {
    try {
      const indexUrl = `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/affiliate/index.json?t=${Date.now()}`;
      const res = await fetch(indexUrl);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          try {
            localStorage.setItem('odia_affiliate_products_v2', JSON.stringify(data));
          } catch {}
          return data;
        }
      }
    } catch (e) {}
  }

  // Fallback to localStorage cache
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const cached = localStorage.getItem('odia_affiliate_products_v2') || localStorage.getItem('affiliate-products');
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch {}
  }

  return [];
}
