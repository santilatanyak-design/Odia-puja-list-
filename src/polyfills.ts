import 'core-js/stable';
import 'whatwg-fetch';

/**
 * Universal Backward Compatibility & Polyfill Layer
 * Ensures the web application loads and operates gracefully on legacy mobile devices,
 * older Android WebViews, older iOS Safari, UC Browser, Opera Mini, and legacy desktop browsers.
 */

// 1. globalThis polyfill
if (typeof globalThis === 'undefined') {
  (function () {
    if (typeof self !== 'undefined') {
      // @ts-ignore
      self.globalThis = self;
    } else if (typeof window !== 'undefined') {
      // @ts-ignore
      window.globalThis = window;
    } else if (typeof global !== 'undefined') {
      // @ts-ignore
      global.globalThis = global;
    }
  })();
}

// 2. Safe LocalStorage & SessionStorage in-memory fallback for Private Browsing / Restricted WebViews
(function () {
  function createMemoryStorage() {
    var store: Record<string, string> = {};
    return {
      getItem: function (key: string) {
        return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
      },
      setItem: function (key: string, value: string) {
        store[key] = String(value);
      },
      removeItem: function (key: string) {
        delete store[key];
      },
      clear: function () {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key: function (index: number) {
        return Object.keys(store)[index] || null;
      },
    };
  }

  try {
    var testKey = '__test_compat_storage__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
  } catch (e) {
    try {
      // @ts-ignore
      window.localStorage = createMemoryStorage();
    } catch (ignore) {}
  }

  try {
    var testSessionKey = '__test_compat_session__';
    window.sessionStorage.setItem(testSessionKey, testSessionKey);
    window.sessionStorage.removeItem(testSessionKey);
  } catch (e) {
    try {
      // @ts-ignore
      window.sessionStorage = createMemoryStorage();
    } catch (ignore) {}
  }
})();

// 3. window.matchMedia polyfill for older browsers
if (typeof window !== 'undefined' && !window.matchMedia) {
  // @ts-ignore
  window.matchMedia = function () {
    return {
      matches: false,
      media: '',
      onchange: null,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {
        return false;
      },
    };
  };
}

// 4. requestAnimationFrame & cancelAnimationFrame polyfills
(function () {
  if (typeof window !== 'undefined') {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      // @ts-ignore
      window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
      // @ts-ignore
      window.cancelAnimationFrame =
        // @ts-ignore
        window[vendors[x] + 'CancelAnimationFrame'] ||
        // @ts-ignore
        window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
      // @ts-ignore
      window.requestAnimationFrame = function (callback: FrameRequestCallback) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }

    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (id: number) {
        clearTimeout(id);
      };
    }
  }
})();

// 5. CustomEvent polyfill for older IE / Android WebViews
(function () {
  if (typeof window !== 'undefined' && typeof window.CustomEvent !== 'function') {
    function CustomEventPolyfill(event: string, params: any) {
      params = params || { bubbles: false, cancelable: false, detail: null };
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    }
    CustomEventPolyfill.prototype = window.Event.prototype;
    // @ts-ignore
    window.CustomEvent = CustomEventPolyfill;
  }
})();

// 6. queueMicrotask polyfill
if (typeof window !== 'undefined' && typeof window.queueMicrotask !== 'function') {
  window.queueMicrotask = function (callback: VoidFunction) {
    if (typeof Promise !== 'undefined' && Promise.resolve) {
      Promise.resolve()
        .then(callback)
        .catch(function (err) {
          setTimeout(function () {
            throw err;
          }, 0);
        });
    } else {
      setTimeout(callback, 0);
    }
  };
}

// 7. structuredClone polyfill fallback
if (typeof window !== 'undefined' && typeof window.structuredClone !== 'function') {
  // @ts-ignore
  window.structuredClone = function (obj: any) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  };
}

// 8. Global Unhandled Promise Rejection & Window Error Guard to prevent blank screens
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', function (event) {
    try {
      console.warn('Silently handled unhandled promise rejection for legacy safety:', event.reason);
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
    } catch (e) {}
  });

  window.addEventListener('error', function (event) {
    try {
      if (event && event.message && event.message.includes('ResizeObserver')) {
        event.stopImmediatePropagation();
      }
    } catch (e) {}
  });
}

export {};
