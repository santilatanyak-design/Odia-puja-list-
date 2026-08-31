import { Temple, DistrictItem, SpiritualStory, StoreProduct, UnifiedFeedItem } from '../types';

/**
 * Official Brand Logo / Fallback Open Graph Banner Image URL
 * High-resolution 1200x630 official spiritual brand banner for Bhakti Ananda Odia TV.
 * Ensures Facebook, WhatsApp, Twitter link previews strictly show the official brand logo if no post image exists.
 */
export const OFFICIAL_BRAND_LOGO_URL =
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1200&auto=format&fit=crop';

/**
 * Resolves any image URL to a valid, secure absolute URL.
 * Strictly falls back to OFFICIAL_BRAND_LOGO_URL if missing, null, or empty.
 * Never allows Unsplash demo placeholders.
 */
export const resolveAbsoluteImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return OFFICIAL_BRAND_LOGO_URL;
  }
  const clean = url.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin || 'https://www.bhaktianandaodiatvofficial.blog';
    return `${origin}${clean.startsWith('/') ? '' : '/'}${clean}`;
  }
  return `https://www.bhaktianandaodiatvofficial.blog${clean.startsWith('/') ? '' : '/'}${clean}`;
};

const setOrCreateMeta = (attrName: 'name' | 'property' | 'itemprop', attrValue: string, contentValue: string) => {
  if (typeof document === 'undefined') return;
  // Remove duplicate existing tags to ensure single source of truth
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

const removeMetaTag = (attrName: 'name' | 'property' | 'itemprop', attrValue: string) => {
  if (typeof document === 'undefined') return;
  const els = document.querySelectorAll(`meta[${attrName}="${attrValue}"]`);
  els.forEach((el) => el.remove());
};

const setCanonicalUrl = (url: string) => {
  if (typeof document === 'undefined') return;
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', url);
};

/**
 * Dynamically updates Open Graph (og:*), Twitter Card, and standard Meta Tags
 * in document.head for Facebook, WhatsApp, Twitter, and other preview scrapers.
 * Directly inserts the exact full AWS S3 image URL into og:image with strict fallback.
 */
export const setDynamicTempleMeta = (temple: Temple, customUrl?: string) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const origin = window.location.origin || 'https://www.bhaktianandaodiatvofficial.blog';
  const shareUrl = customUrl || `${origin}/temple/${encodeURIComponent(temple.id)}`;
  
  const pageTitle = `${temple.name} - ପୂଜା ଓ ଜଳାଭିଷେକ ବୁକିଂ | Bhakti Ananda Odia TV`;
  const metaTitle = `🚩 ${temple.name} (${temple.location || 'Odisha'}) - ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ`;
  
  const rawDesc = temple.description || temple.history || `ପ୍ରସିଦ୍ଧ ${temple.name} (${temple.location || 'Odisha'}) ରେ ଜଳାଭିଷେକ ଏବଂ ସ୍ୱତନ୍ତ୍ର ପୂଜା ବୁକିଂ କରନ୍ତୁ।`;
  const metaDescription = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
  
  // Directly use the exact full image URL (AWS S3 or direct URL) with strict brand fallback
  const imageUrl = resolveAbsoluteImageUrl(temple.imageUrl || temple.thumbnailUrl);

  document.title = pageTitle;

  // Standard HTML Description
  setOrCreateMeta('name', 'description', metaDescription);

  // Open Graph
  setOrCreateMeta('property', 'og:type', 'website');
  setOrCreateMeta('property', 'og:site_name', 'Bhakti Ananda Odia TV & Puja Samagri Portal');
  setOrCreateMeta('property', 'og:title', metaTitle);
  setOrCreateMeta('property', 'og:description', metaDescription);
  setOrCreateMeta('property', 'og:url', shareUrl);

  // Open Graph Image Tags (Strict Non-Empty Output)
  setOrCreateMeta('property', 'og:image', imageUrl);
  setOrCreateMeta('property', 'og:image:secure_url', imageUrl);
  setOrCreateMeta('property', 'og:image:url', imageUrl);
  setOrCreateMeta('property', 'og:image:type', 'image/jpeg');
  setOrCreateMeta('property', 'og:image:width', '1200');
  setOrCreateMeta('property', 'og:image:height', '630');
  setOrCreateMeta('property', 'og:image:alt', temple.name);

  // Twitter Cards
  setOrCreateMeta('name', 'twitter:card', 'summary_large_image');
  setOrCreateMeta('name', 'twitter:title', metaTitle);
  setOrCreateMeta('name', 'twitter:description', metaDescription);
  setOrCreateMeta('name', 'twitter:image', imageUrl);
  setOrCreateMeta('name', 'twitter:image:src', imageUrl);
  setOrCreateMeta('name', 'image', imageUrl);
  setOrCreateMeta('itemprop', 'image', imageUrl);

  // Canonical Link
  setCanonicalUrl(shareUrl);
};

/**
 * Dynamically updates Open Graph tags for District Items (Temples, Tourist places, Festivals)
 */
export const setDynamicDistrictItemMeta = (item: DistrictItem, customUrl?: string) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const origin = window.location.origin || 'https://www.bhaktianandaodiatvofficial.blog';
  const shareUrl = customUrl || `${origin}/district/${encodeURIComponent(item.districtId)}/${encodeURIComponent(item.id)}`;

  const pageTitle = `${item.title} (${item.location || 'Odisha'}) | Explore Odisha`;
  const metaTitle = `🛕 ${item.title} - ${item.districtNameOdia || ''} | ଓଡ଼ିଶା ଦର୍ଶନ`;
  const rawDesc = item.description || item.significance || 'ଓଡ଼ିଶାର ପ୍ରସିଦ୍ଧ ପର୍ଯ୍ୟଟନ ଓ ତୀର୍ଥକ୍ଷେତ୍ର ଦର୍ଶନ କରନ୍ତୁ।';
  const metaDescription = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
  const imageUrl = resolveAbsoluteImageUrl(item.imageUrl || item.adImageUrl || item.affiliateProductImageUrl);

  document.title = pageTitle;

  setOrCreateMeta('name', 'description', metaDescription);
  setOrCreateMeta('property', 'og:type', 'website');
  setOrCreateMeta('property', 'og:site_name', 'Explore Odisha & Bhakti Ananda Odia TV');
  setOrCreateMeta('property', 'og:title', metaTitle);
  setOrCreateMeta('property', 'og:description', metaDescription);
  setOrCreateMeta('property', 'og:url', shareUrl);

  setOrCreateMeta('property', 'og:image', imageUrl);
  setOrCreateMeta('property', 'og:image:secure_url', imageUrl);
  setOrCreateMeta('property', 'og:image:url', imageUrl);
  setOrCreateMeta('property', 'og:image:type', 'image/jpeg');
  setOrCreateMeta('property', 'og:image:width', '1200');
  setOrCreateMeta('property', 'og:image:height', '630');
  setOrCreateMeta('property', 'og:image:alt', item.title);

  setOrCreateMeta('name', 'twitter:card', 'summary_large_image');
  setOrCreateMeta('name', 'twitter:title', metaTitle);
  setOrCreateMeta('name', 'twitter:description', metaDescription);
  setOrCreateMeta('name', 'twitter:image', imageUrl);
  setOrCreateMeta('name', 'twitter:image:src', imageUrl);
  setCanonicalUrl(shareUrl);
};

/**
 * Dynamically updates Open Graph tags for Spiritual Stories / Blog Posts / Single Post view.
 * Guarantees all 5 essential OG properties plus Twitter and structured metadata.
 * Uses the story's original uploaded image URL if present, and ONLY falls back to brand logo if completely missing.
 */
export const setDynamicStoryMeta = (story: SpiritualStory, customUrl?: string) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const origin = window.location.origin || 'https://www.bhaktianandaodiatvofficial.blog';
  const shareUrl = customUrl || `${origin}/story/${encodeURIComponent(story.id)}`;

  const pageTitle = `${story.title} | Bhakti Ananda Odia TV`;
  const metaTitle = story.title ? `📖 ${story.title} - ${story.category || 'ଆଧ୍ୟାତ୍ମିକ କଥା'}` : 'ଆଧ୍ୟାତ୍ମିକ କଥା | Bhakti Ananda Odia TV';
  const rawDesc = story.summary || story.content || 'ପବିତ୍ର ଓଡ଼ିଆ ବ୍ରତକଥା, ଠାକୁରଙ୍କ ମାହାତ୍ମ୍ୟ ଓ ଆଧ୍ୟାତ୍ମିକ ଲେଖା ପଢ଼ନ୍ତୁ।';
  const metaDescription = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
  
  // Specific post image verification: Use the story's original image, only falling back if absent
  const rawImage = story.imageUrl && typeof story.imageUrl === 'string' && story.imageUrl.trim().length > 0
    ? story.imageUrl.trim()
    : null;
  const imageUrl = resolveAbsoluteImageUrl(rawImage);

  document.title = pageTitle;

  // 1. Standard Description
  setOrCreateMeta('name', 'description', metaDescription);

  // 2. Open Graph Tags (Required 5 Properties)
  setOrCreateMeta('property', 'fb:app_id', '1082236902872');
  setOrCreateMeta('property', 'og:title', metaTitle);
  setOrCreateMeta('property', 'og:description', metaDescription);
  setOrCreateMeta('property', 'og:image', imageUrl);
  setOrCreateMeta('property', 'og:url', shareUrl);
  setOrCreateMeta('property', 'og:type', 'article');

  // Supporting Open Graph properties for Facebook / WhatsApp Rich Previews
  setOrCreateMeta('property', 'og:site_name', 'Bhakti Ananda Odia TV');
  setOrCreateMeta('property', 'og:image:secure_url', imageUrl);
  setOrCreateMeta('property', 'og:image:url', imageUrl);
  setOrCreateMeta('property', 'og:image:type', imageUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg');
  setOrCreateMeta('property', 'og:image:width', '1200');
  setOrCreateMeta('property', 'og:image:height', '630');
  setOrCreateMeta('property', 'og:image:alt', story.title || 'Bhakti Ananda Odia TV');

  // 3. Twitter Card Tags
  setOrCreateMeta('name', 'twitter:card', 'summary_large_image');
  setOrCreateMeta('name', 'twitter:title', metaTitle);
  setOrCreateMeta('name', 'twitter:description', metaDescription);
  setOrCreateMeta('name', 'twitter:image', imageUrl);
  setOrCreateMeta('name', 'twitter:image:src', imageUrl);

  // 4. Itemprop / Search Schema Image
  setOrCreateMeta('name', 'image', imageUrl);
  setOrCreateMeta('itemprop', 'image', imageUrl);

  // 5. Canonical Link
  setCanonicalUrl(shareUrl);
};

/**
 * Dynamically updates Open Graph tags for Store Products (Puja Samagri Store)
 */
export const setDynamicStoreProductMeta = (product: StoreProduct, customUrl?: string) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const origin = window.location.origin || 'https://www.bhaktianandaodiatvofficial.blog';
  const shareUrl = customUrl || `${origin}/?view=store&product_id=${encodeURIComponent(product.id)}`;

  const pageTitle = `${product.name} - ₹${product.price} | Puja Samagri Store`;
  const metaTitle = `🛍️ ${product.name} (ମୂଲ୍ୟ: ₹${product.price}) - Cash on Delivery`;
  const rawDesc = product.description || `Buy ${product.name} on Puja Samagri Store with Cash on Delivery (COD) across Odisha.`;
  const metaDescription = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
  const imageUrl = resolveAbsoluteImageUrl(product.imageUrl);

  document.title = pageTitle;

  setOrCreateMeta('name', 'description', metaDescription);
  setOrCreateMeta('property', 'og:type', 'product');
  setOrCreateMeta('property', 'og:site_name', 'Puja Samagri Store | Bhakti Ananda Odia TV');
  setOrCreateMeta('property', 'og:title', metaTitle);
  setOrCreateMeta('property', 'og:description', metaDescription);
  setOrCreateMeta('property', 'og:url', shareUrl);

  setOrCreateMeta('property', 'og:image', imageUrl);
  setOrCreateMeta('property', 'og:image:secure_url', imageUrl);
  setOrCreateMeta('property', 'og:image:url', imageUrl);
  setOrCreateMeta('property', 'og:image:type', 'image/jpeg');
  setOrCreateMeta('property', 'og:image:width', '1200');
  setOrCreateMeta('property', 'og:image:height', '630');
  setOrCreateMeta('property', 'og:image:alt', product.name);

  setOrCreateMeta('name', 'twitter:card', 'summary_large_image');
  setOrCreateMeta('name', 'twitter:title', metaTitle);
  setOrCreateMeta('name', 'twitter:description', metaDescription);
  setOrCreateMeta('name', 'twitter:image', imageUrl);
  setOrCreateMeta('name', 'twitter:image:src', imageUrl);

  setCanonicalUrl(shareUrl);
};

/**
 * Executes native navigator.share() API with fallback to Clipboard Copy and WhatsApp Direct Share.
 */
export const shareStoryNative = async (
  story: SpiritualStory
): Promise<{ success: boolean; method: 'share' | 'clipboard' | 'whatsapp'; error?: string }> => {
  if (typeof window === 'undefined') {
    return { success: false, method: 'clipboard', error: 'Window undefined' };
  }

  const origin = window.location.origin || 'https://www.bhaktianandaodiatvofficial.blog';
  const cleanId = (story.id || '').replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
  const shareUrl = `${origin}/story/${encodeURIComponent(cleanId)}`;
  const shareTitle = `📖 ${story.title}`;
  const excerpt = story.summary || story.content ? `${(story.summary || story.content).slice(0, 100)}...` : '';
  const shareText = `📖 *${story.title}*\n${excerpt}\n\n👇 ସମ୍ପୂର୍ଣ୍ଣ କାହାଣୀ ପଢ଼ନ୍ତୁ:\n${shareUrl}`;

  // Update dynamic OG meta tags immediately
  setDynamicStoryMeta(story, shareUrl);

  // 1. Try Native Web Share API
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const sharePayload: ShareData = {
        title: shareTitle,
        text: `📖 ${story.title}\n\n${excerpt}`,
        url: shareUrl,
      };

      if (typeof navigator.canShare === 'function') {
        if (navigator.canShare(sharePayload)) {
          await navigator.share(sharePayload);
          return { success: true, method: 'share' };
        }
      } else {
        await navigator.share(sharePayload);
        return { success: true, method: 'share' };
      }
    } catch (err: any) {
      if (err && (err.name === 'AbortError' || err.message?.includes('Abort'))) {
        return { success: false, method: 'share', error: 'User cancelled share' };
      }
      console.warn('Native share failed, falling back to clipboard / whatsapp:', err);
    }
  }

  // 2. Try Clipboard API
  let clipboardCopied = false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(shareText);
      clipboardCopied = true;
    }
  } catch (clipErr) {
    console.warn('Clipboard write failed:', clipErr);
  }

  // 3. Fallback to WhatsApp Direct URL
  const encodedText = encodeURIComponent(`${shareText}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

  try {
    const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = whatsappUrl;
    }
  } catch {
    // Safe fallback
  }

  return {
    success: true,
    method: clipboardCopied ? 'clipboard' : 'whatsapp',
  };
};

/**
 * Executes native navigator.share() API for Store Products
 */
export const shareStoreProductNative = async (
  product: StoreProduct
): Promise<{ success: boolean; method: 'share' | 'clipboard' | 'whatsapp'; error?: string }> => {
  if (typeof window === 'undefined') {
    return { success: false, method: 'clipboard', error: 'Window undefined' };
  }

  const origin = window.location.origin || '';
  const shareUrl = `${origin}/?view=store&product_id=${encodeURIComponent(product.id)}`;
  const shareTitle = `🛍️ ${product.name} - ₹${product.price}`;
  const shareText = `🛍️ *${product.name}* (ମୂଲ୍ୟ: ₹${product.price})\n${product.description ? product.description.slice(0, 100) + '...' : 'ପୂଜା ସାମଗ୍ରୀ ଷ୍ଟୋର୍ - Cash on Delivery ଉପଲବ୍ଧ!'}\n\n👇 ଏହି ଲିଙ୍କ୍ ରେ ଅର୍ଡର୍ କରନ୍ତୁ:\n${shareUrl}`;

  // Update dynamic OG meta tags immediately
  setDynamicStoreProductMeta(product, shareUrl);

  // 1. Try Native Web Share API
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const sharePayload: ShareData = {
        title: shareTitle,
        text: `Buy ${product.name} for ₹${product.price} at Puja Samagri Store!`,
        url: shareUrl,
      };

      if (typeof navigator.canShare === 'function') {
        if (navigator.canShare(sharePayload)) {
          await navigator.share(sharePayload);
          return { success: true, method: 'share' };
        }
      } else {
        await navigator.share(sharePayload);
        return { success: true, method: 'share' };
      }
    } catch (err: any) {
      if (err && (err.name === 'AbortError' || err.message?.includes('Abort'))) {
        return { success: false, method: 'share', error: 'User cancelled share' };
      }
    }
  }

  // 2. Try Clipboard API
  let clipboardCopied = false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(shareText);
      clipboardCopied = true;
    }
  } catch (clipErr) {
    console.warn('Clipboard write failed:', clipErr);
  }

  // 3. WhatsApp Direct URL
  const encodedText = encodeURIComponent(`${shareText}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

  try {
    const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = whatsappUrl;
    }
  } catch {
    // Safe fallback
  }

  return {
    success: true,
    method: clipboardCopied ? 'clipboard' : 'whatsapp',
  };
};

/**
 * Executes native navigator.share() API for District Items
 */
export const shareDistrictItemNative = async (
  item: DistrictItem
): Promise<{ success: boolean; method: 'share' | 'clipboard' | 'whatsapp'; error?: string }> => {
  if (typeof window === 'undefined') {
    return { success: false, method: 'clipboard', error: 'Window undefined' };
  }

  const origin = window.location.origin || '';
  const shareUrl = `${origin}/district/${encodeURIComponent(item.districtId)}/${encodeURIComponent(item.id)}`;

  const shareTitle = `🛕 ${item.title} - ${item.location || 'Odisha'}`;
  const shareText = `🚩 ${item.title} (${item.location || 'Odisha'})\n\n${item.description.slice(0, 140)}...\n\n👇 ଏହି ଲିଙ୍କ୍ ରେ ଦେଖନ୍ତୁ:\n${shareUrl}`;

  setDynamicDistrictItemMeta(item, shareUrl);

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const sharePayload: ShareData = {
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      };

      if (typeof navigator.canShare === 'function') {
        if (navigator.canShare(sharePayload)) {
          await navigator.share(sharePayload);
          return { success: true, method: 'share' };
        }
      } else {
        await navigator.share(sharePayload);
        return { success: true, method: 'share' };
      }
    } catch (err: any) {
      if (err && (err.name === 'AbortError' || err.message?.includes('Abort'))) {
        return { success: false, method: 'share', error: 'User cancelled share' };
      }
    }
  }

  let clipboardCopied = false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(`${shareText}`);
      clipboardCopied = true;
    }
  } catch (clipErr) {
    console.warn('Clipboard write failed:', clipErr);
  }

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  try {
    const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = whatsappUrl;
    }
  } catch {
    // Safe fallback
  }

  return {
    success: true,
    method: clipboardCopied ? 'clipboard' : 'whatsapp',
  };
};

/**
 * Executes native navigator.share() API with fallback to Clipboard Copy and WhatsApp Direct Share.
 */
export const shareTempleNative = async (
  temple: Temple
): Promise<{ success: boolean; method: 'share' | 'clipboard' | 'whatsapp'; error?: string }> => {
  if (typeof window === 'undefined') {
    return { success: false, method: 'clipboard', error: 'Window undefined' };
  }

  const origin = window.location.origin || '';
  const shareUrl = `${origin}/temple/${encodeURIComponent(temple.id)}`;

  const shareTitle = `🚩 ${temple.name} - ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ`;
  const shareText = `🙏 ${temple.name} (${temple.location || 'Odisha'}) ରେ ଦର୍ଶନ ଏବଂ ସ୍ୱତନ୍ତ୍ର ପୂଜା / ଜଳାଭିଷେକ ବୁକିଂ କରନ୍ତୁ!\n\n👇 ଏହି ଲିଙ୍କ୍ ରେ କ୍ଲିକ୍ କରି ବୁକିଂ କରନ୍ତୁ:\n${shareUrl}`;

  // Update dynamic OG meta tags before sharing
  setDynamicTempleMeta(temple, shareUrl);

  // 1. Try Native Web Share API
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const sharePayload: ShareData = {
        title: shareTitle,
        text: `🙏 ${temple.name} (${temple.location || 'Odisha'}) ରେ ଦର୍ଶନ ଏବଂ ପୂଜା ବୁକିଂ କରନ୍ତୁ!`,
        url: shareUrl,
      };

      if (typeof navigator.canShare === 'function') {
        if (navigator.canShare(sharePayload)) {
          await navigator.share(sharePayload);
          return { success: true, method: 'share' };
        }
      } else {
        await navigator.share(sharePayload);
        return { success: true, method: 'share' };
      }
    } catch (err: any) {
      if (err && (err.name === 'AbortError' || err.message?.includes('Abort'))) {
        return { success: false, method: 'share', error: 'User cancelled share' };
      }
      console.warn('Native share failed, falling back to clipboard / whatsapp:', err);
    }
  }

  // 2. Try Clipboard API
  let clipboardCopied = false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(shareUrl);
      clipboardCopied = true;
    }
  } catch (clipErr) {
    console.warn('Clipboard write failed:', clipErr);
  }

  // 3. Fallback to WhatsApp Direct URL
  const encodedText = encodeURIComponent(`${shareText}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

  try {
    const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = whatsappUrl;
    }
  } catch {
    // Safe fallback
  }

  return {
    success: true,
    method: clipboardCopied ? 'clipboard' : 'whatsapp',
  };
};

/**
 * Triggers Facebook Graph API to immediately re-scrape and clear cached OpenGraph metadata for a URL.
 */
export const refreshFacebookOgCache = async (url: string): Promise<boolean> => {
  try {
    const endpoint = `https://graph.facebook.com/?id=${encodeURIComponent(url)}&scrape=true`;
    await fetch(endpoint, { method: 'POST', mode: 'no-cors' });
    return true;
  } catch (err) {
    console.warn('Facebook cache scrape warning:', err);
    return false;
  }
};

/**
 * Opens official Facebook Debugger tool for a specific story URL so user can inspect and force scrape
 */
export const openFacebookDebugger = (url: string) => {
  const debuggerUrl = `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`;
  window.open(debuggerUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Directly opens Facebook Share Dialog for a URL
 */
export const openFacebookShare = (url: string, quote?: string) => {
  let shareEndpoint = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  if (quote) {
    shareEndpoint += `&quote=${encodeURIComponent(quote)}`;
  }
  window.open(shareEndpoint, '_blank', 'noopener,noreferrer,width=600,height=500');
};

/**
 * Directly opens WhatsApp Share with formatted text and link
 */
export const openWhatsAppDirectShare = (text: string, url: string) => {
  const message = `${text}\n\n👇 ଏଠାରେ ପଢ଼ନ୍ତୁ:\n${url}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Directly opens ShareChat share dialog or launches native mobile share sheet for ShareChat
 */
export const openShareChatShare = async (text: string, url: string, title?: string): Promise<boolean> => {
  const fullShareText = `${title ? `🚩 *${title}*\n` : ''}${text}\n\n👇 ଏଠାରେ ଦେଖନ୍ତୁ:\n${url}`;

  // 1. First copy text to clipboard so it's always ready to paste in ShareChat
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(fullShareText);
    }
  } catch {}

  // 2. Try Native Share API (allows selecting ShareChat app directly on mobile devices)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: title || 'ଭକ୍ତି ଆନନ୍ଦ - ଶେୟାର୍ କରନ୍ତୁ',
        text: fullShareText,
        url: url,
      });
      return true;
    } catch (err: any) {
      if (err && (err.name === 'AbortError' || err.message?.includes('Abort'))) {
        return false;
      }
    }
  }

  // 3. Fallback: Open ShareChat Web
  try {
    const shareChatUrl = `https://sharechat.com`;
    window.open(shareChatUrl, '_blank', 'noopener,noreferrer');
  } catch {}

  return true;
};

/**
 * Directly opens Threads (by Instagram / Meta) post intent with formatted text and link
 */
export const openThreadsShare = (text: string, url: string, title?: string) => {
  const fullShareText = `${title ? `🚩 ${title}\n` : ''}${text}\n\n👇 ଏଠାରେ ପଢ଼ନ୍ତୁ:\n${url}`;
  const threadsUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(fullShareText)}`;
  window.open(threadsUrl, '_blank', 'noopener,noreferrer');
};

