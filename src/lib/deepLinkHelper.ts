export const getSmartAppUrl = (url: string, store: 'amazon' | 'flipkart' | 'meesho' | 'generic'): string => {
  if (!url) return '';
  if (typeof window === 'undefined') return url;

  try {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroid = /android/i.test(userAgent);
    
    // For Android, intent:// URLs force the OS to handle the link outside the current WebView/In-App Browser
    // This is the most reliable way to break out of ShareChat, Facebook, Instagram, etc.
    if (isAndroid) {
      const urlWithoutProtocol = url.replace(/^https?:\/\//, '');
      let packageName = 'com.android.chrome'; // Fallback to Chrome to break out of IAB
      
      if (store === 'amazon') packageName = 'in.amazon.mShop.android.shopping';
      else if (store === 'flipkart') packageName = 'com.flipkart.android';
      else if (store === 'meesho') packageName = 'com.meesho.supply';

      return `intent://${urlWithoutProtocol}#Intent;scheme=https;package=${packageName};S.browser_fallback_url=${encodeURIComponent(url)};end;`;
    }
  } catch (err) {
    console.warn('Error generating deep link:', err);
  }

  // iOS Universal Links handle app switching natively without custom schemes in most cases.
  // Standard URL is returned for iOS and Desktop.
  return url;
};
