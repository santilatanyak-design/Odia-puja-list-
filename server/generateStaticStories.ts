import fs from 'fs';
import path from 'path';
import { SpiritualStory } from '../src/types';
import { serverFirestore, syncAllStoriesFromFirestore } from './firebaseSync';
import { collection, getDocs } from 'firebase/firestore';
import { uploadAllStoryHtmlToS3 } from './uploadStoriesToS3';

const DOMAIN = 'https://www.bhaktianandaodiatvofficial.blog';
const DEFAULT_IMAGE = 'https://www.bhaktianandaodiatvofficial.blog/brand-banner.svg';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function generateStaticStoryPages(targetBaseDir?: string) {
  try {
    console.log('[Static Page Generator] 🚀 Starting static HTML generation for AWS/Cloud hosting...');
    
    // 1. Load base index.html template (prefer dist/index.html after vite build, fallback to root index.html)
    const distTemplatePath = path.join(process.cwd(), 'dist', 'index.html');
    const rootTemplatePath = path.join(process.cwd(), 'index.html');
    const templatePath = fs.existsSync(distTemplatePath) ? distTemplatePath : rootTemplatePath;
    if (!fs.existsSync(templatePath)) {
      console.warn('[Static Page Generator] Template index.html not found');
      return;
    }
    const template = fs.readFileSync(templatePath, 'utf-8');

    // 2. Fetch stories from Firestore and posts.json
    let stories: SpiritualStory[] = [];
    try {
      stories = await syncAllStoriesFromFirestore();
    } catch (err) {
      console.warn('[Static Page Generator] Error syncing from firestore, using fallback:', err);
    }

    // Also check posts.json
    const postsJsonPath = path.join(process.cwd(), 'posts.json');
    let postsData: Record<string, any> = {};
    if (fs.existsSync(postsJsonPath)) {
      try {
        postsData = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
      } catch {}
    }

    // Merge stories with postsData
    const storyMap = new Map<string, { id: string; title: string; description: string; imageUrl: string }>();

    stories.forEach((s) => {
      if (s && s.id) {
        storyMap.set(s.id, {
          id: s.id,
          title: s.title || 'ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV',
          description: (s.summary || s.content || '').slice(0, 160),
          imageUrl: s.imageUrl || DEFAULT_IMAGE,
        });
      }
    });

    Object.keys(postsData).forEach((k) => {
      const item = postsData[k];
      if (item && item.id && !storyMap.has(item.id)) {
        storyMap.set(item.id, {
          id: item.id,
          title: item.title || 'ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV',
          description: item.description || '',
          imageUrl: item.image || DEFAULT_IMAGE,
        });
      }
    });

    console.log(`[Static Page Generator] 📚 Processing ${storyMap.size} stories...`);

    const outputDirs = [
      targetBaseDir || path.join(process.cwd(), 'dist'),
      path.join(process.cwd(), 'public'),
    ];

    storyMap.forEach((story) => {
      const storyId = story.id.replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
      const title = `📖 ${story.title} | Bhakti Ananda Odia TV`;
      const description = story.description || 'ପବିତ୍ର ଓଡ଼ିଆ ବ୍ରତକଥା, ଠାକୁରଙ୍କ ମାହାତ୍ମ୍ୟ ଓ ଆଧ୍ୟାତ୍ମିକ ଲେଖା ପଢ଼ନ୍ତୁ।';
      
      const DEFAULT_BRAND_LOGO = 'https://www.bhaktianandaodiatvofficial.blog/brand-banner.svg';
      const rawImg = (story as any).imageUrl || (story as any).image || DEFAULT_BRAND_LOGO;
      const imageUrl = rawImg.startsWith('http') ? rawImg : `${DOMAIN}/${rawImg.replace(/^\//, '')}`;
  
      const canonicalUrl = `${DOMAIN}/story/${encodeURIComponent(storyId)}.html`;

      let imageType = 'image/jpeg';
      if (imageUrl.includes('.png')) imageType = 'image/png';
      else if (imageUrl.includes('.webp')) imageType = 'image/webp';
      else if (imageUrl.includes('.svg')) imageType = 'image/svg+xml';

      // Clean template of existing meta tags
      let cleaned = template
        .replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, '')
        .replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, '')
        .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
        .replace(/<meta\s+property=["']fb:app_id["'][^>]*>/gi, '')
        .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
        .replace(/<title>.*?<\/title>/gi, '');

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
      "datePublished": "${new Date().toISOString()}",
      "author": [{
        "@type": "Person",
        "name": "Bhakti Ananda Odia TV"
      }]
    }
    </script>
  `;

      
      let finalHtml = cleaned;
      if (finalHtml.includes('name="viewport"')) {
        finalHtml = finalHtml.replace(/(<meta\s+name=["']viewport["'][^>]*>)/i, `$1\n${metaTags}`);
      } else {
        finalHtml = finalHtml.replace('<head>', `<head>\n${metaTags}`);
      }

      const storyHtml = `
        <div id="root" style="background-color: #FFFBF0; min-height: 100vh;">
          <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; color: #333;">
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 15px;">${escapeHtml(story.title)}</h1>
            ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(story.title)}" style="width: 100%; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />` : ''}
            <div style="line-height: 1.6; font-size: 16px;">
              ${((story as any).content || story.description || '').split('\n\n').map((p: string) => '<p style="margin-bottom: 15px;">' + escapeHtml(p.replace(/^###\s*/, '')) + '</p>').join('')}
            </div>
            <p style="text-align: center; margin-top: 40px; color: #888; font-size: 12px;">ଅଧିକ ପଢିବାକୁ ତଳକୁ ସ୍କ୍ରୋଲ୍ କରନ୍ତୁ... Loading interactive features...</p>
          </div>
        </div>
      `;
      finalHtml = finalHtml.replace(/<div id="root"[^>]*>.*?<\/div>/, storyHtml);
      
      outputDirs.forEach((outDir) => {
        try {
          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
          }

          // 1. /story/[storyId]/index.html
          const storyDir = path.join(outDir, 'story', storyId);
          if (!fs.existsSync(storyDir)) {
            fs.mkdirSync(storyDir, { recursive: true });
          }
          fs.writeFileSync(path.join(storyDir, 'index.html'), finalHtml, 'utf-8');

          // 2. /story/[storyId].html
          const htmlPath = path.join(outDir, 'story', `${storyId}.html`);
          fs.writeFileSync(htmlPath, finalHtml, 'utf-8');

          // 3. /story/[storyId] (direct file without extension for S3 clean URLs)
          const cleanPath = path.join(outDir, 'story', storyId, 'index.html');
          if (fs.existsSync(path.dirname(cleanPath))) {
            fs.writeFileSync(cleanPath, finalHtml, 'utf-8');
          }
        } catch (writeErr) {
          console.warn(`[Static Page Generator] Write error for ${storyId} in ${outDir}:`, writeErr);
        }
      });
    });

    // Auto-upload all generated story HTML pages directly to AWS S3 if credentials exist
    try {
      await uploadAllStoryHtmlToS3();
    } catch (s3Err) {
      console.warn('[Static Page Generator] S3 upload error:', s3Err);
    }

    console.log('[Static Page Generator] ✅ Static HTML story pages generated successfully!');
  } catch (err) {
    console.error('[Static Page Generator] Error:', err);
  }
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].includes('generateStaticStories')) {
  generateStaticStoryPages().then(() => {
    console.log('Done.');
    process.exit(0);
  });
}
