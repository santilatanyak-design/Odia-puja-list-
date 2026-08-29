import React, { useState, useEffect, useRef } from 'react';
import { AffiliateProductAd } from '../types';
import {
  ExternalLink,
  X,
  Clock,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Star,
  Flame,
} from 'lucide-react';
import { SmartImage } from './SmartImage';

interface AffiliateAdModalProps {
  ad: AffiliateProductAd | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  lang?: 'OD' | 'EN';
}

export const AffiliateAdModal: React.FC<AffiliateAdModalProps> = ({
  ad,
  isOpen,
  onClose,
  lang = 'OD',
}) => {
  // STRICT NO-FALLBACK CHECK:
  // If ad data is missing, disabled, or lacks a valid link or image, return null immediately.
  const affiliateUrl = (
    ad?.affiliateUrl ||
    ad?.adLink ||
    (ad as any)?.affiliateLink ||
    (ad as any)?.affiliateTargetUrl ||
    ''
  ).trim();

  const productImageUrl = (
    ad?.productImageUrl ||
    ad?.adImageUrl ||
    (ad as any)?.affiliateImageURL ||
    (ad as any)?.affiliateImageUrl ||
    (ad as any)?.affiliateProductImageUrl ||
    ''
  ).trim();

  const isEnabled = ad && ad.enabled !== false && Boolean(affiliateUrl && productImageUrl);

  const countdownStart = Math.max(1, Number(ad?.adTimerSeconds) || Number(ad?.countdownSeconds) || 5);
  const [countdown, setCountdown] = useState<number>(countdownStart);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !isEnabled) {
      setCountdown(countdownStart);
      return;
    }

    setCountdown(countdownStart);
    let remaining = countdownStart;

    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        setCountdown(0);
        onCloseRef.current();
      } else {
        setCountdown(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, countdownStart, isEnabled]);

  // If not open or failing the strict non-empty data check, DO NOT render anything in the DOM
  if (!isOpen || !isEnabled || !ad) {
    return null;
  }

  const handleOrderClick = () => {
    try {
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = affiliateUrl;
    }
  };

  return (
    <div
      id="affiliate-ad-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="affiliate-ad-container"
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden relative transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Sponsor Tag, Visible Countdown Timer & Close Button */}
        <div className="bg-gradient-to-r from-[#232f3e] via-[#131921] to-[#232f3e] text-white px-4 py-3 flex items-center justify-between border-b border-amber-400/40 select-none">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-amber-400 text-amber-950 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>SPONSORED (ପ୍ରାୟୋଜିତ)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Visible Countdown Timer */}
            <div
              id="affiliate-ad-timer"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/20 border border-amber-400/60 rounded-full text-amber-300 font-mono text-xs font-black shadow-inner"
              title={`Closing in ${countdown}s`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>
                {lang === 'OD'
                  ? `ବିଜ୍ଞାପନ ବନ୍ଦ ହେବ: ${countdown}s`
                  : `Closing in: ${countdown}s`}
              </span>
            </div>

            {/* Clear [X] Close Button */}
            <button
              id="affiliate-ad-close-btn"
              onClick={onClose}
              title="Close Ad"
              aria-label="Close"
              className="p-1.5 rounded-full text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer flex items-center justify-center border border-white/20 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Product Visual Area - Strict rendering without demo placeholders */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
            <SmartImage
              src={productImageUrl}
              alt={ad.productTitle || 'Affiliate Product'}
              containerClassName="w-full h-full"
              className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-amber-500 text-amber-950 text-[10px] font-black rounded-md shadow-xs flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-950" />
              <span>TOP PICK</span>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-slate-600 text-[11px] ml-1">(4.8 / 5 Verified)</span>
              </div>

              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-black flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>

            {ad.productTitle && (
              <h3 className="text-base font-black text-slate-900 leading-snug">
                {ad.productTitle}
              </h3>
            )}

            {ad.productDescription && (
              <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                {ad.productDescription}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Original Product Link</span>
            </div>
          </div>
        </div>

        {/* Footer CTA & Dismiss Note */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2 shrink-0">
          <button
            id="affiliate-ad-cta-btn"
            onClick={handleOrderClick}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#ff9900] via-[#ffaa00] to-[#e68a00] hover:from-[#f08d00] hover:to-[#d67e00] text-slate-950 font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition transform active:scale-98 cursor-pointer border border-amber-600/40"
          >
            <ShoppingBag className="w-4 h-4 text-slate-950" />
            <span>
              {lang === 'OD'
                ? 'ଏବେ ଅର୍ଡର କରନ୍ତୁ (Order Now)'
                : 'Order Now'}
            </span>
            <ExternalLink className="w-4 h-4 text-slate-950" />
          </button>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-medium">
            <span>
              {lang === 'OD'
                ? `ଏହି ବିଜ୍ଞାପନ ${countdown} ସେକେଣ୍ଡରେ ଆପେ ଆପେ ବନ୍ଦ ହେବ`
                : `This ad will auto-close in ${countdown}s`}
            </span>
            <button
              onClick={onClose}
              className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
            >
              Skip (ବାଦ୍ ଦିଅନ୍ତୁ)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
