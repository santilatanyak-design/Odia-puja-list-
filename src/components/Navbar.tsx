import React, { useEffect, useState } from 'react';
import { Pujari } from '../types';
import { ShieldCheck, User, LogOut, Sparkles, Languages, Download, CheckCircle2, Share2 } from 'lucide-react';
import { Language, translations } from '../lib/translations';
import { TempleAppLogo } from './AppIcons';
import { triggerPwaInstall } from '../utils/pwaHelper';
import { PwaInstallModal } from './PwaInstallModal';

export const getGlobalMainThumbnailUrl = (): string => {
  try {
    const globalThumb = (localStorage.getItem('globalThumbnail') || localStorage.getItem('main_app_thumbnail_url') || '').trim();
    if (globalThumb) return globalThumb;
  } catch (e) {
    console.warn('Error reading globalThumbnail from localStorage:', e);
  }
  return ''; // Strict No-Default: returns empty string if no Admin thumbnail is configured
};

export const syncGlobalOpenGraphMetaTags = () => {
  if (typeof document === 'undefined') return;

  const homepageUrl = `${window.location.origin}${window.location.pathname}`;
  const title = '🙏 ଶ୍ରୀ ମନ୍ଦିର ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ - Online Temple Booking';
  const description = 'ଆପଣଙ୍କ ନିକଟସ୍ଥ ମନ୍ଦିରରେ ପୂଜା ଏବଂ ଦର୍ଶନ ବୁକିଂ କରିବା ପାଇଁ ଏଠାରେ କ୍ଲିକ୍ କରନ୍ତୁ।';
  const mainImage = getGlobalMainThumbnailUrl();

  const updateOrSetMeta = (attrName: string, attrValue: string, contentValue: string) => {
    let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', contentValue);
  };

  const removeMeta = (attrName: string, attrValue: string) => {
    const el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (el) el.remove();
  };

  updateOrSetMeta('property', 'og:type', 'website');
  updateOrSetMeta('property', 'og:url', homepageUrl);
  updateOrSetMeta('property', 'og:title', title);
  updateOrSetMeta('property', 'og:description', description);
  updateOrSetMeta('name', 'twitter:title', title);
  updateOrSetMeta('name', 'twitter:description', description);

  if (mainImage) {
    updateOrSetMeta('property', 'og:image', mainImage);
    updateOrSetMeta('property', 'og:image:width', '1200');
    updateOrSetMeta('property', 'og:image:height', '630');
    updateOrSetMeta('name', 'twitter:card', 'summary_large_image');
    updateOrSetMeta('name', 'twitter:image', mainImage);
  } else {
    updateOrSetMeta('property', 'og:image', '');
    removeMeta('property', 'og:image:width');
    removeMeta('property', 'og:image:height');
    removeMeta('name', 'twitter:image');
    updateOrSetMeta('name', 'twitter:card', 'summary');
  }
};

export const handleHeaderAppShare = async () => {
  const homepageUrl = `${window.location.origin}${window.location.pathname}`;

  const shareTitle = '🙏 ଶ୍ରୀ ମନ୍ଦିର ଅନଲାଇନ୍ ପୂଜା ଏବଂ ଜଳାଭିଷେକ ବୁକିଂ ପୋର୍ଟାଲ୍';
  const shareText = '🙏 ଶ୍ରୀ ମନ୍ଦିର ଅନଲାଇନ୍ ପୂଜା ଏବଂ ଜଳାଭିଷେକ ବୁକିଂ ପୋର୍ଟାଲ୍। ଘରେ ବସି ବୁକିଂ କରିବା ପାଇଁ ଏଠାରେ କ୍ଲିକ୍ କରନ୍ତୁ 👇';

  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: homepageUrl,
      });
      return;
    } catch (err) {
      console.log('Native share dismissed:', err);
    }
  }

  const fullMsg = `${shareText}\n${homepageUrl}`;
  try {
    await navigator.clipboard.writeText(fullMsg);
    alert('ଲିଙ୍କ୍ କପି ହୋଇଗଲା! (Homepage link copied to clipboard)');
  } catch (clipErr) {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullMsg)}`, '_blank');
  }
};

interface NavbarProps {
  currentRole?: 'pujari' | 'admin';
  currentView?: string;
  isAdminAuthenticated?: boolean;
  activePujari: Pujari | null;
  lang: Language;
  onToggleLang: () => void;
  onSwitchRole?: (role: 'pujari' | 'admin') => void;
  onLogoutPujari: () => void;
  onLogoutAdmin?: () => void;
  onOpenAdminModal?: () => void;
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView = 'home',
  isAdminAuthenticated = false,
  activePujari,
  lang,
  onToggleLang,
  onLogoutPujari,
  onLogoutAdmin,
  onGoHome,
}) => {
  const t = translations[lang];

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  useEffect(() => {
    // Synchronize global Open Graph meta tags on initial page mount
    syncGlobalOpenGraphMetaTags();

    // Check if running in standalone PWA mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    if ((window as any).__PWA_INSTALL_PROMPT__) {
      setDeferredPrompt((window as any).__PWA_INSTALL_PROMPT__);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent standard browser infobar
      e.preventDefault();
      // Store event for 1-click install trigger
      setDeferredPrompt(e);
      if (typeof window !== 'undefined') {
        (window as any).__PWA_INSTALL_PROMPT__ = e;
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    await triggerPwaInstall(
      deferredPrompt,
      () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      },
      () => {
        setShowInstallModal(true);
      }
    );
  };

  const isAdminView = currentView === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#701a1e] via-[#8B0000] to-[#701a1e] text-white border-b-2 border-amber-400 shadow-lg w-full max-w-full overflow-hidden box-border">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-2.5 w-full box-border">
        {/* Logo & Sacred Branding */}
        <div onClick={onGoHome} className="flex items-center gap-2 sm:gap-2.5 cursor-pointer min-w-0 shrink">
          <TempleAppLogo size={38} className="shrink-0 shadow-sm" />
          <div className="min-w-0 shrink">
            <h1 className="text-xs sm:text-base font-black text-amber-100 leading-tight tracking-tight flex items-center gap-1 min-w-0">
              <span className="truncate">Bhakti Ananda Odia TV</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-amber-200/90 font-medium hidden sm:block truncate">
              Your Devotion, Our Service
            </p>
          </div>
        </div>

        {/* Right Section / Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Public PWA 1-Click App Install Button */}
          {!isAdminView && !isInstalled && (
            <button
              onClick={handleInstallClick}
              title={lang === 'OD' ? 'ମୋବାଇଲ୍‌ରେ ଆପ୍ ସଂସ୍ଥାପନ କରନ୍ତୁ' : 'Install App on Mobile'}
              className="px-2 sm:px-3.5 py-1.2 sm:py-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 font-black text-[11px] sm:text-xs rounded-xl border-2 border-amber-500 shadow-md flex items-center gap-1 cursor-pointer transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-amber-950 stroke-[2.5]" />
              <span className="hidden lg:inline">{t.downloadApp}</span>
              <span className="lg:hidden">{t.downloadAppShort}</span>
            </button>
          )}

          {/* Language Toggle Button */}
          <button
            onClick={onToggleLang}
            title={lang === 'OD' ? 'Switch to English' : 'ଓଡ଼ିଆ ଭାଷା ବାଛନ୍ତୁ'}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.2 sm:py-1.5 rounded-xl border-2 border-amber-400 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-black text-[11px] sm:text-xs transition cursor-pointer shadow-xs active:scale-95"
          >
            <Languages className="w-3.5 h-3.5 text-amber-300" />
            <span>{lang === 'OD' ? 'English' : 'ଓଡ଼ିଆ'}</span>
          </button>

          {/* Header Main App Share Button */}
          <button
            onClick={handleHeaderAppShare}
            title={lang === 'OD' ? 'ଆପ୍ ଶେୟାର୍ କରନ୍ତୁ' : 'Share App'}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.2 sm:py-1.5 rounded-xl border-2 border-amber-400 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-black text-[11px] sm:text-xs transition cursor-pointer shadow-xs active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden xs:inline">{lang === 'OD' ? 'ଶେୟାର୍' : 'Share'}</span>
          </button>

          {/* Active Logged-in Pujari Profile Pill */}
          {activePujari && !isAdminView && (
            <div className="flex items-center gap-1.5 bg-amber-950/70 border border-amber-400/40 px-2 sm:px-3 py-1 rounded-xl text-xs">
              <User className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="font-black text-amber-100 hidden sm:inline truncate max-w-[100px]">
                {activePujari.name}
              </span>
              <button
                onClick={onLogoutPujari}
                title="Pujari Logout"
                className="p-1 text-amber-300 hover:text-white rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Dedicated Admin Status / Exit Pill (ONLY visible when navigating /admin directly) */}
          {isAdminView && isAdminAuthenticated && (
            <div className="flex items-center gap-1.5 bg-black/60 border border-amber-400/60 px-2.5 py-1 rounded-xl text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-black text-amber-200 hidden sm:inline">Admin Mode</span>
              {onLogoutAdmin && (
                <button
                  onClick={onLogoutAdmin}
                  title="Logout Admin"
                  className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black rounded-lg text-[10px] sm:text-xs transition cursor-pointer"
                >
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PWA Install Guide Modal (replaces JS alerts with contextual UI) */}
      <PwaInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        lang={lang}
      />
    </header>
  );
};
