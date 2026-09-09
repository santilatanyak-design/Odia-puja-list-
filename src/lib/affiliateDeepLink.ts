/**
 * Smart Deep Linking Logic
 * Forces native browser (Chrome/Safari) or Shopping App (Amazon/Flipkart)
 * when opened inside Facebook/WhatsApp/Instagram in-app browsers.
 */
export function openAffiliateLink(url: string, platform: string) {
  if (typeof window === 'undefined') return;

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Detect in-app browsers
  const isFBAV = /FBAV|FBAN|FBIOS/i.test(userAgent);
  const isInstagram = /Instagram/i.test(userAgent);
  const isWhatsApp = /WhatsApp/i.test(userAgent);
  const isInApp = isFBAV || isInstagram || isWhatsApp;
  
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

  let finalUrl = url;

  // Platform specific deep-link handling (Amazon/Flipkart specific intent schemes can be used if available)
  // For now, ensuring it escapes the in-app browser is the main priority.

  if (isInApp) {
    if (isAndroid) {
      // Force Android to open Chrome or native handler via Intent
      const cleanUrl = url.replace(/^https?:\/\//, '');
      const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
      
      // Fallback if Chrome is not present
      setTimeout(() => {
        window.location.href = url;
      }, 2000);
      return;
    } else if (isIOS) {
      // iOS doesn't have a reliable intent mechanism to force Safari from FB.
      // Usually, telling them to click "Open in Safari" is needed, but we can try 
      // specific app schemes if known (like amzn://)
      if (platform === 'Amazon' && url.includes('amazon')) {
        const amznUrl = url.replace(/^https?:\/\//, 'amzn://');
        window.location.href = amznUrl;
        setTimeout(() => {
          window.location.href = url;
        }, 2000);
        return;
      }
      if (platform === 'Flipkart' && url.includes('flipkart')) {
        const flipkartUrl = url.replace(/^https?:\/\//, 'flipkart://');
        window.location.href = flipkartUrl;
        setTimeout(() => {
          window.location.href = url;
        }, 2000);
        return;
      }
    }
  }

  // Default behavior
  window.open(finalUrl, '_blank', 'noopener,noreferrer');
}
