import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { DEFAULT_TEMPLES } from '../src/data/defaultTemples';
import { DEFAULT_DISTRICT_ITEMS } from '../src/data/defaultDistrictItems';
import { ODISHA_DISTRICTS } from '../src/types';
import type { SpiritualStory, Temple, DistrictItem, OdishaDistrictInfo } from '../src/types';

// Load Firebase Config
let firebaseConfigFile: any = {};
try {
  const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(cfgPath)) {
    firebaseConfigFile = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  }
} catch (err) {
  console.warn('Could not read firebase-applet-config.json:', err);
}

const DEFAULT_ORIGIN = 'https://www.bhaktianandaodiatvofficial.blog';
const FALLBACK_DEFAULT_IMAGE =
  'https://www.dropbox.com/scl/fi/0h60d3p642b4fyne4hj6g/ChatGPT-Image-Aug-13-2026-11_57_57-AM-1.png?rlkey=5g6wh4ulvz5cl1zvxjk050dmq&st=f7aretvj&raw=1';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface SeoPayload {
  title: string;
  ogTitle: string;
  ogDesc: string;
  ogImage: string;
  canonicalUrl: string;
  ogType?: string;
  jsonLd?: any;
  initialState?: Record<string, any>;
}

function generateStaticHtml(templateHtml: string, seo: SeoPayload): string {
  let html = templateHtml;

  const titleEsc = escapeHtml(seo.title);
  const ogTitleEsc = escapeHtml(seo.ogTitle || seo.title);
  const ogDescEsc = escapeHtml(seo.ogDesc);
  const ogImageEsc = escapeHtml(seo.ogImage || FALLBACK_DEFAULT_IMAGE);
  const canonicalEsc = escapeHtml(seo.canonicalUrl);
  const ogTypeEsc = escapeHtml(seo.ogType || 'website');

  // 1. Browser Title
  html = html.replace(/<title>[\s\S]*?<\/title>/gi, `<title>${titleEsc}</title>`);

  // 2. Canonical Link
  if (html.includes('rel="canonical"') || html.includes("rel='canonical'")) {
    html = html.replace(/<link[^>]*rel=["']canonical["'][^>]*>/gi, `<link rel="canonical" href="${canonicalEsc}" />`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${canonicalEsc}" />\n</head>`);
  }

  // 3. Meta Description
  if (html.includes('name="description"') || html.includes("name='description'")) {
    html = html.replace(/<meta[^>]*name=["']description["'][^>]*>/gi, `<meta name="description" content="${ogDescEsc}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="description" content="${ogDescEsc}" />\n</head>`);
  }

  // 4. Open Graph Tags
  if (html.includes('property="og:title"') || html.includes("property='og:title'")) {
    html = html.replace(/<meta[^>]*property=["']og:title["'][^>]*>/gi, `<meta id="og-title" property="og:title" content="${ogTitleEsc}" />`);
  } else {
    html = html.replace('</head>', `  <meta id="og-title" property="og:title" content="${ogTitleEsc}" />\n</head>`);
  }

  if (html.includes('property="og:description"') || html.includes("property='og:description'")) {
    html = html.replace(/<meta[^>]*property=["']og:description["'][^>]*>/gi, `<meta id="og-desc" property="og:description" content="${ogDescEsc}" />`);
  } else {
    html = html.replace('</head>', `  <meta id="og-desc" property="og:description" content="${ogDescEsc}" />\n</head>`);
  }

  if (html.includes('property="og:image"') || html.includes("property='og:image'")) {
    html = html.replace(/<meta[^>]*property=["']og:image["'][^>]*>/gi, `<meta id="og-img" property="og:image" content="${ogImageEsc}" />`);
  } else {
    html = html.replace('</head>', `  <meta id="og-img" property="og:image" content="${ogImageEsc}" />\n</head>`);
  }

  if (html.includes('property="og:image:secure_url"') || html.includes("property='og:image:secure_url'")) {
    html = html.replace(/<meta[^>]*property=["']og:image:secure_url["'][^>]*>/gi, `<meta id="og-img-sec" property="og:image:secure_url" content="${ogImageEsc}" />`);
  } else {
    html = html.replace('</head>', `  <meta id="og-img-sec" property="og:image:secure_url" content="${ogImageEsc}" />\n</head>`);
  }

  if (html.includes('property="og:url"') || html.includes("property='og:url'")) {
    html = html.replace(/<meta[^>]*property=["']og:url["'][^>]*>/gi, `<meta id="og-url" property="og:url" content="${canonicalEsc}" />`);
  } else {
    html = html.replace('</head>', `  <meta id="og-url" property="og:url" content="${canonicalEsc}" />\n</head>`);
  }

  if (html.includes('property="og:type"') || html.includes("property='og:type'")) {
    html = html.replace(/<meta[^>]*property=["']og:type["'][^>]*>/gi, `<meta property="og:type" content="${ogTypeEsc}" />`);
  } else {
    html = html.replace('</head>', `  <meta property="og:type" content="${ogTypeEsc}" />\n</head>`);
  }

  // 5. Twitter Card Tags
  if (html.includes('name="twitter:card"') || html.includes("name='twitter:card'")) {
    html = html.replace(/<meta[^>]*name=["']twitter:card["'][^>]*>/gi, `<meta id="tw-card" name="twitter:card" content="summary_large_image" />`);
  } else {
    html = html.replace('</head>', `  <meta id="tw-card" name="twitter:card" content="summary_large_image" />\n</head>`);
  }

  if (html.includes('name="twitter:image"') || html.includes("name='twitter:image'")) {
    html = html.replace(/<meta[^>]*name=["']twitter:image["'][^>]*>/gi, `<meta id="tw-img" name="twitter:image" content="${ogImageEsc}" />`);
  } else {
    html = html.replace('</head>', `  <meta id="tw-img" name="twitter:image" content="${ogImageEsc}" />\n</head>`);
  }

  if (html.includes('name="twitter:title"') || html.includes("name='twitter:title'")) {
    html = html.replace(/<meta[^>]*name=["']twitter:title["'][^>]*>/gi, `<meta id="tw-title" name="twitter:title" content="${ogTitleEsc}" />`);
  } else {
    html = html.replace('</head>', `  <meta id="tw-title" name="twitter:title" content="${ogTitleEsc}" />\n</head>`);
  }

  if (html.includes('name="twitter:description"') || html.includes("name='twitter:description'")) {
    html = html.replace(/<meta[^>]*name=["']twitter:description["'][^>]*>/gi, `<meta id="tw-desc" name="twitter:description" content="${ogDescEsc}" />`);
  } else {
    html = html.replace('</head>', `  <meta id="tw-desc" name="twitter:description" content="${ogDescEsc}" />\n</head>`);
  }

  // 6. JSON-LD Schema
  if (seo.jsonLd) {
    const jsonLdString = JSON.stringify(seo.jsonLd);
    const jsonLdTag = `\n  <script type="application/ld+json">\n${jsonLdString}\n  </script>`;
    html = html.replace('</head>', `${jsonLdTag}\n</head>`);
  }

  // 7. Hydration Initial State Script
  if (seo.initialState) {
    const stateScript = `\n  <script>\n    window.__PRELOADED_STATE__ = ${JSON.stringify(seo.initialState)};\n  </script>`;
    html = html.replace('</head>', `${stateScript}\n</head>`);
  }

  return html;
}

function writeStaticRoute(distDir: string, routePath: string, htmlContent: string) {
  // Normalize routePath e.g. "/story/story-529058"
  const cleanRoute = routePath.replace(/^\/+|\/+$/g, '');
  const targetDir = path.join(distDir, cleanRoute);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const targetFile = path.join(targetDir, 'index.html');
  fs.writeFileSync(targetFile, htmlContent, 'utf8');
}

async function fetchFirestoreStories(): Promise<SpiritualStory[]> {
  try {
    if (!firebaseConfigFile.projectId) return [];
    const app = initializeApp(firebaseConfigFile, `prerender-${Date.now()}`);
    const db =
      firebaseConfigFile.firestoreDatabaseId && firebaseConfigFile.firestoreDatabaseId !== '(default)'
        ? getFirestore(app, firebaseConfigFile.firestoreDatabaseId)
        : getFirestore(app);

    const snap = await getDocs(collection(db, 'spiritual_stories'));
    const stories: SpiritualStory[] = [];
    snap.docs.forEach((doc) => {
      const data = doc.data() as SpiritualStory;
      if (data && data.title) {
        stories.push({
          ...data,
          id: doc.id || data.id,
        });
      }
    });
    return stories;
  } catch (err) {
    console.warn('Firestore prerender fetch notice (using fallbacks):', err);
    return [];
  }
}

async function runPrerender() {
  console.log('🚀 Starting Build-Time Static Prerendering for AWS Amplify / Static Hosting...');

  const distDir = path.resolve(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.error('❌ dist/index.html not found! Run "vite build" before prerendering.');
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  let generatedCount = 0;

  // 1. Fetch Stories
  const firestoreStories = await fetchFirestoreStories();
  console.log(`📚 Fetched ${firestoreStories.length} spiritual stories from Firestore.`);

  // If local server database has extra stories, merge them
  const allStories: SpiritualStory[] = [...firestoreStories];
  try {
    const dbJsonPath = path.resolve(process.cwd(), 'data', 'db.json');
    if (fs.existsSync(dbJsonPath)) {
      const localDb = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
      if (Array.isArray(localDb.stories)) {
        for (const s of localDb.stories) {
          if (!allStories.some((x) => x.id === s.id)) {
            allStories.push(s);
          }
        }
      }
    }
  } catch {}

  // 2. Generate Static HTML for all Stories
  for (const story of allStories) {
    const storyTitle = `${story.title} | Bhakti Ananda Odia TV`;
    const ogTitle = `📖 ${story.title} - ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV`;
    const rawExcerpt = (story.summary || story.content || '').replace(/\s+/g, ' ').trim();
    const ogDesc = rawExcerpt.length > 150 ? `${rawExcerpt.slice(0, 147)}...` : rawExcerpt || 'ପବିତ୍ର ଓଡ଼ିଆ ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ ପଢ଼ନ୍ତୁ।';
    const ogImage = (story.imageUrl || FALLBACK_DEFAULT_IMAGE).trim();
    const canonicalUrl = `${DEFAULT_ORIGIN}/story/${encodeURIComponent(story.id)}`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      headline: story.title,
      description: ogDesc,
      image: ogImage ? [ogImage] : undefined,
      datePublished: story.publishedAt || new Date().toISOString(),
      dateModified: story.publishedAt || new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: story.author || 'ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Bhakti Ananda Odia TV',
        url: DEFAULT_ORIGIN,
        logo: {
          '@type': 'ImageObject',
          url: `${DEFAULT_ORIGIN}/pwa-icon.svg`,
        },
      },
      articleSection: story.category || 'ଜଗନ୍ନାଥ ଲୀଳା',
      inLanguage: 'or',
    };

    const storyHtml = generateStaticHtml(baseHtml, {
      title: storyTitle,
      ogTitle,
      ogDesc,
      ogImage,
      canonicalUrl,
      ogType: 'article',
      jsonLd,
      initialState: {
        viewMode: 'blog',
        storyId: story.id,
      },
    });

    writeStaticRoute(distDir, `/story/${story.id}`, storyHtml);
    writeStaticRoute(distDir, `/blog/${story.id}`, storyHtml);
    writeStaticRoute(distDir, `/stories/${story.id}`, storyHtml);
    generatedCount += 3;
  }

  // 3. Generate Static HTML for Temples
  for (const temple of DEFAULT_TEMPLES) {
    const templeTitle = `${temple.name} - ପୂଜା ଓ ଜଳାଭିଷେକ ବୁକିଂ | Puja Samagri Portal`;
    const ogTitle = `🚩 ${temple.name} (${temple.location || 'Odisha'}) - ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ`;
    const rawDesc = temple.description || temple.history || `ପ୍ରସିଦ୍ଧ ${temple.name} ରେ ଜଳାଭିଷେକ ଏବଂ ସ୍ୱତନ୍ତ୍ର ପୂଜା ବୁକିଂ କରନ୍ତୁ।`;
    const ogDesc = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
    const ogImage = (temple.imageUrl || temple.thumbnailUrl || FALLBACK_DEFAULT_IMAGE).trim();
    const canonicalUrl = `${DEFAULT_ORIGIN}/temple/${encodeURIComponent(temple.id)}`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'HinduTemple',
      name: temple.name,
      description: ogDesc,
      image: ogImage ? [ogImage] : undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: temple.location || 'Odisha',
        addressRegion: 'Odisha',
        addressCountry: 'IN',
      },
    };

    const templeHtml = generateStaticHtml(baseHtml, {
      title: templeTitle,
      ogTitle,
      ogDesc,
      ogImage,
      canonicalUrl,
      ogType: 'place',
      jsonLd,
      initialState: {
        viewMode: 'temple',
        templeId: temple.id,
      },
    });

    writeStaticRoute(distDir, `/temple/${temple.id}`, templeHtml);
    writeStaticRoute(distDir, `/temples/${temple.id}`, templeHtml);
    generatedCount += 2;
  }

  // 4. Generate Static HTML for Odisha Districts
  for (const district of ODISHA_DISTRICTS) {
    const distTitle = `${district.nameOdia} (${district.nameEng}) ଜିଲ୍ଲା ଦର୍ଶନ | Explore Odisha`;
    const ogTitle = `🚩 ${district.nameOdia} (${district.nameEng}) - ${district.tagline} | ଓଡ଼ିଶା ଦର୍ଶନ`;
    const ogDesc = `${district.nameOdia} ଜିଲ୍ଲାର ପ୍ରସିଦ୍ଧ ମନ୍ଦିର, ଧାର୍ମିକ ପୀଠ, ଉତ୍ସବ, ପର୍ଯ୍ୟଟନ ଓ ଐତିହ୍ୟ ସମ୍ପର୍କିତ ସମ୍ପୂର୍ଣ୍ଣ ବିବରଣୀ।`;
    const distItems = DEFAULT_DISTRICT_ITEMS.filter((i) => i.districtId.toLowerCase() === district.id.toLowerCase());
    const sampleImg = distItems.find((i) => i.imageUrl)?.imageUrl || FALLBACK_DEFAULT_IMAGE;
    const canonicalUrl = `${DEFAULT_ORIGIN}/district/${encodeURIComponent(district.id)}`;

    const distHtml = generateStaticHtml(baseHtml, {
      title: distTitle,
      ogTitle,
      ogDesc,
      ogImage: sampleImg,
      canonicalUrl,
      ogType: 'website',
      initialState: {
        viewMode: 'home',
        districtId: district.id,
      },
    });

    writeStaticRoute(distDir, `/district/${district.id}`, distHtml);
    writeStaticRoute(distDir, `/districts/${district.id}`, distHtml);
    generatedCount += 2;
  }

  // 5. Generate Static HTML for District Items (Places / Heritage)
  for (const item of DEFAULT_DISTRICT_ITEMS) {
    const itemTitle = `${item.title} (${item.districtNameEng || 'Odisha'}) | Explore Odisha`;
    const ogTitle = `🛕 ${item.title} (${item.districtNameOdia || item.districtNameEng}) - ଓଡ଼ିଶା ଦର୍ଶନ`;
    const rawDesc = (item.description || item.significance || '').replace(/\s+/g, ' ').trim();
    const ogDesc = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc || 'ଓଡ଼ିଶାର ପ୍ରସିଦ୍ଧ ମନ୍ଦିର ଓ ଐତିହ୍ୟ ବିବରଣୀ।';
    const ogImage = (item.imageUrl || FALLBACK_DEFAULT_IMAGE).trim();
    const canonicalUrl = `${DEFAULT_ORIGIN}/district/${encodeURIComponent(item.districtId)}/${encodeURIComponent(item.id)}`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'TouristAttraction',
      name: item.title,
      description: ogDesc,
      image: ogImage ? [ogImage] : undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: item.districtNameEng || 'Odisha',
        addressRegion: 'Odisha',
        addressCountry: 'IN',
      },
    };

    const itemHtml = generateStaticHtml(baseHtml, {
      title: itemTitle,
      ogTitle,
      ogDesc,
      ogImage,
      canonicalUrl,
      ogType: 'place',
      jsonLd,
      initialState: {
        viewMode: 'home',
        districtId: item.districtId,
        itemId: item.id,
      },
    });

    writeStaticRoute(distDir, `/district/${item.districtId}/${item.id}`, itemHtml);
    writeStaticRoute(distDir, `/place/${item.id}`, itemHtml);
    writeStaticRoute(distDir, `/item/${item.id}`, itemHtml);
    generatedCount += 3;
  }

  // 6. Core Static App Views
  const coreViews = [
    {
      route: '/blog',
      title: 'ଆଧ୍ୟାତ୍ମିକ କଥା, ବ୍ରତ ଓ ପର୍ବପର୍ବାଣୀ ବିବରଣୀ (Spiritual Blog) | Bhakti Ananda Odia TV',
      ogTitle: '📖 ଆଧ୍ୟାତ୍ମିକ କଥା ଓ ବ୍ରତ ମାହାତ୍ମ୍ୟ - ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV',
      ogDesc: 'ପବିତ୍ର ଓଡ଼ିଆ ବ୍ରତକଥା, ଠାକୁରଙ୍କ ମାହାତ୍ମ୍ୟ, ସନାତନ ଧର୍ମ ନୀତି ଓ ଉତ୍ସବ ସମ୍ପର୍କିତ ବିଶେଷ ଆଧ୍ୟାତ୍ମିକ ଲେଖା।',
      ogImage: FALLBACK_DEFAULT_IMAGE,
      initialState: { viewMode: 'blog' },
    },
    {
      route: '/shorts',
      title: 'ମନ୍ଦିର ଦର୍ଶନ ଓ ଆଧ୍ୟାତ୍ମିକ ଭିଡିଓ (Temple Shorts) | Bhakti Ananda Odia TV',
      ogTitle: '🎥 ଶ୍ରୀକ୍ଷେତ୍ର ଓ ପ୍ରସିଦ୍ଧ ମନ୍ଦିର ଭିଡିଓ ଦର୍ଶନ - Temple Shorts',
      ogDesc: 'ପ୍ରତ୍ୟକ୍ଷ ଦେଖନ୍ତୁ ଓଡ଼ିଶାର ପ୍ରମୁଖ ମନ୍ଦିରଗୁଡ଼ିକର ଦୈନିକ ନୀତିକାନ୍ତି, ଆଳତି ଓ ଆଧ୍ୟାତ୍ମିକ ଦର୍ଶନ ଭିଡିଓ।',
      ogImage: FALLBACK_DEFAULT_IMAGE,
      initialState: { viewMode: 'shorts' },
    },
    {
      route: '/panchang',
      title: 'ଓଡ଼ିଆ କୋହେନୂର ପଞ୍ଜିକା ଓ ଦୈନିକ ରାଶିଫଳ (Odia Panchang) | Bhakti Ananda Odia TV',
      ogTitle: '📅 ଆଜିର ଓଡ଼ିଆ ପଞ୍ଜିକା, ତିଥି ଓ ଶୁଭ ବେଳା | Odia Panchang',
      ogDesc: 'ଦୈନିକ ସୂର୍ଯ୍ୟୋଦୟ, ସୂର୍ଯ୍ୟାସ୍ତ, ତିଥି, ନକ୍ଷତ୍ର, ରାହୁକାଳ, ଅମୃତବେଳା ଓ ଶୁଭ କାର୍ଯ୍ୟ ସମୟ ସୂଚୀ।',
      ogImage: FALLBACK_DEFAULT_IMAGE,
      initialState: { viewMode: 'panchang' },
    },
    {
      route: '/store',
      title: 'ଅନଲାଇନ୍ ପୂଜା ସାମଗ୍ରୀ ଷ୍ଟୋର - ଶୁଦ୍ଧ ଓ ପ୍ରାମାଣିକ ସାମଗ୍ରୀ | Puja Store',
      ogTitle: '🛒 ଅନଲାଇନ୍ ପୂଜା ସାମଗ୍ରୀ ଷ୍ଟୋର - Puja Samagri Store',
      ogDesc: 'ଘରେ ବସି ଅର୍ଡର କରନ୍ତୁ ଶୁଦ୍ଧ ଗଙ୍ଗାଜଳ, କସ୍ତୁରୀ, ଅଗରବତୀ, ଚନ୍ଦନ ଓ ସମସ୍ତ ପୂଜା ଉପକରଣ।',
      ogImage: FALLBACK_DEFAULT_IMAGE,
      initialState: { viewMode: 'store' },
    },
    {
      route: '/temple',
      title: 'ଶ୍ରୀ ମନ୍ଦିର ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ (Temple Puja Booking) | Bhakti Ananda Odia TV',
      ogTitle: '🚩 ଶ୍ରୀ ମନ୍ଦିର ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ - Online Temple Booking',
      ogDesc: 'ଓଡ଼ିଶାର ପ୍ରସିଦ୍ଧ ତୀର୍ଥସ୍ଥଳୀ ଓ ମନ୍ଦିରଗୁଡ଼ିକରେ ଅନଲାଇନ୍ ଜଳାଭିଷେକ, ଭୋଗ ଲାଗି ଓ ସ୍ୱତନ୍ତ୍ର ପୂଜା ସେବା।',
      ogImage: FALLBACK_DEFAULT_IMAGE,
      initialState: { viewMode: 'temple' },
    },
    {
      route: '/portal',
      title: 'ପୂଜାରୀ ପୋର୍ଟାଲ୍ | Pujari Management Portal',
      ogTitle: '🙏 ପୂଜାରୀ ପୋର୍ଟାଲ୍ - Puja Samagri Portal',
      ogDesc: 'ପୂଜାରୀ ପ୍ରୋଫାଇଲ୍, ପୂଜା ସୂଚୀ ପ୍ରସ୍ତୁତି ଓ ସେବା ପରିଚାଳନା।',
      ogImage: FALLBACK_DEFAULT_IMAGE,
      initialState: { viewMode: 'portal' },
    },
    {
      route: '/login',
      title: 'ପୂଜାରୀ ଲଗଇନ୍ | Pujari Login Portal',
      ogTitle: '🔐 ପୂଜାରୀ ଲଗଇନ୍ - Puja Samagri Portal',
      ogDesc: 'ପୂଜାରୀ ଲଗଇନ୍ କରି ନୂତନ ପୂଜା ସୂଚୀ ତିଆରି କରନ୍ତୁ।',
      ogImage: FALLBACK_DEFAULT_IMAGE,
      initialState: { viewMode: 'login' },
    },
  ];

  for (const page of coreViews) {
    const pageHtml = generateStaticHtml(baseHtml, {
      title: page.title,
      ogTitle: page.ogTitle,
      ogDesc: page.ogDesc,
      ogImage: page.ogImage,
      canonicalUrl: `${DEFAULT_ORIGIN}${page.route}`,
      ogType: 'website',
      initialState: page.initialState,
    });
    writeStaticRoute(distDir, page.route, pageHtml);
    generatedCount++;
  }

  console.log(`✅ Successfully prerendered ${generatedCount} static HTML route files in "dist/"!`);
  console.log(`🎉 AWS Amplify / S3 / CloudFront and Facebookbot will now serve 100% exact Open Graph tags directly from static files!`);
  process.exit(0);
}

runPrerender().catch((err) => {
  console.error('Prerender error:', err);
  process.exit(1);
});
