import React, { useState, useEffect } from 'react';
import { SpiritualStory } from '../types';
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
} from 'lucide-react';
import { SmartImage } from './SmartImage';

interface SpiritualBlogProps {
  onBack: () => void;
  onNavigateToPanchang?: () => void;
}

export const SpiritualBlog: React.FC<SpiritualBlogProps> = ({ onBack, onNavigateToPanchang }) => {
  const [stories, setStories] = useState<SpiritualStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<SpiritualStory | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedStoryId, setCopiedStoryId] = useState<string | null>(null);
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});

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

  // 2. Dynamic SEO, Canonical Link & JSON-LD Schema Synchronizer
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
      } else {
        // Clear schema and restore standard blog category SEO
        clearStoryJsonLd();
        updateDocumentSeoAndCanonical(getSeoConfigForView('blog'));

        // Reset URL search parameter to standard blog view
        const targetUrl = `${window.location.pathname}?view=blog`;
        if (window.location.search !== '?view=blog') {
          window.history.replaceState({ viewMode: 'blog' }, '', targetUrl);
        }
      }
    } catch (err) {
      console.warn('Story SEO synchronization error:', err);
    }
  }, [selectedStory]);

  const categories = [
    { id: 'all', label: 'ସମସ୍ତ କାହାଣୀ (All)' },
    { id: 'ଜଗନ୍ନାଥ', label: '🚩 ଜଗନ୍ନାଥ ଲୀଳା' },
    { id: 'ପୁରାଣ', label: '📜 ପୁରାଣ ଓ ଇତିହାସ' },
    { id: 'ଶିବ', label: '🔱 ଶିବ ମହିମା' },
    { id: 'ଭକ୍ତି', label: '🪔 ଭକ୍ତି ଭାବ' },
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
            <span>ଦିବ୍ୟ ଆଧ୍ୟାତ୍ମିକ କଥା ଓ ବ୍ଲଗ୍ (Spiritual Stories & Blog)</span>
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
          <div className="md:col-span-5 h-56 md:h-full relative overflow-hidden bg-slate-900">
            <SmartImage
              src={featuredStory.imageUrl}
              alt={featuredStory.title}
              priority={true}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <span className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-amber-950 rounded-full text-[11px] font-black shadow-md flex items-center gap-1 z-10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ବିଶେଷ କାହାଣୀ (Featured)</span>
            </span>
          </div>

          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <span className="px-3 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black rounded-full inline-block">
                {featuredStory.category}
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
                <span className="px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-900 text-white font-extrabold rounded-xl text-xs flex items-center gap-1">
                  <span>ପଢ଼ନ୍ତୁ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-amber-950 flex items-center gap-2">
          <span>📚 ସମସ୍ତ ଆଧ୍ୟାତ୍ମିକ କଥା</span>
          <span className="text-xs text-amber-800 font-bold">({filteredStories.length} ଗୋଟି ଲେଖା)</span>
        </h3>

        {filteredStories.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-amber-300 space-y-2">
            <p className="text-sm font-bold text-slate-700">କୌଣସି କାହାଣୀ ମିଳିଲା ନାହିଁ (No stories found)</p>
            <p className="text-xs text-slate-500">ଦୟାକରି ଅନ୍ୟ କୌଣସି ଶବ୍ଦ କିମ୍ବା ବର୍ଗ ଚୟନ କରନ୍ତୁ।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStories.map((story, storyIdx) => (
              <div
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className="bg-white rounded-3xl border-2 border-amber-300 hover:border-amber-500 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between cursor-pointer group transform hover:-translate-y-1"
              >
                <div>
                  <div className="h-44 w-full relative overflow-hidden bg-slate-900">
                    <SmartImage
                      src={story.imageUrl}
                      alt={story.title}
                      priority={storyIdx < 3}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-amber-950/80 text-amber-200 rounded-full text-[10px] font-black backdrop-blur-xs border border-amber-400/40 z-10">
                      {story.category}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-2">
                    <h4 className="font-black text-slate-900 group-hover:text-amber-900 transition-colors line-clamp-2 text-sm sm:text-base leading-snug">
                      {story.title}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium line-clamp-3 leading-relaxed">
                      {story.summary}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 pt-0 border-t border-amber-100 flex items-center justify-between gap-2 mt-2">
                  <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" />
                    <span>{story.readTimeMinutes} ମିନିଟ୍</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleLike(e, story.id)}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition ${
                        likedStories[story.id]
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedStories[story.id] ? 'fill-rose-600' : ''}`} />
                      <span className="text-[11px]">{story.likesCount || 0}</span>
                    </button>

                    <button
                      onClick={(e) => handleShareStory(e, story)}
                      title="Share Story"
                      className="p-1.5 rounded-lg text-xs bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300"
                    >
                      {copiedStoryId === story.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5 text-amber-900" />
                      )}
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header Bar */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#5c0f12] via-[#8B0000] to-[#3a0608] text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-400/20 border border-amber-400/50 text-amber-300 rounded-full text-xs font-black">
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
              {/* Image banner if present */}
              {selectedStory.imageUrl && (
                <div className="h-56 sm:h-72 w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md">
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

              {/* Full Content Body with beautiful typography */}
              <div className="prose prose-amber max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-4 font-normal">
                {selectedStory.content.split('\n\n').map((para, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 sm:p-5 bg-amber-50 border-t border-amber-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleLike(e, selectedStory.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                    likedStories[selectedStory.id]
                      ? 'bg-rose-600 text-white border-rose-700'
                      : 'bg-white text-slate-700 hover:bg-rose-50 border-amber-300'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${likedStories[selectedStory.id] ? 'fill-white' : ''}`} />
                  <span>{selectedStory.likesCount || 0} ଲୋକଙ୍କୁ ପସନ୍ଦ ଆସିଛି</span>
                </button>

                <button
                  onClick={(e) => handleShareStory(e, selectedStory)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1.5 transition cursor-pointer"
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
    </div>
  );
};
