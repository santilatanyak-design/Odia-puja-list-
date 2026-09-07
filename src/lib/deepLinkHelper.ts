export const getSmartAppUrl = (url: string, store: 'amazon' | 'flipkart' | 'meesho' | 'generic'): string => {
  if (!url) return '';
  if (typeof window === 'undefined') return url;

  try {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroid = /android/i.test(userAgent);

    // Apply Android intent broadly for all Android requests to guarantee app open
    if (isAndroid) {
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

export const handleSmartAppClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, url: string, store: 'amazon' | 'flipkart' | 'meesho' | 'generic') => {
  if (!url) return;
  if (typeof window === 'undefined') return;

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isAndroid = /android/i.test(userAgent);

  if (isAndroid) {
    // Prevent the default link behavior to stop target="_blank" from breaking the intent
    e.preventDefault(); 
    
    const intentUrl = getSmartAppUrl(url, store);
    
    // Direct top-level navigation is the most aggressive and reliable breakout method
    try {
      if (window.top) {
        window.top.location.href = intentUrl;
      } else {
        window.location.href = intentUrl;
      }
    } catch (err) {
      window.location.href = intentUrl;
    }

    // Fallback: If intent is blocked silently, redirect using the normal URL
    setTimeout(() => {
      try {
        if (window.top) window.top.location.href = url;
        else window.location.href = url;
      } catch (err) {
        window.location.href = url;
      }
    }, 1500);
  }
};
