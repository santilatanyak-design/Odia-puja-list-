/**
 * Comprehensive utility to detect in-app browsers across all major social media platforms
 * (WhatsApp, Instagram, Threads, Twitter/X, Telegram, LinkedIn, Snapchat, Facebook, TikTok, Reddit, etc.,
 * and generic Android WebViews) and trigger an Android Chrome Intent redirect to open the native browser.
 */

export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined' || !window.navigator) return false;
  const ua = window.navigator.userAgent || window.navigator.vendor || '';

  // Comprehensive In-App Browser & WebView identifiers
  const inAppPatterns = [
    // Meta / Facebook / Instagram / Threads
    /FBAN/i,
    /FBAV/i,
    /FB_IAB/i,
    /FB4A/i,
    /FBIOS/i,
    /Instagram/i,
    /Barcelona/i,      // Threads app internal code name / UA
    /Threads/i,

    // WhatsApp
    /WhatsApp/i,
    /WhatsAppClient/i,

    // Twitter / X
    /Twitter/i,
    /TwitterAndroid/i,
    /TwitterBrowser/i,
    /X-App/i,
    /TweetDeck/i,

    // Telegram
    /Telegram/i,
    /TelegramAndroid/i,
    /Telegram-Android/i,

    // LinkedIn
    /LinkedInApp/i,
    /LinkedIn/i,

    // Snapchat
    /Snapchat/i,

    // TikTok / ByteDance
    /musical_ly/i,
    /ByteDance/i,
    /TikTok/i,
    /BytedanceWebview/i,

    // Reddit & Pinterest
    /Reddit/i,
    /RedditApp/i,
    /Pinterest/i,

    // Line, WeChat, Discord
    /Line\//i,
    /MicroMessenger/i,
    /Discord/i,

    // Generic Android System WebViews & In-App WebViews
    /;\s*wv\b/i,                              // Standard Android WebView token '; wv)'
    /\bwv\b/i,                                // wv token
    /Android.*Version\/[0-9.]+\s+(?:Mobile\s+)?(?:Safari\/[0-9.]+\s+)?Chrome\//i, // Android WebView
    /Android.*Version\/[0-9.]+/i,             // Legacy Android WebView
    /GSA\//i,                                 // Google Search App WebView
    /AlohaBrowser/i
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
 * Triggers an Android Chrome Intent to break out of any in-app webview
 * (WhatsApp, Instagram, Threads, Twitter/X, Telegram, LinkedIn, Snapchat, etc.)
 * and launch the full Chrome browser, allowing standard PWA installation to work seamlessly.
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
 * Universal handler for PWA installation with automated In-App Browser breakout
 * for ALL social media platforms without showing manual popups on Android.
 */
export async function triggerPwaInstall(
  promptEvent: any,
  onSuccess?: () => void,
  onShowFallbackModal?: () => void,
  customUrl?: string
): Promise<void> {
  // 1. Ensure dynamic manifest is set to public manifest
  if (typeof document !== 'undefined') {
    const dynamicManifest = document.getElementById('dynamic-pwa-manifest') as HTMLLinkElement;
    if (dynamicManifest) {
      dynamicManifest.href = '/manifest.json';
    }
  }

  // 2. If inside ANY social media in-app browser or Android WebView, immediately break out to Chrome
  if (isAndroid() && isInAppBrowser()) {
    const redirected = openInNativeChrome(customUrl);
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

  // 4. On Android without a prompt, attempt the native Chrome intent directly to ensure breakout
  if (isAndroid()) {
    const redirected = openInNativeChrome(customUrl);
    if (redirected) return;
  }

  // 5. Fallback modal for iOS (Safari Add to Home screen instructions) or desktop
  if (onShowFallbackModal) {
    onShowFallbackModal();
  }
}

