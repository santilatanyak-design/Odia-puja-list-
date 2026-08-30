/**
 * Dynamic SEO & Canonical Tag Manager
 * Updates document.title, meta tags, and <link rel="canonical"> dynamically based on
 * current active view mode and URL search parameters for Google Search Console and social scrapers.
 */

import { SpiritualStory } from '../types';
import { OFFICIAL_BRAND_LOGO_URL, resolveAbsoluteImageUrl, setDynamicStoryMeta } from './ogMetaHelper';

export interface PageSeoConfig {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: string;
}

export const getBaseOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname.includes('bhaktianandaodiatvofficial.blog')) {
      return 'https://www.bhaktianandaodiatvofficial.blog';
    }
    return window.location.origin || 'https://www.bhaktianandaodiatvofficial.blog';
  }
  return 'https://www.bhaktianandaodiatvofficial.blog';
};

/**
 * Creates a clean excerpt limited to max chars (default 150)
 */
export const createStoryExcerpt = (text: string, maxLen = 150): string => {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return clean.substring(0, maxLen).trim() + '...';
};

export const getSeoConfigForView = (
  viewMode: 'home' | 'login' | 'store' | 'portal' | 'temple' | 'shorts' | 'panchang' | 'blog' | 'admin',
  searchQuery?: string,
  explicitTargetId?: string | null
): PageSeoConfig => {
  const origin = getBaseOrigin();
  const search = searchQuery !== undefined ? searchQuery : (typeof window !== 'undefined' ? window.location.search : '');
  const params = new URLSearchParams(search);

  // Extract storyId from explicit param, query params, or URL path (/story/:id or /blog/:id)
  let storyId = explicitTargetId || params.get('storyId') || params.get('story') || params.get('id');
  if (!storyId && typeof window !== 'undefined') {
    const pathname = window.location.pathname || '';
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'story' || parts[0] === 'blog' || parts[0] === 'stories') {
      storyId = parts[1] ? decodeURIComponent(parts[1]) : null;
    }
  }

  const templeId = params.get('templeId') || params.get('temple');
  const productId = params.get('product_id') || params.get('product');
  const districtId = params.get('district');
  const itemId = params.get('item');

  if (storyId) {
    let storyImg: string | null = null;
    let storyTitle = 'ଆଧ୍ୟାତ୍ମିକ କଥା ଓ ବ୍ଲଗ୍ | Bhakti Ananda Odia TV';
    let storyDesc = 'ପବିତ୍ର ଓଡ଼ିଆ ବ୍ରତକଥା, ଠାକୁରଙ୍କ ମାହାତ୍ମ୍ୟ, ସନାତନ ଧର୍ମ ନୀତି ଓ ଉତ୍ସବ ସମ୍ପର୍କିତ ବିଶେଷ ଆଧ୍ୟାତ୍ମିକ ଲେଖା।';
    try {
      if (typeof window !== 'undefined') {
        const localV3 = localStorage.getItem('odia_spiritual_stories_v3');
        const localBase = localStorage.getItem('odisha_spiritual_stories');
        const candidateList = [
          ...(localV3 ? JSON.parse(localV3) : []),
          ...(localBase ? JSON.parse(localBase) : []),
        ];
        const found = candidateList.find((s: any) => s && (s.id === storyId || s.id === decodeURIComponent(storyId || '')));
        if (found) {
          if (found.title) storyTitle = `📖 ${found.title} | Bhakti Ananda Odia TV`;
          if (found.summary || found.content) {
            const raw = found.summary || found.content;
            storyDesc = raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;
          }
          if (found.imageUrl && typeof found.imageUrl === 'string' && found.imageUrl.trim()) {
            storyImg = found.imageUrl.trim();
          }
        }
      }
    } catch {}

    return {
      title: storyTitle,
      description: storyDesc,
      canonicalUrl: `${origin}/story/${encodeURIComponent(storyId)}`,
      ogImage: resolveAbsoluteImageUrl(storyImg),
      ogType: 'article',
    };
  }

  if (districtId && itemId) {
    return {
      title: 'ଓଡ଼ିଶା ଦର୍ଶନ ଓ ପ୍ରସିଦ୍ଧ ପର୍ଯ୍ୟଟନ ସ୍ଥଳୀ | Explore Odisha',
      description: 'ଓଡ଼ିଶାର ସମସ୍ତ ୩୦ଟି ଜିଲ୍ଲାର ପ୍ରସିଦ୍ଧ ମନ୍ଦିର, ତୀର୍ଥକ୍ଷେତ୍ର, ଐତିହ୍ୟ ଓ ଦର୍ଶନୀୟ ସ୍ଥାନର ସମ୍ପୂର୍ଣ୍ଣ ବିବରଣୀ।',
      canonicalUrl: `${origin}/?district=${encodeURIComponent(districtId)}&item=${encodeURIComponent(itemId)}`,
      ogImage: OFFICIAL_BRAND_LOGO_URL,
    };
  }

  if (templeId) {
    return {
      title: 'ଶ୍ରୀ ମନ୍ଦିର ଅନଲାଇନ୍ ପୂଜା ଓ ଜଳାଭିଷେକ ବୁକିଂ | Bhakti Ananda Odia TV',
      description: 'ଓଡ଼ିଶାର ପ୍ରସିଦ୍ଧ ମନ୍ଦିରରେ ଦର୍ଶନ ଏବଂ ସ୍ୱତନ୍ତ୍ର ପୂଜା, ଜଳାଭିଷେକ ଓ ଭୋଗ ସେବା ଅନଲାଇନ୍ ବୁକ୍ କରନ୍ତୁ।',
      canonicalUrl: `${origin}/?templeId=${encodeURIComponent(templeId)}`,
      ogImage: OFFICIAL_BRAND_LOGO_URL,
    };
  }

  if (productId) {
    return {
      title: 'ଅନଲାଇନ୍ ପୂଜା ସାମଗ୍ରୀ ଓ ବୈଦିକ ବସ୍ତୁ | Puja Samagri Store',
      description: 'ଶୁଦ୍ଧ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ, ମୂର୍ତ୍ତି ଓ ଆଧ୍ୟାତ୍ମିକ ବସ୍ତୁ ଅନଲାଇନ୍ ଅର୍ଡର୍ କରନ୍ତୁ।',
      canonicalUrl: `${origin}/?product_id=${encodeURIComponent(productId)}`,
      ogImage: OFFICIAL_BRAND_LOGO_URL,
    };
  }

  switch (viewMode) {
    case 'admin':
      return {
        title: 'ଆଡମିନ୍ ପୋର୍ଟାଲ୍ (Admin Portal) | Bhakti Ananda Odia TV',
        description: 'Bhakti Ananda Odia TV ଅଫିସିଆଲ୍ ଆଡମିନ୍ ପ୍ୟାନେଲ୍।',
        canonicalUrl: `${origin}/admin`,
        ogImage: OFFICIAL_BRAND_LOGO_URL,
      };

    case 'store':
      return {
        title: 'ଅନଲାଇନ୍ ପୂଜା ସାମଗ୍ରୀ ଷ୍ଟୋର୍ (Online Puja Store) | Bhakti Ananda Odia TV',
        description: 'ଶୁଦ୍ଧ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ, ମୂର୍ତ୍ତି, ଫଟୋ ବନ୍ଧେଇ, ହବନ କୁଣ୍ଡ ଏବଂ ଶ୍ରୀକ୍ଷେତ୍ର ପୁରୀର ଅଧିକୃତ ଆଧ୍ୟାତ୍ମିକ ସାମଗ୍ରୀ ଅନଲାଇନରେ ଅର୍ଡର କରନ୍ତୁ।',
        canonicalUrl: `${origin}/?view=store`,
        ogImage: OFFICIAL_BRAND_LOGO_URL,
      };

    case 'temple':
      return {
        title: 'ଶ୍ରୀ ମନ୍ଦିର ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ (Temple Puja Booking) | Bhakti Ananda Odia TV',
        description: 'ଓଡ଼ିଶାର ପ୍ରସିଦ୍ଧ ତୀର୍ଥସ୍ଥଳୀ ଓ ମନ୍ଦିରଗୁଡ଼ିକରେ ଅନଲାଇନ୍ ଜଳାଭିଷେକ, ଭୋଗ ଲାଗି ଓ ସ୍ୱତନ୍ତ୍ର ପୂଜା ସେବା ସହଜରେ ବୁକ୍ କରନ୍ତୁ।',
        canonicalUrl: `${origin}/?view=temple`,
        ogImage: OFFICIAL_BRAND_LOGO_URL,
      };

    case 'panchang':
      return {
        title: 'ଓଡ଼ିଆ କୋହିନୂର କ୍ୟାଲେଣ୍ଡର ପାଞ୍ଜି (Odia Panchang & Calendar) | Bhakti Ananda Odia TV',
        description: 'ଆଜିର ତିଥି, ନକ୍ଷତ୍ର, ଯୋଗ, ବାରବେଳା, କାଳବେଳା, ରାହୁକାଳ ଏବଂ ସମସ୍ତ ପର୍ବପର୍ବାଣୀ ବିବରଣୀ ସହ ଦୈନିକ ଓଡ଼ିଆ ପାଞ୍ଜି।',
        canonicalUrl: `${origin}/?panchang=true`,
        ogImage: OFFICIAL_BRAND_LOGO_URL,
      };

    case 'blog':
      return {
        title: 'ଆଧ୍ୟାତ୍ମିକ କଥା, ବ୍ରତ ଓ ପର୍ବପର୍ବାଣୀ ବିବରଣୀ (Spiritual Blog) | Bhakti Ananda Odia TV',
        description: 'ପବିତ୍ର ଓଡ଼ିଆ ବ୍ରତକଥା, ଠାକୁରଙ୍କ ମାହାତ୍ମ୍ୟ, ସନାତନ ଧର୍ମ ନୀତି ଓ ଉତ୍ସବ ସମ୍ପର୍କିତ ବିଶେଷ ଆଧ୍ୟାତ୍ମିକ ଲେଖା।',
        canonicalUrl: `${origin}/?view=blog`,
        ogImage: OFFICIAL_BRAND_LOGO_URL,
      };

    case 'shorts':
      return {
        title: 'ମନ୍ଦିର ଦର୍ଶନ ଓ ଆଧ୍ୟାତ୍ମିକ ଭିଡିଓ (Temple Shorts Feed) | Bhakti Ananda Odia TV',
        description: 'ପ୍ରତ୍ୟହ ଦେବଦେବୀଙ୍କ ମଙ୍ଗଳ ଆଳତି, ଦିବ୍ୟ ଦର୍ଶନ, ଏବଂ ଓଡ଼ିଶାର ପବିତ୍ର ମନ୍ଦିରଗୁଡ଼ିକର ରିଲ୍ସ ଭିଡିଓ ଦେଖନ୍ତୁ।',
        canonicalUrl: `${origin}/?shorts=true`,
        ogImage: OFFICIAL_BRAND_LOGO_URL,
      };

    case 'login':
    case 'portal':
      return {
        title: 'ପୂଜକ ଲଗଇନ୍ ଓ ପୋର୍ଟାଲ୍ (Pujari Portal) | Bhakti Ananda Odia TV',
        description: 'ପୂଜା ଫର୍ମାଟ୍, ସାମଗ୍ରୀ ତାଲିକା ଜେନେରେଟର ଏବଂ ପୂଜକ ସେବା ପୋର୍ଟାଲ୍।',
        canonicalUrl: `${origin}/?view=portal`,
        ogImage: OFFICIAL_BRAND_LOGO_URL,
      };

    case 'home':
    default:
      return {
        title: 'Bhakti Ananda Odia TV | ଶ୍ରୀ ମନ୍ଦିର ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ, ଓଡ଼ିଶା ଦର୍ଶନ, ପଞ୍ଜିକା ଓ ଆଧ୍ୟାତ୍ମିକ କଥା',
        description: 'ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV - ସମ୍ପୂର୍ଣ୍ଣ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ, ପ୍ରାମାଣିକ ଓଡ଼ିଆ କ୍ୟାଲେଣ୍ଡର ପାଞ୍ଜି, ଅନଲାଇନ୍ ମନ୍ଦିର ପୂଜା ବୁକିଂ, ଓଡ଼ିଶାର ୩୦ ଜିଲ୍ଲା ଦର୍ଶନ ଏବଂ ଆଧ୍ୟାତ୍ମିକ ଭିଡିଓ ଦର୍ଶନ କରନ୍ତୁ।',
        canonicalUrl: `${origin}/`,
        ogImage: OFFICIAL_BRAND_LOGO_URL,
      };
  }
};

/**
 * Directly synchronizes DOM <title>, <meta name="description">, <link rel="canonical">,
 * Open Graph, and Twitter metadata tags.
 */
export const updateDocumentSeoAndCanonical = (config: PageSeoConfig) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  // 1. Update Document Title
  if (config.title) {
    document.title = config.title;
  }

  // 2. Helper function to create or update meta tags
  const setOrCreateMeta = (attrName: 'name' | 'property' | 'itemprop', attrValue: string, contentValue: string) => {
    const existing = document.querySelectorAll(`meta[${attrName}="${attrValue}"]`);
    if (existing.length > 1) {
      existing.forEach((el, index) => {
        if (index > 0) el.remove();
      });
    }
    let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', contentValue);
  };

  // 3. Update Standard Description
  if (config.description) {
    setOrCreateMeta('name', 'description', config.description);
  }

  // 4. Update Canonical Link tag (<link rel="canonical" href="...">)
  if (config.canonicalUrl) {
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', config.canonicalUrl);
  }

  // 5. Update Open Graph Meta (Title, Desc, URL, Type, Site Name)
  if (config.title) setOrCreateMeta('property', 'og:title', config.title);
  if (config.description) setOrCreateMeta('property', 'og:description', config.description);
  if (config.canonicalUrl) setOrCreateMeta('property', 'og:url', config.canonicalUrl);
  setOrCreateMeta('property', 'og:type', config.ogType || 'website');
  setOrCreateMeta('property', 'og:site_name', 'Bhakti Ananda Odia TV & Puja Samagri Portal');

  // 6. Update Twitter Meta
  if (config.title) setOrCreateMeta('name', 'twitter:title', config.title);
  if (config.description) setOrCreateMeta('name', 'twitter:description', config.description);

  // 7. Strictly Resolved Image (Always non-empty for social link previews)
  const resolvedImageUrl = resolveAbsoluteImageUrl(config.ogImage);
  setOrCreateMeta('property', 'og:image', resolvedImageUrl);
  setOrCreateMeta('property', 'og:image:secure_url', resolvedImageUrl);
  setOrCreateMeta('property', 'og:image:url', resolvedImageUrl);
  setOrCreateMeta('property', 'og:image:type', 'image/jpeg');
  setOrCreateMeta('property', 'og:image:width', '1200');
  setOrCreateMeta('property', 'og:image:height', '630');
  if (config.title) setOrCreateMeta('property', 'og:image:alt', config.title);

  setOrCreateMeta('name', 'twitter:card', 'summary_large_image');
  setOrCreateMeta('name', 'twitter:image', resolvedImageUrl);
  setOrCreateMeta('name', 'twitter:image:src', resolvedImageUrl);
  setOrCreateMeta('name', 'image', resolvedImageUrl);
  setOrCreateMeta('itemprop', 'image', resolvedImageUrl);
};

/**
 * Injects or updates JSON-LD schema and comprehensive Open Graph tags for a specific blog/story post
 */
export const updateStorySeoAndJsonLd = (story: SpiritualStory) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const origin = getBaseOrigin();
  const canonicalUrl = `${origin}/story/${encodeURIComponent(story.id)}`;
  const excerpt = createStoryExcerpt(story.summary || story.content || '', 150);
  const title = `${story.title} | Bhakti Ananda Odia TV`;
  const resolvedImageUrl = resolveAbsoluteImageUrl(story.imageUrl);

  // 1. Update Title, Meta, Canonical, OG & Twitter
  updateDocumentSeoAndCanonical({
    title,
    description: excerpt,
    canonicalUrl,
    ogImage: resolvedImageUrl,
    ogType: 'article',
  });

  // 2. Also run specialized story meta injector for article specific fields
  setDynamicStoryMeta(story, canonicalUrl);

  // 3. Build JSON-LD Schema (Article / BlogPosting)
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    headline: story.title,
    description: excerpt,
    image: [resolvedImageUrl],
    datePublished: story.publishedAt || new Date().toISOString(),
    dateModified: story.publishedAt || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: story.author || 'Bhakti Ananda Odia TV',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bhakti Ananda Odia TV',
      url: origin,
      logo: {
        '@type': 'ImageObject',
        url: resolvedImageUrl,
      },
    },
    articleSection: story.category || 'Spiritual',
    inLanguage: 'or', // Odia language
  };

  // 4. Inject into <head> with id="story-jsonld-schema"
  let scriptEl = document.getElementById('story-jsonld-schema') as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'story-jsonld-schema';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify(schemaData, null, 2);
};

/**
 * Removes the dynamic story JSON-LD schema when exiting story modal
 */
export const clearStoryJsonLd = () => {
  if (typeof document === 'undefined') return;
  const scriptEl = document.getElementById('story-jsonld-schema');
  if (scriptEl && scriptEl.parentNode) {
    scriptEl.parentNode.removeChild(scriptEl);
  }
};

