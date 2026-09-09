import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getClientAwsConfig } from './s3Upload';
import type { AffiliateProduct } from './affiliateApi';

const DOMAIN = 'https://www.bhaktianandaodiatvofficial.blog';
const DEFAULT_BRAND_LOGO = 'https://www.bhaktianandaodiatvofficial.blog/brand-banner.svg';

function escapeHtml(str: string = ''): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds static HTML specifically crafted for WhatsApp, Facebook, Twitter, and Telegram crawlers
 * as well as human visitors clicking shared links from social media.
 * Contains:
 * 1. 100% real Open Graph meta tags (og:image, og:title, og:description) with the original product S3 image.
 * 2. Instant client-side redirect to the live website with the exact product loaded: ?deal=[dealId]
 * 3. Instant visual fallback card with product photo & "Buy Now / Grab Deal" button for instant interaction.
 */
export function buildDealHtml(product: AffiliateProduct): string {
  const dealId = (product.id || '').replace(/^(\/)?deal\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
  const title = `${product.title} | Bhakti Store`;
  const description = (
    product.description ||
    `Verified authentic spiritual product on Bhakti Store via ${product.platform || 'Amazon'}. Order online with guaranteed delivery.`
  ).replace(/<[^>]*>?/gm, '').slice(0, 240);

  const rawImg = (product.imageUrl || DEFAULT_BRAND_LOGO).trim();
  const imageUrl = rawImg.startsWith('http') ? rawImg : `${DOMAIN}/${rawImg.replace(/^\//, '')}`;
  const canonicalUrl = `${DOMAIN}/deal/${encodeURIComponent(dealId)}.html`;
  const directSpaUrl = `${DOMAIN}/?deal=${encodeURIComponent(dealId)}`;

  let imageType = 'image/jpeg';
  if (imageUrl.includes('.png')) imageType = 'image/png';
  else if (imageUrl.includes('.webp')) imageType = 'image/webp';
  else if (imageUrl.includes('.svg')) imageType = 'image/svg+xml';

  const safeJsonPayload = JSON.stringify(product).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="or">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph / WhatsApp / Facebook Scraper Meta Tags -->
  <meta property="og:site_name" content="Bhakti Store" />
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:url" content="${imageUrl}" />
  <meta property="og:image:type" content="${imageType}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(product.title)}" />

  <!-- Twitter Card Scraper Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta name="twitter:image:src" content="${imageUrl}" />

  <!-- JSON-LD Product Schema for Search Engines & Social Platforms -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": ${JSON.stringify(product.title)},
    "image": ${JSON.stringify(imageUrl)},
    "description": ${JSON.stringify(description)},
    "offers": {
      "@type": "Offer",
      "url": ${JSON.stringify(product.affiliateUrl || directSpaUrl)},
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": ${JSON.stringify(product.platform || 'Bhakti Store')}
      }
    }
  }
  </script>

  <!-- Preloaded Data for SPA -->
  <script>
    window.__PRELOADED_STATE__ = {
      viewMode: 'deal',
      dealId: "${escapeHtml(dealId)}",
      deal: ${safeJsonPayload}
    };
    
    // Instant Deep-Link Redirect to live website with this exact product loaded (skip for crawlers)
    (function() {
      var ua = navigator.userAgent || navigator.vendor || window.opera || '';
      var isCrawler = /bot|facebook|whatsapp|twitter|pinterest|linkedin|slack|preview|crawler/i.test(ua);
      var isDirectAction = window.location.search.indexOf('no_redirect=1') !== -1;
      
      if (!isCrawler && !isDirectAction) {
        var targetSpa = "${directSpaUrl}";
        // Smoothly transfer to SPA
        if (window.location.href !== targetSpa) {
          window.location.replace(targetSpa);
        }
      }
    })();
  </script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Odia', sans-serif;
      background-color: #FFFBF0;
      color: #1e293b;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #fde68a;
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
      max-width: 480px;
      width: 100%;
      overflow: hidden;
      text-align: center;
    }
    .header {
      background: linear-gradient(135deg, #701a1e 0%, #991b1b 100%);
      color: #ffffff;
      padding: 16px;
      font-weight: 800;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .img-wrap {
      width: 100%;
      height: 280px;
      background: #fafaf9;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
    }
    .img-wrap img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .badge {
      position: absolute;
      top: 16px;
      left: 16px;
      background: #0f172a;
      color: #fde047;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .content {
      padding: 24px;
    }
    .title {
      font-size: 18px;
      font-weight: 800;
      line-height: 1.4;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .desc {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 20px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .btn-buy {
      display: block;
      width: 100%;
      background: #f59e0b;
      color: #000000;
      font-size: 15px;
      font-weight: 800;
      text-decoration: none;
      padding: 14px 20px;
      border-radius: 14px;
      margin-bottom: 10px;
      transition: background 0.2s;
    }
    .btn-buy:hover {
      background: #d97706;
    }
    .btn-store {
      display: block;
      width: 100%;
      background: #f1f5f9;
      color: #334155;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      padding: 12px 20px;
      border-radius: 14px;
    }
    .btn-store:hover {
      background: #e2e8f0;
    }
    .redirecting {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 14px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span>🚩 Bhakti Store • verified deal</span>
    </div>
    <div class="img-wrap">
      <span class="badge">${escapeHtml(product.platform || 'Bhakti Store')}</span>
      <img src="${imageUrl}" alt="${escapeHtml(product.title)}" />
    </div>
    <div class="content">
      <h1 class="title">${escapeHtml(product.title)}</h1>
      <p class="desc">${escapeHtml(description)}</p>
      <a href="${escapeHtml(product.affiliateUrl || directSpaUrl)}" target="_blank" rel="noopener noreferrer" class="btn-buy">
        🛒 Buy Now on ${escapeHtml(product.platform || 'Store')}
      </a>
      <a href="${directSpaUrl}" class="btn-store">
        ଭକ୍ତି ଷ୍ଟୋର ଆପ୍ ରେ ଖୋଲନ୍ତୁ (Open in Store)
      </a>
      <p class="redirecting">Directing to verified store page...</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Uploads the static deal HTML page to AWS S3 across all deep-link keys:
 * 1. deal/${dealId}.html
 * 2. deal/${dealId}
 * 3. product/${dealId}.html
 * 4. product/${dealId}
 * 5. affiliate/product-${dealId}.html
 *
 * This guarantees that when Facebook, WhatsApp, or Twitter scrapers request
 * the link, S3 immediately serves this static HTML with original photos and titles!
 */
export async function autoPublishDealHtmlToS3(product: AffiliateProduct): Promise<boolean> {
  const awsConfig = getClientAwsConfig();
  if (!product || !product.id) return false;

  const rawId = (product.id || '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
  const cleanId = rawId.replace(/^(\/)?deal\//i, '').replace(/^(\/)?product\//i, '');
  const idWithoutProd = cleanId.replace(/^prod_/, '');
  const idWithProd = cleanId.startsWith('prod_') ? cleanId : `prod_${cleanId}`;

  const htmlContent = buildDealHtml(product);
  const bytes = new TextEncoder().encode(htmlContent);

  // Sync to AWS S3 if credentials available in browser localStorage
  if (awsConfig.bucket && awsConfig.accessKeyId && awsConfig.secretAccessKey) {
    try {
      const s3Client = new S3Client({
        region: awsConfig.region || 'ap-south-1',
        credentials: {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
        },
      });

      const safeUpload = async (key: string, useAcl: boolean = false): Promise<boolean> => {
        try {
          await s3Client.send(
            new PutObjectCommand({
              Bucket: awsConfig.bucket,
              Key: key,
              Body: bytes,
              ContentType: 'text/html; charset=utf-8',
              CacheControl: 'public, max-age=0, must-revalidate',
              ...(useAcl ? { ACL: 'public-read' } : {}),
            })
          );
          return true;
        } catch (err: any) {
          return false;
        }
      };

      // Upload with ACL first; if bucket restricts ACLs, fallback without ACL
      const uploadWithFallback = async (key: string) => {
        const ok = await safeUpload(key, true);
        if (!ok) {
          await safeUpload(key, false);
        }
      };

      // Primary keys
      await uploadWithFallback(`deal/${cleanId}.html`);
      await uploadWithFallback(`deal/${cleanId}`);
      await uploadWithFallback(`deal/${cleanId}/index.html`);
      await uploadWithFallback(`product/${cleanId}.html`);
      await uploadWithFallback(`product/${cleanId}`);
      await uploadWithFallback(`affiliate/product-${cleanId}.html`);

      // Variation keys (with prod_ and without prod_ to catch all share formats)
      if (idWithProd !== cleanId) {
        await uploadWithFallback(`deal/${idWithProd}.html`);
        await uploadWithFallback(`deal/${idWithProd}`);
        await uploadWithFallback(`deal/${idWithProd}/index.html`);
      }
      if (idWithoutProd !== cleanId) {
        await uploadWithFallback(`deal/${idWithoutProd}.html`);
        await uploadWithFallback(`deal/${idWithoutProd}`);
        await uploadWithFallback(`deal/${idWithoutProd}/index.html`);
      }

      // Also ensure JSON payload is uploaded to S3
      try {
        const jsonBytes = new TextEncoder().encode(JSON.stringify(product, null, 2));
        const uploadJson = async (k: string) => {
          try {
            await s3Client.send(
              new PutObjectCommand({
                Bucket: awsConfig.bucket,
                Key: k,
                Body: jsonBytes,
                ContentType: 'application/json; charset=utf-8',
                CacheControl: 'public, max-age=60',
              })
            );
          } catch {}
        };
        await uploadJson(`affiliate/product-${cleanId}.json`);
        if (idWithProd !== cleanId) await uploadJson(`affiliate/product-${idWithProd}.json`);
        if (idWithoutProd !== cleanId) await uploadJson(`affiliate/product-${idWithoutProd}.json`);
      } catch {}

      console.log(`[Auto S3 Deal HTML] ✅ Successfully uploaded static share HTML for product: ${cleanId}`);
    } catch (s3Err) {
      console.warn('[Auto S3 Deal HTML] S3 upload error:', s3Err);
    }
  } else {
    console.warn('[Auto S3 Deal HTML] AWS Credentials missing in localStorage; skipping direct S3 HTML upload.');
  }

  // Also sync to local backend if running full-stack
  try {
    await fetch('/api/sync-deal-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, html: htmlContent }),
    });
  } catch {}

  return true;
}

/**
 * Bulk publishes all products in the affiliate catalog to AWS S3.
 * Ideal for fixing all WhatsApp and Facebook social media link previews in one click!
 */
export async function bulkPublishAllDealsToS3(
  products: AffiliateProduct[],
  onProgress?: (done: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  const total = products.length;

  for (let i = 0; i < total; i++) {
    const p = products[i];
    try {
      const ok = await autoPublishDealHtmlToS3(p);
      if (ok) success++;
      else failed++;
    } catch (e) {
      failed++;
    }
    if (onProgress) onProgress(i + 1, total);
  }

  return { success, failed };
}
