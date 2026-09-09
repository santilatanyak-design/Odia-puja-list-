import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import { initializeApp, getApps, getApp } from 'firebase/app';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

function getAwsConfig(): { region: string; bucket: string; accessKeyId: string; secretAccessKey: string } {
  let cfg: any = {};
  const localAwsPath = path.join(process.cwd(), 'aws-config.json');
  if (fs.existsSync(localAwsPath)) {
    try { cfg = JSON.parse(fs.readFileSync(localAwsPath, 'utf-8')); } catch {}
  }
  return {
    region: (process.env.VITE_AWS_REGION || process.env.AWS_REGION || process.env.MY_AWS_REGION || cfg.region || 'ap-south-1').trim(),
    bucket: (process.env.VITE_AWS_BUCKET || process.env.AWS_BUCKET || process.env.MY_AWS_S3_BUCKET_NAME || cfg.bucket || 'bhakti-ananda-photos').trim(),
    accessKeyId: (process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || process.env.MY_AWS_ACCESS_KEY_ID || cfg.accessKeyId || '').trim(),
    secretAccessKey: (process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || process.env.MY_AWS_SECRET_ACCESS_KEY || cfg.secretAccessKey || '').trim(),
  };
}

app.get("/api/s3/config", (req, res) => {
  const cfg = getAwsConfig();
  res.json({
    ...cfg,
    isConfigured: Boolean(cfg.accessKeyId && cfg.secretAccessKey),
  });
});

app.post("/api/s3/config", (req, res) => {
  try {
    const { region, bucket, accessKeyId, secretAccessKey } = req.body || {};
    const localAwsPath = path.join(process.cwd(), 'aws-config.json');
    let existing: any = {};
    if (fs.existsSync(localAwsPath)) {
      try { existing = JSON.parse(fs.readFileSync(localAwsPath, 'utf-8')); } catch {}
    }
    const updated = {
      region: (region || existing.region || 'ap-south-1').trim(),
      bucket: (bucket || existing.bucket || 'bhakti-ananda-photos').trim(),
      accessKeyId: (accessKeyId || existing.accessKeyId || '').trim(),
      secretAccessKey: (secretAccessKey || existing.secretAccessKey || '').trim()
    };
    fs.writeFileSync(localAwsPath, JSON.stringify(updated, null, 2), 'utf-8');
    res.json({ success: true, config: updated, isConfigured: Boolean(updated.accessKeyId && updated.secretAccessKey) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/s3/test", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { region, bucket, accessKeyId, secretAccessKey } = req.body || {};
    const cfg = getAwsConfig();
    const finalRegion = (region || cfg.region || 'ap-south-1').trim();
    const finalBucket = (bucket || cfg.bucket || 'bhakti-ananda-photos').trim();
    const finalAccessKeyId = (accessKeyId || cfg.accessKeyId || '').trim();
    const finalSecretAccessKey = (secretAccessKey || cfg.secretAccessKey || '').trim();

    if (!finalAccessKeyId || !finalSecretAccessKey) {
      return res.status(400).json({ success: false, error: 'AWS Access Key ID and Secret Access Key are required.' });
    }

    const { HeadBucketCommand, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    const s3Client = new S3Client({
      region: finalRegion,
      credentials: {
        accessKeyId: finalAccessKeyId,
        secretAccessKey: finalSecretAccessKey,
      },
      maxAttempts: 1,
    });

    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: finalBucket }));
    } catch (headErr) {
      await s3Client.send(new ListObjectsV2Command({ Bucket: finalBucket, MaxKeys: 1 }));
    }

    return res.json({ success: true, message: "AWS S3 Connected Successfully!" });
  } catch (err: any) {
    console.error('Error testing S3 connection:', err);
    return res.status(200).json({ success: false, error: err.message || 'AWS S3 connection failed' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ==========================================
// REAL AWS S3 IMAGE UPLOADER API
// ==========================================
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    let fileBuffer: Buffer | null = null;
    let fileName: string = '';
    let mimeType: string = 'image/jpeg';
    let folder: string = 'photos';

    if (req.file) {
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname || `upload_${Date.now()}.jpg`;
      mimeType = req.file.mimetype || 'image/jpeg';
      folder = req.body.folder || 'photos';
    } else if (req.body && (req.body.base64 || req.body.file)) {
      const b64Data = req.body.base64 || req.body.file;
      const matches = b64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        fileBuffer = Buffer.from(matches[2], 'base64');
      } else {
        fileBuffer = Buffer.from(b64Data, 'base64');
      }
      folder = req.body.folder || 'photos';
      const ext = mimeType.split('/')[1] || 'jpg';
      fileName = `upload_${Date.now()}.${ext}`;
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const ext = fileName.includes('.') ? fileName.split('.').pop() || 'jpg' : 'jpg';
    const s3Key = `${cleanFolder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const aws = getAwsConfig();
    const AWS_REGION = aws.region || 'ap-south-1';
    const AWS_BUCKET = aws.bucket || 'bhakti-ananda-photos';

    // If AWS credentials exist, attempt upload directly to AWS S3 bucket
    if (aws.accessKeyId && aws.secretAccessKey) {
      try {
        const s3Client = new S3Client({
          region: AWS_REGION,
          credentials: {
            accessKeyId: aws.accessKeyId,
            secretAccessKey: aws.secretAccessKey,
          },
        });

        await s3Client.send(new PutObjectCommand({
          Bucket: AWS_BUCKET,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: mimeType,
          CacheControl: 'public, max-age=31536000, immutable',
        }));

        const finalUrl = `https://${AWS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
        console.log('[AWS S3 API Upload] Uploaded successfully to S3:', finalUrl);
        return res.json({ success: true, url: finalUrl, imageUrl: finalUrl, key: s3Key });
      } catch (s3Err: any) {
        console.warn('[AWS S3 API Upload] S3 client upload failed, using local persistent fallback:', s3Err?.message || s3Err);
      }
    }

    // High availability local persistent fallback
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', cleanFolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const localFilePath = path.join(uploadDir, `${Date.now()}_${path.basename(fileName)}`);
    fs.writeFileSync(localFilePath, fileBuffer);
    const localUrl = `/uploads/${cleanFolder}/${path.basename(localFilePath)}`;
    console.log('[Upload API] Saved locally to:', localUrl);
    return res.json({ success: true, url: localUrl, imageUrl: localUrl, key: s3Key, isLocalFallback: true });
  } catch (err: any) {
    console.error('Error in /api/upload:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// REAL AWS BACKEND DATA API: PRODUCTS
// ==========================================
function readLocalProducts(): any[] {
  const paths = [
    path.join(process.cwd(), 'public', 'affiliate-products.json'),
    path.join(process.cwd(), 'dist', 'affiliate-products.json'),
    path.join(process.cwd(), 'affiliate-products.json')
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) return data;
      } catch {}
    }
  }
  return [];
}

function saveLocalProducts(products: any[]) {
  const paths = [
    path.join(process.cwd(), 'public', 'affiliate-products.json'),
    path.join(process.cwd(), 'dist', 'affiliate-products.json'),
    path.join(process.cwd(), 'affiliate-products.json')
  ];
  for (const p of paths) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(products, null, 2), 'utf-8');
    } catch (e) {
      console.warn(`Could not save products to ${p}:`, e);
    }
  }
}

// GET all products: checks AWS S3 master index then local persistence
app.get(['/api/products', '/api/affiliate/products'], async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const aws = getAwsConfig();

  if (aws.bucket && aws.region && aws.accessKeyId && aws.secretAccessKey) {
    try {
      const s3Client = new S3Client({
        region: aws.region,
        credentials: {
          accessKeyId: aws.accessKeyId,
          secretAccessKey: aws.secretAccessKey,
        },
      });
      const s3Res = await s3Client.send(new GetObjectCommand({
        Bucket: aws.bucket,
        Key: 'affiliate/index.json',
      }));
      if (s3Res.Body) {
        const bodyStr = await s3Res.Body.transformToString();
        const s3Data = JSON.parse(bodyStr);
        if (Array.isArray(s3Data) && s3Data.length > 0) {
          saveLocalProducts(s3Data);
          return res.json(s3Data);
        }
      }
    } catch (e) {
      // S3 object might not exist yet, fallback to local storage
    }
  }

  const list = readLocalProducts();
  return res.json(list);
});

// GET single product by ID
app.get(['/api/products/:id', '/api/affiliate/products/:id'], async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const { id } = req.params;
  const cleanId = String(id).replace(/^prod_/, '').trim();
  const aws = getAwsConfig();

  if (aws.bucket && aws.region && aws.accessKeyId && aws.secretAccessKey) {
    const s3Client = new S3Client({
      region: aws.region,
      credentials: {
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
      },
    });
    const keys = [
      `affiliate/product-${id}.json`,
      `affiliate/product-${cleanId}.json`,
      `affiliate/product-prod_${cleanId}.json`
    ];
    for (const key of keys) {
      try {
        const s3Res = await s3Client.send(new GetObjectCommand({
          Bucket: aws.bucket,
          Key: key,
        }));
        if (s3Res.Body) {
          const bodyStr = await s3Res.Body.transformToString();
          const item = JSON.parse(bodyStr);
          return res.json({ success: true, product: item });
        }
      } catch {}
    }
  }

  const list = readLocalProducts();
  const found = list.find((p: any) => p.id === id || p.id === `prod_${cleanId}` || p.id === cleanId);
  if (found) {
    return res.json({ success: true, product: found });
  }

  return res.status(404).json({ error: 'Product not found' });
});

// POST save product: Writes directly to AWS S3 & persists locally
app.post(['/api/products', '/api/affiliate/products'], async (req, res) => {
  try {
    const body = req.body || {};
    const product = body.product || body;

    if (!product.title || !product.imageUrl || !product.affiliateUrl) {
      return res.status(400).json({ error: 'Missing required product fields (title, imageUrl, affiliateUrl)' });
    }

    const productId = product.id || `prod_${Date.now()}`;
    const fullProduct = {
      id: productId,
      title: String(product.title).trim(),
      description: String(product.description || '').trim(),
      imageUrl: String(product.imageUrl).trim(),
      affiliateUrl: String(product.affiliateUrl).trim(),
      youtubeUrl: String(product.youtubeUrl || '').trim(),
      platform: product.platform || 'Amazon',
      category: product.category || 'Spiritual & Puja',
      isFeatured: Boolean(product.isFeatured),
      inStock: product.inStock !== false,
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update local persistent file
    const currentList = readLocalProducts();
    const existingIndex = currentList.findIndex((p: any) => p.id === productId);
    let updatedList = [...currentList];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = fullProduct;
    } else {
      updatedList.unshift(fullProduct);
    }
    saveLocalProducts(updatedList);

    // Sync to AWS S3 bucket
    const aws = getAwsConfig();
    if (aws.accessKeyId && aws.secretAccessKey && aws.bucket && aws.region) {
      try {
        const s3Client = new S3Client({
          region: aws.region,
          credentials: {
            accessKeyId: aws.accessKeyId,
            secretAccessKey: aws.secretAccessKey,
          },
        });

        // 1. Single product JSON file in S3: affiliate/product-${productId}.json
        const singleBytes = new TextEncoder().encode(JSON.stringify(fullProduct, null, 2));
        await s3Client.send(new PutObjectCommand({
          Bucket: aws.bucket,
          Key: `affiliate/product-${productId}.json`,
          Body: singleBytes,
          ContentType: 'application/json; charset=utf-8',
          CacheControl: 'public, max-age=0, must-revalidate',
        }));

        // 2. Master index JSON file in S3: affiliate/index.json
        const indexBytes = new TextEncoder().encode(JSON.stringify(updatedList, null, 2));
        await s3Client.send(new PutObjectCommand({
          Bucket: aws.bucket,
          Key: `affiliate/index.json`,
          Body: indexBytes,
          ContentType: 'application/json; charset=utf-8',
          CacheControl: 'public, max-age=0, must-revalidate',
        }));
        console.log(`[AWS S3] ✅ Successfully saved product ${productId} and master index to AWS S3!`);
      } catch (s3Err) {
        console.error('[AWS S3 Error] Failed pushing product to S3:', s3Err);
      }
    }

    return res.json({ success: true, product: fullProduct });
  } catch (err: any) {
    console.error('Error saving product:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT & PATCH update product in AWS S3 and database
app.put(['/api/products/:id', '/api/affiliate/products/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const product = body.product || body;

    const currentList = readLocalProducts();
    const existingIndex = currentList.findIndex((p: any) => p.id === id);
    if (existingIndex < 0) {
      return res.status(404).json({ error: 'Product not found to update' });
    }

    const existingProduct = currentList[existingIndex];
    const updatedProduct = {
      ...existingProduct,
      ...product,
      id,
      title: product.title !== undefined ? String(product.title).trim() : existingProduct.title,
      description: product.description !== undefined ? String(product.description).trim() : existingProduct.description,
      imageUrl: product.imageUrl !== undefined ? String(product.imageUrl).trim() : existingProduct.imageUrl,
      affiliateUrl: product.affiliateUrl !== undefined ? String(product.affiliateUrl).trim() : existingProduct.affiliateUrl,
      youtubeUrl: product.youtubeUrl !== undefined ? String(product.youtubeUrl).trim() : existingProduct.youtubeUrl,
      platform: product.platform || existingProduct.platform || 'Amazon',
      category: product.category || existingProduct.category || 'Spiritual & Puja',
      isFeatured: product.isFeatured !== undefined ? Boolean(product.isFeatured) : existingProduct.isFeatured,
      inStock: product.inStock !== undefined ? Boolean(product.inStock) : existingProduct.inStock,
      updatedAt: new Date().toISOString(),
    };

    currentList[existingIndex] = updatedProduct;
    saveLocalProducts(currentList);

    // Sync updated product and master index to AWS S3
    const aws = getAwsConfig();
    if (aws.accessKeyId && aws.secretAccessKey && aws.bucket && aws.region) {
      try {
        const s3Client = new S3Client({
          region: aws.region,
          credentials: {
            accessKeyId: aws.accessKeyId,
            secretAccessKey: aws.secretAccessKey,
          },
        });

        // Update single product JSON in S3
        const singleBytes = new TextEncoder().encode(JSON.stringify(updatedProduct, null, 2));
        await s3Client.send(new PutObjectCommand({
          Bucket: aws.bucket,
          Key: `affiliate/product-${id}.json`,
          Body: singleBytes,
          ContentType: 'application/json; charset=utf-8',
          CacheControl: 'public, max-age=0, must-revalidate',
        }));

        // Update master index JSON in S3
        const indexBytes = new TextEncoder().encode(JSON.stringify(currentList, null, 2));
        await s3Client.send(new PutObjectCommand({
          Bucket: aws.bucket,
          Key: `affiliate/index.json`,
          Body: indexBytes,
          ContentType: 'application/json; charset=utf-8',
          CacheControl: 'public, max-age=0, must-revalidate',
        }));
        console.log(`[AWS S3] ✅ Successfully updated product ${id} via PUT in AWS S3!`);
      } catch (s3Err) {
        console.error('[AWS S3 Error] Failed updating product in S3:', s3Err);
      }
    }

    return res.json({ success: true, product: updatedProduct });
  } catch (err: any) {
    console.error('Error updating product:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.patch(['/api/products/:id', '/api/affiliate/products/:id'], async (req, res) => {
  // Delegate patch to put
  const putHandler: any = app._router.stack.find((layer: any) => layer.route && layer.route.methods.put && layer.route.path?.includes('/api/products/:id'));
  if (putHandler) {
    return putHandler.handle(req, res);
  }
  return res.status(405).json({ error: 'Method not supported' });
});

// DELETE product from AWS S3 and database
app.delete(['/api/products/:id', '/api/affiliate/products/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const currentList = readLocalProducts();
    const updatedList = currentList.filter((p: any) => p.id !== id);
    saveLocalProducts(updatedList);

    const aws = getAwsConfig();
    if (aws.accessKeyId && aws.secretAccessKey && aws.bucket && aws.region) {
      try {
        const s3Client = new S3Client({
          region: aws.region,
          credentials: {
            accessKeyId: aws.accessKeyId,
            secretAccessKey: aws.secretAccessKey,
          },
        });
        await s3Client.send(new DeleteObjectCommand({
          Bucket: aws.bucket,
          Key: `affiliate/product-${id}.json`,
        }));
        const indexBytes = new TextEncoder().encode(JSON.stringify(updatedList, null, 2));
        await s3Client.send(new PutObjectCommand({
          Bucket: aws.bucket,
          Key: `affiliate/index.json`,
          Body: indexBytes,
          ContentType: 'application/json; charset=utf-8',
          CacheControl: 'public, max-age=0, must-revalidate',
        }));
      } catch (e) {
        console.error('Error deleting product from S3:', e);
      }
    }

    return res.json({ success: true, message: 'Deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// REAL AWS BACKEND DATA API: BANNERS / SLIDERS
// ==========================================
function readLocalBanners(): any {
  const paths = [
    path.join(process.cwd(), 'public', 'slider-config.json'),
    path.join(process.cwd(), 'dist', 'slider-config.json'),
    path.join(process.cwd(), 'slider-config.json')
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      } catch {}
    }
  }
  return { autoSlideIntervalSeconds: 5, images: [] };
}

function saveLocalBanners(cfg: any) {
  const paths = [
    path.join(process.cwd(), 'public', 'slider-config.json'),
    path.join(process.cwd(), 'dist', 'slider-config.json'),
    path.join(process.cwd(), 'slider-config.json')
  ];
  for (const p of paths) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf-8');
    } catch (e) {}
  }
}

app.get(['/api/banners', '/api/sliders'], async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const aws = getAwsConfig();
  if (aws.bucket && aws.region) {
    try {
      const s3Url = `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/slider/config.json?t=${Date.now()}`;
      const r = await fetch(s3Url);
      if (r.ok) {
        const data = await r.json();
        saveLocalBanners(data);
        return res.json({ success: true, config: data });
      }
    } catch {}
  }
  const local = readLocalBanners();
  return res.json({ success: true, config: local });
});

app.post(['/api/banners', '/api/sliders'], async (req, res) => {
  try {
    const config = req.body || {};
    const formatted = {
      autoSlideIntervalSeconds: Number(config.autoSlideIntervalSeconds) || 5,
      images: Array.isArray(config.images) ? config.images : [],
      updatedAt: new Date().toISOString()
    };

    saveLocalBanners(formatted);

    const aws = getAwsConfig();
    if (aws.accessKeyId && aws.secretAccessKey && aws.bucket && aws.region) {
      try {
        const s3Client = new S3Client({
          region: aws.region,
          credentials: { accessKeyId: aws.accessKeyId, secretAccessKey: aws.secretAccessKey },
        });
        const bytes = new TextEncoder().encode(JSON.stringify(formatted, null, 2));
        await s3Client.send(new PutObjectCommand({
          Bucket: aws.bucket,
          Key: `slider/config.json`,
          Body: bytes,
          ContentType: 'application/json; charset=utf-8',
          CacheControl: 'public, max-age=0, must-revalidate',
        }));
        console.log('[AWS S3] ✅ Successfully saved slider banners to AWS S3!');
      } catch (e) {
        console.error('Error saving banners to S3:', e);
      }
    }

    return res.json({ success: true, config: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete(['/api/banners/:id', '/api/sliders/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const current = readLocalBanners();
    const images = Array.isArray(current.images) ? current.images : [];
    const updatedImages = images.filter((img: any) => img.id !== id);
    const formatted = {
      ...current,
      images: updatedImages,
      updatedAt: new Date().toISOString()
    };
    saveLocalBanners(formatted);

    const aws = getAwsConfig();
    if (aws.accessKeyId && aws.secretAccessKey && aws.bucket && aws.region) {
      try {
        const s3Client = new S3Client({
          region: aws.region,
          credentials: { accessKeyId: aws.accessKeyId, secretAccessKey: aws.secretAccessKey },
        });
        const bytes = new TextEncoder().encode(JSON.stringify(formatted, null, 2));
        await s3Client.send(new PutObjectCommand({
          Bucket: aws.bucket,
          Key: `slider/config.json`,
          Body: bytes,
          ContentType: 'application/json; charset=utf-8',
          CacheControl: 'public, max-age=0, must-revalidate',
        }));
        console.log(`[AWS S3] Deleted banner ${id} from config`);
      } catch (e) {
        console.error('Error deleting banner from S3:', e);
      }
    }

    return res.json({ success: true, config: formatted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/sync-story-html', async (req, res) => {
  try {
    const { story, html } = req.body;
    if (!story || !html) return res.status(400).json({ error: 'Missing data' });
    
    // Also save to posts.json and public/posts.json just in case
    const targetPaths = [
      path.join(process.cwd(), 'posts.json'),
      path.join(process.cwd(), 'public', 'posts.json'),
      path.join(process.cwd(), 'dist', 'posts.json')
    ];
    for (const p of targetPaths) {
      if (fs.existsSync(p)) {
        try {
          let postsData = JSON.parse(fs.readFileSync(p, 'utf-8'));
          if (Array.isArray(postsData)) {
            postsData = [story, ...postsData.filter((item: any) => item.id !== story.id)];
            fs.writeFileSync(p, JSON.stringify(postsData, null, 2));
          } else {
            const cleanId = (story.id || '').replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
            postsData[story.id] = story;
            postsData[cleanId] = story;
            fs.writeFileSync(p, JSON.stringify(postsData, null, 2));
          }
        } catch (e) {
          console.error(`Error updating ${p}:`, e);
        }
      }
    }

    const awsConf = getAwsConfig();
    const AWS_REGION = awsConf.region || 'ap-south-1';
    const AWS_BUCKET = awsConf.bucket || 'bhakti-ananda-photos';
    const AWS_ACCESS_KEY = awsConf.accessKeyId;
    const AWS_SECRET_KEY = awsConf.secretAccessKey;
    
    if (AWS_REGION && AWS_BUCKET && AWS_ACCESS_KEY && AWS_SECRET_KEY) {
      console.log('[Backend] Uploading received static HTML to S3 for', story.id);
      const s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY,
          secretAccessKey: AWS_SECRET_KEY,
        }
      });

      const storyId = (story.id || '').replace(/^(\/)?story\//i, '');
      const bodyBytes = new TextEncoder().encode(html);
      
      await Promise.all([
        s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: `story/${storyId}/index.html`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' })),
        s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: `story/${storyId}`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' })),
        s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: `story/${storyId}.html`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' }))
      ]);
      console.log('[Backend] ✅ S3 static upload complete for', storyId);
    } else {
      console.log('[Backend] S3 keys missing on server, cannot upload static html.');
    }
    
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error in sync-story-html:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sync-deal-html', async (req, res) => {
  try {
    const { product, html } = req.body;
    if (!product || !html) return res.status(400).json({ error: 'Missing product or html data' });

    const rawId = (product.id || '').replace(/\.html?$/i, '').replace(/^(\/)?deal\//i, '').replace(/^(\/)?product\//i, '').trim();
    const dealId = rawId;

    // 1. Write to local filesystem in public/deal and dist/deal
    const publicDealDir = path.join(process.cwd(), 'public', 'deal');
    const distDealDir = path.join(process.cwd(), 'dist', 'deal');
    for (const d of [publicDealDir, distDealDir]) {
      try {
        if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        fs.writeFileSync(path.join(d, `${dealId}.html`), html, 'utf-8');
        fs.writeFileSync(path.join(d, `${dealId}`), html, 'utf-8');
      } catch (writeErr) {}
    }

    // 2. Upload to S3 if AWS credentials configured on server
    const awsConf = getAwsConfig();
    if (awsConf.region && awsConf.bucket && awsConf.accessKeyId && awsConf.secretAccessKey) {
      const s3Client = new S3Client({
        region: awsConf.region,
        credentials: {
          accessKeyId: awsConf.accessKeyId,
          secretAccessKey: awsConf.secretAccessKey,
        }
      });
      const bodyBytes = new TextEncoder().encode(html);
      const safeUpload = async (key: string) => {
        try {
          await s3Client.send(new PutObjectCommand({
            Bucket: awsConf.bucket,
            Key: key,
            Body: bodyBytes,
            ContentType: 'text/html; charset=utf-8',
            CacheControl: 'public, max-age=0, must-revalidate'
          }));
        } catch {}
      };

      await Promise.all([
        safeUpload(`deal/${dealId}.html`),
        safeUpload(`deal/${dealId}`),
        safeUpload(`deal/${dealId}/index.html`),
        safeUpload(`product/${dealId}.html`),
        safeUpload(`product/${dealId}`),
        safeUpload(`affiliate/product-${dealId}.html`),
      ]);
      console.log('[Backend] ✅ S3 static deal HTML uploaded for', dealId);
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('Error in sync-deal-html:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/district-items', (req, res) => {
  const { districtId } = req.query;
  const items: any[] = [];
  if (districtId && districtId !== 'all') {
    return res.json({ success: true, items: items.filter((i: any) => i.districtId === districtId) });
  }
  return res.json({ success: true, items });
});

function extractCommentStoryId(req: express.Request): string {
  let raw = '';
  if (req.query && req.query.storyId) {
    raw = String(req.query.storyId);
  } else if (req.body && req.body.storyId) {
    raw = String(req.body.storyId);
  } else if (req.body && req.body.originalStoryId) {
    raw = String(req.body.originalStoryId);
  } else {
    const urlParts = req.url.split('/api/comments');
    if (urlParts.length > 1) {
      const rest = urlParts[1].split('?')[0];
      raw = rest.replace(/^\/+/, '');
    }
    if (!raw && req.params) {
      raw = (req.params as any).storyId || (req.params as any)[0] || '';
    }
  }

  let clean = decodeURIComponent(String(raw || ''))
    .replace(/^\/+/, '')
    .replace(/^story\//i, '')
    .replace(/^story-/, '')
    .replace(/\.html?$/i, '')
    .replace(/\/$/, '')
    .trim();

  return clean;
}

function getCommentCandidateKeys(cleanId: string): string[] {
  if (!cleanId) return [];
  return [
    cleanId,
    `story-${cleanId}`,
    `story/${cleanId}`,
    `/story/${cleanId}`,
    `/story/${cleanId}.html`,
    `${cleanId}.html`,
    `story-${cleanId}.html`
  ];
}

function readLocalComments(cleanId: string): any[] {
  const localPaths = [
    path.join(process.cwd(), 'comments.json'),
    path.join(process.cwd(), 'public', 'comments.json'),
    path.join(process.cwd(), 'dist', 'comments.json')
  ];
  const keys = getCommentCandidateKeys(cleanId);
  let bestList: any[] = [];

  for (const p of localPaths) {
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        for (const k of keys) {
          if (Array.isArray(data[k]) && data[k].length > bestList.length) {
            bestList = data[k];
          }
        }
      } catch {}
    }
  }
  return bestList;
}

function saveLocalComments(cleanId: string, comments: any[]) {
  const localPaths = [
    path.join(process.cwd(), 'comments.json'),
    path.join(process.cwd(), 'public', 'comments.json'),
    path.join(process.cwd(), 'dist', 'comments.json')
  ];
  const keys = getCommentCandidateKeys(cleanId);

  for (const p of localPaths) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      let data: Record<string, any[]> = {};
      if (fs.existsSync(p)) {
        try { data = JSON.parse(fs.readFileSync(p, 'utf-8')); } catch {}
      }
      for (const k of keys) {
        data[k] = comments;
      }
      fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.warn(`Failed writing comments to ${p}:`, e);
    }
  }
}

// Fetch comments for any story
app.get(['/api/comments', '/api/comments/*', '/api/comments/:storyId'], async (req, res) => {
  try {
    const cleanId = extractCommentStoryId(req);
    if (!cleanId) {
      return res.json({ success: true, comments: [] });
    }

    let comments: any[] = readLocalComments(cleanId);

    // Try AWS S3 if credentials available
    const aws = getAwsConfig();
    if (aws.region && aws.bucket && aws.accessKeyId && aws.secretAccessKey) {
      try {
        const s3Client = new S3Client({
          region: aws.region,
          credentials: { accessKeyId: aws.accessKeyId, secretAccessKey: aws.secretAccessKey }
        });
        const s3Keys = [`comments/${cleanId}.json`, `comments/story-${cleanId}.json`];
        for (const k of s3Keys) {
          try {
            const s3Res = await s3Client.send(new GetObjectCommand({ Bucket: aws.bucket, Key: k }));
            const s3Body = await s3Res.Body?.transformToString();
            if (s3Body) {
              const parsed = JSON.parse(s3Body);
              if (Array.isArray(parsed) && parsed.length >= comments.length) {
                comments = parsed;
                // Keep local updated with S3
                saveLocalComments(cleanId, comments);
                break;
              }
            }
          } catch {}
        }
      } catch (err: any) {
        console.warn('S3 comment fetch error (using local):', err.message);
      }
    }

    return res.json({ success: true, storyId: cleanId, comments });
  } catch (err: any) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: err.message });
  }
});

// Post a new comment
app.post(['/api/comments', '/api/comments/*', '/api/comments/:storyId'], async (req, res) => {
  try {
    const cleanId = extractCommentStoryId(req);
    const { name, text } = req.body || {};

    if (!cleanId) {
      return res.status(400).json({ error: 'Story ID is required' });
    }
    if (!name || !text || !String(name).trim() || !String(text).trim()) {
      return res.status(400).json({ error: 'Name and text are required' });
    }

    const newComment = {
      id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: String(name).trim(),
      text: String(text).trim(),
      createdAt: new Date().toISOString()
    };

    // Load existing comments
    let comments: any[] = readLocalComments(cleanId);

    // Also check S3 for any newer comments
    const aws = getAwsConfig();
    let s3Client: S3Client | null = null;
    if (aws.region && aws.bucket && aws.accessKeyId && aws.secretAccessKey) {
      try {
        s3Client = new S3Client({
          region: aws.region,
          credentials: { accessKeyId: aws.accessKeyId, secretAccessKey: aws.secretAccessKey }
        });
        const s3Res = await s3Client.send(new GetObjectCommand({
          Bucket: aws.bucket,
          Key: `comments/${cleanId}.json`
        }));
        const s3Body = await s3Res.Body?.transformToString();
        if (s3Body) {
          const parsed = JSON.parse(s3Body);
          if (Array.isArray(parsed) && parsed.length > comments.length) {
            comments = parsed;
          }
        }
      } catch {}
    }

    // Append new comment
    comments.push(newComment);

    // Save to local storage
    saveLocalComments(cleanId, comments);

    // Save to AWS S3
    if (s3Client && aws.bucket) {
      try {
        const bodyBytes = new TextEncoder().encode(JSON.stringify(comments, null, 2));
        
        const uploadS3 = async (key: string, useAcl: boolean) => {
          try {
            await s3Client!.send(new PutObjectCommand({
              Bucket: aws.bucket,
              Key: key,
              Body: bodyBytes,
              ContentType: 'application/json',
              CacheControl: 'public, max-age=0, must-revalidate',
              ...(useAcl ? { ACL: 'public-read' } : {})
            }));
            return true;
          } catch {
            return false;
          }
        };

        const keys = [`comments/${cleanId}.json`, `comments/story-${cleanId}.json`];
        for (const k of keys) {
          let success = await uploadS3(k, true);
          if (!success) {
            await uploadS3(k, false);
          }
        }
      } catch (err: any) {
        console.warn('S3 save comments failed (saved locally though):', err.message);
      }
    }

    return res.json({ success: true, storyId: cleanId, comment: newComment, comments });
  } catch (err: any) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/pujaris", (req, res) => res.json([]));
app.get("/api/lists", (req, res) => res.json([]));
app.get("/api/lists/search", (req, res) => res.json([]));
app.get("/api/payments", (req, res) => res.json([]));
app.get("/api/qr-config", (req, res) => res.json({}));
app.get("/api/templates", (req, res) => res.json([]));
app.get("/api/temples", (req, res) => res.json([]));
app.get("/api/stories", (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  const postsPath = path.join(process.cwd(), 'public', 'posts.json');
  const fallbackPath = path.join(process.cwd(), 'posts.json');
  const target = fs.existsSync(postsPath) ? postsPath : (fs.existsSync(fallbackPath) ? fallbackPath : null);
  if (target) {
    try {
      const raw = fs.readFileSync(target, 'utf-8');
      const data = JSON.parse(raw);
      const list = Array.isArray(data) ? data : Object.values(data);
      return res.json(list);
    } catch {}
  }
  return res.json([]);
});

app.get("/api/stories/:storyId", async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  const { storyId } = req.params;
  const cleanId = String(storyId).replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
  const idWithoutStory = cleanId.replace(/^story-/, '').trim();
  const idWithStory = cleanId.startsWith('story-') ? cleanId : `story-${cleanId}`;

  const postsPath = path.join(process.cwd(), 'public', 'posts.json');
  const fallbackPath = path.join(process.cwd(), 'posts.json');
  const target = fs.existsSync(postsPath) ? postsPath : (fs.existsSync(fallbackPath) ? fallbackPath : null);
  if (target) {
    try {
      const raw = fs.readFileSync(target, 'utf-8');
      const data = JSON.parse(raw);
      const list = Array.isArray(data) ? data : Object.values(data);
      const match = list.find((p: any) => {
        if (!p) return false;
        const pid = String(p.id || '').trim();
        const pCleanId = pid.replace(/^story-/, '').trim();
        return pid === cleanId || pid === idWithStory || pid === idWithoutStory ||
               pCleanId === cleanId || pCleanId === idWithoutStory;
      });
      if (match) {
        return res.json({ success: true, story: match });
      }
    } catch {}
  }

  // Fallback to S3 (Using direct HTTP fetch so it works without AWS credentials on the server)
  const aws = getAwsConfig();
  if (aws.bucket && aws.region) {
    const nowT = Date.now();
        const s3Urls = [
          `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/posts/story-${cleanId}.json?t=${nowT}`,
          `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/story/${cleanId}/story.json?t=${nowT}`,
          `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/story/${cleanId}.json?t=${nowT}`
        ];
    for (const url of s3Urls) {
      try {
        const fetchRes = await fetch(url);
        if (fetchRes.ok) {
          const s3Story = await fetchRes.json();
          return res.json({ success: true, story: s3Story, from: 's3' });
        }
      } catch {}
    }
  }

  return res.status(404).json({ error: "Story not found" });
});
app.post("/api/stories", async (req, res) => {
  try {
    const { story } = req.body;
    if (!story || !story.id) {
      return res.status(400).json({ error: "Missing story or story.id" });
    }
    const cleanId = String(story.id).replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
    const pathsToUpdate = [
      path.join(process.cwd(), 'posts.json'),
      path.join(process.cwd(), 'public', 'posts.json'),
      path.join(process.cwd(), 'dist', 'posts.json')
    ];
    for (const p of pathsToUpdate) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          const data = JSON.parse(raw);
          if (Array.isArray(data)) {
            const idx = data.findIndex((item: any) => item.id === cleanId || item.id === `story-${cleanId}`);
            if (idx >= 0) data[idx] = { ...data[idx], ...story, id: cleanId };
            else data.unshift({ ...story, id: cleanId });
            fs.writeFileSync(p, JSON.stringify(data, null, 2));
          } else if (typeof data === 'object') {
            const entry = {
              id: cleanId,
              title: story.title || '',
              description: story.summary || story.content || '',
              content: story.content || '',
              image: story.imageUrl || story.image || '',
              imageUrl: story.imageUrl || story.image || '',
              author: story.author || 'ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV',
              category: story.category || 'ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ',
              readTimeMinutes: Number(story.readTimeMinutes) || 3,
              publishedAt: story.publishedAt || new Date().toISOString().split('T')[0],
              likesCount: Number(story.likesCount) || 12,
              affiliateAd: story.affiliateAd || undefined,
            };
            data[cleanId] = entry;
            data[`story-${cleanId.replace(/^story-/, '')}`] = entry;
            data[`/story/${cleanId}`] = entry;
            data[`/story/${cleanId}.html`] = entry;
            fs.writeFileSync(p, JSON.stringify(data, null, 2));
          }
        } catch (e) {
          console.error(`Error writing to ${p}:`, e);
        }
      }
    }

    // Sync directly to AWS S3 (Bucket: bhakti-ananda-photos) if server credentials available
    const awsConf = getAwsConfig();
    const AWS_REGION = awsConf.region || 'ap-south-1';
    const AWS_BUCKET = awsConf.bucket || 'bhakti-ananda-photos';
    const AWS_ACCESS_KEY = awsConf.accessKeyId;
    const AWS_SECRET_KEY = awsConf.secretAccessKey;
    
    if (AWS_REGION && AWS_BUCKET && AWS_ACCESS_KEY && AWS_SECRET_KEY) {
      try {
        const s3Client = new S3Client({
          region: AWS_REGION,
          credentials: { accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY }
        });
        const storyBytes = new TextEncoder().encode(JSON.stringify(story, null, 2));
        s3Client.send(new PutObjectCommand({
          Bucket: AWS_BUCKET,
          Key: `posts/story-${cleanId}.json`,
          Body: storyBytes,
          ContentType: 'application/json; charset=utf-8',
          CacheControl: 'public, max-age=0, must-revalidate',
        })).catch(() => {});

        // Also sync updated posts.json to S3
        const mainPostsPath = path.join(process.cwd(), 'posts.json');
        if (fs.existsSync(mainPostsPath)) {
          const allPostsData = fs.readFileSync(mainPostsPath);
          s3Client.send(new PutObjectCommand({
            Bucket: AWS_BUCKET,
            Key: 'posts.json',
            Body: allPostsData,
            ContentType: 'application/json; charset=utf-8',
            CacheControl: 'public, max-age=0, must-revalidate',
          })).catch(() => {});
        }
      } catch (e) {
        console.warn('Server S3 story sync error:', e);
      }
    }

    res.json({ success: true, story });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stories/:storyId/like', async (req, res) => {
  try {
    const { storyId } = req.params;
    const cleanId = String(storyId).replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
    const idWithoutStory = cleanId.replace(/^story-/, '').trim();
    const idWithStory = cleanId.startsWith('story-') ? cleanId : `story-${cleanId}`;

    const paths = [
      path.join(process.cwd(), 'posts.json'),
      path.join(process.cwd(), 'public', 'posts.json'),
      path.join(process.cwd(), 'dist', 'posts.json'),
    ];
    let updatedLikes = req.body?.likesCount;

    for (const p of paths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          const data = JSON.parse(raw);
          if (Array.isArray(data)) {
            const idx = data.findIndex((item: any) => {
              const pid = String(item?.id || '').trim();
              return pid === cleanId || pid === idWithStory || pid === idWithoutStory;
            });
            if (idx >= 0) {
              if (updatedLikes === undefined) {
                updatedLikes = (data[idx].likesCount || 0) + 1;
              }
              data[idx].likesCount = updatedLikes;
              fs.writeFileSync(p, JSON.stringify(data, null, 2));
            }
          }
        } catch {}
      }
    }
    return res.json({ success: true, likesCount: updatedLikes });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/panchang', (req, res) => {
  const panchangPath = path.join(process.cwd(), 'panchang.json');
  const publicPanchang = path.join(process.cwd(), 'public', 'panchang.json');
  const target = fs.existsSync(panchangPath) ? panchangPath : (fs.existsSync(publicPanchang) ? publicPanchang : null);
  if (target) {
    try {
      const data = JSON.parse(fs.readFileSync(target, 'utf-8'));
      return res.json(data);
    } catch {}
  }
  return res.status(404).json({ error: 'Panchang not found' });
});

app.post('/api/panchang', async (req, res) => {
  try {
    const { panchang } = req.body;
    if (!panchang) return res.status(400).json({ error: 'Missing panchang' });
    const paths = [
      path.join(process.cwd(), 'panchang.json'),
      path.join(process.cwd(), 'public', 'panchang.json'),
      path.join(process.cwd(), 'dist', 'panchang.json'),
    ];
    for (const p of paths) {
      try {
        fs.writeFileSync(p, JSON.stringify(panchang, null, 2));
      } catch {}
    }

    const awsConf = getAwsConfig();
    const AWS_REGION = awsConf.region || 'ap-south-1';
    const AWS_BUCKET = awsConf.bucket || 'bhakti-ananda-photos';
    const AWS_ACCESS_KEY = awsConf.accessKeyId;
    const AWS_SECRET_KEY = awsConf.secretAccessKey;
    if (AWS_REGION && AWS_BUCKET && AWS_ACCESS_KEY && AWS_SECRET_KEY) {
      try {
        const s3Client = new S3Client({
          region: AWS_REGION,
          credentials: { accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY }
        });
        const bytes = new TextEncoder().encode(JSON.stringify(panchang, null, 2));
        s3Client.send(new PutObjectCommand({
          Bucket: AWS_BUCKET,
          Key: 'panchang/today.json',
          Body: bytes,
          ContentType: 'application/json; charset=utf-8',
          CacheControl: 'public, max-age=60',
        })).catch(() => {});
      } catch {}
    }

    return res.json({ success: true, panchang });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/stories/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;
    
    // Remove from local posts.json
    const postsPath = path.join(process.cwd(), 'posts.json');
    if (fs.existsSync(postsPath)) {
      try {
        let postsData = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
        if (Array.isArray(postsData)) {
          postsData = postsData.filter((p: any) => p.id !== storyId);
          fs.writeFileSync(postsPath, JSON.stringify(postsData, null, 2));
        } else {
          delete postsData[storyId];
          const cleanId = (storyId || '').replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
          delete postsData[cleanId];
          fs.writeFileSync(postsPath, JSON.stringify(postsData, null, 2));
        }
      } catch (e) {
        console.error("Error deleting from posts.json:", e);
      }
    }

    const awsConf = getAwsConfig();
    const AWS_REGION = awsConf.region || 'ap-south-1';
    const AWS_BUCKET = awsConf.bucket || 'bhakti-ananda-photos';
    const AWS_ACCESS_KEY = awsConf.accessKeyId;
    const AWS_SECRET_KEY = awsConf.secretAccessKey;
    
    if (AWS_REGION && AWS_BUCKET && AWS_ACCESS_KEY && AWS_SECRET_KEY) {
      try {
        const s3Client = new S3Client({
          region: AWS_REGION,
          credentials: { accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY }
        });
        
        const cleanId = (storyId || '').replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
        // Fire and forget deletes
        Promise.all([
          s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: `story/${cleanId}/index.html`, Body: '', ContentType: 'text/html' })).catch(()=>{}),
          s3Client.send(new PutObjectCommand({ Bucket: AWS_BUCKET, Key: `story/${cleanId}.html`, Body: '', ContentType: 'text/html' })).catch(()=>{})
        ]);
      } catch (e) {}
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting story:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve SPA index.html for direct story URLs so latest JS assets load and app interface renders immediately

app.get(['/deal/*', '/deal', '/product/*', '/product'], async (req, res, next) => {
  console.log("INTERCEPTED DEAL/PRODUCT ROUTE:", req.path);
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|json|woff2?|map)$/)) {
    return next();
  }

  const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
  const srcIndexPath = path.join(process.cwd(), 'index.html');
  const indexPath = fs.existsSync(distIndexPath) ? distIndexPath : (fs.existsSync(srcIndexPath) ? srcIndexPath : null);

  if (indexPath) {
    let html = fs.readFileSync(indexPath, 'utf-8');
    const match = req.path.match(/\/(?:deal|product)\/([^\/.]+)/);
    const queryId = (req.query.deal as string) || (req.query.id as string) || (req.query.productId as string) || '';
    const cleanId = (match && match[1] ? match[1] : queryId).trim();
    
    let deal: any = null;
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const host = req.get('host') || 'bhaktistore.com';
    const canonicalUrl = `${protocol}://${host}${cleanId ? `/deal/${cleanId}` : ''}`;
    
    if (cleanId) {
      const aws = getAwsConfig();
      if (aws.bucket && aws.region && aws.accessKeyId && aws.secretAccessKey) {
        try {
          const s3Client = new S3Client({
            region: aws.region,
            credentials: { accessKeyId: aws.accessKeyId, secretAccessKey: aws.secretAccessKey },
          });

          // 1. Try direct S3 file: affiliate/product-${cleanId}.json
          const possibleKeys = [
            `affiliate/product-${cleanId}.json`,
            cleanId.startsWith('prod_') 
              ? `affiliate/product-${cleanId.replace(/^prod_/, '')}.json`
              : `affiliate/product-prod_${cleanId}.json`
          ];

          for (const key of possibleKeys) {
            try {
              const s3Res = await s3Client.send(new GetObjectCommand({
                Bucket: aws.bucket,
                Key: key,
              }));
              if (s3Res.Body) {
                deal = JSON.parse(await s3Res.Body.transformToString());
                if (deal && deal.title) {
                  console.log(`[SSR] Found deal from S3 key: ${key}`);
                  break;
                }
              }
            } catch (kErr) {}
          }

          // 2. If not found in individual keys, check master catalog: affiliate/index.json
          if (!deal) {
            try {
              const indexRes = await s3Client.send(new GetObjectCommand({
                Bucket: aws.bucket,
                Key: 'affiliate/index.json',
              }));
              if (indexRes.Body) {
                const catalog = JSON.parse(await indexRes.Body.transformToString());
                if (Array.isArray(catalog)) {
                  deal = catalog.find((p: any) => 
                    p && (p.id === cleanId || p.id === `prod_${cleanId}` || (p.id && p.id.replace(/^prod_/, '') === cleanId.replace(/^prod_/, '')))
                  );
                  if (deal) console.log(`[SSR] Found deal ${cleanId} from S3 affiliate/index.json catalog!`);
                }
              }
            } catch (idxErr) {}
          }
        } catch (e) {
          console.warn('[SSR] S3 deal fetch error:', e);
        }
      }
    }

    // Strip any pre-existing meta tags to prevent duplicates
    html = html.replace(/<meta property="og:[^>]+>/gi, '')
               .replace(/<meta name="twitter:[^>]+>/gi, '')
               .replace(/<title>.*?<\/title>/gi, '')
               .replace(/<meta name="description"[^>]+>/gi, '');

    if (deal && deal.title) {
      // Dynamic Open Graph from REAL AWS S3 Product
      const title = String(deal.title).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const desc = String(deal.description || `Verified authentic deal on ${deal.title} at Bhakti Store.`)
        .substring(0, 250)
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const img = deal.imageUrl || 'https://www.bhaktianandaodiatvofficial.blog/brand-banner.svg';

      const newMeta = `
        <title>${title} | Bhakti Store</title>
        <meta name="description" content="${desc}" />
        <meta property="og:url" content="${canonicalUrl}" />
        <meta property="og:title" content="${title} | Bhakti Store" />
        <meta property="og:description" content="${desc}" />
        <meta property="og:image" content="${img}" />
        <meta property="og:image:secure_url" content="${img}" />
        <meta property="og:image:url" content="${img}" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="${title}" />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="Bhakti Store" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title} | Bhakti Store" />
        <meta name="twitter:description" content="${desc}" />
        <meta name="twitter:image" content="${img}" />
        <script>window.__PRELOADED_STATE__ = { viewMode: 'deal', dealId: '${cleanId}', deal: ${JSON.stringify(deal).replace(/</g, '\\u003c')} };</script>
      `;
      html = html.replace('</head>', `${newMeta}\n</head>`);
    } else {
      // Clean Generic Site Branding (Zero Demo Data Policy)
      const genericTitle = 'Bhakti Store';
      const genericDesc = 'Discover verified spiritual products, puja samagri, and authentic spiritual essentials.';
      const genericImg = 'https://www.bhaktianandaodiatvofficial.blog/brand-banner.svg';

      const newMeta = `
        <title>${genericTitle}</title>
        <meta name="description" content="${genericDesc}" />
        <meta property="og:url" content="${canonicalUrl}" />
        <meta property="og:title" content="${genericTitle}" />
        <meta property="og:description" content="${genericDesc}" />
        <meta property="og:image" content="${genericImg}" />
        <meta property="og:image:secure_url" content="${genericImg}" />
        <meta property="og:image:url" content="${genericImg}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="${genericTitle}" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Bhakti Store" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${genericTitle}" />
        <meta name="twitter:description" content="${genericDesc}" />
        <meta name="twitter:image" content="${genericImg}" />
      `;
      html = html.replace('</head>', `${newMeta}\n</head>`);
    }
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    return res.send(html);
  }
  next();
});

app.get(['/story/*', '/story'], async (req, res, next) => {
  console.log("INTERCEPTED STORY ROUTE:", req.path);
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|json)$/)) {
    return next();
  }
  const distPath = path.join(process.cwd(), 'dist');
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf-8');
    
    const storyIdMatch = req.path.match(/\/story\/([^\/.]+)/);
    if (storyIdMatch && storyIdMatch[1]) {
      let cleanId = storyIdMatch[1];
      if (cleanId.startsWith('story-')) cleanId = cleanId.replace('story-', '');
      
      let story: any = null;

      const aws = getAwsConfig();
      if (aws.bucket && aws.region) {
        const nowT = Date.now();
    const s3Urls = [
      `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/posts/story-${cleanId}.json?t=${nowT}`,
      `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/story/${cleanId}/story.json?t=${nowT}`,
      `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/story/${cleanId}.json?t=${nowT}`
    ];
        for (const url of s3Urls) {
          try {
            const fetchRes = await fetch(url);
            if (fetchRes.ok) {
              story = await fetchRes.json();
              console.log(`[SSR] Found story ${cleanId} from S3!`);
              break;
            }
          } catch (e) {}
        }
      }

      // Fallback to local posts.json
      if (!story) {
        const postsPath = path.join(process.cwd(), 'posts.json');
        if (fs.existsSync(postsPath)) {
          try {
            const postsRaw = fs.readFileSync(postsPath, 'utf-8');
            const postsData = JSON.parse(postsRaw);
            const posts = Array.isArray(postsData) ? postsData : Object.values(postsData);
            story = posts.find((p) => p && (p.id === cleanId || p.id === `story-${cleanId}` || p.id === `/story/${cleanId}`));
          } catch (e) {
            console.error("Error parsing posts.json in /story route:", e);
          }
        }
      }

      if (story) {
        const title = (story.title || 'Bhakti Ananda Odia TV').replace(/"/g, '&quot;');
        const desc = (story.description || story.content || '').substring(0, 250).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const img = story.image || story.imageUrl || 'https://www.bhaktianandaodiatvofficial.blog/brand-banner.svg';
        
        html = html.replace(/<meta property="og:[^>]+>/gi, '')
                   .replace(/<meta name="twitter:[^>]+>/gi, '')
                   .replace(/<title>.*?<\/title>/gi, '');
                   
        const newMeta = `
          <title>${title}</title>
          <meta property="og:url" content="https://www.bhaktianandaodiatvofficial.blog/story/${cleanId}" />
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${desc}" />
          <meta property="og:image" content="${img}" />
          <meta property="og:type" content="article" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${title}" />
          <meta name="twitter:image" content="${img}" />
          <script>window.__PRELOADED_STATE__ = { viewMode: 'blog', storyId: '${cleanId}', story: ${JSON.stringify(story).replace(/</g, '\\u003c')} };</script>
        `;
        html = html.replace('</head>', `${newMeta}\n</head>`);
      }
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    return res.send(html);
  }
  next();
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
