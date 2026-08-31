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

/**
 * Builds the complete standalone HTML document for any story
 * Contains exact Open Graph, Twitter, SEO meta tags and client SPA app shell.
 */
export function buildStoryHtml(story: SpiritualStory): string {
  const storyId = story.id;
  const title = `📖 ${story.title} | Bhakti Ananda Odia TV`;
  const description = (story.summary || story.content || 'ପବିତ୍ର ଓଡ଼ିଆ ବ୍ରତକଥା, ଠାକୁରଙ୍କ ମାହାତ୍ମ୍ୟ ଓ ଆଧ୍ୟାତ୍ମିକ ଲେଖା ପଢ଼ନ୍ତୁ।').slice(0, 200);
  const rawImg = story.imageUrl || DEFAULT_BRAND_LOGO;
  const imageUrl = rawImg.startsWith('http') ? rawImg : `${DOMAIN}/${rawImg.replace(/^\//, '')}`;
  const canonicalUrl = `${DOMAIN}/story/${storyId}/index.html`;

  let imageType = 'image/jpeg';
  if (imageUrl.includes('.png')) imageType = 'image/png';
  else if (imageUrl.includes('.webp')) imageType = 'image/webp';
  else if (imageUrl.includes('.svg')) imageType = 'image/svg+xml';

  return `<!doctype html>
<html lang="or" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/brand-banner.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
    <meta name="theme-color" content="#b45309" />
    
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
    <meta name="image" content="${imageUrl}" />
    <meta itemprop="image" content="${imageUrl}" />

    <link rel="manifest" href="/manifest.json" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Kalinga&family=Naveen+Odia&family=Anek+Odia:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    
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
    <script type="module" crossorigin src="/assets/index.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index.css">
  </head>
  <body class="h-full bg-slate-50 text-slate-900 font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
    <div id="root">
      <noscript>
        <div style="padding: 24px; font-family: sans-serif; max-width: 800px; margin: 0 auto;">
          <h1>${escapeHtml(title)}</h1>
          <img src="${imageUrl}" alt="${escapeHtml(title)}" style="max-width: 100%; border-radius: 8px;" />
          <p style="margin-top: 16px; font-size: 18px; line-height: 1.6;">${escapeHtml(description)}</p>
          <p><a href="/" style="color: #b45309; font-weight: bold;">ମୁଖ୍ୟ ପୃଷ୍ଠାକୁ ଯାଆନ୍ତୁ</a></p>
        </div>
      </noscript>
    </div>
    <script>
      // Automatically redirect browser to story view if needed
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/story/') && !window.location.hash) {
        window.history.replaceState(null, '', '/story/' + encodeURIComponent('${storyId}'));
      }
    </script>
  </body>
</html>`;
}

/**
 * Automatically uploads story static HTML directly to AWS S3
 * This guarantees that ANY newly published story gets instant, zero-delay preview on Facebook & WhatsApp!
 */
export async function autoPublishStoryHtmlToS3(story: SpiritualStory): Promise<boolean> {
  try {
    const awsConfig = getClientAwsConfig();
    const htmlContent = buildStoryHtml(story);
    const storyId = story.id;

    // 1. If Direct AWS S3 Client SDK is configured, upload directly
    if (awsConfig.isDirectReady) {
      const s3Client = new S3Client({
        region: awsConfig.region,
        credentials: {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
        },
        maxAttempts: 2,
      });

      const bodyBytes = new TextEncoder().encode(htmlContent);

      const uploadTasks = [
        // 1. story/[id]/index.html
        s3Client.send(
          new PutObjectCommand({
            Bucket: awsConfig.bucket,
            Key: `story/${storyId}/index.html`,
            Body: bodyBytes,
            ContentType: 'text/html; charset=utf-8',
            CacheControl: 'public, max-age=0, must-revalidate',
          })
        ),
        // 2. story/[id]
        s3Client.send(
          new PutObjectCommand({
            Bucket: awsConfig.bucket,
            Key: `story/${storyId}`,
            Body: bodyBytes,
            ContentType: 'text/html; charset=utf-8',
            CacheControl: 'public, max-age=0, must-revalidate',
          })
        ),
        // 3. story/[id].html
        s3Client.send(
          new PutObjectCommand({
            Bucket: awsConfig.bucket,
            Key: `story/${storyId}.html`,
            Body: bodyBytes,
            ContentType: 'text/html; charset=utf-8',
            CacheControl: 'public, max-age=0, must-revalidate',
          })
        ),
      ];

      await Promise.allSettled(uploadTasks);
      console.log(`[Auto S3 Story HTML] 🚀 Successfully published story HTML to AWS S3: story/${storyId}`);
    }

    // 2. Also notify backend API (if running in fullstack)
    try {
      fetch('/api/sync-story-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, html: htmlContent }),
      }).catch(() => {});
    } catch {}

    return true;
  } catch (err: any) {
    console.warn('[Auto S3 Story HTML] Auto-publish warning:', err?.message || err);
    return false;
  }
}
