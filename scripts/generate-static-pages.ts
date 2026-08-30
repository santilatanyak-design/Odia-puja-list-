import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_TEMPLES } from '../src/data/defaultTemples';
import { DEFAULT_DISTRICT_ITEMS } from '../src/data/defaultDistrictItems';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const DB_PATH = path.resolve(ROOT_DIR, 'data/db.json');

const SITE_URL = 'https://www.bhaktianandaodiatvofficial.blog';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1200&auto=format&fit=crop';
const DEFAULT_TITLE = 'Bhakti Ananda Odia TV | ଶ୍ରୀ ମନ୍ଦିର ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ, ଓଡ଼ିଶା ଦର୍ଶନ, ପଞ୍ଜିକା ଓ ଆଧ୍ୟାତ୍ମିକ କଥା';
const DEFAULT_DESC = 'ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV - ସମ୍ପୂର୍ଣ୍ଣ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ, ପ୍ରାମାଣିକ ଓଡ଼ିଆ କ୍ୟାଲେଣ୍ଡର ପାଞ୍ଜି, ଅନଲାଇନ୍ ମନ୍ଦିର ପୂଜା ବୁକିଂ, ଓଡ଼ିଶାର ୩୦ ଜିଲ୍ଲା ଦର୍ଶନ ଏବଂ ଆଧ୍ୟାତ୍ମିକ ଭିଡିଓ।';

export interface PageMetadata {
  relPath: string;
  title: string;
  description: string;
  imageUrl: string;
  type?: 'website' | 'article' | 'product';
  preloadedState?: Record<string, any>;
}

function loadDatabase(): { stories?: any[]; temples?: any[]; districtItems?: any[]; products?: any[]; storeProducts?: any[] } {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read data/db.json, using defaults:', err);
  }
  return {};
}

export function generateHtmlWithMeta(
  baseHtml: string,
  meta: PageMetadata
): string {
  const fullUrl = meta.relPath ? `${SITE_URL}/${meta.relPath}` : `${SITE_URL}/`;
  let img = meta.imageUrl || DEFAULT_IMAGE;
  if (img.startsWith('/')) {
    img = `${SITE_URL}${img}`;
  }

  const title = meta.title || DEFAULT_TITLE;
  const desc = meta.description || DEFAULT_DESC;
  const ogType = meta.type || 'website';

  let imageType = 'image/jpeg';
  if (img.includes('.png')) imageType = 'image/png';
  else if (img.includes('.webp')) imageType = 'image/webp';

  // Strip existing OG, Twitter, canonical, description, and title
  let html = baseHtml
    .replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']image["'][^>]*>/gi, '')
    .replace(/<meta\s+itemprop=["']image["'][^>]*>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<title>.*?<\/title>/gi, '');

  const preloadedScript = meta.preloadedState
    ? `<script>window.__PRELOADED_STATE__ = ${JSON.stringify(meta.preloadedState)};</script>`
    : '';

  const ogTags = `
    <title>${title}</title>
    <meta name="description" content="${desc}" />
    <link rel="canonical" href="${fullUrl}" />
    <meta property="og:site_name" content="Bhakti Ananda Odia TV & Puja Samagri Portal" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:secure_url" content="${img}" />
    <meta property="og:image:url" content="${img}" />
    <meta property="og:image:type" content="${imageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${title}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${img}" />
    <meta name="twitter:image:src" content="${img}" />
    <meta name="image" content="${img}" />
    <meta itemprop="image" content="${img}" />
    ${preloadedScript}
  `;

  return html.replace('<head>', `<head>${ogTags}`);
}

export async function generateAllStaticPages(): Promise<number> {
  console.log('🚀 Generating static pre-rendered SSG pages for Facebook, WhatsApp & social crawlers...');
  const baseIndexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(baseIndexPath)) {
    console.warn('dist/index.html not found, skipping static page generation for now.');
    return 0;
  }

  const baseHtml = fs.readFileSync(baseIndexPath, 'utf-8');
  const db = loadDatabase();

  const pages: PageMetadata[] = [];

  // 1. Homepage with rich metadata
  pages.push({
    relPath: '',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    imageUrl: DEFAULT_IMAGE,
    preloadedState: { viewMode: 'home' }
  });

  // 2. Static Core Pages
  pages.push({
    relPath: 'panchang',
    title: 'ଓଡ଼ିଆ କ୍ୟାଲେଣ୍ଡର ଓ ପଞ୍ଜିକା (Odia Panchang 2025-2026) | Bhakti Ananda Odia TV',
    description: 'ଆଜିର ତିଥି, ନକ୍ଷତ୍ର, ଶୁଭ ବେଳା, ରାହୁ କାଳ ଓ ସମସ୍ତ ଓଡ଼ିଆ ପର୍ବପର୍ବାଣୀ ସୂଚୀ।',
    imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1200&auto=format&fit=crop',
    preloadedState: { viewMode: 'panchang' }
  });

  pages.push({
    relPath: 'shorts',
    title: 'ଭକ୍ତି ସର୍ଟସ୍ ଓ ଆଧ୍ୟାତ୍ମିକ ଭିଡିଓ (Bhakti Shorts) | Bhakti Ananda Odia TV',
    description: 'ପ୍ରତିଦିନ ଦେଖନ୍ତୁ ଓଡ଼ିଶାର ପ୍ରସିଦ୍ଧ ମନ୍ଦିର ଦର୍ଶନ, ମହାପ୍ରସାଦ ଓ ଭକ୍ତି ସର୍ଟସ୍ ଭିଡିଓ।',
    imageUrl: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?q=80&w=1200&auto=format&fit=crop',
    preloadedState: { viewMode: 'shorts' }
  });

  pages.push({
    relPath: 'store',
    title: 'ଶୁଦ୍ଧ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ ଷ୍ଟୋର୍ (Online Puja Samagri Store) | Bhakti Ananda Odia TV',
    description: 'ଶୁଦ୍ଧ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ, ମୂର୍ତ୍ତି, ଧୂପ, ଦୀପ ଓ ଆଧ୍ୟାତ୍ମିକ ସାମଗ୍ରୀ ଘରେ ବସି କିଣନ୍ତୁ।',
    imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1200&auto=format&fit=crop',
    preloadedState: { viewMode: 'store' }
  });

  pages.push({
    relPath: 'puri-store',
    title: 'ପୁରୀ ମନ୍ଦିର ସ୍ୱତନ୍ତ୍ର ପୂଜା ସାମଗ୍ରୀ ଓ ମହାପ୍ରସାଦ ସେବା | Bhakti Ananda Odia TV',
    description: 'ପୁରୀ ଶ୍ରୀକ୍ଷେତ୍ରର ସ୍ୱତନ୍ତ୍ର ନିର୍ମାଲ୍ୟ, ତୁଳସୀ ମାଳା ଓ ପ୍ରସାଦ ବୁକ୍ କରନ୍ତୁ।',
    imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1200&auto=format&fit=crop',
    preloadedState: { viewMode: 'puri_store' }
  });

  pages.push({
    relPath: 'blog',
    title: 'ଓଡ଼ିଆ ଧାର୍ମିକ ଓ ପୌରାଣିକ କଥା (Spiritual Blog) | Bhakti Ananda Odia TV',
    description: 'ପ୍ରଭୁ ଜଗନ୍ନାଥଙ୍କ ଲୀଳା, ଶିବ ପୁରାଣ ଓ ଓଡ଼ିଶାର ପବିତ୍ର ଧାର୍ମିକ କଥା ପଢ଼ନ୍ତୁ।',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop',
    preloadedState: { viewMode: 'blog' }
  });

  // 3. Temples
  const allTemples = [...DEFAULT_TEMPLES];
  if (Array.isArray(db.temples)) {
    db.temples.forEach((t) => {
      if (!allTemples.some((ex) => ex.id === t.id)) {
        allTemples.push(t);
      }
    });
  }

  allTemples.forEach((temple) => {
    const rawDesc = temple.description || temple.history || `ପ୍ରସିଦ୍ଧ ${temple.name} ରେ ଅନଲାଇନ୍ ଜଳାଭିଷେକ ଓ ପୂଜା ବୁକ୍ କରନ୍ତୁ।`;
    const desc = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
    const img = temple.imageUrl || temple.thumbnailUrl || DEFAULT_IMAGE;

    pages.push({
      relPath: `temple/${temple.id}`,
      title: `🚩 ${temple.name} (${temple.location || 'Odisha'}) - ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ | Bhakti Ananda Odia TV`,
      description: desc,
      imageUrl: img,
      preloadedState: { viewMode: 'temple', templeId: temple.id }
    });
  });

  // 4. District Items
  const allDistrictItems = [...DEFAULT_DISTRICT_ITEMS];
  if (Array.isArray(db.districtItems)) {
    db.districtItems.forEach((d) => {
      if (!allDistrictItems.some((ex) => ex.id === d.id)) {
        allDistrictItems.push(d);
      }
    });
  }

  allDistrictItems.forEach((item) => {
    const rawDesc = item.description || item.significance || 'ଓଡ଼ିଶାର ପ୍ରସିଦ୍ଧ ପର୍ଯ୍ୟଟନ ଓ ତୀର୍ଥକ୍ଷେତ୍ର ଦର୍ଶନ କରନ୍ତୁ।';
    const desc = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
    const img = item.imageUrl || item.adImageUrl || item.affiliateProductImageUrl || DEFAULT_IMAGE;

    pages.push({
      relPath: `district/${item.districtId}/${item.id}`,
      title: `🛕 ${item.title} - ${item.districtNameOdia || ''} | ଓଡ଼ିଶା ଦର୍ଶନ | Bhakti Ananda Odia TV`,
      description: desc,
      imageUrl: img,
      preloadedState: { viewMode: 'home', selectedDistrictId: item.districtId, selectedItemId: item.id }
    });
  });

  // 5. Stories / Spiritual Articles
  if (Array.isArray(db.stories)) {
    db.stories.forEach((story) => {
      const rawDesc = story.summary || story.content || DEFAULT_DESC;
      const desc = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
      const img = story.imageUrl || DEFAULT_IMAGE;

      pages.push({
        relPath: `story/${story.id}`,
        title: `📖 ${story.title} | Bhakti Ananda Odia TV`,
        description: desc,
        imageUrl: img,
        type: 'article',
        preloadedState: { viewMode: 'blog', storyId: story.id }
      });

      pages.push({
        relPath: `blog/${story.id}`,
        title: `📖 ${story.title} | Bhakti Ananda Odia TV`,
        description: desc,
        imageUrl: img,
        type: 'article',
        preloadedState: { viewMode: 'blog', storyId: story.id }
      });
    });
  }

  // 6. Products
  const products = Array.isArray(db.products) ? db.products : (Array.isArray(db.storeProducts) ? db.storeProducts : []);
  products.forEach((prod) => {
    const rawDesc = prod.description || `ଶୁଦ୍ଧ ଓ ପ୍ରାମାଣିକ ${prod.name} କିଣନ୍ତୁ।`;
    const desc = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
    const img = prod.imageUrl || prod.photoUrl || DEFAULT_IMAGE;

    pages.push({
      relPath: `store/${prod.id}`,
      title: `🛍️ ${prod.name} | ଶୁଦ୍ଧ ପୂଜା ସାମଗ୍ରୀ | Bhakti Ananda Odia TV`,
      description: desc,
      imageUrl: img,
      type: 'product',
      preloadedState: { viewMode: 'store', productId: prod.id }
    });

    pages.push({
      relPath: `product/${prod.id}`,
      title: `🛍️ ${prod.name} | ଶୁଦ୍ଧ ପୂଜା ସାମଗ୍ରୀ | Bhakti Ananda Odia TV`,
      description: desc,
      imageUrl: img,
      type: 'product',
      preloadedState: { viewMode: 'store', productId: prod.id }
    });
  });

  // Write all pages to dist/
  let createdCount = 0;
  for (const page of pages) {
    if (!page.relPath) {
      // Leave base index.html completely blank of OG tags as requested
      continue;
    }

    const enrichedHtml = generateHtmlWithMeta(baseHtml, page);

    // 1. Directory based index.html: dist/<path>/index.html
    const outDir = path.join(DIST_DIR, page.relPath);
    fs.mkdirSync(outDir, { recursive: true });
    const outHtmlPath = path.join(outDir, 'index.html');
    fs.writeFileSync(outHtmlPath, enrichedHtml, 'utf-8');

    // 2. Direct flat html file: dist/<path>.html
    const flatHtmlPath = path.join(DIST_DIR, `${page.relPath}.html`);
    const flatDir = path.dirname(flatHtmlPath);
    if (!fs.existsSync(flatDir)) {
      fs.mkdirSync(flatDir, { recursive: true });
    }
    fs.writeFileSync(flatHtmlPath, enrichedHtml, 'utf-8');

    createdCount++;
  }

  console.log(`✨ Successfully pre-rendered ${createdCount} pages with dynamic Open Graph & Twitter meta tags in dist/!`);
  return createdCount;
}

if (process.argv[1] && process.argv[1].includes('generate-static-pages')) {
  generateAllStaticPages().catch((err) => {
    console.error('Error generating static pages:', err);
    process.exit(1);
  });
}
