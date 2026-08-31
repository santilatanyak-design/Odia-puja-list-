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

  if (!template || !template.includes('<head>')) {
    template = `<!doctype html><html lang="or" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/brand-banner.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
    <title>Bhakti Ananda Odia TV</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
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

    const storyHtml = `
      <div id="root" style="background-color: #FFFBF0; min-height: 100vh;">
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; color: #333;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 15px;">${escapeHtml(story.title)}</h1>
          ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(story.title)}" style="width: 100%; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />` : ''}
          <div style="line-height: 1.6; font-size: 16px;">
            ${(story.content || '').split('\n\n').map(p => '<p style="margin-bottom: 15px;">' + escapeHtml(p.replace(/^###\s*/, '')) + '</p>').join('')}
          </div>
          <p style="text-align: center; margin-top: 40px; color: #888; font-size: 12px;">ଅଧିକ ପଢିବାକୁ ତଳକୁ ସ୍କ୍ରୋଲ୍ କରନ୍ତୁ... Loading interactive features...</p>
        </div>
      </div>
    `;
    finalHtml = finalHtml.replace(/<div id="root"[^>]*>.*?<\/div>/, storyHtml);

  }

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
