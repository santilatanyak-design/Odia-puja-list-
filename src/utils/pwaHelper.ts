/**
 * Utility to detect in-app browsers (Facebook, Instagram, WhatsApp, Messenger, etc.)
 * and trigger an Android Intent redirect to open the true native Chrome browser.
 */

export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined' || !window.navigator) return false;
  const ua = window.navigator.userAgent || window.navigator.vendor || '';

  // Common In-App Browser identifiers
  const inAppPatterns = [
    /FBAN/i,            // Facebook App
    /FBAV/i,            // Facebook App
    /Instagram/i,       // Instagram App
    /WhatsApp/i,        // WhatsApp In-app Webview
    /Messenger/i,       // FB Messenger
    /Snapchat/i,        // Snapchat
    /Line\//i,          // Line App
    /MicroMessenger/i,  // WeChat
    /Twitter/i,         // Twitter / X
    /musical_ly/i,      // TikTok
    /ByteDance/i,       // TikTok
    /AlohaBrowser/i,
    /GSA\//i            // Google Search App (WebView mode)
  ];

  return inAppPatterns.some((pattern) => pattern.test(ua));
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined' || !window.navigator) return false;
  return /Android/i.test(window.navigator.userAgent || '');
}

export function isIOS(): boolean {
  if (typeof window === 'undefined' || !window.navigator) return false;
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent || '');
}

/**
 * Triggers an Android Chrome Intent to break out of Facebook/Instagram/WhatsApp webviews
 * and launch the full Chrome browser, allowing standard PWA installation to work.
 */
export function openInNativeChrome(targetUrl?: string): boolean {
  if (typeof window === 'undefined') return false;

  const rawUrl = targetUrl || window.location.href;
  
  if (isAndroid()) {
    try {
      // Remove scheme (http:// or https://) for the intent URI
      const urlWithoutScheme = rawUrl.replace(/^https?:\/\//i, '');
      const scheme = rawUrl.startsWith('http://') ? 'http' : 'https';
      
      // Android Chrome Intent syntax
      const intentUrl = `intent://${urlWithoutScheme}#Intent;scheme=${scheme};package=com.android.chrome;end;`;
      
      window.location.href = intentUrl;
      return true;
    } catch (e) {
      console.warn('Could not launch Chrome intent:', e);
    }
  }

  return false;
}

/**
 * Generic handler for public PWA installation with automated In-App Browser breakout
 */
export async function triggerPwaInstall(
  promptEvent: any,
  onSuccess?: () => void,
  onShowFallbackModal?: () => void
): Promise<void> {
  // 1. Ensure dynamic manifest is set to public manifest
  if (typeof document !== 'undefined') {
    const dynamicManifest = document.getElementById('dynamic-pwa-manifest') as HTMLLinkElement;
    if (dynamicManifest) {
      dynamicManifest.href = '/manifest.json';
    }
  }

  // 2. Check if inside in-app browser on Android - auto breakout to Chrome!
  if (isInAppBrowser() && isAndroid()) {
    const redirected = openInNativeChrome();
    if (redirected) return;
  }

  // 3. Native PWA prompt available (Standard Chrome, Edge, Samsung Internet)
  const activePrompt = promptEvent || (typeof window !== 'undefined' ? (window as any).__PWA_INSTALL_PROMPT__ : null);
  if (activePrompt) {
    try {
      activePrompt.prompt();
      const { outcome } = await activePrompt.userChoice;
      if (outcome === 'accepted') {
        if (typeof window !== 'undefined') {
          (window as any).__PWA_INSTALL_PROMPT__ = null;
        }
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('PWA install prompt error:', err);
    }
    return;
  }

  // 4. Fallback modal or banner trigger (Never use window.alert)
  if (onShowFallbackModal) {
    onShowFallbackModal();
  }
}
