export const getSmartAppUrl = (url: string, store: 'amazon' | 'flipkart' | 'meesho' | 'generic'): string => {
  if (!url) return '';
  if (typeof window === 'undefined') return url;

  try {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroid = /android/i.test(userAgent);
    const isInstagram = /instagram/i.test(userAgent);
    const isFacebook = /FBAN|FBAV/i.test(userAgent);
    const isThreads = /Threads/i.test(userAgent);
    const isShareChat = /ShareChat/i.test(userAgent);

    const isInAppBrowser = isInstagram || isFacebook || isThreads || isShareChat;

    if (isAndroid && isInAppBrowser) {
      const urlWithoutProtocol = url.replace(/^https?:\/\//, '');
      let packageName = 'com.android.chrome';
      
      if (store === 'amazon') packageName = 'in.amazon.mShop.android.shopping';
      else if (store === 'flipkart') packageName = 'com.flipkart.android';
      else if (store === 'meesho') packageName = 'com.meesho.supply';

      return `intent://${urlWithoutProtocol}#Intent;scheme=https;package=${packageName};S.browser_fallback_url=${encodeURIComponent(url)};end;`;
    }
  } catch (err) {
    console.warn('Error generating deep link:', err);
  }
  return url;
};

