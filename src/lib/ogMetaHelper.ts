import { Temple, DistrictItem } from '../types';

/**
 * Dynamically updates Open Graph (og:*), Twitter Card, and standard Meta Tags
 * in document.head for Facebook, WhatsApp, Twitter, and other preview scrapers.
 * Directly inserts the exact full image URL provided for the temple into og:image.
 */
export const setDynamicTempleMeta = (temple: Temple, customUrl?: string) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const origin = window.location.origin || '';
  const shareUrl = customUrl || `${origin}/temple/${encodeURIComponent(temple.id)}`;
  
  const pageTitle = `${temple.name} - ପୂଜା ଓ ଜଳାଭିଷେକ ବୁକିଂ | Puja Samagri Portal`;
  const metaTitle = `🚩 ${temple.name} (${temple.location || 'Odisha'}) - ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ`;
  
  const rawDesc = temple.description || temple.history || `ପ୍ରସିଦ୍ଧ ${temple.name} (${temple.location || 'Odisha'}) ରେ ଜଳାଭିଷେକ ଏବଂ ସ୍ୱତନ୍ତ୍ର ପୂଜା ବୁକିଂ କରନ୍ତୁ।`;
  const metaDescription = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
  
  // Directly use the exact full image URL provided by the user when adding/editing the temple without shortening or processing
  const imageUrl = (temple.imageUrl || temple.thumbnailUrl || '').trim();

  // Set browser tab title
  document.title = pageTitle;

  const setOrCreateMeta = (attrName: 'name' | 'property' | 'itemprop', attrValue: string, contentValue: string) => {
    let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', contentValue);
  };

  const removeMetaTag = (attrName: 'name' | 'property' | 'itemprop', attrValue: string) => {
    const el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (el) el.remove();
  };

  // Standard HTML Description
  setOrCreateMeta('name', 'description', metaDescription);

  // Open Graph (Facebook / WhatsApp / LinkedIn / Telegram)
  setOrCreateMeta('property', 'og:type', 'website');
  setOrCreateMeta('property', 'og:site_name', 'Bhakti Ananda Odia TV & Puja Samagri Portal');
  setOrCreateMeta('property', 'og:title', metaTitle);
  setOrCreateMeta('property', 'og:description', metaDescription);
  setOrCreateMeta('property', 'og:url', shareUrl);

  if (imageUrl) {
    // Directly insert the exact full image URL without processing, shortening or alterations
    setOrCreateMeta('property', 'og:image', imageUrl);
    setOrCreateMeta('property', 'og:image:secure_url', imageUrl);
    setOrCreateMeta('property', 'og:image:url', imageUrl);
    setOrCreateMeta('property', 'og:image:alt', temple.name);
    
    setOrCreateMeta('name', 'twitter:image', imageUrl);
    setOrCreateMeta('name', 'twitter:image:src', imageUrl);
    setOrCreateMeta('name', 'image', imageUrl);
    setOrCreateMeta('itemprop', 'image', imageUrl);
  } else {
    removeMetaTag('property', 'og:image');
    removeMetaTag('property', 'og:image:secure_url');
    removeMetaTag('property', 'og:image:url');
    removeMetaTag('property', 'og:image:alt');
    removeMetaTag('name', 'twitter:image');
    removeMetaTag('name', 'twitter:image:src');
    removeMetaTag('name', 'image');
    removeMetaTag('itemprop', 'image');
  }

  // Twitter Cards
  setOrCreateMeta('name', 'twitter:card', imageUrl ? 'summary_large_image' : 'summary');
  setOrCreateMeta('name', 'twitter:title', metaTitle);
  setOrCreateMeta('name', 'twitter:description', metaDescription);

  // Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', shareUrl);
};

/**
 * Dynamically updates Open Graph tags for District Items
 */
export const setDynamicDistrictItemMeta = (item: DistrictItem, customUrl?: string) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const origin = window.location.origin || '';
  const shareUrl = customUrl || `${origin}/district/${encodeURIComponent(item.districtId)}/${encodeURIComponent(item.id)}`;

  const pageTitle = `${item.title} (${item.location || 'Odisha'}) | Explore Odisha`;
  const metaTitle = `🛕 ${item.title} - ${item.districtNameOdia || ''} | ଓଡ଼ିଶା ଦର୍ଶନ`;
  const metaDescription = item.description.length > 160 ? `${item.description.slice(0, 157)}...` : item.description;
  const imageUrl = (item.imageUrl || '').trim();

  document.title = pageTitle;

  const setOrCreateMeta = (attrName: 'name' | 'property', attrValue: string, contentValue: string) => {
    let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', contentValue);
  };

  setOrCreateMeta('name', 'description', metaDescription);
  setOrCreateMeta('property', 'og:type', 'website');
  setOrCreateMeta('property', 'og:site_name', 'Explore Odisha & Puja Samagri Portal');
  setOrCreateMeta('property', 'og:title', metaTitle);
  setOrCreateMeta('property', 'og:description', metaDescription);
  setOrCreateMeta('property', 'og:url', shareUrl);

  if (imageUrl) {
    setOrCreateMeta('property', 'og:image', imageUrl);
    setOrCreateMeta('property', 'og:image:secure_url', imageUrl);
    setOrCreateMeta('property', 'og:image:alt', item.title);
    setOrCreateMeta('name', 'twitter:image', imageUrl);
    setOrCreateMeta('name', 'twitter:card', 'summary_large_image');
  }

  setOrCreateMeta('name', 'twitter:title', metaTitle);
  setOrCreateMeta('name', 'twitter:description', metaDescription);
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

  // Update dynamic OG meta tags before sharing so local preview crawlers fetch updated tags
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
