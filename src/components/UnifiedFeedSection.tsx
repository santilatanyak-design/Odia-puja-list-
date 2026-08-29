import React, { useState, useEffect } from 'react';
import { UnifiedFeedItem } from '../types';
import { getAllContent } from '../lib/contentApi';
import { SmartImage } from './SmartImage';
import { getCategoryBadgeStyle } from './SpiritualBlog';
import {
  BookOpen,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Sparkles,
  Search,
  Tag,
  Share2,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface UnifiedFeedSectionProps {
  onNavigateToBlog?: (storyId?: string) => void;
  onNavigateToTemple?: (templeId?: string) => void;
}

export const UnifiedFeedSection: React.FC<UnifiedFeedSectionProps> = ({
  onNavigateToBlog,
  onNavigateToTemple,
}) => {
  const [feedItems, setFeedItems] = useState<UnifiedFeedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const items = await getAllContent();
      setFeedItems(items);
    } catch (err) {
      console.warn('Error loading unified feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();

    // Listen for custom post and temple updates
    const handleUpdate = () => {
      loadFeed();
    };
    window.addEventListener('temple_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('temple_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const categories = [
    { id: 'all', label: 'ସମସ୍ତ ଫିଡ୍ (All Feed)' },
    { id: 'custom', label: '✍️ ନୂତନ ପୋଷ୍ଟ (Custom Posts)' },
    { id: 'temple', label: '🛕 ମନ୍ଦିର (Temples)' },
    { id: 'purana', label: '📜 ପୁରାଣ ଓ ଇତିହାସ' },
  ];

  const filteredItems = feedItems.filter((item) => {
    let matchesCategory = true;
    if (selectedCategory === 'custom') {
      matchesCategory = item.sourceType === 'custom_post';
    } else if (selectedCategory === 'temple') {
      matchesCategory = item.sourceType === 'temple';
    } else if (selectedCategory === 'purana') {
      matchesCategory = item.sourceType === 'purana' || item.sourceType === 'district_story';
    }

    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleCardClick = (item: UnifiedFeedItem) => {
    if (item.sourceType === 'custom_post') {
      if (onNavigateToBlog) {
        onNavigateToBlog(item.id);
      }
    } else if (item.sourceType === 'temple') {
      if (onNavigateToTemple) {
        const rawTempleId = item.id.replace('temple-', '');
        onNavigateToTemple(rawTempleId);
      }
    } else {
      if (onNavigateToBlog) {
        onNavigateToBlog(item.id);
      }
    }
  };

  const handleShare = (e: React.MouseEvent, item: UnifiedFeedItem) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/?item=${encodeURIComponent(item.id)}`;
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.summary,
        url: shareUrl,
      }).catch(() => {});
    } else {
      try {
        navigator.clipboard.writeText(shareUrl);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2500);
      } catch {}
    }
  };

  return (
    <section id="main-unified-feed-section" className="space-y-4 pt-2">
      {/* Section Title & News Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-2 border-slate-200/90 relative">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block animate-pulse" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              ସଦ୍ୟତମ ଧାର୍ମିକ ସମ୍ବାଦ ଓ ଫିଡ୍ (Devotional News Portal)
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
            ପବିତ୍ର ମନ୍ଦିର, ପୁରାଣ କଥା ଓ ଆଧ୍ୟାତ୍ମିକ ଅପଡେଟ୍ (Top Stories & Latest Updates)
          </p>
          {/* Colored Underline Accent */}
          <div className="absolute -bottom-0.5 left-0 w-28 sm:w-36 h-0.5 bg-orange-600" />
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-60">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ଖୋଜନ୍ତୁ (Search stories)..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black shadow-2xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2 bg-white rounded-2xl border border-slate-200/80">
          <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-600">ଖବର ଲୋଡ୍ ହେଉଛି (Loading News)...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <BookOpen className="w-8 h-8 text-orange-600/50 mx-auto" />
          <p className="text-xs font-bold text-slate-700">କୌଣସି ପୋଷ୍ଟ ମିଳିଲା ନାହିଁ (No posts found)</p>
          <p className="text-[11px] text-slate-500">ଅନ୍ୟ ବର୍ଗ ଚୟନ କରନ୍ତୁ କିମ୍ବା ଆଡମିନ୍ ପ୍ୟାନେଲ୍‌ରୁ ନୂତନ ପୋଷ୍ଟ ଯୋଡ଼ନ୍ତୁ।</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 1. FEATURED TOP STORY HERO */}
          {filteredItems[0] && (
            <article
              onClick={() => handleCardClick(filteredItems[0])}
              className="bg-white rounded-2xl border border-slate-200 hover:border-orange-400 overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer group select-none"
            >
              {/* Full-Width Hero Image with Subtle Zoom */}
              <div className="relative w-full h-48 sm:h-64 md:h-72 bg-slate-900 overflow-hidden">
                <SmartImage
                  src={filteredItems[0].imageUrl}
                  alt={filteredItems[0].title}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Gradient for Text Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                {/* Top Badge: Featured Top Story & Category */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2.5 py-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black rounded-md text-[10px] sm:text-xs shadow-md uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-200" />
                    <span>Top Story • ମୁଖ୍ୟ ଖବର</span>
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-black shadow-md border ${getCategoryBadgeStyle(
                      filteredItems[0].category
                    )}`}
                  >
                    {filteredItems[0].category}
                  </span>
                </div>

                {/* Top Right Share Button */}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    type="button"
                    onClick={(e) => handleShare(e, filteredItems[0])}
                    title="Share Top Story"
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition cursor-pointer border border-white/20"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Headline & Excerpt Below Large Image */}
              <div className="p-4 sm:p-5 space-y-2">
                <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 leading-snug group-hover:text-orange-600 transition-colors">
                  {filteredItems[0].title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {filteredItems[0].summary}
                </p>

                {/* Bottom Meta & Read Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-600 font-semibold">
                      <User className="w-3 h-3 text-orange-600" />
                      <span>{filteredItems[0].author || 'ପଣ୍ଡିତ ମହାଶୟ'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{filteredItems[0].publishedAt}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-orange-700 font-semibold">
                      <Clock className="w-3 h-3 text-orange-600" />
                      <span>{filteredItems[0].readTimeMinutes || 3} min</span>
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-orange-600 font-black text-xs group-hover:translate-x-0.5 transition-transform">
                    <span>ସମ୍ପୂର୍ଣ୍ଣ ପଢ଼ନ୍ତୁ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </article>
          )}

          {/* 2. SECTION SUB-HEADER FOR REMAINING STORIES */}
          {filteredItems.length > 1 && (
            <div className="pt-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 relative mb-3">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-orange-600 inline-block" />
                  <span>ଅଧିକ ସମ୍ବାଦ ଓ ଧାର୍ମିକ ଅପଡେଟ୍ (More Stories & News)</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {filteredItems.length - 1} Posts
                </span>
                <div className="absolute -bottom-px left-0 w-20 h-0.5 bg-orange-600" />
              </div>

              {/* 3. COMPACT NEWS LIST VIEW (Remaining Posts) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {filteredItems.slice(1).map((item) => {
                  const badgeClass = getCategoryBadgeStyle(item.category);

                  return (
                    <article
                      key={item.id}
                      onClick={() => handleCardClick(item)}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 hover:bg-orange-50/30 transition-colors cursor-pointer group select-none"
                    >
                      {/* Left Thumbnail: Medium-Small Square */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80">
                        <SmartImage
                          src={item.imageUrl}
                          alt={item.title}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {item.isFeatured && (
                          <span className="absolute top-1 left-1 px-1 py-0.2 bg-orange-500 text-white font-black rounded text-[8px] shadow-xs">
                            Top
                          </span>
                        )}
                      </div>

                      {/* Right Details: Badge, Title (Max 2 lines), Excerpt (1 line) */}
                      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5 self-stretch">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black tracking-wide border shadow-2xs ${badgeClass}`}
                            >
                              {item.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium hidden xs:inline">
                              • {item.author || 'ପଣ୍ଡିତ ମହାଶୟ'}
                            </span>
                          </div>

                          {/* Bold Headline */}
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
                            {item.title}
                          </h4>

                          {/* 1-Line Description */}
                          <p className="text-[11px] sm:text-xs text-slate-500 font-normal leading-relaxed line-clamp-1">
                            {item.summary}
                          </p>
                        </div>

                        {/* Date & Meta */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 mt-auto">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5 text-slate-400" />
                              <span>{item.publishedAt}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-500 font-semibold">
                              <Clock className="w-2.5 h-2.5 text-orange-600" />
                              <span>{item.readTimeMinutes || 3} min</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleShare(e, item)}
                              title="Share post"
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                            >
                              <Share2 className="w-3 h-3" />
                            </button>
                            <span className="hidden sm:inline-flex items-center gap-0.5 font-bold text-orange-600 text-[10px]">
                              <span>Read</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </section>
  );
};
