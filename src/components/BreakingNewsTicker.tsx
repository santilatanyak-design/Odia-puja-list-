import React, { useEffect, useState } from 'react';
import { Flame, Bell, Sparkles } from 'lucide-react';
import { getDailyPanchang } from '../lib/contentApi';
import { DailyPanchang } from '../types';

interface BreakingNewsTickerProps {
  onTickerClick?: () => void;
  className?: string;
}

export const BreakingNewsTicker: React.FC<BreakingNewsTickerProps> = ({
  onTickerClick,
  className = '',
}) => {
  const [panchang, setPanchang] = useState<DailyPanchang | null>(null);

  useEffect(() => {
    getDailyPanchang()
      .then((p) => {
        if (p) setPanchang(p);
      })
      .catch(() => {});
  }, []);

  const tickerItems = [
    panchang?.tithi
      ? `ଆଜିର ପଞ୍ଚାଙ୍ଗ: ${panchang.tithi}, ${panchang.nakshatra || ''} | ଅମୃତ ବେଳା: ${panchang.amritabela || 'ପ୍ରାତଃ ସୂର୍ଯ୍ୟୋଦୟରୁ ସନ୍ଧ୍ୟା'}`
      : 'ଆଜିର ପବିତ୍ର ପଞ୍ଚାଙ୍ଗ ଓ ଶୁଭ ବେଳା ଅପଡେଟ୍ ହୋଇଛି',
    panchang?.specialFestival ? `ପର୍ବପର୍ବାଣୀ: ${panchang.specialFestival}` : 'ଶ୍ରୀମନ୍ଦିର ଦୈନନ୍ଦିନ ନୀତି କାନ୍ତି ଓ ଦର୍ଶନ ସମୟ ସୂଚୀ ଲାଇଭ୍ ଉପଲବ୍ଧ',
    'ଅନ୍‌ଲାଇନ୍‌ରେ ଶ୍ରୀକ୍ଷେତ୍ର ପ୍ରସାଦ ସେବା ଓ ନାମ ସଙ୍କୀର୍ତ୍ତନ ପୂଜା ବୁକିଂ ଚାଲୁଅଛି',
    'ପବିତ୍ର ପୁରାଣ ଓ ଓଡ଼ିଶାର ୩୦ ଜିଲ୍ଲାର ପ୍ରସିଦ୍ଧ ମନ୍ଦିର ଇତିହାସ ପଢ଼ନ୍ତୁ',
  ];

  return (
    <div
      id="breaking-news-ticker"
      onClick={onTickerClick}
      className={`w-full bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs flex items-center select-none cursor-pointer ${className}`}
      aria-label="Breaking News Ticker"
    >
      {/* Left Badge: Flashing Breaking News Tag */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-inner">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <span className="hidden xs:inline">ତାଜା ଅପଡେଟ୍</span>
        <span className="xs:hidden">Live</span>
      </div>

      {/* Marquee Scrolling Content */}
      <div className="overflow-hidden whitespace-nowrap py-1.5 px-3 flex-1 relative">
        <div className="inline-block animate-marquee hover:[animation-play-state:paused]">
          <div className="flex items-center gap-8 text-xs font-semibold text-slate-700">
            {tickerItems.map((text, idx) => (
              <span key={idx} className="inline-flex items-center gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>{text}</span>
              </span>
            ))}
            {/* Duplicate for seamless infinite loop */}
            {tickerItems.map((text, idx) => (
              <span key={`dup-${idx}`} className="inline-flex items-center gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>{text}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
