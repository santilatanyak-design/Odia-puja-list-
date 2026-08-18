import React, { useState, useEffect } from 'react';
import { DistrictItem, DistrictCategory, ODISHA_DISTRICTS, OdishaDistrictInfo } from '../types';
import { subscribeDistrictItems } from '../lib/districtApi';
import {
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BookOpen,
  X,
  Compass,
  Flame,
  Info,
} from 'lucide-react';

interface ExploreDistrictSectionProps {
  onNavigateToTemples?: () => void;
}

export const ExploreDistrictSection: React.FC<ExploreDistrictSectionProps> = ({
  onNavigateToTemples,
}) => {
  const [districtItems, setDistrictItems] = useState<DistrictItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('puri');
  const [selectedCategory, setSelectedCategory] = useState<'all' | DistrictCategory>('all');
  const [selectedDetailItem, setSelectedDetailItem] = useState<DistrictItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeDistrictItems((items) => {
      setDistrictItems(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const selectedDistrictInfo =
    ODISHA_DISTRICTS.find((d) => d.id === selectedDistrictId) || ODISHA_DISTRICTS[0];

  // Filter items by district and category
  const filteredItems = districtItems.filter((item) => {
    if (item.districtId !== selectedDistrictId) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  const totalInDistrict = districtItems.filter((i) => i.districtId === selectedDistrictId).length;
  const templesCount = districtItems.filter(
    (i) => i.districtId === selectedDistrictId && i.category === 'temple'
  ).length;
  const festivalsCount = districtItems.filter(
    (i) => i.districtId === selectedDistrictId && i.category === 'festival'
  ).length;
  const storiesCount = districtItems.filter(
    (i) => i.districtId === selectedDistrictId && i.category === 'story'
  ).length;

  return (
    <section className="w-full space-y-3.5 my-2" id="explore-odisha-districts">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300/70 text-amber-950 text-xs font-black mb-1.5 shadow-2xs">
            <Compass className="w-3.5 h-3.5 text-[#8B0000] animate-spin-slow" />
            <span>ଓଡ଼ିଶା ଦର୍ଶନ • EXPLORE ODISHA</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>ଓଡ଼ିଶାର ଜିଲ୍ଲା ଦର୍ଶନ</span>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              ୩୦ ଜିଲ୍ଲା
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            ପ୍ରତ୍ୟେକ ଜିଲ୍ଲାର ପ୍ରସିଦ୍ଧ ମନ୍ଦିର, ପବିତ୍ର ପର୍ବପର୍ବାଣୀ ଏବଂ ଆଧ୍ୟାତ୍ମିକ ଇତିହାସ
          </p>
        </div>

        {onNavigateToTemples && (
          <button
            onClick={onNavigateToTemples}
            className="text-xs font-extrabold text-amber-900 hover:text-amber-950 flex items-center gap-1 self-start sm:self-auto cursor-pointer group"
          >
            <span>ସମସ୍ତ ମନ୍ଦିର ଦେଖନ୍ତୁ</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-[#8B0000]" />
          </button>
        )}
      </div>

      {/* 30 Districts Horizontal Scroll Bar */}
      <div className="w-full bg-gradient-to-r from-amber-900 via-[#8B0000] to-amber-950 p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl shadow-md border border-amber-500/30">
        <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-200 px-1 mb-2">
          <span>ଜିଲ୍ଲା ବାଛନ୍ତୁ (Select District to Explore):</span>
          <span className="text-[10px] text-amber-300/80 font-mono">
            {ODISHA_DISTRICTS.length} Districts
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-amber-600/40">
          {ODISHA_DISTRICTS.map((dist) => {
            const isSelected = dist.id === selectedDistrictId;
            const count = districtItems.filter((i) => i.districtId === dist.id).length;

            return (
              <button
                key={dist.id}
                onClick={() => {
                  setSelectedDistrictId(dist.id);
                  setSelectedCategory('all');
                }}
                className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black shrink-0 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-md scale-105 ring-2 ring-white/60 font-black'
                    : 'bg-black/30 hover:bg-black/45 text-amber-100 border border-white/10 hover:border-amber-400/30'
                }`}
              >
                <span className="text-base">{dist.icon}</span>
                <div className="text-left">
                  <div className="leading-tight text-xs font-black">{dist.nameOdia}</div>
                  <div className={`text-[9px] font-semibold ${isSelected ? 'text-amber-950/80' : 'text-amber-300/70'}`}>
                    {dist.nameEng}
                  </div>
                </div>
                {count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      isSelected
                        ? 'bg-[#8B0000] text-amber-100'
                        : 'bg-amber-400/30 text-amber-200'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected District Info Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
            {selectedDistrictInfo.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {selectedDistrictInfo.nameOdia} ({selectedDistrictInfo.nameEng})
              </h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[10px] font-black">
                ଓଡ଼ିଶା
              </span>
            </div>
            <p className="text-xs text-amber-900/90 font-semibold mt-0.5">
              ✨ {selectedDistrictInfo.tagline}
            </p>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `ସମସ୍ତ (${totalInDistrict})`, icon: '🚩' },
            { id: 'temple', label: `ମନ୍ଦିର (${templesCount})`, icon: '🛕' },
            { id: 'festival', label: `ପର୍ବପର୍ବାଣୀ (${festivalsCount})`, icon: '🎉' },
            { id: 'story', label: `ଆଧ୍ୟାତ୍ମିକ କଥା (${storiesCount})`, icon: '📖' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                selectedCategory === cat.id
                  ? 'bg-[#8B0000] text-amber-100 shadow-xs font-black'
                  : 'bg-amber-50/80 hover:bg-amber-100 text-slate-800 border border-amber-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid / Empty State */}
      {loading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-amber-200 shadow-xs">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-amber-900 font-bold">ଲୋଡ୍ ହେଉଛି (Loading...)...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-amber-50/70 rounded-2xl border border-amber-200/80 py-6 px-4 text-center">
          <p className="text-xs font-bold text-amber-950">
            No data found for {selectedDistrictInfo.nameOdia} ({selectedDistrictInfo.nameEng})
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedDetailItem(item)}
              className="bg-white rounded-3xl border border-amber-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5"
            >
              <div>
                {/* Image / Banner */}
                {item.imageUrl ? (
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=600&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 bg-black/70 backdrop-blur-xs text-amber-200 rounded-lg text-[10px] font-black border border-amber-400/30 flex items-center gap-1">
                        <span>{selectedDistrictInfo.icon}</span>
                        <span>{item.districtNameOdia || selectedDistrictInfo.nameOdia}</span>
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black text-white shadow-2xs ${
                          item.category === 'temple'
                            ? 'bg-amber-600'
                            : item.category === 'festival'
                            ? 'bg-rose-600'
                            : 'bg-purple-600'
                        }`}
                      >
                        {item.category === 'temple'
                          ? '🛕 ମନ୍ଦିର'
                          : item.category === 'festival'
                          ? '🎉 ପର୍ବପର୍ବାଣୀ'
                          : '📖 ଆଧ୍ୟାତ୍ମିକ କଥା'}
                      </span>
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <h4 className="font-black text-white text-base leading-snug drop-shadow-md group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-amber-100 to-amber-50 border-b border-amber-200 flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-[#8B0000] text-amber-100 rounded-lg text-[10px] font-black flex items-center gap-1">
                      <span>{selectedDistrictInfo.icon}</span>
                      <span>{item.districtNameOdia || selectedDistrictInfo.nameOdia}</span>
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black text-white ${
                        item.category === 'temple'
                          ? 'bg-amber-600'
                          : item.category === 'festival'
                          ? 'bg-rose-600'
                          : 'bg-purple-600'
                      }`}
                    >
                      {item.category === 'temple'
                        ? '🛕 ମନ୍ଦିର'
                        : item.category === 'festival'
                        ? '🎉 ପର୍ବ'
                        : '📖 କଥା'}
                    </span>
                  </div>
                )}

                {/* Card Text Content */}
                <div className="p-4 space-y-2.5">
                  {!item.imageUrl && (
                    <h4 className="font-black text-slate-900 text-base leading-snug group-hover:text-[#8B0000] transition-colors">
                      {item.title}
                    </h4>
                  )}

                  {item.location && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-950 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  {item.famousFestivals && (
                    <div className="text-[11px] text-amber-950 font-medium bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60">
                      <span className="font-bold text-amber-900">✨ ପ୍ରମୁଖ ପର୍ବ: </span>
                      <span>{item.famousFestivals}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="px-4 py-3 bg-amber-50/40 border-t border-amber-100 flex items-center justify-between">
                <span className="text-[11px] text-amber-900 font-extrabold flex items-center gap-1 group-hover:text-[#8B0000]">
                  <span>ସମ୍ପୂର୍ଣ୍ଣ ପଢ଼ନ୍ତୁ (Read Details)</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>

                {item.bestTimeToVisit && (
                  <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                    🗓️ {item.bestTimeToVisit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DETAILED POPUP MODAL FOR FULL READING                          */}
      {/* ------------------------------------------------------------- */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border-2 border-amber-400 relative space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#8B0000] text-amber-100 rounded-xl text-xs font-black flex items-center gap-1">
                  <span>{selectedDistrictInfo.icon}</span>
                  <span>{selectedDetailItem.districtNameOdia || selectedDistrictInfo.nameOdia}</span>
                </span>
                <span
                  className={`px-2.5 py-1 rounded-xl text-xs font-black text-white ${
                    selectedDetailItem.category === 'temple'
                      ? 'bg-amber-600'
                      : selectedDetailItem.category === 'festival'
                      ? 'bg-rose-600'
                      : 'bg-purple-600'
                  }`}
                >
                  {selectedDetailItem.category === 'temple'
                    ? '🛕 ପ୍ରସିଦ୍ଧ ମନ୍ଦିର'
                    : selectedDetailItem.category === 'festival'
                    ? '🎉 ପବିତ୍ର ପର୍ବପର୍ବାଣୀ'
                    : '📖 ଆଧ୍ୟାତ୍ମିକ ଇତିହାସ'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="p-1.5 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Image */}
            {selectedDetailItem.imageUrl && (
              <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-slate-100 border border-amber-200 shadow-inner">
                <img
                  src={selectedDetailItem.imageUrl}
                  alt={selectedDetailItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title & Location */}
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                {selectedDetailItem.title}
              </h3>
              {selectedDetailItem.location && (
                <div className="flex items-center gap-1.5 text-xs text-amber-950 font-bold">
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{selectedDetailItem.location}</span>
                </div>
              )}
            </div>

            {/* Badges / Quick Highlights */}
            {(selectedDetailItem.famousFestivals || selectedDetailItem.bestTimeToVisit) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs">
                {selectedDetailItem.famousFestivals && (
                  <div>
                    <span className="font-black text-amber-950 block">✨ ମୁଖ୍ୟ ପର୍ବପର୍ବାଣୀ:</span>
                    <span className="text-amber-900 font-medium">{selectedDetailItem.famousFestivals}</span>
                  </div>
                )}
                {selectedDetailItem.bestTimeToVisit && (
                  <div>
                    <span className="font-black text-amber-950 block">🗓️ ପରିଦର୍ଶନର ଶ୍ରେଷ୍ଠ ସମୟ:</span>
                    <span className="text-amber-900 font-medium">{selectedDetailItem.bestTimeToVisit}</span>
                  </div>
                )}
              </div>
            )}

            {/* Full Description & Spiritual Significance */}
            <div className="space-y-3 pt-1">
              <div>
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#8B0000]" />
                  <span>ବିସ୍ତୃତ ବିବରଣୀ ଓ ଇତିହାସ (Full History & Description)</span>
                </h4>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                  {selectedDetailItem.description}
                </div>
              </div>

              {selectedDetailItem.significance && (
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>ଧାର୍ମିକ ଓ ଆଧ୍ୟାତ୍ମିକ ମହତ୍ତ୍ୱ (Spiritual Significance)</span>
                  </h4>
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80">
                    {selectedDetailItem.significance}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
              {selectedDetailItem.externalLink ? (
                <a
                  href={selectedDetailItem.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-amber-800" />
                  <span>ଗୁଗୁଲ୍ ମ୍ୟାପ୍ / ୱେବସାଇଟ୍ ଲିଙ୍କ୍</span>
                </a>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="px-5 py-2 bg-gradient-to-r from-[#701a1e] to-[#8B0000] text-amber-100 font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer hover:text-white"
              >
                ବନ୍ଦ କରନ୍ତୁ (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
