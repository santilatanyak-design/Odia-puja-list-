import React, { useState, useEffect } from 'react';
import { DailyPanchang } from '../types';
import { subscribeDailyPanchang, DEFAULT_PANCHANG } from '../lib/contentApi';
import {
  Calendar,
  Sun,
  Moon,
  Clock,
  Sparkles,
  Share2,
  Check,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Flame,
  Compass,
} from 'lucide-react';
import { openWhatsAppDirectShare, openShareChatShare, openThreadsShare } from '../lib/ogMetaHelper';

interface PanchangPageProps {
  onBack: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToStories?: () => void;
}

export const PanchangPage: React.FC<PanchangPageProps> = ({ onBack, onNavigateToBlog, onNavigateToStories }) => {
  const [panchang, setPanchang] = useState<DailyPanchang | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const handleStoriesNav = onNavigateToBlog || onNavigateToStories;

  useEffect(() => {
    const unsub = subscribeDailyPanchang((data) => {
      setPanchang(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleShare = () => {
    if (!panchang) return;
    const shareText = `🚩 *ଓଡ଼ିଆ ଦୈନିକ ପଞ୍ଜିକା (Daily Odia Panchang)* 🚩
📅 ତାରିଖ: ${panchang.date || ''} (${panchang.odiaDateText || panchang.odiaMonth || ''})
✨ ପକ୍ଷ ଓ ତିଥି: ${panchang.paksha || ''} • ${panchang.tithi || ''}
🌟 ନକ୍ଷତ୍ର: ${panchang.nakshatra || ''}
🕉️ ଯୋଗ: ${panchang.yoga || ''} | କରଣ: ${panchang.karana || ''}
🌅 ସୂର୍ଯ୍ୟୋଦୟ: ${panchang.sunrise || ''} | ସୂର୍ଯ୍ୟାସ୍ତ: ${panchang.sunset || ''}
🟢 ଅମୃତ ବେଳା: ${panchang.amritabela || ''}
🔴 ରାହୁକାଳ: ${panchang.rahukala || ''}
🧘 ବ୍ରାହ୍ମ ମୁହୂର୍ତ୍ତ: ${panchang.brahmaMuhurta || ''}
🎉 ଆଜିର ପର୍ବ: ${panchang.specialFestival || 'ଶୁଭ ଦିବସ'}
🪔 ଦୈନିକ ବିଚାର: ${panchang.dailyAdvice || 'ହରେ କୃଷ୍ଣ ହରେ ରାମ'}

ଦେଖନ୍ତୁ ସମ୍ପୂର୍ଣ୍ଣ ବିବରଣୀ: ${typeof window !== 'undefined' ? window.location.origin : ''}`;

    if (navigator.share) {
      navigator.share({
        title: 'ଓଡ଼ିଆ ଦୈନିକ ପଞ୍ଜିକା',
        text: shareText,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-12 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-amber-900">ଦୈନିକ ପଞ୍ଜିକା ତଥ୍ୟ ଲୋଡ୍ ହେଉଛି (Loading Panchang...)...</p>
      </div>
    );
  }

  const p: DailyPanchang = panchang || DEFAULT_PANCHANG;
  const hasData = Boolean(panchang && (panchang.tithi || panchang.date || panchang.odiaDateText));

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 box-border">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-amber-400 shadow-xs"
        >
          <span>←</span>
          <span>ମୁଖ୍ୟ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ (Back to Home)</span>
        </button>

        {hasData && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                if (!panchang) return;
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const shareText = `🚩 *ଓଡ଼ିଆ ଦୈନିକ ପଞ୍ଜିକା (Daily Odia Panchang)* 🚩\n📅 ତାରିଖ: ${panchang.date || ''} (${panchang.odiaDateText || panchang.odiaMonth || ''})\n✨ ତିଥି: ${panchang.paksha || ''} • ${panchang.tithi || ''}\n🌟 ନକ୍ଷତ୍ର: ${panchang.nakshatra || ''}\n🎉 ଆଜିର ପର୍ବ: ${panchang.specialFestival || 'ଶୁଭ ଦିବସ'}`;
                openWhatsAppDirectShare(shareText, origin ? `${origin}/?panchang=true` : '');
              }}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer shadow-sm"
            >
              <span>💬 WhatsApp</span>
            </button>

            <button
              onClick={async () => {
                if (!panchang) return;
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const shareText = `📅 ତାରିଖ: ${panchang.date || ''} (${panchang.odiaDateText || panchang.odiaMonth || ''})\n✨ ତିଥି: ${panchang.paksha || ''} • ${panchang.tithi || ''}\n🌟 ନକ୍ଷତ୍ର: ${panchang.nakshatra || ''}\n🎉 ପର୍ବ: ${panchang.specialFestival || 'ଶୁଭ ଦିବସ'}`;
                await openShareChatShare(shareText, origin ? `${origin}/?panchang=true` : '', 'ଓଡ଼ିଆ ଦୈନିକ ପଞ୍ଜିକା');
              }}
              className="px-3 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer shadow-sm"
            >
              <span>✨ ShareChat</span>
            </button>

            <button
              onClick={() => {
                if (!panchang) return;
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const shareText = `📅 ତାରିଖ: ${panchang.date || ''} (${panchang.odiaDateText || panchang.odiaMonth || ''})\n✨ ତିଥି: ${panchang.paksha || ''} • ${panchang.tithi || ''}\n🌟 ନକ୍ଷତ୍ର: ${panchang.nakshatra || ''}\n🎉 ପର୍ବ: ${panchang.specialFestival || 'ଶୁଭ ଦିବସ'}`;
                openThreadsShare(shareText, origin ? `${origin}/?panchang=true` : '', 'ଓଡ଼ିଆ ଦୈନିକ ପଞ୍ଜିକା');
              }}
              className="px-3 py-2 bg-black hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer shadow-sm border border-slate-700"
            >
              <span>🧵 Threads</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer border border-amber-300"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-amber-800" />
                  <span>More</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="bg-gradient-to-br from-[#500c0f] via-[#7a1217] to-[#340407] text-white border-2 sm:border-3 border-amber-400 rounded-3xl p-8 sm:p-12 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-3xl mx-auto border border-amber-400/40">
            📅
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-100">
            ଆଜିର ପଞ୍ଜିକା ତଥ୍ୟ ଉପଲବ୍ଧ ହୋଇନାହିଁ
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/90 max-w-md mx-auto leading-relaxed">
            Admin Panel ରୁ ଆଜିର ତିଥି, ନକ୍ଷତ୍ର ଓ ଶୁଭ ବେଳା ସଂଯୋଗ କରାଗଲେ ଏଠାରେ ସ୍ୱୟଂଚାଳିତ ଭାବେ ପ୍ରଦର୍ଶିତ ହେବ।
          </p>
        </div>
      ) : (
        <>
          {/* Main Majestic Panchang Header Card */}
          <div className="bg-gradient-to-br from-[#500c0f] via-[#7a1217] to-[#340407] text-white border-2 sm:border-3 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-44 h-44 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-400/25 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-400/20 border border-amber-400/60 rounded-full text-xs text-amber-300 font-extrabold backdrop-blur-xs">
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  <span>ଓଡ଼ିଆ ଦୈନିକ ପଞ୍ଜିକା (Odia Panchang)</span>
                  <span>•</span>
                  <span>ଶ୍ରୀକ୍ଷେତ୍ର ପୁରୀ ଗଣନା</span>
                </div>
                {p.date && (
                  <span className="text-xs text-amber-200/90 font-mono font-bold bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-500/30">
                    📅 {p.date}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-amber-100 tracking-tight leading-tight">
                  ଆଜିର ଶୁଭ ପଞ୍ଜିକା ଓ ରାଶି ନକ୍ଷତ୍ର
                </h1>
                {(p.odiaDateText || p.odiaMonth) && (
                  <p className="text-sm sm:text-base text-amber-200 font-bold mt-1">
                    {p.odiaDateText || p.odiaMonth}
                  </p>
                )}
              </div>

              {/* Quick Highlight Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="bg-amber-950/60 border border-amber-400/40 rounded-2xl p-3 text-center">
                  <span className="block text-[11px] text-amber-300 font-bold uppercase tracking-wider">ପକ୍ଷ (Paksha)</span>
                  <span className="font-black text-xs sm:text-sm text-white">{p.paksha || '--'}</span>
                </div>
                <div className="bg-amber-950/60 border border-amber-400/40 rounded-2xl p-3 text-center">
                  <span className="block text-[11px] text-amber-300 font-bold uppercase tracking-wider">ତିଥି (Tithi)</span>
                  <span className="font-black text-xs sm:text-sm text-amber-100">{p.tithi || '--'}</span>
                </div>
                <div className="bg-amber-950/60 border border-amber-400/40 rounded-2xl p-3 text-center">
                  <span className="block text-[11px] text-amber-300 font-bold uppercase tracking-wider">ନକ୍ଷତ୍ର (Nakshatra)</span>
                  <span className="font-black text-xs sm:text-sm text-white">{p.nakshatra || '--'}</span>
                </div>
                <div className="bg-amber-950/60 border border-amber-400/40 rounded-2xl p-3 text-center">
                  <span className="block text-[11px] text-amber-300 font-bold uppercase tracking-wider">ମାସ (Month)</span>
                  <span className="font-black text-xs sm:text-sm text-amber-100">{p.odiaMonth || '--'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Festival / Fasting Banner */}
          {p.specialFestival && (
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 border-2 border-amber-600 rounded-3xl p-5 shadow-lg text-amber-950 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-950 text-amber-300 flex items-center justify-center text-2xl shrink-0 shadow-md">
                🚩
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-950 text-amber-200 px-2.5 py-0.5 rounded-md inline-block">
                  ଆଜିର ପର୍ବ ଓ ବିଶେଷତ୍ୱ (Today's Festival / Vrata)
                </span>
                <h3 className="text-base sm:text-lg font-black text-amber-950 leading-snug">
                  {p.specialFestival}
                </h3>
                {p.fastingInfo && (
                  <p className="text-xs font-bold text-amber-900">
                    {p.fastingInfo}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Key Auspicious / Inauspicious Timings Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card: Auspicious Timings */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-300 shadow-md space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-emerald-100">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  🟢
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">ଶୁଭ ସମୟ (Auspicious Muhurat)</h3>
                  <p className="text-xs text-slate-500 font-medium">କାର୍ଯ୍ୟ ଆରମ୍ଭ, ପୂଜା ଓ ଯାତ୍ରା ପାଇଁ ଉତ୍ତମ</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>ଅମୃତ ବେଳା (Amrita Bela)</span>
                    </span>
                    <p className="text-xs text-emerald-900 font-bold">{p.amritabela || 'ସୂଚନା ନାହିଁ'}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md text-[10px] font-black">
                    ଉତ୍ତମ
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                      <span>ବ୍ରାହ୍ମ ମୁହୂର୍ତ୍ତ (Brahma Muhurta)</span>
                    </span>
                    <p className="text-xs text-emerald-900 font-bold">{p.brahmaMuhurta || 'ସୂଚନା ନାହିଁ'}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md text-[10px] font-black">
                    ଧ୍ୟାନ / ଜପ
                  </span>
                </div>

                {p.gulikaKala && (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>ଗୁଳିକା କାଳ (Gulika Kala)</span>
                      </span>
                      <p className="text-xs text-emerald-900 font-bold">{p.gulikaKala}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md text-[10px] font-black">
                      ଶୁଭ
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Card: Inauspicious Timings (Varjya) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-rose-300 shadow-md space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-rose-100">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  🔴
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">ଅଶୁଭ ସମୟ (Inauspicious / Varjya)</h3>
                  <p className="text-xs text-slate-500 font-medium">ନୂତନ କାର୍ଯ୍ୟ ଓ ଶୁଭ କର୍ମ ବର୍ଜନୀୟ</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                      <span>ରାହୁ କାଳ (Rahu Kala)</span>
                    </span>
                    <p className="text-xs text-rose-900 font-bold">{p.rahukala || 'ସୂଚନା ନାହିଁ'}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded-md text-[10px] font-black">
                    ବର୍ଜନୀୟ
                  </span>
                </div>

                {p.yamaganda && (
                  <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-700" />
                        <span>ଯମଗଣ୍ଡ କାଳ (Yamaganda)</span>
                      </span>
                      <p className="text-xs text-rose-900 font-bold">{p.yamaganda}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded-md text-[10px] font-black">
                      ଅଶୁଭ
                    </span>
                  </div>
                )}

                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl">
                  <span className="text-xs font-bold text-amber-950 block">
                    💡 ଜ୍ୟୋତିଷ ପରାମର୍ଶ:
                  </span>
                  <p className="text-xs text-amber-900 mt-0.5 leading-relaxed font-medium">
                    ରାହୁକାଳ ସମୟରେ ଯାତ୍ରା ଆରମ୍ଭ କିମ୍ବା ଚୁକ୍ତିପତ୍ର ସ୍ୱାକ୍ଷର କରନ୍ତୁ ନାହିଁ। ଜରୁରୀ କାମ ଥିଲେ ତୁଳସୀ ପତ୍ର ସେବନ କରି ପ୍ରଭୁଙ୍କ ନାମ ସ୍ମରଣ କରନ୍ତୁ।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sun & Astrological Planetary Matrix */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-300 shadow-md space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-700" />
              <span>ସୂର୍ଯ୍ୟ, ଚନ୍ଦ୍ର ଓ ଜ୍ୟୋତିଷ ଗଣନା (Solar & Lunar Details)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-1">
                <Sun className="w-5 h-5 text-amber-600 mx-auto" />
                <span className="block text-[11px] text-slate-500 font-bold">ସୂର୍ଯ୍ୟୋଦୟ (Sunrise)</span>
                <span className="font-black text-xs sm:text-sm text-slate-900">{p.sunrise || '--'}</span>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-1">
                <Sun className="w-5 h-5 text-rose-600 mx-auto" />
                <span className="block text-[11px] text-slate-500 font-bold">ସୂର୍ଯ୍ୟାସ୍ତ (Sunset)</span>
                <span className="font-black text-xs sm:text-sm text-slate-900">{p.sunset || '--'}</span>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-1">
                <Moon className="w-5 h-5 text-indigo-600 mx-auto" />
                <span className="block text-[11px] text-slate-500 font-bold">ଚନ୍ଦ୍ରୋଦୟ (Moonrise)</span>
                <span className="font-black text-xs sm:text-sm text-slate-900">{p.moonrise || 'ସନ୍ଧ୍ୟା ସମୟ'}</span>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-1">
                <Flame className="w-5 h-5 text-amber-700 mx-auto" />
                <span className="block text-[11px] text-slate-500 font-bold">ଯୋଗ ଓ କରଣ (Yoga/Karana)</span>
                <span className="font-black text-xs text-slate-900 truncate block">
                  {p.yoga || '--'} / {p.karana || '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Spiritual Thought & Advice */}
          {p.dailyAdvice && (
            <div className="bg-gradient-to-br from-amber-100 to-amber-200/80 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-md text-amber-950 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>ଦୈନିକ ସଦ୍‌ବିଚାର ଓ ପୂଜା ନୀତି (Daily Spiritual Wisdom)</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-amber-950 leading-relaxed italic">
                "{p.dailyAdvice}"
              </p>
            </div>
          )}
        </>
      )}

      {/* Cross-Link Card to Spiritual Blog */}
      {handleStoriesNav && (
        <div
          onClick={handleStoriesNav}
          className="bg-gradient-to-r from-[#701a1e] to-amber-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-amber-400 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:shadow-2xl transition group"
        >
          <div className="space-y-1 text-center sm:text-left">
            <span className="px-3 py-0.5 bg-amber-400/20 text-amber-300 text-xs font-black rounded-full border border-amber-400/40">
              📖 ପୁରାଣ ଓ ଇତିହାସ
            </span>
            <h4 className="text-lg font-black text-amber-100">
              ପଢ଼ନ୍ତୁ ଶ୍ରୀକ୍ଷେତ୍ର ଓ ପୁରାଣର ଦିବ୍ୟ କାହାଣୀ ସମୂହ (Spiritual Stories)
            </h4>
            <p className="text-xs text-amber-200 font-medium">
              ଭକ୍ତ ସାଲବେଗ, ମାଣିକ ପାଟଣୀ ଓ ଶିବ ମହିମାର ରୋମାଞ୍ଚକର ଗାଥା।
            </p>
          </div>
          <button
            type="button"
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black rounded-2xl text-xs flex items-center gap-1.5 transition shrink-0 group-hover:scale-105"
          >
            <span>କାହାଣୀ ପଢ଼ନ୍ତୁ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
