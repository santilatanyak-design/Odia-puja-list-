import React, { useState, useEffect } from 'react';
import { DistrictItem, DistrictCategory, ODISHA_DISTRICTS, OdishaDistrictInfo, PuriStoreConfig } from '../types';
import { subscribeDistrictItems } from '../lib/districtApi';
import { subscribePuriStoreConfig, DEFAULT_PURI_STORE_CONFIG } from '../lib/api';
import { shareDistrictItemNative, setDynamicDistrictItemMeta } from '../lib/ogMetaHelper';
import { PuriOnlineStoreModal } from './PuriOnlineStoreModal';
import { SmartImage } from './SmartImage';
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
  Share2,
  Check,
  ShoppingBag,
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
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [puriStoreModalOpen, setPuriStoreModalOpen] = useState(false);
  const [puriStoreConfig, setPuriStoreConfig] = useState<PuriStoreConfig>(DEFAULT_PURI_STORE_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeDistrictItems((items) => {
      setDistrictItems(items);
      setLoading(false);

      // Deep link resolution for district & items
      try {
        if (typeof window !== 'undefined') {
          const preloaded = (window as any).__PRELOADED_STATE__;
          const params = new URLSearchParams(window.location.search);
          const pathParts = window.location.pathname.split('/').filter(Boolean);
          
          let targetDist = preloaded?.districtId || params.get('district') || '';
          let targetItem = preloaded?.itemId || params.get('item') || '';

          if (pathParts[0] === 'district' || pathParts[0] === 'districts') {
            if (pathParts[1]) targetDist = pathParts[1];
            if (pathParts[2]) targetItem = pathParts[2];
          } else if (pathParts[0] === 'place' || pathParts[0] === 'item') {
            if (pathParts[1]) targetItem = pathParts[1];
          }

          if (targetDist && ODISHA_DISTRICTS.some((d) => d.id.toLowerCase() === targetDist.toLowerCase())) {
            setSelectedDistrictId(targetDist.toLowerCase());
          }

          if (targetItem && items.length > 0) {
            const matched = items.find((i) => i.id === targetItem);
            if (matched) {
              setSelectedDetailItem(matched);
              if (matched.districtId) {
                setSelectedDistrictId(matched.districtId.toLowerCase());
              }
            }
          }
        }
      } catch {}
    });
    const unsubStore = subscribePuriStoreConfig((cfg) => {
      setPuriStoreConfig(cfg);
    });
    return () => {
      unsub();
      unsubStore();
    };
  }, []);

  const validStoreProducts = (puriStoreConfig.products || []).filter(
    (p) => p && p.photoUrl && p.buyLink && p.photoUrl.trim().length > 0 && p.buyLink.trim().length > 0
  );
  const hasStoreProducts = puriStoreConfig.enabled !== false && validStoreProducts.length > 0;

  // Update dynamic meta tags when modal opens
  useEffect(() => {
    if (selectedDetailItem) {
      setDynamicDistrictItemMeta(selectedDetailItem);
    }
  }, [selectedDetailItem]);

  const handleShareItem = async (item: DistrictItem) => {
    try {
      const res = await shareDistrictItemNative(item);
      if (res.success && res.method === 'clipboard') {
        setCopiedItemId(item.id);
        setTimeout(() => setCopiedItemId(null), 2500);
      }
    } catch (e) {
      console.error('Error sharing district item:', e);
    }
  };

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

      {/* ------------------------------------------------------------- */}
      {/* PURI (ପୁରୀ) ONLINE STORE / ପୂଜା ସାମଗ୍ରୀ INLINE CARD (White-Label) */}
      {/* ONLY rendered when real products exist in Firebase            */}
      {/* ------------------------------------------------------------- */}
      {selectedDistrictId === 'puri' && hasStoreProducts && (
        <div className="bg-gradient-to-r from-amber-900 via-[#8B0000] to-amber-950 text-white rounded-2xl p-3.5 sm:p-4 border-2 border-amber-400/60 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-200 shrink-0 shadow-inner">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-amber-200">
                  {puriStoreConfig.title || 'Online Store / ପୂଜା ସାମଗ୍ରୀ (Puri)'}
                </span>
                <span className="px-2 py-0.5 bg-amber-400/30 text-amber-200 font-bold rounded-md text-[9px] uppercase tracking-wider border border-amber-400/40">
                  ସ୍ୱତନ୍ତ୍ର ସେବା
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-amber-100/90 font-medium">
                {puriStoreConfig.subtitle || 'ପ୍ରଭୁ ଶ୍ରୀ ଜଗନ୍ନାଥ କାଠ ମୂର୍ତ୍ତି, ପିତ୍ତଳ ପୂଜା ଥାଳି, ଶୁଦ୍ଧ ଚନ୍ଦନ ଓ ଦିବ୍ୟ ପୂଜା ସାମଗ୍ରୀ'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setPuriStoreModalOpen(true)}
            type="button"
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#8B0000]" />
            <span>ଷ୍ଟୋର୍ ଦେଖନ୍ତୁ (View Store)</span>
          </button>
        </div>
      )}

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
          {filteredItems.map((item, itemIdx) => (
            <div
              key={item.id}
              onClick={() => setSelectedDetailItem(item)}
              className="bg-white rounded-3xl border border-amber-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5"
            >
              <div>
                {/* Image / Banner */}
                {item.imageUrl ? (
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <SmartImage
                      src={item.imageUrl}
                      alt={item.title}
                      priority={itemIdx < 3}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                    
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
              <div className="px-4 py-3 bg-amber-50/40 border-t border-amber-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-amber-900 font-extrabold flex items-center gap-1 group-hover:text-[#8B0000]">
                    <span>ସମ୍ପୂର୍ଣ୍ଣ ପଢ଼ନ୍ତୁ (Read Details)</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>

                  {/* Bright BLUE Share button directly next to Read Details */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareItem(item);
                    }}
                    title="Share"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-md"
                    style={{ display: 'inline-flex', zIndex: 30 }}
                  >
                    {copiedItemId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-white" />
                        <span>Share</span>
                      </>
                    )}
                  </button>
                </div>

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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShareItem(selectedDetailItem)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-md"
                  style={{ display: 'inline-flex', zIndex: 50 }}
                >
                  {copiedItemId === selectedDetailItem.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-white" />
                      <span>Share</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDetailItem(null)}
                  className="p-1.5 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Image */}
            {selectedDetailItem.imageUrl && (
              <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-slate-100 border border-amber-200 shadow-inner">
                <SmartImage
                  src={selectedDetailItem.imageUrl}
                  alt={selectedDetailItem.title}
                  priority={true}
                  containerClassName="w-full h-full"
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

              {/* Affiliate Product Recommendation Card if configured */}
              {Boolean(
                (selectedDetailItem.affiliateProductTitle && selectedDetailItem.affiliateProductTitle.trim()) ||
                (selectedDetailItem.affiliateTargetUrl && selectedDetailItem.affiliateTargetUrl.trim()) ||
                (selectedDetailItem.affiliateAd?.productTitle && selectedDetailItem.affiliateAd.productTitle.trim()) ||
                (selectedDetailItem.affiliateAd?.affiliateUrl && selectedDetailItem.affiliateAd.affiliateUrl.trim())
              ) && (
                <div className="pt-2">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3.5">
                    {(selectedDetailItem.affiliateProductImageUrl || selectedDetailItem.affiliateAd?.productImageUrl) && (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white border border-amber-200 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                        <SmartImage
                          src={selectedDetailItem.affiliateProductImageUrl || selectedDetailItem.affiliateAd?.productImageUrl || ''}
                          alt={selectedDetailItem.affiliateProductTitle || selectedDetailItem.affiliateAd?.productTitle || 'Product'}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-200/80 text-amber-950 rounded text-[10px] font-black uppercase tracking-wider">
                        <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                        <span>ସ୍ୱତନ୍ତ୍ର ପୂଜା ସାମଗ୍ରୀ • Special Offer</span>
                      </span>
                      <h5 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                        {selectedDetailItem.affiliateProductTitle || selectedDetailItem.affiliateAd?.productTitle || 'ପବିତ୍ର ପୂଜା ସାମଗ୍ରୀ ଓ ଧାର୍ମିକ ପୁସ୍ତକ'}
                      </h5>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Amazon ରେ ରିହାତି ମୂଲ୍ୟରେ ଉପଲବ୍ଧ | ସିଧାସଳଖ ଘରେ ଡେଲିଭରୀ ପାଆନ୍ତୁ।
                      </p>
                    </div>
                    <a
                      href={selectedDetailItem.affiliateTargetUrl || selectedDetailItem.affiliateAd?.affiliateUrl || 'https://www.amazon.in'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-[#ff9900] to-[#e68a00] hover:from-[#f08d00] hover:to-[#d67e00] text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Buy on Amazon</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Large Full-width Bright BLUE Share Temple Button at the very BOTTOM of the text */}
              <div className="pt-2 w-full" style={{ display: 'block', zIndex: 50 }}>
                <button
                  type="button"
                  onClick={() => handleShareItem(selectedDetailItem)}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black rounded-2xl text-sm sm:text-base shadow-xl transition cursor-pointer flex items-center justify-center gap-2 border-2 border-blue-400/40"
                  style={{ display: 'flex', zIndex: 50 }}
                >
                  {copiedItemId === selectedDetailItem.id ? (
                    <>
                      <Check className="w-5 h-5 text-white" />
                      <span className="font-black tracking-wide">ଲିଙ୍କ୍ କପି ହେଲା (Link Copied!)</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5 text-white" />
                      <span className="font-black tracking-wide">ମନ୍ଦିର ସେୟାର୍ କରନ୍ତୁ (Share Temple)</span>
                    </>
                  )}
                </button>
              </div>
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

      {/* Puri Online Store Modal */}
      <PuriOnlineStoreModal
        isOpen={puriStoreModalOpen}
        onClose={() => setPuriStoreModalOpen(false)}
      />
    </section>
  );
};
