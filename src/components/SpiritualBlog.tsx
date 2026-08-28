import React, { useState, useEffect, useRef } from 'react';
import { SpiritualStory, AffiliateProductAd } from '../types';
import { subscribeSpiritualStories, likeSpiritualStory, DEFAULT_STORIES } from '../lib/contentApi';
import {
  updateStorySeoAndJsonLd,
  clearStoryJsonLd,
  updateDocumentSeoAndCanonical,
  getSeoConfigForView,
  getBaseOrigin,
} from '../lib/seoHelper';
import {
  BookOpen,
  Search,
  Heart,
  Share2,
  Clock,
  User,
  Sparkles,
  ArrowRight,
  X,
  Check,
  Flame,
  Tag,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react';
import { SmartImage } from './SmartImage';
import { AffiliateAdModal } from './AffiliateAdModal';

interface SpiritualBlogProps {
  onBack: () => void;
  onNavigateToPanchang?: () => void;
}

// Category Color Mapping Helper
export const getCategoryBadgeStyle = (category: string = ''): string => {
  const cat = category.toLowerCase().trim();
  if (cat.includes('ଜଗନ୍ନାଥ') || cat.includes('jagannath') || cat.includes('ପୂଜା')) {
    return 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-400';
  }
  if (cat.includes('ଶିବ') || cat.includes('shiva') || cat.includes('ମହାଦେବ')) {
    return 'bg-gradient-to-r from-indigo-700 to-blue-800 text-white border-indigo-400';
  }
  if (cat.includes('ପୁରାଣ') || cat.includes('ଇତିହାସ') || cat.includes('purana')) {
    return 'bg-gradient-to-r from-amber-700 to-orange-800 text-white border-amber-400';
  }
  if (cat.includes('ଆୟୁର୍ବେଦ') || cat.includes('ଜୀବନ') || cat.includes('lifestyle')) {
    return 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white border-emerald-400';
  }
  if (cat.includes('ଭକ୍ତି') || cat.includes('ସାହିତ୍ୟ') || cat.includes('bhakti')) {
    return 'bg-gradient-to-r from-purple-700 to-violet-800 text-white border-purple-400';
  }
  if (cat.includes('ମନ୍ଦିର') || cat.includes('temple')) {
    return 'bg-gradient-to-r from-amber-800 to-yellow-900 text-white border-amber-400';
  }
  // Default dynamic hash color
  return 'bg-gradient-to-r from-amber-800 to-slate-900 text-white border-amber-300';
};

export const SpiritualBlog: React.FC<SpiritualBlogProps> = ({ onBack, onNavigateToPanchang }) => {
  const [stories, setStories] = useState<SpiritualStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<SpiritualStory | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedStoryId, setCopiedStoryId] = useState<string | null>(null);
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});

  // Smart Affiliate Ad Pop-up State
  const [isAdOpen, setIsAdOpen] = useState<boolean>(false);
  const [activeAd, setActiveAd] = useState<AffiliateProductAd | null>(null);
  const adTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Subscribe to spiritual stories
  useEffect(() => {
    const unsub = subscribeSpiritualStories((data) => {
      if (Array.isArray(data)) {
        setStories(data);

        // Check if there's a deep-linked storyId in preloaded state, pathname, or URL search parameters
        try {
          if (typeof window !== 'undefined') {
            const preloadedId = (window as any).__PRELOADED_STATE__?.storyId;
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            let pathStoryId = '';
            if (pathParts[0] === 'story' || pathParts[0] === 'blog' || pathParts[0] === 'stories') {
              pathStoryId = pathParts[1] || '';
            }
            const params = new URLSearchParams(window.location.search);
            const targetStoryId = preloadedId || pathStoryId || params.get('storyId') || params.get('story');
            if (targetStoryId) {
              const matched = data.find((s) => s.id === targetStoryId);
              if (matched) {
                setSelectedStory(matched);
              }
            }
          }
        } catch {
          // Safe skip
        }
      }
    });
    return () => {
      unsub();
      clearStoryJsonLd();
    };
  }, []);

  // 2. Dynamic SEO, Canonical Link & JSON-LD Schema Synchronizer + Smart Affiliate Ad Trigger
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      if (selectedStory) {
        // Inject Article/BlogPosting Schema and meta tags for the active story
        updateStorySeoAndJsonLd(selectedStory);

        // Sync URL to exact canonical story URL
        const targetUrl = `/story/${encodeURIComponent(selectedStory.id)}`;
        if (window.location.pathname !== targetUrl && window.location.search !== `?view=blog&storyId=${encodeURIComponent(selectedStory.id)}`) {
          window.history.replaceState({ viewMode: 'blog', storyId: selectedStory.id }, '', targetUrl);
        }

        // Setup Smart Affiliate Ad with Delay Trigger
        if (adTimeoutRef.current) {
          clearTimeout(adTimeoutRef.current);
          adTimeoutRef.current = null;
        }

        const adConfig: AffiliateProductAd = selectedStory.affiliateAd || {
          enabled: true,
          productTitle: 'ପବିତ୍ର ଓଡ଼ିଆ ଭାଗବତ ଓ ପୂଜା ସାମଗ୍ରୀ ସେଟ୍',
          productImageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=600&auto=format&fit=crop',
          productDescription: 'ଶୁଦ୍ଧ ଚନ୍ଦନ କାଠ, ଅଗରବତୀ, ପିତ୍ତଳ ଦୀପ ଓ ଶ୍ରୀମଦ୍ ଭାଗବତ ଗ୍ରନ୍ଥ। Amazon ରେ ସ୍ୱତନ୍ତ୍ର ରିହାତି ସହ ଉପଲବ୍ଧ।',
          productPrice: 'Special ₹299 (Save 40%)',
          affiliateUrl: 'https://www.amazon.in',
          triggerDelaySeconds: 4,
          countdownSeconds: 5,
        };

        if (adConfig.enabled !== false) {
          setActiveAd(adConfig);
          const delayMs = (adConfig.triggerDelaySeconds || 4) * 1000;
          adTimeoutRef.current = setTimeout(() => {
            setIsAdOpen(true);
          }, delayMs);
        } else {
          setActiveAd(null);
          setIsAdOpen(false);
        }
      } else {
        // Clear schema and restore standard blog category SEO
        clearStoryJsonLd();
        updateDocumentSeoAndCanonical(getSeoConfigForView('blog'));

        // Reset URL search parameter to standard blog view
        const targetUrl = `${window.location.pathname}?view=blog`;
        if (window.location.search !== '?view=blog') {
          window.history.replaceState({ viewMode: 'blog' }, '', targetUrl);
        }

        if (adTimeoutRef.current) {
          clearTimeout(adTimeoutRef.current);
          adTimeoutRef.current = null;
        }
        setIsAdOpen(false);
        setActiveAd(null);
      }
    } catch (err) {
      console.warn('Story SEO synchronization error:', err);
    }

    return () => {
      if (adTimeoutRef.current) {
        clearTimeout(adTimeoutRef.current);
        adTimeoutRef.current = null;
      }
    };
  }, [selectedStory]);

  const categories = [
    { id: 'all', label: 'ସମସ୍ତ କାହାଣୀ (All)' },
    { id: 'ଜଗନ୍ନାଥ', label: '🚩 ଜଗନ୍ନାଥ ଲୀଳା' },
    { id: 'ପୁରାଣ', label: '📜 ପୁରାଣ ଓ ଇତିହାସ' },
    { id: 'ଶିବ', label: '🔱 ଶିବ ମହିମା' },
    { id: 'ଭକ୍ତି', label: '🪔 ଭକ୍ତି ଭାବ' },
    { id: 'ଆୟୁର୍ବେଦ', label: '🌿 ଆୟୁର୍ବେଦ ଓ ଜୀବନ' },
  ];

  const filteredStories = stories.filter((story) => {
    const matchesCategory =
      activeCategory === 'all' ||
      story.category.toLowerCase().includes(activeCategory.toLowerCase());
    const matchesSearch =
      !searchQuery.trim() ||
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredStory = stories.find((s) => s.isFeatured) || (stories.length > 0 ? stories[0] : null);

  const handleLike = async (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    if (likedStories[storyId]) return;
    setLikedStories((prev) => ({ ...prev, [storyId]: true }));
    const newCount = await likeSpiritualStory(storyId);
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, likesCount: newCount } : s))
    );
    if (selectedStory && selectedStory.id === storyId) {
      setSelectedStory((prev) => (prev ? { ...prev, likesCount: newCount } : null));
    }
  };

  const handleShareStory = (e: React.MouseEvent, story: SpiritualStory) => {
    e.stopPropagation();
    const origin = getBaseOrigin();
    const storyCanonicalLink = `${origin}/story/${encodeURIComponent(story.id)}`;
    const shareText = `📖 *${story.title}*
${story.summary}

✍️ ଲେଖକ: ${story.author}
ପଢ଼ନ୍ତୁ ସମ୍ପୂର୍ଣ୍ଣ କାହାଣୀ ପୂଜା ସାମଗ୍ରୀ ପୋର୍ଟାଲରେ: ${storyCanonicalLink}`;

    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: shareText,
        url: storyCanonicalLink,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedStoryId(story.id);
      setTimeout(() => setCopiedStoryId(null), 2500);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 box-border">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-amber-400 shadow-xs"
        >
          <span>←</span>
          <span>ମୁଖ୍ୟ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ (Back to Home)</span>
        </button>

        {onNavigateToPanchang && (
          <button
            onClick={onNavigateToPanchang}
            className="px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <span>📅</span>
            <span>ଦୈନିକ ପଞ୍ଜିକା (Panchang)</span>
          </button>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#4c0b0e] via-[#751117] to-[#2c0507] text-white border-2 sm:border-3 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-44 h-44 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-400/25 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-400/20 border border-amber-400/60 rounded-full text-xs text-amber-300 font-extrabold backdrop-blur-xs">
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            <span>ଦିବ୍ୟ ଆଧ୍ୟାତ୍ମିକ କଥା ଓ ବ୍ଲଗ୍ (Spiritual Stories & Lifestyle Feed)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-amber-100 tracking-tight leading-tight">
            ପୁରାଣ, ଜଗନ୍ନାଥ ଲୀଳା ଓ ଭକ୍ତି ରସାମୃତ
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/90 font-medium max-w-2xl leading-relaxed">
            ପ୍ରଭୁ ଶ୍ରୀ ଜଗନ୍ନାଥଙ୍କ ଅପାର ମହିମା, ଭକ୍ତଙ୍କ ଅଲୌକିକ ଅନୁଭୂତି ଏବଂ ଓଡ଼ିଶାର ଶାସ୍ତ୍ରୀୟ ପରମ୍ପରାର ପ୍ରେରଣାଦାୟୀ କାହାଣୀ ସମୂହ।
          </p>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-amber-800 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="କାହାଣୀ କିମ୍ବା ବିଷୟ ଖୋଜନ୍ତୁ (Search stories by title or keywords)..."
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-amber-300 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-amber-800 text-white shadow-sm border border-amber-950 font-black'
                  : 'bg-amber-100/90 text-amber-950 hover:bg-amber-200 border border-amber-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Story Hero (if no search filter active) */}
      {!searchQuery && activeCategory === 'all' && featuredStory && (
        <div
          onClick={() => setSelectedStory(featuredStory)}
          className="bg-white rounded-3xl border-2 border-amber-400 shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition group grid grid-cols-1 md:grid-cols-12"
        >
          <div className="md:col-span-5 h-60 md:h-full relative overflow-hidden bg-slate-900">
            <SmartImage
              src={featuredStory.imageUrl}
              alt={featuredStory.title}
              priority={true}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-tl-2xl rounded-tr-2xl md:rounded-tr-none md:rounded-bl-2xl"
            />
            {/* Color Coded Category Badge */}
            <span
              className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-black shadow-lg border flex items-center gap-1 z-10 ${getCategoryBadgeStyle(
                featuredStory.category
              )}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{featuredStory.category}</span>
            </span>
          </div>

          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <span className="px-3 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black rounded-full inline-block">
                ⭐ Featured Story
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-amber-900 transition-colors leading-snug">
                {featuredStory.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-3 leading-relaxed">
                {featuredStory.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-amber-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>{featuredStory.author}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>{featuredStory.readTimeMinutes} ମିନିଟ୍ ପଠନ</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleLike(e, featuredStory.id)}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition ${
                    likedStories[featuredStory.id]
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${likedStories[featuredStory.id] ? 'fill-rose-600' : ''}`} />
                  <span>{featuredStory.likesCount || 0}</span>
                </button>
                <button
                  onClick={(e) => handleShareStory(e, featuredStory)}
                  className="p-2 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 flex items-center gap-1 transition"
                  title="Share Story"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
                <span className="px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-900 text-white font-extrabold rounded-xl text-xs flex items-center gap-1">
                  <span>ସମ୍ପୂର୍ଣ୍ଣ ପଢ଼ନ୍ତୁ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FRONT-END FEED (Card Layout) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-black text-amber-950 flex items-center gap-2">
            <span>📚 ସମସ୍ତ ଆଧ୍ୟାତ୍ମିକ କଥା ଓ ପୋଷ୍ଟ ଫିଡ୍</span>
            <span className="text-xs text-amber-800 font-bold">({filteredStories.length} ଗୋଟି ଲେଖା)</span>
          </h3>
        </div>

        {filteredStories.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-amber-300 space-y-2 shadow-sm">
            <p className="text-sm font-bold text-slate-700">କୌଣସି କାହାଣୀ ମିଳିଲା ନାହିଁ (No stories found)</p>
            <p className="text-xs text-slate-500">ଦୟାକରି ଅନ୍ୟ କୌଣସି ଶବ୍ଦ କିମ୍ବା ବର୍ଗ ଚୟନ କରନ୍ତୁ।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story, storyIdx) => (
              <div
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className="bg-white rounded-3xl border-2 border-amber-300/80 hover:border-amber-500 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer group transform hover:-translate-y-1"
              >
                <div>
                  {/* Large Image Positioned at the Top with slightly rounded corners & Overlapping Category Tag */}
                  <div className="h-52 w-full relative overflow-hidden bg-slate-900 rounded-t-3xl">
                    <SmartImage
                      src={story.imageUrl}
                      alt={story.title}
                      priority={storyIdx < 3}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Category Tag: Small, Color-Coded Badge Overlapping Top-Left of Image */}
                    <div className="absolute top-3 left-3 z-10">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-black shadow-lg border backdrop-blur-xs flex items-center gap-1 ${getCategoryBadgeStyle(
                          story.category
                        )}`}
                      >
                        <Tag className="w-3 h-3" />
                        <span>{story.category}</span>
                      </span>
                    </div>

                    {story.affiliateAd?.enabled && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="px-2 py-0.5 bg-black/60 backdrop-blur-xs text-amber-300 rounded-full text-[10px] font-black border border-amber-400/40 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-amber-400" />
                          <span>Special Offer</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body with Bold Title & Snippet */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <h4 className="font-black text-slate-900 group-hover:text-amber-900 transition-colors line-clamp-2 text-base sm:text-lg leading-snug">
                      {story.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-3 leading-relaxed">
                      {story.summary}
                    </p>
                  </div>
                </div>

                {/* Card Action Buttons: Read Details & Share */}
                <div className="p-4 sm:p-5 pt-0 border-t border-amber-100/80 flex items-center justify-between gap-2 mt-3">
                  <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" />
                    <span>{story.readTimeMinutes} ମିନିଟ୍</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Share Button */}
                    <button
                      type="button"
                      onClick={(e) => handleShareStory(e, story)}
                      title="Share Story (ଶେୟାର କରନ୍ତୁ)"
                      className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedStoryId === story.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-amber-900" />
                          <span>ଶେୟାର</span>
                        </>
                      )}
                    </button>

                    {/* Read Details Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStory(story);
                      }}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 transition shadow-xs cursor-pointer"
                    >
                      <span>ପଢ଼ନ୍ତୁ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULL STORY READER MODAL */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header Bar */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#5c0f12] via-[#8B0000] to-[#3a0608] text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-0.5 rounded-full text-xs font-black border ${getCategoryBadgeStyle(selectedStory.category)}`}>
                  {selectedStory.category}
                </span>
                <span className="text-xs text-amber-200 font-bold hidden sm:inline">
                  • {selectedStory.readTimeMinutes} ମିନିଟ୍ ପଠନ
                </span>
              </div>

              <button
                onClick={() => setSelectedStory(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1">
              {/* Image banner */}
              {selectedStory.imageUrl && (
                <div className="h-60 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md">
                  <SmartImage
                    src={selectedStory.imageUrl}
                    alt={selectedStory.title}
                    priority={true}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h2 className="text-xl sm:text-3xl font-black text-amber-950 leading-tight">
                  {selectedStory.title}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-bold mt-2 pt-2 border-t border-amber-100">
                  <span className="flex items-center gap-1 text-amber-900 font-extrabold">
                    <User className="w-3.5 h-3.5" />
                    <span>ଲେଖକ: {selectedStory.author}</span>
                  </span>
                  <span>•</span>
                  <span>ପ୍ରକାଶନ: {selectedStory.publishedAt}</span>
                </div>
              </div>

              {/* Story summary quote */}
              {selectedStory.summary && (
                <div className="p-4 bg-amber-50 border-l-4 border-amber-600 rounded-r-2xl italic text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
                  "{selectedStory.summary}"
                </div>
              )}

              {/* Full Content Body with beautiful typography & markdown support */}
              <div className="prose prose-amber max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-4 font-normal">
                {selectedStory.content.split('\n\n').map((para, idx) => {
                  const trimmed = para.trim();
                  if (trimmed.startsWith('### ')) {
                    return (
                      <h3 key={idx} className="text-base sm:text-lg font-black text-amber-950 pt-2 pb-1 border-b border-amber-200">
                        {trimmed.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (trimmed.startsWith('> ')) {
                    return (
                      <blockquote key={idx} className="p-3 bg-amber-50/80 border-l-4 border-amber-700 rounded-r-xl italic font-bold text-amber-900 text-xs sm:text-sm">
                        {trimmed.replace('> ', '')}
                      </blockquote>
                    );
                  }
                  if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
                    return (
                      <div key={idx} className="pl-2 space-y-1">
                        {trimmed.split('\n').map((line, lIdx) => (
                          <div key={lIdx} className="flex items-start gap-2">
                            <span className="text-amber-700 font-bold">•</span>
                            <span>{line.replace(/^[•\-]\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="leading-relaxed">
                      {para}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 sm:p-5 bg-amber-50 border-t border-amber-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleLike(e, selectedStory.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                    likedStories[selectedStory.id]
                      ? 'bg-rose-600 text-white border-rose-700'
                      : 'bg-white text-slate-700 hover:bg-rose-50 border-amber-300'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${likedStories[selectedStory.id] ? 'fill-white' : ''}`} />
                  <span>{selectedStory.likesCount || 0} ଲାଇକ୍</span>
                </button>

                <button
                  onClick={(e) => handleShareStory(e, selectedStory)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedStoryId === selectedStory.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-amber-800" />
                      <span>Share Story</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setSelectedStory(null)}
                className="px-5 py-2 bg-gradient-to-r from-amber-800 to-amber-950 text-white font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                ବନ୍ଦ କରନ୍ତୁ (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART AFFILIATE PRODUCT POP-UP AD MODAL (Delay Trigger + Countdown + Auto-Dismiss) */}
      {activeAd && (
        <AffiliateAdModal
          ad={activeAd}
          isOpen={isAdOpen}
          onClose={() => setIsAdOpen(false)}
          lang="OD"
        />
      )}
    </div>
  );
};

