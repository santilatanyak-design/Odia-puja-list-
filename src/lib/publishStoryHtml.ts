import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getClientAwsConfig } from './s3Upload';
import type { SpiritualStory } from '../types';

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

export async function buildStoryHtml(story: SpiritualStory): Promise<string> {
  const storyId = (story.id || '').replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
  const title = `📖 ${story.title} | Bhakti Ananda Odia TV`;
  const description = (story.summary || story.content || 'ପବିତ୍ର ଓଡ଼ିଆ ବ୍ରତକଥା, ଠାକୁରଙ୍କ ମାହାତ୍ମ୍ୟ ଓ ଆଧ୍ୟାତ୍ମିକ ଲେଖା ପଢ଼ନ୍ତୁ।').replace(/<[^>]*>?/gm, '').slice(0, 200);
  const rawImg = (story as any).imageUrl || (story as any).image || DEFAULT_BRAND_LOGO;
  const imageUrl = rawImg.startsWith('http') ? rawImg : `${DOMAIN}/${rawImg.replace(/^\//, '')}`;
  const canonicalUrl = `${DOMAIN}/story/${encodeURIComponent(storyId)}.html`;

  let imageType = 'image/jpeg';
  if (imageUrl.includes('.png')) imageType = 'image/png';
  else if (imageUrl.includes('.webp')) imageType = 'image/webp';
  else if (imageUrl.includes('.svg')) imageType = 'image/svg+xml';

  const metaTags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:site_name" content="Bhakti Ananda Odia TV" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:url" content="${imageUrl}" />
    <meta property="og:image:type" content="${imageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:image:src" content="${imageUrl}" />
    <script>
      window.__PRELOADED_STATE__ = { viewMode: 'blog', storyId: "${escapeHtml(storyId)}" };
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "${escapeHtml(story.title)}",
      "image": ["${imageUrl}"],
      "datePublished": "${story.publishedAt || new Date().toISOString()}",
      "author": [{
        "@type": "Person",
        "name": "${escapeHtml(story.author || 'Bhakti Ananda Odia TV')}"
      }],
      "publisher": {
        "@type": "Organization",
        "name": "Bhakti Ananda Odia TV",
        "logo": {
          "@type": "ImageObject",
          "url": "${DOMAIN}/brand-banner.svg"
        }
      },
      "description": "${escapeHtml(description)}"
    }
    </script>
  `;

  let template = '';
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch(window.location.origin + '/');
      if (res.ok) {
        template = await res.text();
      }
    }
  } catch (err) {
    console.warn('Could not fetch index.html template from origin', err);
  }

  // Extract scripts and links from active DOM if available
  let domScriptsAndStyles = '';
  if (typeof document !== 'undefined') {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    styles.forEach((s) => {
      const href = s.getAttribute('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${DOMAIN}/${href.replace(/^\//, '')}`;
        domScriptsAndStyles += `<link rel="stylesheet" crossorigin href="${fullUrl}" />\n`;
      }
    });
    scripts.forEach((s) => {
      const src = s.getAttribute('src');
      if (src && !src.includes('gtag') && !src.includes('googletagmanager')) {
        const fullUrl = src.startsWith('http') ? src : `${DOMAIN}/${src.replace(/^\//, '')}`;
        domScriptsAndStyles += `<script type="module" crossorigin src="${fullUrl}"></script>\n`;
      }
    });
  }

  if (!template || !template.includes('<head>')) {
    template = `<!doctype html><html lang="or" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/brand-banner.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
    <title>Bhakti Ananda Odia TV</title>
    ${domScriptsAndStyles}
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
  } else if (domScriptsAndStyles && !template.includes('/assets/')) {
    template = template.replace('</head>', `${domScriptsAndStyles}\n</head>`);
  }

  let finalHtml = template
    .replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']fb:app_id["'][^>]*>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<title>.*?<\/title>/gi, '');

  if (finalHtml.includes('name="viewport"')) {
    finalHtml = finalHtml.replace(/(<meta\s+name=["']viewport["'][^>]*>)/i, `$1\n${metaTags}`);
  } else {
    finalHtml = finalHtml.replace('<head>', `<head>\n${metaTags}`);
  }

  const storyHtml = `
    <div id="root" style="background-color: #FFFBF0; min-height: 100vh; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <!-- Top Website Header -->
      <header style="background: linear-gradient(135deg, #701a1e 0%, #8B0000 100%); color: #ffffff; padding: 12px 16px; border-bottom: 3px solid #f59e0b; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <div style="max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <a href="${DOMAIN}/?view=home" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: #ffffff;">
            <img src="${DEFAULT_BRAND_LOGO}" alt="Bhakti Ananda Logo" style="height: 40px; width: auto; border-radius: 8px; background: #ffffff; padding: 2px;" />
            <div>
              <div style="font-size: 18px; font-weight: 800; color: #fbbf24; line-height: 1.2;">ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV</div>
              <div style="font-size: 11px; color: #fde68a; opacity: 0.9;">Bhakti Ananda Odia TV - Official</div>
            </div>
          </a>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <a href="${DOMAIN}/?view=home" style="background: rgba(255,255,255,0.15); color: #ffffff; text-decoration: none; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid rgba(255,255,255,0.25);">🏠 ମୁଖ୍ୟ ପୃଷ୍ଠା</a>
            <a href="${DOMAIN}/?view=store" style="background: #f59e0b; color: #701a1e; text-decoration: none; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 800;">🛒 ପୂଜା ଷ୍ଟୋର</a>
            <a href="${DOMAIN}/?view=panchang" style="background: rgba(255,255,255,0.15); color: #ffffff; text-decoration: none; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid rgba(255,255,255,0.25);">📅 ପାଞ୍ଜି</a>
            <a href="${DOMAIN}/?view=shorts" style="background: rgba(255,255,255,0.15); color: #ffffff; text-decoration: none; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid rgba(255,255,255,0.25);">🎬 ଶୋର୍ଟ୍ସ</a>
          </div>
        </div>
      </header>

      <!-- Website Callout Banner -->
      <div style="background: #fef3c7; border-bottom: 1px solid #fde68a; padding: 10px 16px; text-align: center; color: #92400e; font-size: 13px; font-weight: 700;">
        🚩 ଆପଣ ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV ଆଧ୍ୟାତ୍ମିକ ପୋଷ୍ଟ ପଢୁଛନ୍ତି। 
        <a href="${DOMAIN}/?view=blog&storyId=${encodeURIComponent(storyId)}" style="color: #701a1e; font-weight: 900; text-decoration: underline; margin-left: 6px;">ସମ୍ପୂର୍ଣ୍ଣ ୱେବସାଇଟ୍ ଖୋଲନ୍ତୁ (Open Full Website) →</a>
      </div>

      <!-- Main Article Area -->
      <main style="max-width: 850px; margin: 24px auto; padding: 0 16px;">
        <article style="background: #ffffff; border-radius: 16px; border: 1px solid #fef3c7; box-shadow: 0 4px 15px rgba(0,0,0,0.06); padding: 24px; overflow: hidden;">
          <div style="margin-bottom: 12px; display: flex; items-center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <span style="background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 12px;">📖 ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ / ବ୍ରତକଥା</span>
            <span style="color: #78716c; font-size: 12px;">Bhakti Ananda Odia TV</span>
          </div>

          <h1 style="font-size: 26px; font-weight: 800; color: #701a1e; margin: 0 0 16px 0; line-height: 1.35;">${escapeHtml(story.title)}</h1>
          
          ${imageUrl ? `<div style="margin-bottom: 20px; text-align: center;"><img src="${imageUrl}" alt="${escapeHtml(story.title)}" style="width: 100%; max-height: 480px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" /></div>` : ''}

          <div style="line-height: 1.8; font-size: 17px; color: #292524; margin-bottom: 24px;">
            ${(story.content || story.summary || (story as any).description || '').split('\n\n').map(p => '<p style="margin-bottom: 16px;">' + escapeHtml(p.replace(/^###\s*/, '')) + '</p>').join('')}
          </div>

          <!-- Direct Interactive Action Buttons -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f3f4f6; display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;">
            <a href="${DOMAIN}/?view=blog&storyId=${encodeURIComponent(storyId)}" style="background: linear-gradient(135deg, #701a1e, #8B0000); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 10px rgba(112,26,30,0.3); display: inline-flex; align-items: center; gap: 8px;">
              🌐 ସମ୍ପୂର୍ଣ୍ଣ ୱେବସାଇଟ୍‌ରେ ପଢ଼ନ୍ତୁ (Open Full Website)
            </a>
            <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(story.title + ' ' + canonicalUrl)}" target="_blank" rel="noopener noreferrer" style="background: #25D366; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 8px;">
              📲 WhatsApp ରେ ସେୟାର୍ କରନ୍ତୁ
            </a>
          </div>
        </article>
      </main>

      <!-- Website Footer -->
      <footer style="background: #701a1e; color: #fef3c7; text-align: center; padding: 28px 16px; margin-top: 40px; border-top: 3px solid #f59e0b;">
        <div style="max-width: 800px; margin: 0 auto;">
          <h3 style="font-size: 18px; font-weight: 800; color: #fbbf24; margin: 0 0 8px 0;">ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV</h3>
          <p style="font-size: 13px; color: #fde68a; margin: 0 0 16px 0;">ଓଡ଼ିଶାର ନଂ. ୧ ଆଧ୍ୟାତ୍ମିକ ପୋର୍ଟାଲ - ପୂଜା ସାମଗ୍ରୀ, ମନ୍ଦିର ବୁକିଂ, ପାଞ୍ଜି ଏବଂ ବ୍ରତକଥା।</p>
          <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; font-size: 13px; font-weight: 700; margin-bottom: 16px;">
            <a href="${DOMAIN}/?view=home" style="color: #ffffff; text-decoration: none;">ମୁଖ୍ୟ ପୃଷ୍ଠା</a> |
            <a href="${DOMAIN}/?view=store" style="color: #ffffff; text-decoration: none;">ପୂଜା ଷ୍ଟୋର</a> |
            <a href="${DOMAIN}/?view=panchang" style="color: #ffffff; text-decoration: none;">ଓଡ଼ିଆ ପାଞ୍ଜି</a> |
            <a href="${DOMAIN}/?view=blog" style="color: #ffffff; text-decoration: none;">ସମସ୍ତ ଲେଖା</a>
          </div>
          <p style="font-size: 11px; color: #fcd34d; opacity: 0.8; margin: 0;">© Bhakti Ananda Odia TV. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  `;
  finalHtml = finalHtml.replace(/<div id="root"[^>]*>.*?<\/div>/s, storyHtml);

  finalHtml = finalHtml.replace(/<!-- Synchronous Immediate Pre-Render OG Tag Injector.*?<\/script>/gis, '');

  return finalHtml;
}

const triggerAmplifyRebuild = async () => {};

export async function autoPublishStoryHtmlToS3(story: SpiritualStory): Promise<boolean> {
  try {
    const awsConfig = getClientAwsConfig();
    const htmlContent = await buildStoryHtml(story);
    const storyId = (story.id || '').replace(/^(\/)?story\//i, '');

    console.log('[Auto S3 Story HTML] 🚀 Built HTML for:', storyId, '| Image URL:', (story as any).imageUrl);

    if (awsConfig.isDirectReady) {
      console.log('[Auto S3 Story HTML] Directly pushing to S3 bucket:', awsConfig.bucket);
      const s3Client = new S3Client({
        region: awsConfig.region,
        credentials: {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
        },
        maxAttempts: 3,
      });

      const bodyBytes = new TextEncoder().encode(htmlContent);
      const uploadTasks = [
        s3Client.send(new PutObjectCommand({ Bucket: awsConfig.bucket, Key: `story/${storyId}/index.html`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' })),
        s3Client.send(new PutObjectCommand({ Bucket: awsConfig.bucket, Key: `story/${storyId}`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' })),
        s3Client.send(new PutObjectCommand({ Bucket: awsConfig.bucket, Key: `story/${storyId}.html`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' }))
      ];
      await Promise.all(uploadTasks);
      console.log(`[Auto S3 Story HTML] ✅ Successfully pushed static HTML files for ${storyId}`);
    } else {
      console.warn('[Auto S3 Story HTML] ⚠️ AWS Keys missing on client! Facebook Share will NOT show original photo because S3 HTML upload is skipped.');
    }

    try {
      await fetch('/api/sync-story-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, html: htmlContent }),
      });
    } catch {}

    return true;
  } catch (err: any) {
    console.error('[Auto S3 Story HTML] ❌ Error:', err?.message || err);
    return false;
  }
}

export async function bulkPublishAllStoriesToS3(
  stories: SpiritualStory[],
  onProgress?: (done: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  const total = stories.length;
  for (let i = 0; i < total; i++) {
    const s = stories[i];
    const ok = await autoPublishStoryHtmlToS3(s);
    if (ok) success++;
    else failed++;
    if (onProgress) onProgress(i + 1, total);
  }
  return { success, failed };
}
