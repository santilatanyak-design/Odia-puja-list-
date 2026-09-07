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

    // For Android, intent:// URLs force the OS to handle the link outside the current WebView/In-App Browser
    // However, some in-app browsers strictly block intent:// in href.
    // As a workaround, we will just use the standard https URL, which many devices have App Links registered for natively anyway.
    // If we want to force intent, we could, but if it's broken, fallback to standard url.
    if (isAndroid && isInAppBrowser) {
      // Trying the intent scheme but without fallback_url might work, or just native intent.
      // Actually, many times native app links (https://) work better on modern Android 12+ if the app is installed.
      // Let's just return the standard URL for now so it doesn't break.
      return url;
    }
  } catch (err) {
    console.warn('Error generating deep link:', err);
  }

  return url;
};

export const handleSmartAppClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string, store: 'amazon' | 'flipkart' | 'meesho' | 'generic') => {
  if (!url) return;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isAndroid = /android/i.test(userAgent);
  const isInAppBrowser = /instagram|FBAN|FBAV|Threads|ShareChat/i.test(userAgent);

  if (isAndroid && isInAppBrowser) {
    // Try to force intent via window.location, which sometimes bypasses href blocks
    e.preventDefault();
    const urlWithoutProtocol = url.replace(/^https?:\/\//, '');
    let packageName = 'com.android.chrome';
    if (store === 'amazon') packageName = 'in.amazon.mShop.android.shopping';
    else if (store === 'flipkart') packageName = 'com.flipkart.android';
    else if (store === 'meesho') packageName = 'com.meesho.supply';
    
    const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=${packageName};S.browser_fallback_url=${encodeURIComponent(url)};end;`;
    
    // Try intent
    window.location.href = intentUrl;
    
    // Fallback if intent fails (e.g., blocked by webview)
    setTimeout(() => {
      window.location.href = url; // fallback to standard url
    }, 1500);
  }
};

