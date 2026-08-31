const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/publishStoryHtml.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const targetStart = 'export function buildStoryHtml(story: SpiritualStory): string {';
const targetEnd = '</html>`;\n}';

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd, startIndex) + targetEnd.length;

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find target function bounds');
    process.exit(1);
}

const replacement = `export async function buildStoryHtml(story: SpiritualStory): Promise<string> {
  const storyId = (story.id || '').replace(/^(\\/)?story\\//i, '').replace(/\\.html?$/i, '').replace(/\\/$/, '').trim();
  const title = \`📖 \${story.title} | Bhakti Ananda Odia TV\`;
  const description = (story.summary || story.content || 'ପବିତ୍ର ଓଡ଼ିଆ ବ୍ରତକଥା, ଠାକୁରଙ୍କ ମାହାତ୍ମ୍ୟ ଓ ଆଧ୍ୟାତ୍ମିକ ଲେଖା ପଢ଼ନ୍ତୁ।').slice(0, 200);
  const rawImg = story.imageUrl || DEFAULT_BRAND_LOGO;
  const imageUrl = rawImg.startsWith('http') ? rawImg : \`\${DOMAIN}/\${rawImg.replace(/^\\//, '')}\`;
  const canonicalUrl = \`\${DOMAIN}/story/\${encodeURIComponent(storyId)}.html\`;

  let imageType = 'image/jpeg';
  if (imageUrl.includes('.png')) imageType = 'image/png';
  else if (imageUrl.includes('.webp')) imageType = 'image/webp';
  else if (imageUrl.includes('.svg')) imageType = 'image/svg+xml';

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

  // Fallback template if fetch fails
  if (!template) {
    template = \`<!doctype html>
<html lang="or" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/brand-banner.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
    <title>Bhakti Ananda Odia TV</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>\`;
  }

  // Clean template of existing meta tags (same logic as generateStaticStories.ts)
  let cleaned = template
    .replace(/<meta\\s+property=["']og:[^"']*["'][^>]*>/gi, '')
    .replace(/<meta\\s+name=["']twitter:[^"']*["'][^>]*>/gi, '')
    .replace(/<meta\\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\\s+property=["']fb:app_id["'][^>]*>/gi, '')
    .replace(/<link\\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<title>.*?<\\/title>/gi, '');

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
    <meta name="image" content="\${imageUrl}" />
    <meta itemprop="image" content="\${imageUrl}" />
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
      }],
      "publisher": {
        "@type": "Organization",
        "name": "Bhakti Ananda Odia TV",
        "logo": {
          "@type": "ImageObject",
          "url": "\${DOMAIN}/brand-banner.svg"
        }
      },
      "description": "\${escapeHtml(description)}"
    }
    </script>
  \`;

  let finalHtml = cleaned;
  if (finalHtml.includes('name="viewport"')) {
    finalHtml = finalHtml.replace(/(<meta\\s+name=["']viewport["'][^>]*>)/i, \`$1\\n\${metaTags}\`);
  } else {
    finalHtml = finalHtml.replace('<head>', \`<head>\\n\${metaTags}\`);
  }

  // Also remove the client-side pre-render script that might override these tags
  finalHtml = finalHtml.replace(/<!-- Synchronous Immediate Pre-Render OG Tag Injector.*?<\\/script>/gis, '');

  return finalHtml;
}`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully replaced buildStoryHtml');
