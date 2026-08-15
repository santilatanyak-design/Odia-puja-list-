import React, { useState, useEffect, useRef } from 'react';
import { TempleShort } from '../types';
import { getYouTubeEmbedUrl, subscribeTempleShorts } from '../lib/shortsApi';
import {
  X,
  ChevronUp,
  ChevronDown,
  Share2,
  Heart,
  Volume2,
  Sparkles,
  ArrowRight,
  Tv,
  Check,
  Compass,
} from 'lucide-react';
import { showCustomAlert } from '../lib/customAlert';

interface TempleShortsFeedProps {
  onClose: () => void;
  onNavigateToTemple?: (templeId?: string) => void;
}

export const TempleShortsFeed: React.FC<TempleShortsFeedProps> = ({
  onClose,
  onNavigateToTemple,
}) => {
  const [shorts, setShorts] = useState<TempleShort[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('temple_shorts_liked_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('temple_shorts_like_counts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [animatingReaction, setAnimatingReaction] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Subscribe to shorts data
  useEffect(() => {
    const unsub = subscribeTempleShorts((list) => {
      setShorts(list);
    });
    return () => unsub();
  }, []);

  // Keyboard navigation (Arrow keys, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, shorts.length]);

  const goToNext = () => {
    if (currentIndex < shorts.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const scrollToIndex = (index: number) => {
    if (index >= 0 && index < shorts.length) {
      setCurrentIndex(index);
      setShowDescription(false);
      const targetElement = slideRefs.current[index];
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // Handle scroll detection for manual touch/mouse scrolling
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    if (clientHeight === 0) return;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== currentIndex && index >= 0 && index < shorts.length) {
      setCurrentIndex(index);
      setShowDescription(false);
    }
  };

  // Toggle Like / Pranam
  const handleToggleLike = (shortId: string) => {
    const isLiked = !likedMap[shortId];
    const newLikedMap = { ...likedMap, [shortId]: isLiked };
    setLikedMap(newLikedMap);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('temple_shorts_liked_map', JSON.stringify(newLikedMap));
      }
    } catch (e) {}

    const currentCount = typeof likeCountMap[shortId] === 'number' ? likeCountMap[shortId] : 0;
    const newCount = isLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
    const newLikeCountMap = { ...likeCountMap, [shortId]: newCount };
    setLikeCountMap(newLikeCountMap);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('temple_shorts_like_counts', JSON.stringify(newLikeCountMap));
      }
    } catch (e) {}

    if (isLiked) {
      setAnimatingReaction(true);
      setTimeout(() => setAnimatingReaction(false), 900);
    }
  };

  // Share Short via Website Link (Never raw YouTube link)
  const handleShare = async (short: TempleShort, index: number) => {
    try {
      const websiteUrl = typeof window !== 'undefined' ? (window.location.origin || window.location.href || '') : '';
      const shareTitle = (short && short.title) ? short.title.trim() : 'ମନ୍ଦିର ପୂଜା ଓ ଦିବ୍ୟ ଦର୍ଶନ 🚩';
      const shareText = `🚩 ${shareTitle}\n🙏 ଦର୍ଶନ କରନ୍ତୁ ଏବଂ ସିଧାସଳଖ ପୂଜା ବୁକିଂ କରନ୍ତୁ! (Watch Darshan and book Puja directly!)`;

      // Check if Web Share API is available and callable
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          const shareData: ShareData = {
            title: shareTitle,
            text: shareText,
            url: websiteUrl,
          };
          if (typeof navigator.canShare === 'function') {
            if (navigator.canShare(shareData)) {
              await navigator.share(shareData);
              return;
            }
          } else {
            await navigator.share(shareData);
            return;
          }
        } catch (shareErr: any) {
          // If user actively cancelled/dismissed native share sheet, exit gracefully
          if (shareErr && (shareErr.name === 'AbortError' || shareErr.message?.includes('Abort'))) {
            return;
          }
        }
      }

      // Safe Clipboard Fallback
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(`${shareText}\n${websiteUrl}`);
          setCopiedIndex(index);
          setTimeout(() => setCopiedIndex(null), 2500);
        }
      } catch {
        // Silently skip clipboard permission issues
      }

      // Direct WhatsApp Share Link fallback
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${websiteUrl}`)}`;
      try {
        const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        if (!opened && typeof window !== 'undefined') {
          window.location.href = whatsappUrl;
        }
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = whatsappUrl;
        }
      }
    } catch (outerErr) {
      console.warn('Share operation encountered a safe error:', outerErr);
    }
  };

  const currentShort = shorts[currentIndex];
  const currentLikeCount = currentShort ? (likeCountMap[currentShort.id] ?? 0) : 0;
  const isCurrentLiked = currentShort ? !!likedMap[currentShort.id] : false;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex items-center justify-center overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 p-3 sm:p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg border border-amber-300">
            <Tv className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black tracking-wide text-amber-300 flex items-center gap-1.5 drop-shadow-md">
              <span>ମନ୍ଦିର ପୂଜା ଭିଡିଓ</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600/90 text-white font-bold uppercase tracking-wider">
                SHORTS
              </span>
            </h1>
            <p className="text-[10px] text-amber-200/80 font-semibold hidden sm:block">
              ଓଡ଼ିଶାର ପ୍ରସିଦ୍ଧ ଧାମ ଓ ମନ୍ଦିରର ଦିବ୍ୟ ଦର୍ଶନ ଓ ଆରତି
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {shorts.length > 0 && (
            <span className="text-xs font-mono font-black bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/40 text-amber-300">
              {currentIndex + 1} / {shorts.length}
            </span>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 hover:bg-rose-600/90 text-white backdrop-blur-md transition cursor-pointer border border-white/20 active:scale-95"
            title="Close Shorts Feed (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Reels / Shorts Container */}
      {shorts.length === 0 ? (
        <div className="text-center p-8 space-y-4 max-w-sm bg-slate-950/80 rounded-3xl border border-amber-500/30 backdrop-blur-md">
          <div className="text-5xl animate-bounce">🎬</div>
          <h2 className="text-lg font-black text-amber-300">
            No Puja Videos available yet
          </h2>
          <p className="text-xs text-amber-100/80 leading-relaxed font-medium">
            କୌଣସି ମନ୍ଦିର ପୂଜା ଭିଡିଓ ବର୍ତ୍ତମାନ ଉପଲବ୍ଧ ନାହିଁ। ଆଡମିନ୍ ପ୍ୟାନେଲରୁ ଭିଡିଓ ଯୋଡ଼ାଗଲେ ଏଠାରେ ଦେଖାଯିବ।
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-lg active:scale-95 transition"
          >
            ଫେରିଯାଆନ୍ତୁ (Go Back)
          </button>
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center p-0 sm:p-2">
          {/* Vertical Snapping Container with Strict 9:16 mobile aspect ratio */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="w-full h-full max-h-screen sm:max-h-[92vh] sm:max-w-[420px] aspect-[9/16] sm:rounded-3xl sm:border-2 sm:border-amber-500/40 bg-black overflow-y-scroll snap-y snap-mandatory scroll-smooth relative shadow-2xl no-scrollbar flex flex-col"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {shorts.map((short, idx) => {
              const embedUrl = getYouTubeEmbedUrl(short.youtubeUrl, idx === currentIndex);
              const isActive = idx === currentIndex;
              const isShortLiked = !!likedMap[short.id];
              const shortLikeCount = likeCountMap[short.id] ?? 0;

              return (
                <div
                  key={short.id || idx}
                  ref={(el) => {
                    slideRefs.current[idx] = el;
                  }}
                  className="w-full h-full min-h-full aspect-[9/16] shrink-0 snap-start snap-always relative bg-black flex items-center justify-center overflow-hidden"
                >
                  {/* YouTube Shorts Embed Frame with Native 9:16 Edge-to-Edge Scaling */}
                  {isActive || Math.abs(idx - currentIndex) <= 1 ? (
                    <div className="w-full h-full relative aspect-[9/16] overflow-hidden flex items-center justify-center bg-black">
                      <iframe
                        src={embedUrl}
                        title={short.title}
                        className="w-full h-full aspect-[9/16] border-0 absolute inset-0 pointer-events-auto"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="eager"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full aspect-[9/16] bg-slate-900 flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-amber-300 font-bold">ଭିଡିଓ ଲୋଡ୍ ହେଉଛି...</p>
                      </div>
                    </div>
                  )}

                  {/* Gradient Overlay for bottom details */}
                  <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none z-10" />

                  {/* Bottom Sacred Information Box */}
                  <div className="absolute bottom-4 left-3 right-16 z-20 space-y-2 pointer-events-auto text-left">
                    {short.templeName && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/90 text-amber-950 backdrop-blur-md rounded-full text-[11px] font-black shadow-md border border-amber-300">
                        <Sparkles className="w-3 h-3" />
                        <span className="truncate max-w-[200px] sm:max-w-[260px]">{short.templeName}</span>
                      </div>
                    )}

                    <h2 className="text-sm sm:text-base font-black text-white leading-snug drop-shadow-md line-clamp-2">
                      {short.title}
                    </h2>

                    {short.description && (
                      <div className="text-xs text-amber-100/90 drop-shadow">
                        {showDescription ? (
                          <p className="bg-black/70 p-2 rounded-xl backdrop-blur-md border border-white/10 text-[11px] leading-relaxed">
                            {short.description}
                          </p>
                        ) : (
                          <p className="line-clamp-1 text-[11px] opacity-90">{short.description}</p>
                        )}
                        <button
                          onClick={() => setShowDescription(!showDescription)}
                          className="text-[10px] font-bold text-amber-300 hover:underline mt-0.5 block cursor-pointer"
                        >
                          {showDescription ? 'କମ୍ ଦେଖନ୍ତୁ (Show Less)' : 'ଅଧିକ ବିବରଣୀ (More...)'}
                        </button>
                      </div>
                    )}

                    {/* Direct Booking CTA */}
                    {onNavigateToTemple && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToTemple(short.templeId);
                        }}
                        className="mt-1 px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer border border-amber-200"
                      >
                        <span>🚩 ପୂଜା / ଜଳାଭିଷେକ ବୁକ୍ କରନ୍ତୁ</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Right Floating Actions (Like, Share, Temple, Counter) */}
                  <div className="absolute right-3 bottom-14 z-20 flex flex-col items-center gap-4 pointer-events-auto">
                    {/* Pranam / Like Button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleToggleLike(short.id)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all active:scale-75 shadow-lg cursor-pointer ${
                          isShortLiked
                            ? 'bg-rose-600 text-white border-rose-400 scale-110 shadow-rose-600/50 ring-2 ring-rose-300'
                            : 'bg-black/60 hover:bg-black/80 text-white border-white/20'
                        }`}
                        title={isShortLiked ? "ପ୍ରଣାମ ହଟାନ୍ତୁ (Unlike)" : "ପ୍ରଣାମ କରନ୍ତୁ (Like)"}
                      >
                        <span className="text-xl">🙏</span>
                      </button>
                      <span className="text-[10px] font-extrabold text-amber-200 mt-1 drop-shadow">
                        {shortLikeCount}
                      </span>
                    </div>

                    {/* Share Button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleShare(short, idx)}
                        className="w-11 h-11 rounded-full bg-black/60 hover:bg-amber-600 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition active:scale-90 shadow-lg cursor-pointer"
                        title="Share this Short"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Share2 className="w-5 h-5 text-amber-300" />
                        )}
                      </button>
                      <span className="text-[10px] font-bold text-slate-300 mt-1">
                        {copiedIndex === idx ? 'କପିଡ୍' : 'ସେୟାର'}
                      </span>
                    </div>

                    {/* Temple Services Quick Link */}
                    {onNavigateToTemple && (
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => {
                            onClose();
                            onNavigateToTemple(short.templeId);
                          }}
                          className="w-11 h-11 rounded-full bg-black/60 hover:bg-amber-700 text-amber-300 border border-amber-400/40 flex items-center justify-center backdrop-blur-md transition active:scale-90 shadow-lg cursor-pointer"
                          title="ମନ୍ଦିର ତାଲିକା ଦେଖନ୍ତୁ"
                        >
                          <Compass className="w-5 h-5 text-amber-400" />
                        </button>
                        <span className="text-[9px] font-bold text-amber-200 mt-1">ମନ୍ଦିର</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Up / Down Float Navigation Arrows */}
          <div className="hidden sm:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-30">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="w-12 h-12 rounded-full bg-slate-900/90 hover:bg-amber-600 disabled:opacity-30 disabled:hover:bg-slate-900/90 text-white border border-amber-500/40 flex items-center justify-center shadow-xl transition cursor-pointer active:scale-90 backdrop-blur-md"
              title="Previous Short (Up Arrow)"
            >
              <ChevronUp className="w-6 h-6 text-amber-300" />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex === shorts.length - 1}
              className="w-12 h-12 rounded-full bg-slate-900/90 hover:bg-amber-600 disabled:opacity-30 disabled:hover:bg-slate-900/90 text-white border border-amber-500/40 flex items-center justify-center shadow-xl transition cursor-pointer active:scale-90 backdrop-blur-md"
              title="Next Short (Down Arrow)"
            >
              <ChevronDown className="w-6 h-6 text-amber-300" />
            </button>
          </div>

          {/* Animated Heart / Pranam Reaction Float */}
          {animatingReaction && (
            <div className="absolute pointer-events-none z-50 animate-ping text-6xl">
              🙏
            </div>
          )}
        </div>
      )}
    </div>
  );
};
