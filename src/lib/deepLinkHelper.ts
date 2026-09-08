import React from 'react';

/**
 * Universal In-App Browser Breakout & Deep-Link Resolver
 * 
 * Uses the exact intent URL / deep-linking fallback logic from the working pop-up ad
 * (targeting Google Chrome's package on Android to break out of Instagram, Facebook, 
 * WhatsApp, Telegram, etc., into the external browser / native shopping apps).
 */
export type SupportedStore = 'amazon' | 'flipkart' | 'meesho' | 'chrome' | 'generic';

/**
 * Auto-detect store from URL if not specified
 */
export const detectStoreFromUrl = (url: string): SupportedStore => {
  if (!url) return 'generic';
  const lower = url.toLowerCase();
  if (lower.includes('amazon.') || lower.includes('amzn.') || lower.includes('a.co/')) {
    return 'amazon';
  }
  if (lower.includes('flipkart.') || lower.includes('dl.flipkart.com') || lower.includes('fkrt.')) {
    return 'flipkart';
  }
  if (lower.includes('meesho.') || lower.includes('meesho.com')) {
    return 'meesho';
  }
  return 'generic';
};

/**
 * Universal In-App Browser Breakout & Shopping App Deep-Link Resolver
 * 
 * - Amazon: Launches Amazon Shopping App (in.amazon.mShop.android.shopping), fallback to Chrome
 * - Flipkart: Launches Flipkart App (com.flipkart.android), fallback to Chrome
 * - Meesho: Launches Meesho App (com.meesho.supply), fallback to Chrome
 * - Chrome: Breaks out of Facebook/Instagram/WhatsApp WebViews directly into Google Chrome
 */
export const getSmartAppUrl = (
  url: string,
  store?: SupportedStore
): string => {
  if (!url) return '';
  if (typeof window === 'undefined') return url;

  try {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isAndroid = /android/i.test(userAgent);

    if (isAndroid) {
      const urlWithoutProtocol = url.replace(/^https?:\/\//i, '');
      const scheme = url.toLowerCase().startsWith('http://') ? 'http' : 'https';
      const resolvedStore = (!store || store === 'generic') ? detectStoreFromUrl(url) : store;

      // Indian Shopping App Packages
      const packageMap: Record<SupportedStore, string> = {
        amazon: 'in.amazon.mShop.android.shopping',
        flipkart: 'com.flipkart.android',
        meesho: 'com.meesho.supply',
        chrome: 'com.android.chrome',
        generic: 'com.android.chrome',
      };

      const targetPackage = packageMap[resolvedStore] || 'com.android.chrome';

      // Android Intent with package and fallback URL:
      // If the native shopping app is installed, Android launches it immediately.
      // If not installed, Android automatically opens S.browser_fallback_url in Google Chrome.
      return `intent://${urlWithoutProtocol}#Intent;scheme=${scheme};package=${targetPackage};S.browser_fallback_url=${encodeURIComponent(url)};end;`;
    }
  } catch (err) {
    console.warn('Error generating deep link intent:', err);
  }
  return url;
};

/**
 * Core reusable deep-link handler for Affiliate Links (Amazon, Flipkart, Meesho, Chrome)
 * Opens in the native shopping app if installed, or in Google Chrome, breaking out of
 * restricted social media In-App Browsers (Facebook, Instagram, WhatsApp, etc.).
 */
export const handleDeepLink = (
  first: React.MouseEvent<any> | string,
  second?: string | SupportedStore,
  third?: SupportedStore
): void => {
  let e: React.MouseEvent<any> | undefined;
  let targetUrl = '';
  let store: SupportedStore = 'generic';

  if (typeof first === 'string') {
    targetUrl = first;
    if (typeof second === 'string' && ['amazon', 'flipkart', 'meesho', 'chrome', 'generic'].includes(second)) {
      store = second as SupportedStore;
    }
  } else if (first && typeof first === 'object') {
    e = first;
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();

    if (typeof second === 'string') {
      targetUrl = second;
    }
    if (third && ['amazon', 'flipkart', 'meesho', 'chrome', 'generic'].includes(third)) {
      store = third;
    }
  }

  if (!targetUrl || typeof window === 'undefined') return;

  const trimmedUrl = targetUrl.trim();
  if (!trimmedUrl) return;

  const resolvedStore = store === 'generic' ? detectStoreFromUrl(trimmedUrl) : store;

  try {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isAndroid = /android/i.test(userAgent);

    if (isAndroid) {
      const urlWithoutProtocol = trimmedUrl.replace(/^https?:\/\//i, '');
      const scheme = trimmedUrl.toLowerCase().startsWith('http://') ? 'http' : 'https';

      // 1. Primary target: Shopping App intent with Chrome fallback
      const primaryIntent = getSmartAppUrl(trimmedUrl, resolvedStore);

      // 2. Secondary fallback intent: Chrome breakout intent
      const chromeIntent = `intent://${urlWithoutProtocol}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(trimmedUrl)};end;`;

      // Trigger navigation
      try {
        if (window.top) {
          window.top.location.href = primaryIntent;
        } else {
          window.location.href = primaryIntent;
        }
      } catch {
        window.location.href = primaryIntent;
      }

      // Fallback 1: If still in current window after 800ms, force Chrome breakout intent
      setTimeout(() => {
        try {
          if (window.top) {
            window.top.location.href = chromeIntent;
          } else {
            window.location.href = chromeIntent;
          }
        } catch {
          window.location.href = chromeIntent;
        }
      }, 800);

      // Fallback 2: Direct URL redirect after 1600ms
      setTimeout(() => {
        try {
          if (window.top) {
            window.top.location.href = trimmedUrl;
          } else {
            window.location.href = trimmedUrl;
          }
        } catch {
          window.location.href = trimmedUrl;
        }
      }, 1600);
    } else {
      // Non-Android (iOS Safari / WebViews, Desktop)
      window.open(trimmedUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    console.error('Error during deep link breakout:', err);
    window.location.href = trimmedUrl;
  }
};

/**
 * Alias methods to guarantee backward compatibility with any other callers
 */
export const executeSmartNavigation = (
  e: React.MouseEvent<any>,
  url: string,
  store: 'amazon' | 'flipkart' | 'meesho' | 'generic' = 'generic'
): void => {
  handleDeepLink(e, url, store);
};

export const handleSmartAppClick = (
  e: React.MouseEvent<any>,
  url: string,
  store: 'amazon' | 'flipkart' | 'meesho' | 'generic' = 'generic'
): void => {
  handleDeepLink(e, url, store);
};
