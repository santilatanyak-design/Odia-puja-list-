import React, { useState, useEffect } from 'react';
import { Pujari, HomeSliderConfig, SliderImage } from '../types';
import { subscribeHomeSliderConfig, DEFAULT_HOME_SLIDER_CONFIG } from '../lib/api';
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  Calendar,
  BookOpen,
  Video,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import {
  TempleAppLogo,
  OdishaTempleBackdrop,
  FindTemplesIllustration,
  BookPujaIllustration,
  PujaSamagriIllustration,
  LiveDarshanIllustration,
  PujaStatusIllustration,
  DevotionalOmIllustration
} from './AppIcons';
import { ExploreDistrictSection } from './ExploreDistrictSection';

interface HomePageProps {
  activePujari: Pujari | null;
  onNavigateToCreateList: () => void;
  onNavigateToStore: () => void;
  onNavigateToTemple?: () => void;
  onNavigateToPanchang?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToShorts?: () => void;
  onNavigateToLogin: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  activePujari,
  onNavigateToCreateList,
  onNavigateToStore,
  onNavigateToTemple,
  onNavigateToPanchang,
  onNavigateToBlog,
  onNavigateToShorts,
  onNavigateToLogin,
}) => {
  const [devotionalModalOpen, setDevotionalModalOpen] = useState(false);
  const [sliderConfig, setSliderConfig] = useState<HomeSliderConfig>(DEFAULT_HOME_SLIDER_CONFIG);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
        setIsAppInstalled(true);
      }
      if ((window as any).__PWA_INSTALL_PROMPT__) {
        setPwaPrompt((window as any).__PWA_INSTALL_PROMPT__);
      }
    }

    const handlePrompt = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
      if (typeof window !== 'undefined') {
        (window as any).__PWA_INSTALL_PROMPT__ = e;
      }
    };

    const handleInstalled = () => {
      setIsAppInstalled(true);
      setPwaPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallPublicApp = async () => {
    if (typeof document !== 'undefined') {
      const dynamicManifest = document.getElementById('dynamic-pwa-manifest') as HTMLLinkElement;
      if (dynamicManifest) {
        dynamicManifest.href = '/manifest.json';
      }
    }
    const prompt = pwaPrompt || (typeof window !== 'undefined' ? (window as any).__PWA_INSTALL_PROMPT__ : null);
    if (prompt) {
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          setIsAppInstalled(true);
          setPwaPrompt(null);
          if (typeof window !== 'undefined') {
            (window as any).__PWA_INSTALL_PROMPT__ = null;
          }
        }
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
    } else {
      alert('ମୋବାଇଲ୍ ବ୍ରାଉଜର୍ (Chrome) ମେନୁ (⋮) ଖୋଲନ୍ତୁ ଏବଂ "Install App" କିମ୍ବା "Add to Home screen" ଉପରେ କ୍ଲିକ୍ କରନ୍ତୁ।');
    }
  };

  // Subscribe to real-time Home Slider config from Firebase
  useEffect(() => {
    const unsub = subscribeHomeSliderConfig((config) => {
      setSliderConfig(config);
    });
    return () => unsub();
  }, []);

  const validSlides = (sliderConfig.images || []).filter(
    (slide) => slide && typeof slide.url === 'string' && slide.url.trim().length > 0
  );
  const hasCustomSlides = validSlides.length > 0;
  const intervalSeconds = sliderConfig.autoSlideIntervalSeconds || 5;

  // Auto-slide effect every 5 seconds (only when real custom slides exist)
  useEffect(() => {
    if (validSlides.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % validSlides.length);
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [validSlides.length, intervalSeconds, isHovered]);

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + validSlides.length) % validSlides.length);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % validSlides.length);
  };

  const handleDevotionalClick = () => {
    setDevotionalModalOpen(true);
  };

  return (
    <div className="w-full max-w-lg md:max-w-3xl mx-auto px-3 sm:px-6 pt-2 pb-2 space-y-4 sm:space-y-6 box-border select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BANNER: CONDITIONAL RENDERING (SLIDER OR STATIC BANNER) */}
      {/* ------------------------------------------------------------- */}
      {hasCustomSlides ? (
        /* Real Custom Auto Slider - Clean banner image only, no text overlays */
        <div
          id="home-auto-sliding-banner"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative w-full rounded-3xl overflow-hidden shadow-md border border-amber-300/80 bg-slate-900 select-none group"
        >
          {/* Base Flow Image to automatically establish the container's exact natural aspect ratio */}
          <img
            src={validSlides[currentSlide]?.url || validSlides[0]?.url}
            alt="Banner Flow"
            className="w-full h-auto block opacity-0 pointer-events-none select-none invisible"
            aria-hidden="true"
          />

          {/* Slide Background Images with smooth fade filling the full dynamic container */}
          {validSlides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.url}
                alt={slide.title || `Banner Slide ${idx + 1}`}
                className="w-full h-full object-fill"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = '0.3';
                }}
              />
            </div>
          ))}

          {/* Dots Indicator (Subtle bottom-center positioning) */}
          {validSlides.length > 1 && (
            <div className="absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-xs rounded-full border border-white/10 pointer-events-auto">
                {validSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(idx);
                    }}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      idx === currentSlide
                        ? 'w-6 h-1.5 bg-amber-400 shadow-xs'
                        : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Left & Right Navigation Buttons (Hover/Touch) */}
          {validSlides.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevSlide}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs border border-white/20 transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-sm"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs border border-white/20 transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-sm"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      ) : (
        /* Original Default Static TV Banner (When Firebase is empty) */
        <div className="relative bg-gradient-to-b from-[#FFFDF5] via-[#FFF8E7] to-[#FFF4D6] rounded-3xl p-4 sm:p-6 shadow-sm border border-amber-200/70 overflow-hidden">
          {/* Scenic Odisha Temple Silhouette Panorama Background */}
          <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none">
            <OdishaTempleBackdrop className="w-full h-full" />
          </div>

          {/* Header Content on Top of Backdrop */}
          <div className="relative z-10 flex items-center gap-3.5 sm:gap-5">
            {/* Circular Temple Brand Logo */}
            <TempleAppLogo size={78} className="shrink-0 shadow-md ring-4 ring-amber-300/40" />

            {/* Title & Tagline */}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-black text-[#8B0000] tracking-tight leading-tight font-serif drop-shadow-2xs">
                Bhakti Ananda <br className="hidden xs:inline sm:hidden" />
                <span>Odia TV</span>
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight mt-0.5 sm:mt-1">
                Your Devotion, Our Service
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-400/30 border border-amber-500/40 text-amber-950 font-black rounded-full text-[10px] sm:text-xs">
                  <span>🚩 ଜୟ ଜଗନ୍ନାଥ</span>
                  <span>•</span>
                  <span>ଶ୍ରୀକ୍ଷେତ୍ର ପୁରୀ</span>
                </span>
              </div>
            </div>
          </div>

          {/* Active Pujari Logged-in Notice (If authenticated) */}
          {activePujari && (
            <div className="relative z-10 mt-3 pt-2.5 border-t border-amber-300/50 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-950">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>ସ୍ୱାଗତମ୍: {activePujari.name} ({activePujari.id})</span>
              </span>
              <button
                onClick={onNavigateToCreateList}
                className="text-[11px] font-black text-[#8B0000] underline underline-offset-2 hover:text-amber-900 cursor-pointer"
              >
                ଡାସବୋର୍ଡକୁ ଯାଆନ୍ତୁ →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Pujari Notice (When logged in and slider is active) */}
      {activePujari && hasCustomSlides && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl px-4 py-2 flex items-center justify-between shadow-2xs">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-950">
            <UserCheck className="w-4 h-4 text-emerald-700" />
            <span>ସ୍ୱାଗତମ୍: {activePujari.name} ({activePujari.id})</span>
          </span>
          <button
            onClick={onNavigateToCreateList}
            className="text-[11px] font-black text-[#8B0000] underline underline-offset-2 hover:text-amber-900 cursor-pointer"
          >
            ଡାସବୋର୍ଡକୁ ଯାଆନ୍ତୁ →
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. NATIVE 6 FEATURE APP CARDS (Matching Reference Screenshot) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {/* Card 1: Find Temples */}
        <button
          id="native-card-find-temples"
          type="button"
          onClick={onNavigateToTemple}
          className="bg-white hover:bg-amber-50/50 active:scale-95 transition-all duration-150 rounded-2xl p-2.5 sm:p-4 shadow-sm hover:shadow-md border border-amber-200/80 flex flex-col items-center justify-between text-center min-h-[115px] sm:min-h-[140px] cursor-pointer group"
        >
          <div className="flex-1 flex items-center justify-center p-1 group-hover:scale-108 transition-transform">
            <FindTemplesIllustration className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <div className="mt-1">
            <span className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight block">
              Find Temples
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-900/80 block mt-0.5">
              ମନ୍ଦିର ଖୋଜନ୍ତୁ
            </span>
          </div>
        </button>

        {/* Card 2: Book Puja */}
        <button
          id="native-card-book-puja"
          type="button"
          onClick={onNavigateToTemple}
          className="bg-white hover:bg-amber-50/50 active:scale-95 transition-all duration-150 rounded-2xl p-2.5 sm:p-4 shadow-sm hover:shadow-md border border-amber-200/80 flex flex-col items-center justify-between text-center min-h-[115px] sm:min-h-[140px] cursor-pointer group"
        >
          <div className="flex-1 flex items-center justify-center p-1 group-hover:scale-108 transition-transform">
            <BookPujaIllustration className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <div className="mt-1">
            <span className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight block">
              Book Puja
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-900/80 block mt-0.5">
              ପୂଜା ବୁକିଂ
            </span>
          </div>
        </button>

        {/* Card 3: Puja Samagri Store */}
        <button
          id="native-card-puja-samagri"
          type="button"
          onClick={onNavigateToStore}
          className="bg-white hover:bg-amber-50/50 active:scale-95 transition-all duration-150 rounded-2xl p-2.5 sm:p-4 shadow-sm hover:shadow-md border border-amber-200/80 flex flex-col items-center justify-between text-center min-h-[115px] sm:min-h-[140px] cursor-pointer group"
        >
          <div className="flex-1 flex items-center justify-center p-1 group-hover:scale-108 transition-transform">
            <PujaSamagriIllustration className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <div className="mt-1">
            <span className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight block">
              Puja Samagri
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-900/80 block mt-0.5">
              ପୂଜା ସାମଗ୍ରୀ
            </span>
          </div>
        </button>

        {/* Card 4: Live Darshan / Shorts */}
        <button
          id="native-card-live-darshan"
          type="button"
          onClick={onNavigateToShorts}
          className="bg-white hover:bg-amber-50/50 active:scale-95 transition-all duration-150 rounded-2xl p-2.5 sm:p-4 shadow-sm hover:shadow-md border border-amber-200/80 flex flex-col items-center justify-between text-center min-h-[115px] sm:min-h-[140px] cursor-pointer group"
        >
          <div className="flex-1 flex items-center justify-center p-1 group-hover:scale-108 transition-transform">
            <LiveDarshanIllustration className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <div className="mt-1">
            <span className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight block">
              Live Darshan
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-rose-700 block mt-0.5">
              ଲାଇଭ୍ ଭିଡିଓ
            </span>
          </div>
        </button>

        {/* Card 5: Puja Status & List Generator */}
        <button
          id="native-card-puja-status"
          type="button"
          onClick={onNavigateToCreateList}
          className="bg-white hover:bg-amber-50/50 active:scale-95 transition-all duration-150 rounded-2xl p-2.5 sm:p-4 shadow-sm hover:shadow-md border border-amber-200/80 flex flex-col items-center justify-between text-center min-h-[115px] sm:min-h-[140px] cursor-pointer group"
        >
          <div className="flex-1 flex items-center justify-center p-1 group-hover:scale-108 transition-transform">
            <PujaStatusIllustration className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <div className="mt-1">
            <span className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight block">
              Puja Status
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 block mt-0.5">
              ପୂଜା ସୂଚୀ ତିଆରି
            </span>
          </div>
        </button>

        {/* Card 6: Devotional Content (Panchang & Stories) */}
        <button
          id="native-card-devotional-content"
          type="button"
          onClick={handleDevotionalClick}
          className="bg-white hover:bg-amber-50/50 active:scale-95 transition-all duration-150 rounded-2xl p-2.5 sm:p-4 shadow-sm hover:shadow-md border border-amber-200/80 flex flex-col items-center justify-between text-center min-h-[115px] sm:min-h-[140px] cursor-pointer group"
        >
          <div className="flex-1 flex items-center justify-center p-1 group-hover:scale-108 transition-transform">
            <DevotionalOmIllustration className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <div className="mt-1">
            <span className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight block">
              Devotional
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-900/80 block mt-0.5">
              ପଞ୍ଜିକା ଓ କଥା
            </span>
          </div>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. QUICK SPIRITUAL ACCESS PILLS (Daily Panchang & Vedic Blog)  */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-[#701a1e] via-[#8B0000] to-[#701a1e] text-white rounded-2xl p-3 sm:p-4 shadow-md border border-amber-400/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-left w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-xl shrink-0">
            📅
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-amber-200">
              ଦୈନିକ ଓଡ଼ିଆ ପଞ୍ଜିକା ଓ ଆଧ୍ୟାତ୍ମିକ କଥା
            </div>
            <div className="text-[10px] sm:text-xs text-amber-100/90 font-medium">
              ଆଜିର ତିଥି, ଶୁଭ ବେଳା, ରାହୁକାଳ ଏବଂ ପୌରାଣିକ ଗାଥା
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onNavigateToPanchang}
            className="flex-1 sm:flex-initial px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>ପଞ୍ଜିକା</span>
          </button>
          <button
            onClick={onNavigateToBlog}
            className="flex-1 sm:flex-initial px-3 py-1.5 bg-amber-100/20 hover:bg-amber-100/30 text-amber-200 hover:text-white font-black rounded-xl text-xs border border-amber-400/50 shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>କଥା ଓ ବ୍ଲଗ୍</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. PUBLIC PWA MOBILE APP DOWNLOAD BANNER                     */}
      {/* ------------------------------------------------------------- */}
      {!isAppInstalled && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 border-2 border-amber-600/40 rounded-2xl p-3.5 sm:p-4 text-slate-950 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-left w-full sm:w-auto">
            <div className="p-2.5 bg-slate-950 text-amber-400 rounded-xl shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5">
                <span>ମୋବାଇଲ୍ ଆପ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ (Download App)</span>
                <span className="px-1.5 py-0.5 bg-slate-950 text-amber-300 text-[9px] font-black rounded-md">PWA</span>
              </div>
              <div className="text-[10px] sm:text-xs text-slate-900 font-bold mt-0.5">
                ଦୈନିକ ପଞ୍ଜିକା, ପୂଜା ବୁକିଂ ଓ ଓଡ଼ିଶା ଦର୍ଶନ ପାଇଁ ଆପ୍ ଇନଷ୍ଟଲ୍ କରନ୍ତୁ।
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallPublicApp}
            className="w-full sm:w-auto px-4 py-2 bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-amber-200 font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Install App (ଡାଉନଲୋଡ୍)</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. PUJARI LOGIN / ACCOUNT ACCESS BANNER                       */}
      {/* ------------------------------------------------------------- */}
      <div id="home-pujari-portal-banner">
        {!activePujari ? (
          <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-3.5 sm:p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-amber-950 font-black text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0" />
              <span>ପୂଜାରୀ / ପଣ୍ଡିତ ପୋର୍ଟାଲ୍ (Pujari & Pandit Portal)</span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-900/90 font-medium">
              ଓଡ଼ିଶାର ସମସ୍ତ ପୂଜକଙ୍କ ପାଇଁ ଶୁଦ୍ଧ ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ ତିଆରି ଏବଂ Odia PDF ଡାଉନଲୋଡ୍ ସେବା।
            </p>
            <button
              onClick={onNavigateToLogin}
              type="button"
              className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-[#701a1e] to-[#8B0000] hover:from-[#8B0000] hover:to-[#a00000] text-amber-200 hover:text-white font-extrabold rounded-xl text-xs shadow-sm transition cursor-pointer border border-amber-400/40"
            >
              🔑 ପୂଜାରୀ ଲଗଇନ୍ / ରେଜିଷ୍ଟ୍ରେସନ୍ (Login)
            </button>
          </div>
        ) : (
          <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-3.5 sm:p-4 text-center space-y-2">
            <div className="text-xs sm:text-sm font-black text-amber-950 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>ଆପଣ ଲଗଇନ୍ ଅଛନ୍ତି: {activePujari.name}</span>
            </div>
            <button
              onClick={onNavigateToCreateList}
              type="button"
              className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-[#701a1e] to-[#8B0000] text-amber-200 hover:text-white font-extrabold rounded-xl text-xs shadow-sm transition cursor-pointer border border-amber-400/40"
            >
              🙏 ପୂଜାରୀ ଡାସବୋର୍ଡ (Pujari Dashboard) କୁ ଯାଆନ୍ତୁ
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. EXPLORE ODISHA BY DISTRICT (30 DISTRICTS)                   */}
      {/* ------------------------------------------------------------- */}
      <ExploreDistrictSection onNavigateToTemples={onNavigateToTemple} />

      {/* ------------------------------------------------------------- */}
      {/* DEVOTIONAL CONTENT SELECTION MODAL                            */}
      {/* ------------------------------------------------------------- */}
      {devotionalModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-amber-400 relative space-y-4">
            <button
              onClick={() => setDevotionalModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-black shadow-inner">
                🕉️
              </div>
              <h3 className="text-base font-black text-amber-950">
                ଆଧ୍ୟାତ୍ମିକ ବିଭାଗ (Devotional Content)
              </h3>
              <p className="text-xs text-amber-900/80 font-medium">
                ଆପଣ କେଉଁ ବିଭାଗକୁ ଯିବାକୁ ଚାହାନ୍ତି ବାଛନ୍ତୁ:
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {/* Option 1: Daily Panchang */}
              <button
                onClick={() => {
                  setDevotionalModalOpen(false);
                  if (onNavigateToPanchang) onNavigateToPanchang();
                }}
                className="w-full p-3 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border border-amber-300 rounded-2xl flex items-center gap-3 text-left transition cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                  📅
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-amber-950">
                    ଦୈନିକ ଓଡ଼ିଆ ପଞ୍ଜିକା (Daily Panchang)
                  </div>
                  <div className="text-[10px] text-amber-900/80 font-medium truncate">
                    ଆଜିର ତିଥି, ଶୁଭ ମୁହୂର୍ତ୍ତ, ରାହୁକାଳ
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-800 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Option 2: Spiritual Stories & Blog */}
              <button
                onClick={() => {
                  setDevotionalModalOpen(false);
                  if (onNavigateToBlog) onNavigateToBlog();
                }}
                className="w-full p-3 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border border-amber-300 rounded-2xl flex items-center gap-3 text-left transition cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                  📖
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-amber-950">
                    ଆଧ୍ୟାତ୍ମିକ କଥା ଓ ବ୍ଲଗ୍ (Vedic Stories)
                  </div>
                  <div className="text-[10px] text-amber-900/80 font-medium truncate">
                    ପ୍ରଭୁ ଶ୍ରୀ ଜଗନ୍ନାଥଙ୍କ ଲୀଳା ଓ ଭକ୍ତ ଚରିତାମୃତ
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-800 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Option 3: Temple Shorts & Reels */}
              <button
                onClick={() => {
                  setDevotionalModalOpen(false);
                  if (onNavigateToShorts) onNavigateToShorts();
                }}
                className="w-full p-3 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border border-amber-300 rounded-2xl flex items-center gap-3 text-left transition cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                  🎬
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-amber-950">
                    ମନ୍ଦିର ପୂଜା ଭିଡିଓ (Live Shorts & Reels)
                  </div>
                  <div className="text-[10px] text-amber-900/80 font-medium truncate">
                    ଦିବ୍ୟ ଆରତି ଓ ପୂଜାର ଭର୍ଟିକାଲ୍ Shorts
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-800 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
