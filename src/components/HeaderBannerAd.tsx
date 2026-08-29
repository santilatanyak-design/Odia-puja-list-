import React from 'react';
import { ExternalLink, ShoppingBag, Sparkles } from 'lucide-react';

interface HeaderBannerAdProps {
  customBannerUrl?: string;
  customTargetUrl?: string;
  customHeadline?: string;
  customSubline?: string;
  className?: string;
}

export const HeaderBannerAd: React.FC<HeaderBannerAdProps> = ({
  customBannerUrl,
  customTargetUrl = 'https://www.amazon.in',
  customHeadline = 'ଶୁଦ୍ଧ ପୂଜା ସାମଗ୍ରୀ, ପବିତ୍ର ଶ୍ରୀମଦ୍ ଭାଗବତ ଓ ପିତ୍ତଳ ଦୀପ ସେଟ୍',
  customSubline = 'ଅତିରିକ୍ତ ରିହାତି ସହ Amazon ରେ ଉପଲବ୍ଧ | ଶୀଘ୍ର ଅର୍ଡର କରନ୍ତୁ',
  className = '',
}) => {
  return (
    <div
      id="permanent-header-banner-ad"
      className={`w-full my-5 sm:my-6 ${className}`}
    >
      {/* Standard Rectangular Banner Container (Pure White / Clean Native Slot) */}
      <div className="w-full bg-white border border-slate-200 hover:border-amber-400/80 rounded-lg shadow-xs hover:shadow-sm transition-all duration-200 overflow-hidden group">
        {customBannerUrl ? (
          /* Custom Graphic Banner View (100% full-width standard ratio) */
          <a
            href={customTargetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-[50px] sm:h-[80px] md:h-[90px] overflow-hidden"
          >
            <img
              src={customBannerUrl}
              alt="Header Sponsor Banner"
              className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
            />
          </a>
        ) : (
          /* Clean Native Editorial Banner Slot */
          <a
            href={customTargetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 sm:py-3.5 sm:px-5 min-h-[58px] sm:min-h-[76px] no-underline select-none"
          >
            {/* Left Column: Icon & Typography */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="hidden xs:flex w-10 h-10 sm:w-11 sm:h-11 rounded-md bg-amber-50 border border-amber-200/80 items-center justify-center shrink-0 group-hover:bg-amber-100/70 transition-colors">
                <ShoppingBag className="w-5 h-5 text-amber-700" />
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200/80 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                    <span>Special Offer</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                    Amazon India
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-amber-800 transition-colors">
                  {customHeadline}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden xs:block">
                  {customSubline}
                </p>
              </div>
            </div>

            {/* Right Column: Clean Native Button */}
            <div className="shrink-0 ml-3 sm:ml-5">
              <span className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-md text-xs sm:text-xs group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all duration-150">
                <span>Shop Now</span>
                <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
            </div>
          </a>
        )}
      </div>
    </div>
  );
};
