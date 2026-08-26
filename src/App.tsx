import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Pujari, QrConfig } from './types';
import { getQrConfig, loginPujari, subscribeQrConfig, subscribePujaris, subscribeSiteLock, verifyAdminMasterId, logPwaInstall } from './lib/api';
import { Language } from './lib/translations';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getSeoConfigForView, updateDocumentSeoAndCanonical } from './lib/seoHelper';
import { sanitizeIdentifier, isActionThrottled, GENERIC_ODIA_ERROR_MESSAGE } from './lib/sanitize';
import { ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { AdminInstallSection } from './components/AdminInstallSection';

// Safe lazy loading wrapper with automatic dynamic import recovery
const lazyWithRetry = (componentImport: () => Promise<{ default: React.ComponentType<any> }>) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn('Chunk load error, retrying component import:', error);
      return await componentImport();
    }
  });

// Lazy load non-critical secondary routes with safe named export resolution
const PujariLogin = lazyWithRetry(() => import('./components/PujariLogin').then((m) => ({ default: m.PujariLogin })));
const PujariPortal = lazyWithRetry(() => import('./components/PujariPortal').then((m) => ({ default: m.PujariPortal })));
const StoreView = lazyWithRetry(() => import('./components/StoreView').then((m) => ({ default: m.StoreView })));
const TempleBookingView = lazyWithRetry(() => import('./components/TempleBookingView').then((m) => ({ default: m.TempleBookingView })));
const TempleShortsFeed = lazyWithRetry(() => import('./components/TempleShortsFeed').then((m) => ({ default: m.TempleShortsFeed })));
const PanchangPage = lazyWithRetry(() => import('./components/PanchangPage').then((m) => ({ default: m.PanchangPage })));
const SpiritualBlog = lazyWithRetry(() => import('./components/SpiritualBlog').then((m) => ({ default: m.SpiritualBlog })));
const AdminPanel = lazyWithRetry(() => import('./components/AdminPanel').then((m) => ({ default: m.AdminPanel })));
const SiteLockOverlay = lazyWithRetry(() => import('./components/SiteLockOverlay').then((m) => ({ default: m.SiteLockOverlay })));

interface AdminRouteLoginProps {
  onSuccess: () => void;
  onBackToHome: () => void;
}

const AdminRouteLogin: React.FC<AdminRouteLoginProps> = ({ onSuccess, onBackToHome }) => {
  const [masterId, setMasterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isActionThrottled('admin_route_login', 1500)) {
      setErrorMsg('ଅତି ଦ୍ରୁତ ଆବେଦନ! ଦୟାକରି ୧-୨ ସେକେଣ୍ଡ ଅପେକ୍ଷା କରନ୍ତୁ।');
      return;
    }
    const cleanId = sanitizeIdentifier(masterId);
    if (!cleanId) {
      setErrorMsg('ଦୟାକରି ସଠିକ୍ ଆଡମିନ୍ Password / Master ID ଦିଅନ୍ତୁ।');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg('');
      const valid = await verifyAdminMasterId(cleanId);
      if (valid) {
        onSuccess();
      } else {
        setErrorMsg('ଅସିଦ୍ଧ ଆଡମିନ୍ Master ID / Password।');
      }
    } catch (err) {
      console.error('Admin route login error:', err);
      setErrorMsg(GENERIC_ODIA_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 flex-col">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-300 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onBackToHome}
          className="mb-4 text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1.5 transition cursor-pointer"
        >
          <span>←</span>
          <span>ମୁଖ୍ୟ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ (Back to Public Home)</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-tr from-[#701a1e] to-[#8B0000] text-amber-300 rounded-2xl border border-amber-400 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-amber-950">ଆଡମିନ୍ ପୋର୍ଟାଲ୍ ଲଗଇନ୍</h2>
            <p className="text-xs text-amber-900/80 font-bold">Secure Administrative Access</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-amber-950 mb-1.5">
              ଆଡମିନ୍ ପାସୱାର୍ଡ / ମାଷ୍ଟର ID (Admin Password)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                placeholder="ଆଡମିନ୍ Password / Master ID ଦିଅନ୍ତୁ"
                value={masterId}
                onChange={(e) => setMasterId(e.target.value)}
                className="w-full pl-9 pr-3 py-3 border border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono font-bold"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#701a1e] to-[#8B0000] hover:from-[#5c1518] hover:to-[#701a1e] text-white font-extrabold rounded-xl text-sm transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>{loading ? 'ଯାଞ୍ଚ ଚାଲିଛି...' : 'ଆଡମିନ୍ ପ୍ୟାନେଲ୍ ପ୍ରବେଶ କରନ୍ତୁ'}</span>
          </button>
        </form>
      </div>

      {/* Dedicated Private Admin PWA App Install Section at bottom of Admin Login */}
      <div className="w-full max-w-md">
        <AdminInstallSection />
      </div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('puja_app_lang');
        return (saved === 'EN' || saved === 'OD') ? saved : 'OD';
      }
    } catch {
      // Fallback on restricted storage
    }
    return 'OD';
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return sessionStorage.getItem('puja_app_admin_auth') === 'true';
      }
    } catch {
      // Fallback
    }
    return false;
  });

  const [activePujari, setActivePujari] = useState<Pujari | null>(null);

  // View Navigation State: Resolved from preloaded state, pathname, search parameters, or default 'home'
  const [viewMode, setViewMode] = useState<'home' | 'login' | 'store' | 'portal' | 'temple' | 'shorts' | 'panchang' | 'blog' | 'admin'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const pwaParam = params.get('pwa');

        // Explicit PWA Admin parameter
        if (pwaParam === 'admin') {
          return 'admin';
        }

        const preloaded = (window as any).__PRELOADED_STATE__;
        if (preloaded && preloaded.viewMode) {
          return preloaded.viewMode;
        }

        const pathname = window.location.pathname.toLowerCase();
        if (pathname === '/admin' || pathname.startsWith('/admin/')) {
          return 'admin';
        }
        if (pathname.startsWith('/story/') || pathname.startsWith('/blog/') || pathname.startsWith('/stories/')) {
          return 'blog';
        }
        if (pathname.startsWith('/temple/') || pathname.startsWith('/temples/')) {
          return 'temple';
        }
        if (pathname === '/shorts' || pathname === '/shorts/') {
          return 'shorts';
        }
        if (pathname === '/panchang' || pathname === '/panchang/') {
          return 'panchang';
        }
        if (pathname === '/store' || pathname === '/store/') {
          return 'store';
        }
        if (pathname === '/login' || pathname === '/login/') {
          return 'login';
        }
        if (pathname === '/portal' || pathname === '/portal/') {
          return 'portal';
        }

        const view = params.get('view');
        if (view === 'admin' || params.get('admin')) {
          return 'admin';
        }
        if (view === 'store' || params.get('store') || params.get('product_id') || params.get('product')) {
          return 'store';
        }
        if (view === 'temple' || params.get('templeId') || params.get('temple')) {
          return 'temple';
        }
        if (view === 'panchang' || params.get('panchang')) {
          return 'panchang';
        }
        if (view === 'blog' || params.get('blog') || params.get('stories') || params.get('storyId') || params.get('story')) {
          return 'blog';
        }
        if (view === 'shorts' || params.get('shorts') || params.get('feed')) {
          return 'shorts';
        }
        if (view === 'login' || params.get('login')) {
          return 'login';
        }
        if (view === 'portal' || params.get('portal')) {
          return 'portal';
        }
      }
    } catch {
      // Fallback to home
    }
    return 'home';
  });

  // Dynamic SEO, Canonical Link, Search Parameter & PWA Manifest Synchronizer
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      // Update dynamic PWA manifest link in head based on active route
      const dynamicManifest = document.getElementById('dynamic-pwa-manifest') as HTMLLinkElement;
      if (dynamicManifest) {
        dynamicManifest.href = viewMode === 'admin' ? '/admin-manifest.json' : '/manifest.json';
      }

      if (viewMode === 'admin') {
        if (window.location.pathname !== '/admin') {
          window.history.replaceState({ viewMode: 'admin' }, '', '/admin');
        }
        const seoConfig = getSeoConfigForView('admin');
        updateDocumentSeoAndCanonical(seoConfig);
        return;
      }

      // 1. Determine the appropriate query parameter string for the active view
      const currentParams = new URLSearchParams(window.location.search);
      let targetQuery = '';
      let targetPath = '/';

      if (viewMode === 'store') {
        const productId = currentParams.get('product_id') || currentParams.get('product');
        targetQuery = productId ? `?view=store&product_id=${encodeURIComponent(productId)}` : '?view=store';
      } else if (viewMode === 'temple') {
        const templeId = currentParams.get('templeId') || currentParams.get('temple');
        targetQuery = templeId ? `?templeId=${encodeURIComponent(templeId)}` : '?view=temple';
      } else if (viewMode === 'panchang') {
        targetQuery = '?panchang=true';
      } else if (viewMode === 'blog') {
        const storyId = currentParams.get('storyId') || currentParams.get('story');
        targetQuery = storyId ? `?view=blog&storyId=${encodeURIComponent(storyId)}` : '?view=blog';
      } else if (viewMode === 'shorts') {
        targetQuery = '?shorts=true';
      } else if (viewMode === 'login') {
        targetQuery = '?view=login';
      } else if (viewMode === 'portal') {
        targetQuery = '?view=portal';
      } else {
        // 'home' - preserve district item if present, otherwise clean root URL
        const districtId = currentParams.get('district');
        const itemId = currentParams.get('item');
        if (districtId && itemId) {
          targetQuery = `?district=${encodeURIComponent(districtId)}&item=${encodeURIComponent(itemId)}`;
        } else {
          targetQuery = '';
        }
      }

      // 2. Synchronize URL in the browser address bar without reload
      const newUrl = `${targetPath}${targetQuery}`;
      if (window.location.pathname !== targetPath || window.location.search !== targetQuery) {
        window.history.replaceState({ viewMode }, '', newUrl);
      }

      // 3. Dynamically update <title>, <meta name="description">, <link rel="canonical"> and OG tags
      const seoConfig = getSeoConfigForView(viewMode, targetQuery);
      updateDocumentSeoAndCanonical(seoConfig);
    } catch (err) {
      console.warn('SEO & Canonical synchronization error:', err);
    }
  }, [viewMode]);

  // Listen to browser Back / Forward (popstate) buttons for seamless navigation
  useEffect(() => {
    const handlePopState = () => {
      try {
        if (typeof window !== 'undefined') {
          const pathname = window.location.pathname.toLowerCase();
          if (pathname === '/admin' || pathname.startsWith('/admin/')) {
            setViewMode('admin');
            return;
          }

          const params = new URLSearchParams(window.location.search);
          const view = params.get('view');
          if (view === 'admin' || params.get('admin')) {
            setViewMode('admin');
          } else if (view === 'store' || params.get('store') || params.get('product_id') || params.get('product')) {
            setViewMode('store');
          } else if (view === 'temple' || params.get('templeId') || params.get('temple')) {
            setViewMode('temple');
          } else if (view === 'panchang' || params.get('panchang')) {
            setViewMode('panchang');
          } else if (view === 'blog' || params.get('blog') || params.get('stories') || params.get('storyId') || params.get('story')) {
            setViewMode('blog');
          } else if (view === 'shorts' || params.get('shorts') || params.get('feed')) {
            setViewMode('shorts');
          } else if (view === 'login' || params.get('login')) {
            setViewMode('login');
          } else if (view === 'portal' || params.get('portal')) {
            setViewMode('portal');
          } else {
            setViewMode('home');
          }
        }
      } catch {
        // Safe skip
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Global Real-time PWA Installation Tracker
  useEffect(() => {
    const handleGlobalAppInstalled = (evt: Event) => {
      try {
        console.log('🎉 PWA successfully installed on device:', evt);
        const resolvedPlatform = (navigator as any)?.userAgentData?.platform || navigator.platform || 'Unknown';
        logPwaInstall({
          platform: resolvedPlatform,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        }).catch((err) => {
          console.warn('Failed to log PWA install to Firestore:', err);
        });
      } catch (err) {
        console.warn('Error in appinstalled event handler:', err);
      }
    };

    window.addEventListener('appinstalled', handleGlobalAppInstalled);
    return () => {
      window.removeEventListener('appinstalled', handleGlobalAppInstalled);
    };
  }, []);

  // Global Emergency Site Lock State
  const [isSiteLocked, setIsSiteLocked] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('puja_app_site_locked') === 'true';
      }
    } catch {
      // Fallback
    }
    return false;
  });

  // Real-time site lock subscription
  useEffect(() => {
    const unsubLock = subscribeSiteLock((locked) => {
      setIsSiteLocked(locked);
    });
    return () => {
      unsubLock();
    };
  }, []);

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === 'OD' ? 'EN' : 'OD';
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('puja_app_lang', next);
        }
      } catch {
        // Safe skip
      }
      return next;
    });
  };

  const [qrConfig, setQrConfig] = useState<QrConfig>({
    newCreationQrUrl: '',
    newCreationUpiId: 'pujasamagri@upi',
    newCreationAmount: 5,
    reDownloadQrUrl: '',
    reDownloadUpiId: 'pujasamagri@upi',
    reDownloadAmount: 2,
  });

  // Load active Pujari session and subscribe to QR config and Pujaris on initial mount
  useEffect(() => {
    initApp();

    const unsubQr = subscribeQrConfig((config) => {
      setQrConfig(config);
    });

    const unsubPujaris = subscribePujaris((pujaris) => {
      if (activePujari?.id) {
        const updated = pujaris.find((p) => p.id === activePujari.id);
        if (updated) {
          setActivePujari(updated);
        }
      }
    });

    return () => {
      unsubQr();
      unsubPujaris();
    };
  }, [activePujari?.id]);

  const initApp = async () => {
    try {
      const config = await getQrConfig();
      setQrConfig(config);

      // Check stored Pujari ID session silently in background without overriding initial Home Page landing
      let storedPujariId: string | null = null;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          storedPujariId = localStorage.getItem('puja_app_pujari_id');
        }
      } catch {
        // Safe skip
      }

      if (storedPujariId) {
        const res = await loginPujari({ pujariId: storedPujariId, skipPinCheck: true });
        if (res.success && res.pujari) {
          setActivePujari(res.pujari);
        }
      }
    } catch (err) {
      console.warn('App initialization warning:', err);
    }
  };

  const handlePujariLoginSuccess = (pujari: Pujari) => {
    setActivePujari(pujari);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('puja_app_pujari_id', pujari.id);
      }
    } catch {
      // Safe skip
    }
    setViewMode('portal');
  };

  const handlePujariLogout = () => {
    setActivePujari(null);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('puja_app_pujari_id');
      }
    } catch {
      // Safe skip
    }
    setViewMode('home');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('puja_app_admin_auth');
      }
    } catch {
      // Safe skip
    }
    setViewMode('home');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleRefreshPujariStatus = async () => {
    if (activePujari) {
      const res = await loginPujari({ pujariId: activePujari.id });
      if (res.success && res.pujari) {
        setActivePujari(res.pujari);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] text-amber-950 font-sans selection:bg-amber-200 flex flex-col w-full max-w-full overflow-x-hidden box-border">
      {/* Top Navigation Bar */}
      <Navbar
        currentView={viewMode}
        isAdminAuthenticated={isAdminAuthenticated}
        activePujari={activePujari}
        lang={lang}
        onToggleLang={toggleLang}
        onGoHome={() => {
          setViewMode('home');
        }}
        onLogoutPujari={handlePujariLogout}
        onLogoutAdmin={handleAdminLogout}
      />

      {/* Main View Area */}
      <main className="w-full max-w-full overflow-x-hidden box-border flex-1">
        <ErrorBoundary onReset={() => setViewMode('home')}>
          <Suspense
            fallback={
              <div className="w-full py-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-amber-900">ଲୋଡ୍ ହେଉଛି (Loading...)...</span>
              </div>
            }
          >
            {viewMode === 'admin' ? (
              <ErrorBoundary fallbackTitle="ଆଡମିନ୍ ପ୍ୟାନେଲ୍ ଲୋଡ୍ କରିବାରେ ସମସ୍ୟା (Admin Panel Error)" onReset={() => setViewMode('home')}>
                {isAdminAuthenticated ? (
                  <AdminPanel onLogoutAdmin={handleAdminLogout} />
                ) : (
                  <AdminRouteLogin
                    onSuccess={() => {
                      setIsAdminAuthenticated(true);
                      try {
                        sessionStorage.setItem('puja_app_admin_auth', 'true');
                      } catch {
                        // Safe skip
                      }
                    }}
                    onBackToHome={() => {
                      setViewMode('home');
                    }}
                  />
                )}
              </ErrorBoundary>
            ) : viewMode === 'store' ? (
              <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4">
                <button
                  onClick={() => setViewMode('home')}
                  className="mb-4 px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-amber-400"
                >
                  <span>←</span>
                  <span>ମୁଖ୍ୟ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ (Back to Home)</span>
                </button>
                <StoreView userPhone={activePujari?.phone} />
              </div>
            ) : viewMode === 'temple' ? (
              <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4">
                <button
                  onClick={() => setViewMode('home')}
                  className="mb-4 px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-amber-400"
                >
                  <span>←</span>
                  <span>ମୁଖ୍ୟ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ (Back to Home)</span>
                </button>
                <TempleBookingView userPhone={activePujari?.phone} />
              </div>
            ) : viewMode === 'login' ? (
              <div className="max-w-7xl mx-auto px-2 sm:px-6 py-2">
                <div className="max-w-lg mx-auto mb-2">
                  <button
                    onClick={() => setViewMode('home')}
                    className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-amber-400"
                  >
                    <span>←</span>
                    <span>ମୁଖ୍ୟ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ (Back to Home)</span>
                  </button>
                </div>
                <PujariLogin
                  lang={lang}
                  onLoginSuccess={handlePujariLoginSuccess}
                />
              </div>
            ) : viewMode === 'portal' && activePujari ? (
              <PujariPortal
                pujari={activePujari}
                qrConfig={qrConfig}
                onRefreshPujari={handleRefreshPujariStatus}
                onLogout={handlePujariLogout}
              />
            ) : viewMode === 'shorts' ? (
              <TempleShortsFeed
                onClose={() => setViewMode('home')}
                onNavigateToTemple={(templeId) => {
                  setViewMode('temple');
                }}
              />
            ) : viewMode === 'panchang' ? (
              <PanchangPage
                onBack={() => setViewMode('home')}
                onNavigateToBlog={() => setViewMode('blog')}
              />
            ) : viewMode === 'blog' ? (
              <SpiritualBlog
                onBack={() => setViewMode('home')}
                onNavigateToPanchang={() => setViewMode('panchang')}
              />
            ) : (
              <HomePage
                activePujari={activePujari}
                onNavigateToCreateList={() => {
                  if (activePujari) {
                    setViewMode('portal');
                  } else {
                    setViewMode('login');
                  }
                }}
                onNavigateToStore={() => setViewMode('store')}
                onNavigateToTemple={() => setViewMode('temple')}
                onNavigateToPanchang={() => setViewMode('panchang')}
                onNavigateToBlog={() => setViewMode('blog')}
                onNavigateToShorts={() => setViewMode('shorts')}
                onNavigateToLogin={() => setViewMode('login')}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Footer Section: Privacy Policy & Terms of Use */}
      {viewMode !== 'shorts' && viewMode !== 'admin' && <Footer />}

      {/* Fixed Native Mobile App Bottom Navigation Bar (Shown on public screens) */}
      {viewMode !== 'shorts' && viewMode !== 'admin' && (
        <BottomNav
          currentView={viewMode}
          activePujari={activePujari}
          onNavigateHome={() => {
            setViewMode('home');
          }}
          onNavigateBookings={() => {
            if (activePujari) {
              setViewMode('portal');
            } else {
              setViewMode('temple');
            }
          }}
          onNavigateTemples={() => setViewMode('temple')}
          onNavigateProfile={() => {
            if (activePujari) {
              setViewMode('portal');
            } else {
              setViewMode('login');
            }
          }}
        />
      )}

      {/* SiteLock Overlay */}
      <Suspense fallback={null}>
        <SiteLockOverlay
          isLocked={isSiteLocked}
          isAdmin={viewMode === 'admin' && isAdminAuthenticated}
          onOpenAdminModal={() => {
            setViewMode('admin');
          }}
          onUnlockAndNavigateToAdmin={() => {
            setIsAdminAuthenticated(true);
            try {
              sessionStorage.setItem('puja_app_admin_auth', 'true');
            } catch {
              // Safe skip
            }
            setViewMode('admin');
            setIsSiteLocked(false);
          }}
        />
      </Suspense>
    </div>
  );
}
