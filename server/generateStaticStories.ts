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
    const storyMap = new Map<string, {
      id: string;
      title: string;
      description: string;
      content: string;
      summary: string;
      imageUrl: string;
      affiliateAd?: any;
    }>();

    stories.forEach((s: any) => {
      if (s && s.id) {
        storyMap.set(s.id, {
          id: s.id,
          title: s.title || 'ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV',
          description: s.summary || (s.content ? s.content.slice(0, 180) : ''),
          content: s.content || s.summary || '',
          summary: s.summary || '',
          imageUrl: s.imageUrl || DEFAULT_IMAGE,
          affiliateAd: s.affiliateAd,
        });
      }
    });

    const postsList = Array.isArray(postsData) ? postsData : Object.values(postsData);
    postsList.forEach((item: any) => {
      if (item && item.id) {
        const cleanId = item.id.replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
        if (cleanId && !storyMap.has(cleanId)) {
          storyMap.set(cleanId, {
            id: cleanId,
            title: item.title || 'ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV',
            description: item.summary || item.description || (item.content ? item.content.slice(0, 180) : ''),
            content: item.content || item.description || item.summary || '',
            summary: item.summary || '',
            imageUrl: item.image || item.imageUrl || DEFAULT_IMAGE,
            affiliateAd: item.affiliateAd,
          });
        }
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
      window.__PRELOADED_STATE__ = {
        viewMode: 'blog',
        storyId: "${escapeHtml(storyId)}",
        story: ${JSON.stringify(story).replace(/</g, '\\u003c')}
      };

      // In-page deep link handler for Amazon, Flipkart, Meesho & Chrome breakout
      function handleSmartAffiliate(event, url, store) {
        if (!url) return;
        var ua = navigator.userAgent || '';
        var isAndroid = /android/i.test(ua);
        if (isAndroid) {
          if (event && event.preventDefault) event.preventDefault();
          var cleanUrl = url.trim();
          var urlNoProto = cleanUrl.replace(/^https?:\\/\\//i, '');
          var pkg = 'com.android.chrome';
          if (store === 'amazon') pkg = 'in.amazon.mShop.android.shopping';
          else if (store === 'flipkart') pkg = 'com.flipkart.android';
          else if (store === 'meesho') pkg = 'com.meesho.supply';

          var appIntent = 'intent://' + urlNoProto + '#Intent;scheme=https;package=' + pkg + ';S.browser_fallback_url=' + encodeURIComponent(cleanUrl) + ';end;';
          var chromeIntent = 'intent://' + urlNoProto + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(cleanUrl) + ';end;';

          try {
            if (window.top) window.top.location.href = appIntent;
            else window.location.href = appIntent;
          } catch(e) {
            window.location.href = appIntent;
          }

          setTimeout(function() {
            try {
              if (window.top) window.top.location.href = chromeIntent;
              else window.location.href = chromeIntent;
            } catch(e) {
              window.location.href = chromeIntent;
            }
          }, 800);

          setTimeout(function() {
            window.location.href = cleanUrl;
          }, 1600);
        }
      }

      // If user arrives via social media direct link on the static HTML, redirect to SPA
      if (window.location.pathname.indexOf('/story/') !== -1 && window.location.search.indexOf('noredirect') === -1) {
        window.location.href = "${DOMAIN}/?view=blog&storyId=${encodeURIComponent(storyId)}";
      }
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

      // Ensure asset paths in script/link tags are absolute
      finalHtml = finalHtml
        .replace(/src=["'](?!http|\/)(assets\/[^"']+)["']/g, 'src="/$1"')
        .replace(/href=["'](?!http|\/)(assets\/[^"']+)["']/g, 'href="/$1"');

      const storyHtml = `
        <div id="root" style="background-color: #FFFBF0; min-height: 100vh; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <!-- Top Website Header -->
          <header style="background: linear-gradient(135deg, #701a1e 0%, #8B0000 100%); color: #ffffff; padding: 12px 16px; border-bottom: 3px solid #f59e0b; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
              <a href="${DOMAIN}/?view=home" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: #ffffff;">
                <img src="${DEFAULT_IMAGE}" alt="Bhakti Ananda Logo" style="height: 40px; width: auto; border-radius: 8px; background: #ffffff; padding: 2px;" />
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
              <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                <span style="background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 12px;">📖 ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ / ବ୍ରତକଥା</span>
                <span style="color: #78716c; font-size: 12px;">Bhakti Ananda Odia TV</span>
              </div>

              <h1 style="font-size: 26px; font-weight: 800; color: #701a1e; margin: 0 0 16px 0; line-height: 1.35;">${escapeHtml(story.title)}</h1>
              
              ${imageUrl ? `<div style="margin-bottom: 20px; text-align: center;"><img src="${imageUrl}" alt="${escapeHtml(story.title)}" style="width: 100%; max-height: 480px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" /></div>` : ''}

              <!-- Full Content Body -->
              <div style="line-height: 1.85; font-size: 17px; color: #1e293b; margin-bottom: 24px;">
                ${(() => {
                  const raw = (story as any).content || story.description || story.summary || '';
                  return raw
                    .split(/\n\s*\n|\n/)
                    .map((p: string) => p.trim())
                    .filter(Boolean)
                    .map((p: string) => {
                      if (p.startsWith('### ')) {
                        return `<h3 style="font-size: 20px; font-weight: 800; color: #701a1e; margin: 24px 0 10px 0; border-bottom: 2px solid #fed7aa; padding-bottom: 4px;">${escapeHtml(p.replace(/^###\s*/, ''))}</h3>`;
                      }
                      if (p.startsWith('> ')) {
                        return `<blockquote style="padding: 12px 16px; background: #fff7ed; border-left: 4px solid #ea580c; border-radius: 0 10px 10px 0; font-style: italic; font-weight: bold; color: #7c2d12; margin: 16px 0;">${escapeHtml(p.replace(/^>\s*/, ''))}</blockquote>`;
                      }
                      if (p.startsWith('• ') || p.startsWith('- ')) {
                        return `<div style="display: flex; align-items: start; gap: 8px; margin: 6px 0; color: #1e293b;"><span style="color: #ea580c; font-weight: 900;">•</span><span>${escapeHtml(p.replace(/^[•\-]\s*/, ''))}</span></div>`;
                      }
                      return `<p style="margin-bottom: 16px; line-height: 1.85; font-size: 17px;">${escapeHtml(p)}</p>`;
                    })
                    .join('');
                })()}
              </div>

              <!-- Affiliate Product Ad Section (Amazon, Flipkart, Meesho, Chrome) -->
              ${(() => {
                const ad = (story as any).affiliateAd;
                const hasAffiliate = ad && ad.enabled !== false && Boolean(
                  ad.amazonLink || ad.flipkartLink || ad.meeshoLink || ad.affiliateUrl
                );
                if (!hasAffiliate || !ad) return '';

                return `
                  <div id="story-affiliate-card" style="margin: 32px 0 24px 0; background: linear-gradient(145deg, #fffbeb, #fef3c7); border: 2px solid #f59e0b; border-radius: 20px; padding: 20px; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.15);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
                      <span style="background: #f59e0b; color: #78350f; font-size: 11px; font-weight: 900; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ⭐ ପ୍ରାୟୋଜିତ ବିଶେଷ ଅଫର (Special Sponsored Offer)
                      </span>
                      <span style="color: #059669; font-size: 12px; font-weight: 800; background: #d1fae5; padding: 3px 8px; border-radius: 6px;">
                        ✓ 100% Original Verified
                      </span>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 16px;">
                      ${ad.productImageUrl ? `
                        <div style="text-align: center; background: #ffffff; border-radius: 14px; padding: 12px; border: 1px solid #fde68a;">
                          <img src="${escapeHtml(ad.productImageUrl)}" alt="${escapeHtml(ad.productTitle || 'Product')}" style="max-height: 240px; max-width: 100%; object-fit: contain; border-radius: 8px;" />
                        </div>
                      ` : ''}

                      <div>
                        ${ad.productTitle ? `
                          <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 8px 0; line-height: 1.4;">
                            ${escapeHtml(ad.productTitle)}
                          </h3>
                        ` : ''}
                        ${ad.productDescription ? `
                          <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0; line-height: 1.6;">
                            ${escapeHtml(ad.productDescription)}
                          </p>
                        ` : ''}

                        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">
                          ${ad.amazonLink ? `
                            <a href="${escapeHtml(ad.amazonLink)}" onclick="handleSmartAffiliate(event, '${escapeHtml(ad.amazonLink)}', 'amazon')" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #ff9900, #e68a00); color: #111827; text-decoration: none; padding: 12px 18px; border-radius: 14px; font-weight: 900; font-size: 15px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(230,138,0,0.35);">
                              🛒 Buy on Amazon (ଆମାଜନରୁ କିଣନ୍ତୁ)
                            </a>
                          ` : ''}

                          ${ad.flipkartLink ? `
                            <a href="${escapeHtml(ad.flipkartLink)}" onclick="handleSmartAffiliate(event, '${escapeHtml(ad.flipkartLink)}', 'flipkart')" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #2874f0, #175ecb); color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 14px; font-weight: 900; font-size: 15px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(40,116,240,0.35);">
                              🛍️ Buy on Flipkart (ଫ୍ଲିପକାର୍ଟରୁ କିଣନ୍ତୁ)
                            </a>
                          ` : ''}

                          ${ad.meeshoLink ? `
                            <a href="${escapeHtml(ad.meeshoLink)}" onclick="handleSmartAffiliate(event, '${escapeHtml(ad.meeshoLink)}', 'meesho')" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #f43397, #c71e74); color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 14px; font-weight: 900; font-size: 15px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(244,51,151,0.35);">
                              🎀 Buy on Meesho (ମିଶୋରୁ କିଣନ୍ତୁ)
                            </a>
                          ` : ''}

                          ${(!ad.amazonLink && !ad.flipkartLink && !ad.meeshoLink && ad.affiliateUrl) ? `
                            <a href="${escapeHtml(ad.affiliateUrl)}" onclick="handleSmartAffiliate(event, '${escapeHtml(ad.affiliateUrl)}', 'generic')" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #ff9900, #e68a00); color: #111827; text-decoration: none; padding: 12px 18px; border-radius: 14px; font-weight: 900; font-size: 15px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(230,138,0,0.35);">
                              ⚡ ଏବେ ଅର୍ଡର କରନ୍ତୁ (Order Now)
                            </a>
                          ` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              })()}

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
