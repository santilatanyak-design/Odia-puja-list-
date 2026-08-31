const fs = require('fs');
let code = fs.readFileSync('src/lib/publishStoryHtml.ts', 'utf-8');

// Replace the buildStoryHtml function to ensure it creates a perfect static HTML for Facebook
const replaceFunction = `export async function buildStoryHtml(story: SpiritualStory): Promise<string> {
  const storyId = (story.id || '').replace(/^(\\/)?story\\//i, '').replace(/\\.html?$/i, '').replace(/\\/$/, '').trim();
  const title = \`\${story.title} | Bhakti Ananda Odia TV\`;
  const description = (story.summary || story.content || 'ପବିତ୍ର ଓଡ଼ିଆ ବ୍ରତକଥା, ଠାକୁରଙ୍କ ମାହାତ୍ମ୍ୟ ଓ ଆଧ୍ୟାତ୍ମିକ ଲେଖା ପଢ଼ନ୍ତୁ।').replace(/<[^>]*>?/gm, '').slice(0, 200);
  const rawImg = story.imageUrl || DEFAULT_BRAND_LOGO;
  const imageUrl = rawImg.startsWith('http') ? rawImg : \`\${DOMAIN}/\${rawImg.replace(/^\\//, '')}\`;
  const canonicalUrl = \`\${DOMAIN}/story/\${encodeURIComponent(storyId)}.html\`;

  let imageType = 'image/jpeg';
  if (imageUrl.includes('.png')) imageType = 'image/png';
  else if (imageUrl.includes('.webp')) imageType = 'image/webp';
  else if (imageUrl.includes('.svg')) imageType = 'image/svg+xml';

  const metaTags = \`
    <title>\${escapeHtml(title)}</title>
    <meta name="description" content="\${escapeHtml(description)}" />
    <link rel="canonical" href="\${canonicalUrl}" />
    <meta property="og:site_name" content="Bhakti Ananda Odia TV" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="\${escapeHtml(title)}" />
    <meta property="og:description" content="\${escapeHtml(description)}" />
    <meta property="og:url" content="\${canonicalUrl}" />
    <meta property="og:image" content="\${imageUrl}" />
    <meta property="og:image:secure_url" content="\${imageUrl}" />
    <meta property="og:image:url" content="\${imageUrl}" />
    <meta property="og:image:type" content="\${imageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="\${escapeHtml(title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="\${escapeHtml(title)}" />
    <meta name="twitter:description" content="\${escapeHtml(description)}" />
    <meta name="twitter:image" content="\${imageUrl}" />
    <meta name="twitter:image:src" content="\${imageUrl}" />
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "\${escapeHtml(story.title)}",
      "image": ["\${imageUrl}"],
      "datePublished": "\${story.publishedAt || new Date().toISOString()}",
      "author": [{
        "@type": "Person",
        "name": "\${escapeHtml(story.author || 'Bhakti Ananda Odia TV')}"
      }]
    }
    </script>
  \`;

  let template = '';
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch(window.location.origin + '/');
      if (res.ok) {
        template = await res.text();
      }
    }
  } catch (err) {
    console.warn('Fetch template failed', err);
  }

  if (!template || !template.includes('<head>')) {
    template = \`<!doctype html><html lang="or"><head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/brand-banner.svg" />
    </head><body><div id="root"></div></body></html>\`;
  }

  let finalHtml = template
    .replace(/<meta\\s+property=["']og:[^"']*["'][^>]*>/gi, '')
    .replace(/<meta\\s+name=["']twitter:[^"']*["'][^>]*>/gi, '')
    .replace(/<meta\\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<title>.*?<\\/title>/gi, '')
    .replace('<head>', \`<head>\\n\${metaTags}\`);

  // Force redirect script so users opening the HTML directly load the SPA properly
  const redirectScript = \`<script>
    if (window.location.pathname.endsWith('/index.html')) {
      window.history.replaceState(null, '', window.location.pathname.replace('/index.html', '/'));
    }
    window.__STORY_INJECTED_OG_TAGS__ = true;
  </script>\`;

  finalHtml = finalHtml.replace('</body>', \`\${redirectScript}</body>\`);

  return finalHtml;
}\`;

code = code.replace(/export async function buildStoryHtml.*?return finalHtml;\s*\}/s, replaceFunction);

// Also modify autoPublishStoryHtmlToS3 to ensure we don't throw errors silently
const uploadFuncRegex = /export async function autoPublishStoryHtmlToS3.*?return true;\s*\}\s*catch[^\}]+\}\s*\}/s;
const newUploadFunc = \`export async function autoPublishStoryHtmlToS3(story: SpiritualStory): Promise<boolean> {
  try {
    const awsConfig = getClientAwsConfig();
    const htmlContent = await buildStoryHtml(story);
    const storyId = story.id;
    
    console.log('[Auto S3 Story HTML] Built HTML for', storyId, 'Image:', story.imageUrl);

    if (awsConfig.isDirectReady) {
      console.log('[Auto S3 Story HTML] Uploading directly to S3 bucket:', awsConfig.bucket);
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
        s3Client.send(new PutObjectCommand({ Bucket: awsConfig.bucket, Key: \`story/\${storyId}/index.html\`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' })),
        s3Client.send(new PutObjectCommand({ Bucket: awsConfig.bucket, Key: \`story/\${storyId}\`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' })),
        s3Client.send(new PutObjectCommand({ Bucket: awsConfig.bucket, Key: \`story/\${storyId}.html\`, Body: bodyBytes, ContentType: 'text/html; charset=utf-8', CacheControl: 'public, max-age=0, must-revalidate' }))
      ];
      await Promise.all(uploadTasks);
      console.log(\`[Auto S3 Story HTML] ✅ Successfully published story HTML to AWS S3: story/\${storyId}\`);
    } else {
      console.warn('[Auto S3 Story HTML] AWS S3 keys missing on client! Unable to upload static HTML directly to S3. Facebook sharing will show default logo.');
    }

    triggerAmplifyRebuild().catch(() => {});
    try {
      await fetch('/api/sync-story-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, html: htmlContent }),
      });
    } catch {}
    return true;
  } catch (err: any) {
    console.error('[Auto S3 Story HTML] Auto-publish error:', err?.message || err);
    return false;
  }
}\`;

code = code.replace(uploadFuncRegex, newUploadFunc);

fs.writeFileSync('src/lib/publishStoryHtml.ts', code);
