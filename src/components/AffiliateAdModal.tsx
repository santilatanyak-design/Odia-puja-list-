import React, { useState, useEffect } from 'react';
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
  ad: AffiliateProductAd;
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
  const countdownStart = Number(ad.countdownSeconds) > 0 ? Number(ad.countdownSeconds) : 5;
  const [countdown, setCountdown] = useState<number>(countdownStart);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(countdownStart);
      return;
    }

    setCountdown(countdownStart);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose(); // Auto-dismiss when countdown reaches 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, countdownStart, onClose]);

  if (!isOpen || !ad.enabled) return null;

  const targetUrl = ad.affiliateUrl || 'https://www.amazon.in';

  const handleOrderClick = () => {
    try {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = targetUrl;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden relative transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Sponsor Tag & Countdown Timer */}
        <div className="bg-gradient-to-r from-[#232f3e] via-[#131921] to-[#232f3e] text-white px-4 py-3 flex items-center justify-between border-b border-amber-400/40">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-amber-400 text-amber-950 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>SPONSORED (ପ୍ରାୟୋଜିତ)</span>
            </span>
            <span className="text-[11px] text-amber-300 font-bold hidden sm:inline">
              Amazon Special Offer
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Countdown Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-400/50 rounded-full text-amber-300 font-mono text-xs font-black">
              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>{countdown}s</span>
            </div>

            {/* Manual Close Button */}
            <button
              onClick={onClose}
              title="Close Ad"
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Product Visual Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {ad.productImageUrl ? (
            <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
              <SmartImage
                src={ad.productImageUrl}
                alt={ad.productTitle || 'Affiliate Product'}
                containerClassName="w-full h-full"
                className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-amber-500 text-amber-950 text-[10px] font-black rounded-md shadow-xs flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-950" />
                <span>TOP PICK</span>
              </div>
            </div>
          ) : (
            <div className="h-32 w-full rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 flex items-center justify-center text-amber-800 text-xs font-bold">
              <ShoppingBag className="w-6 h-6 mr-2 text-amber-600" />
              <span>Amazon Spiritual & Puja Collection</span>
            </div>
          )}

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

            <h3 className="text-base font-black text-slate-900 leading-snug">
              {ad.productTitle || 'ପବିତ୍ର ପୂଜା ସାମଗ୍ରୀ ଓ ଧାର୍ମିକ ପୁସ୍ତକ'}
            </h3>

            {ad.productDescription && (
              <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                {ad.productDescription}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Original & Fast Amazon Delivery Available</span>
            </div>
          </div>
        </div>

        {/* Footer CTA & Auto-Dismiss Note */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2 shrink-0">
          <button
            onClick={handleOrderClick}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#ff9900] via-[#ffaa00] to-[#e68a00] hover:from-[#f08d00] hover:to-[#d67e00] text-slate-950 font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition transform active:scale-98 cursor-pointer border border-amber-600/40"
          >
            <ShoppingBag className="w-4 h-4 text-slate-950" />
            <span>
              {lang === 'OD'
                ? 'ଏବେ ଅର୍ଡର କରନ୍ତୁ (Order Now on Amazon)'
                : 'Order Now on Amazon'}
            </span>
            <ExternalLink className="w-4 h-4 text-slate-950" />
          </button>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-medium">
            <span>ଏହି ବିଜ୍ଞାପନ {countdown} ସେକେଣ୍ଡରେ ଆପେ ଆପେ ବନ୍ଦ ହୋଇଯିବ</span>
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
