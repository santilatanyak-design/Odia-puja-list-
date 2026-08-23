import React, { useState, useEffect } from 'react';
import { X, ExternalLink, ShoppingBag, Sparkles, ChevronDown } from 'lucide-react';
import { PuriStoreConfig, PuriStoreProduct } from '../types';
import { subscribePuriStoreConfig, DEFAULT_PURI_STORE_CONFIG } from '../lib/api';

interface PuriOnlineStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PuriOnlineStoreModal: React.FC<PuriOnlineStoreModalProps> = ({ isOpen, onClose }) => {
  const [storeConfig, setStoreConfig] = useState<PuriStoreConfig>(DEFAULT_PURI_STORE_CONFIG);
  const [visibleCount, setVisibleCount] = useState<number>(4);

  useEffect(() => {
    const unsub = subscribePuriStoreConfig((config) => {
      setStoreConfig(config);
    });
    return () => unsub();
  }, []);

  // Reset pagination when modal opens
  useEffect(() => {
    if (isOpen) {
      setVisibleCount(4);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const products = (storeConfig.products || []).filter(
    (p) => p && p.name && p.photoUrl && p.buyLink && p.photoUrl.trim().length > 0 && p.buyLink.trim().length > 0
  );

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = products.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-amber-400 overflow-hidden">
        {/* Header - Completely White-Labeled */}
        <div className="bg-gradient-to-r from-amber-900 via-[#8B0000] to-amber-950 text-white p-4 sm:p-5 flex items-center justify-between relative shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-200 shrink-0 shadow-inner">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-amber-200">
                  {storeConfig.title || 'ଶ୍ରୀକ୍ଷେତ୍ର ପୁରୀ ଅନଲାଇନ୍ ଷ୍ଟୋର୍ (Online Store)'}
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-100/90 font-medium">
                {storeConfig.subtitle || 'ପ୍ରଭୁ ଶ୍ରୀ ଜଗନ୍ନାଥଙ୍କ ପବିତ୍ର ପୂଜା ସାମଗ୍ରୀ ଓ ଆଧ୍ୟାତ୍ମିକ ଉପହାର'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-amber-200 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Info Banner */}
        <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 font-medium shrink-0">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
            <span>ଶୁଦ୍ଧ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ ଓ ଆଧ୍ୟାତ୍ମିକ ବସ୍ତୁ ସଂଗ୍ରହ କରନ୍ତୁ</span>
          </span>
          <span className="text-[11px] font-bold text-amber-800">
            {visibleProducts.length} / {products.length} ଟି ସାମଗ୍ରୀ
          </span>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {products.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <ShoppingBag className="w-12 h-12 text-amber-300 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-bold text-slate-600">
                ବର୍ତ୍ତମାନ କୌଣସି ସାମଗ୍ରୀ ଉପଲବ୍ଧ ନାହିଁ।
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-amber-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group hover:border-amber-400"
                  >
                    <div>
                      {/* Photo Container */}
                      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={prod.photoUrl}
                          alt={prod.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.opacity = '0.3';
                          }}
                        />
                        {prod.tag && (
                          <span className="absolute top-2 left-2 px-2.5 py-0.5 bg-black/75 backdrop-blur-xs text-amber-200 text-[10px] font-black rounded-lg border border-amber-400/30">
                            {prod.tag}
                          </span>
                        )}
                      </div>

                      {/* Title & Info */}
                      <div className="p-3.5 space-y-1">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                          {prod.name}
                        </h4>
                        {prod.nameEng && (
                          <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-relaxed">
                            {prod.nameEng}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* White-Label Buy Button: "ଅର୍ଡର୍ କରନ୍ତୁ (Order Now)" */}
                    <div className="p-3.5 pt-0">
                      <a
                        href={prod.buyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-[#8B0000] to-[#701a1e] hover:from-[#a00000] hover:to-[#8B0000] text-amber-100 hover:text-white font-extrabold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer group/btn"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                        <span>ଅର୍ଡର୍ କରନ୍ତୁ (Order Now)</span>
                        <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform text-amber-200" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* 'Load More' (ଆହୁରି ଦେଖନ୍ତୁ) Button */}
              {hasMore && (
                <div className="pt-3 pb-1 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#8B0000] to-[#701a1e] hover:from-[#a00000] hover:to-[#8B0000] text-amber-100 hover:text-white font-black rounded-xl text-xs shadow-sm hover:shadow transition flex items-center gap-2 cursor-pointer border border-amber-400/40 active:scale-95"
                  >
                    <span>ଆହୁରି ଦେଖନ୍ତୁ (Load More)</span>
                    <ChevronDown className="w-4 h-4 text-amber-300" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center shrink-0">
          <p className="text-[10px] text-slate-500 font-medium">
            * ଏହି ସାମଗ୍ରୀଗୁଡ଼ିକ ଶୁଦ୍ଧ ଓ ପ୍ରାମାଣିକ ଆଧ୍ୟାତ୍ମିକ ସେବା ପାଇଁ ଉପଲବ୍ଧ।
          </p>
        </div>
      </div>
    </div>
  );
};
