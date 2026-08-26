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
    // ShareChat & Moj (Mohalla Tech) - High priority detection
    /ShareChat/i,
    /ShareChatApp/i,
    /ShareChat_Android/i,
    /mohalla/i,
    /Moj\//i,
    /MojApp/i,

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
 * (ShareChat, WhatsApp, Instagram, Threads, Twitter/X, Telegram, LinkedIn, Snapchat, etc.)
 * and launch the full Chrome browser, allowing standard PWA installation to work seamlessly.
 */
export function openInNativeChrome(targetUrl?: string): boolean {
  if (typeof window === 'undefined') return false;

  let fullUrl = targetUrl || window.location.href;
  try {
    // Ensure absolute URL
    fullUrl = new URL(fullUrl, window.location.origin).href;
  } catch {
    fullUrl = window.location.href;
  }

  if (isAndroid()) {
    try {
      // Remove scheme (http:// or https://) for the intent URI
      const urlWithoutScheme = fullUrl.replace(/^https?:\/\//i, '');
      const fallbackUrl = fullUrl.startsWith('http') ? fullUrl : `https://${fullUrl}`;
      
      // Explicit Android Chrome Intent URI with browser_fallback_url parameter
      const intentUrl = `intent://${urlWithoutScheme}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end;`;

      // 1. Dynamic Anchor Tag Method (bypasses ShareChat WebView click/intent swallowing)
      if (typeof document !== 'undefined') {
        const link = document.createElement('a');
        link.href = intentUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        link.style.position = 'fixed';
        link.style.top = '-9999px';
        link.style.left = '-9999px';
        document.body.appendChild(link);
        
        // Dispatch mouse click event explicitly
        try {
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
          });
          link.dispatchEvent(clickEvent);
        } catch {
          // fallback to standard .click()
        }
        
        link.click();

        setTimeout(() => {
          try {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
          } catch {
            // ignore cleanup errors
          }
        }, 500);
      }

      // 2. Direct assignment attempt as immediate parallel trigger
      try {
        window.location.href = intentUrl;
      } catch (assignErr) {
        console.warn('Direct location.href assignment failed:', assignErr);
      }

      return true;
    } catch (e) {
      console.warn('Could not launch Chrome intent, triggering secondary window.open backup:', e);
      // Secondary Backup: Force system browser via window.open
      try {
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
      } catch {
        window.location.href = fullUrl;
      }
      return true;
    }
  }

  // Non-Android fallback
  try {
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  } catch {
    window.location.href = fullUrl;
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

