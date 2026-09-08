import React from 'react';

/**
 * Universal In-App Browser Breakout & Deep-Link Resolver
 * 
 * Uses the exact intent URL / deep-linking fallback logic from the working pop-up ad
 * (targeting Google Chrome's package on Android to break out of Instagram, Facebook, 
 * WhatsApp, Telegram, etc., into the external browser / native shopping apps).
 */
export const getSmartAppUrl = (url: string, store?: 'amazon' | 'flipkart' | 'meesho' | 'generic'): string => {
  if (!url) return '';
  if (typeof window === 'undefined') return url;

  try {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isAndroid = /android/i.test(userAgent);

    if (isAndroid) {
      const urlWithoutProtocol = url.replace(/^https?:\/\//i, '');
      const scheme = url.toLowerCase().startsWith('http://') ? 'http' : 'https';

      // Always use com.android.chrome for Android intent breakout
      // This breaks out of Instagram/Facebook/WhatsApp WebViews with 100% reliability
      // and lets Chrome hand off to Amazon/Flipkart/Meesho native apps if installed.
      return `intent://${urlWithoutProtocol}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end;`;
    }
  } catch (err) {
    console.warn('Error generating deep link intent:', err);
  }
  return url;
};

/**
 * Core reusable deep-link handler extracted from the working pop-up ad.
 * Breaks out of In-App Browsers by launching native Chrome with top-level navigation,
 * followed by a fallback redirect.
 * 
 * Supports both signatures:
 * - handleDeepLink(url)
 * - handleDeepLink(url, store)
 * - handleDeepLink(event, url)
 * - handleDeepLink(event, url, store)
 */
export const handleDeepLink = (
  first: React.MouseEvent<any> | string,
  second?: string | 'amazon' | 'flipkart' | 'meesho' | 'generic',
  third?: 'amazon' | 'flipkart' | 'meesho' | 'generic'
): void => {
  let e: React.MouseEvent<any> | undefined;
  let targetUrl = '';
  let store: 'amazon' | 'flipkart' | 'meesho' | 'generic' = 'generic';

  if (typeof first === 'string') {
    targetUrl = first;
    if (typeof second === 'string' && ['amazon', 'flipkart', 'meesho', 'generic'].includes(second)) {
      store = second as any;
    }
  } else if (first && typeof first === 'object') {
    e = first;
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();

    if (typeof second === 'string') {
      targetUrl = second;
    }
    if (third) {
      store = third;
    }
  }

  if (!targetUrl || typeof window === 'undefined') return;

  const trimmedUrl = targetUrl.trim();
  if (!trimmedUrl) return;

  try {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isAndroid = /android/i.test(userAgent);

    if (isAndroid) {
      // Generate the exact intent breakout URL
      const intentUrl = getSmartAppUrl(trimmedUrl, store);

      // Top-level location breakout
      try {
        if (window.top) {
          window.top.location.href = intentUrl;
        } else {
          window.location.href = intentUrl;
        }
      } catch {
        window.location.href = intentUrl;
      }

      // Safety fallback: if intent blocked silently, redirect directly
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
      }, 1500);
    } else {
      // Non-Android (Desktop, iOS Safari / WebViews)
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
