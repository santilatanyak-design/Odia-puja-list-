import React, { useState, useEffect, useRef } from 'react';
import { SpiritualStory, AffiliateProductAd } from '../types';
import { subscribeSpiritualStories, likeSpiritualStory, DEFAULT_STORIES, normalizeStory } from '../lib/contentApi';
import { getDistrictItems } from '../lib/districtApi';
import {
  updateStorySeoAndJsonLd,
  clearStoryJsonLd,
  updateDocumentSeoAndCanonical,
  getSeoConfigForView,
  getBaseOrigin,
} from '../lib/seoHelper';
import {
  shareStoryNative,
  setDynamicStoryMeta,
  getStoryShareUrl,
  openFacebookShare,
  openWhatsAppDirectShare,
  openShareChatShare,
  openThreadsShare,
  openFacebookDebugger,
  refreshFacebookOgCache,
} from '../lib/ogMetaHelper';
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
  ChevronLeft,
  Calendar,
  Eye,
} from 'lucide-react';
import { SmartImage } from './SmartImage';
import { AffiliateAdModal } from './AffiliateAdModal';
import { findTriggerInText, logAffiliateDebug } from '../lib/adUtils';

interface SpiritualBlogProps {
  initialStoryId?: string | null;
  onBack: () => void;
  onNavigateToPanchang?: () => void;
}

// Category Color Mapping Helper
export const getCategoryBadgeStyle = (category: string = ''): string => {
  const cat = category.toLowerCase().trim();
  if (cat.includes('ଜଗନ୍ନାଥ') || cat.includes('jagannath') || cat.includes('ପୂଜା')) {
    return 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-400';
  }
  if (cat.includes('ଶିବ') || cat.includes('shiva') || cat.includes('ମହାଦେବ')) {
    return 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white border-indigo-400';
  }
  if (cat.includes('ପୁରାଣ') || cat.includes('ଇତିହାସ') || cat.includes('purana')) {
    return 'bg-gradient-to-r from-amber-600 to-orange-700 text-white border-amber-400';
  }
  if (cat.includes('ଆୟୁର୍ବେଦ') || cat.includes('ଜୀବନ') || cat.includes('lifestyle')) {
    return 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400';
  }
  if (cat.includes('ଭକ୍ତି') || cat.includes('ସାହିତ୍ୟ') || cat.includes('bhakti')) {
    return 'bg-gradient-to-r from-purple-600 to-violet-700 text-white border-purple-400';
  }
  if (cat.includes('ମନ୍ଦିର') || cat.includes('temple')) {
    return 'bg-gradient-to-r from-amber-700 to-yellow-800 text-white border-amber-400';
  }
  return 'bg-gradient-to-r from-orange-600 to-amber-700 text-white border-orange-300';
};

export const SpiritualBlog: React.FC<SpiritualBlogProps> = ({
  initialStoryId,
  onBack,
  onNavigateToPanchang,
}) => {
  const [stories, setStories] = useState<SpiritualStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<SpiritualStory | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedStoryId, setCopiedStoryId] = useState<string | null>(null);
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});

  // Smart Affiliate Ad Pop-up State (Time Delay & Scroll Depth Cliffhanger Trigger)
  const [isAdOpen, setIsAdOpen] = useState<boolean>(false);
  const [activeAd, setActiveAd] = useState<AffiliateProductAd | null>(null);
  const adTriggeredForStoryRef = useRef<Record<string, boolean>>({});
  const articleContainerRef = useRef<HTMLDivElement | null>(null);

  const handleCloseAd = React.useCallback(() => {
    setIsAdOpen(false);
  }, []);

  // 1. Subscribe to spiritual stories
  useEffect(() => {
    const unsub = subscribeSpiritualStories((data) => {
      if (Array.isArray(data)) {
        setStories(data);
      }
    });
    return () => {
      unsub();
      clearStoryJsonLd();
    };
  }, []);

  // 2. Resolve initialStoryId or URL params into selectedStory
  useEffect(() => {
    const resolveTargetStory = async () => {
      let targetId = initialStoryId;

      if (!targetId && typeof window !== 'undefined') {
        const preloadedId = (window as any).__PRELOADED_STATE__?.storyId;
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        let pathStoryId = '';
        if (pathParts[0] === 'story' || pathParts[0] === 'blog' || pathParts[0] === 'stories') {
          pathStoryId = pathParts[1] || '';
        }
        const params = new URLSearchParams(window.location.search);
        targetId = preloadedId || pathStoryId || params.get('storyId') || params.get('story');
      }

      if (!targetId) return;

      const cleanTargetId = String(targetId)
        .replace(/^(\/)?story\//i, '')
        .replace(/\.html?$/i, '')
        .replace(/\/$/, '')
        .trim();

      if (!cleanTargetId) return;

      // 1. Check in regular stories
      const matched = stories.find(
        (s) => s.id === cleanTargetId || s.id === targetId || s.id.endsWith(cleanTargetId)
      );
      if (matched) {
        setSelectedStory(matched);
        return;
      }

      // 2. Check in DEFAULT_STORIES fallback
      const defaultMatch = DEFAULT_STORIES.find(
        (s) => s.id === cleanTargetId || s.id === targetId
      );
      if (defaultMatch) {
        setSelectedStory(defaultMatch);
        return;
      }

      // 3. Check in posts.json directly for immediate resolution
      try {
        const res = await fetch('/posts.json');
        if (res.ok) {
          const posts = await res.json();
          const rawItem =
            posts[cleanTargetId] ||
            posts[`/story/${cleanTargetId}`] ||
            posts[`/story/${cleanTargetId}.html`] ||
            posts[`story-${cleanTargetId}`];
          if (rawItem) {
            const normalized = normalizeStory(rawItem);
            if (normalized) {
              setSelectedStory(normalized);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('posts.json lookup error:', err);
      }

      // 4. Check if district heritage / purana item
      if (cleanTargetId.startsWith('district-') || cleanTargetId.length > 0) {
        try {
          const dItems = await getDistrictItems();
          const rawId = cleanTargetId.replace('district-', '');
          const dMatch = dItems.find((d) => d.id === rawId || `district-${d.id}` === cleanTargetId);
          if (dMatch) {
            const isPurana = dMatch.category === 'story' || dMatch.districtNameOdia.includes('ପୁରାଣ');
            setSelectedStory({
              id: `district-${dMatch.id}`,
              title: dMatch.title,
              category: isPurana
                ? 'ପୌରାଣିକ ଇତିହାସ'
                : `${dMatch.districtNameOdia} - ${dMatch.category === 'temple' ? 'ମନ୍ଦିର' : 'ପର୍ବପର୍ବାଣୀ'}`,
              summary: dMatch.description ? dMatch.description.slice(0, 140) + '...' : (dMatch.significance || ''),
              content: dMatch.description || dMatch.significance || 'ପବିତ୍ର ଐତିହ୍ୟ କଥା।',
              imageUrl: dMatch.imageUrl || '',
              author: `${dMatch.districtNameOdia} ଐତିହ୍ୟ`,
              readTimeMinutes: 3,
              publishedAt: dMatch.createdAt ? dMatch.createdAt.split('T')[0] : '2026-01-01',
              likesCount: 15,
            });
          }
        } catch {
          // Ignore
        }
      }
    };

    resolveTargetStory();
  }, [initialStoryId, stories]);

  // 3. Dynamic SEO, Canonical Link & JSON-LD Schema Synchronizer + Smart Affiliate Ad Setup
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      if (selectedStory) {
        // Scroll to top when opening a story
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Synchronously update dynamic OG metadata and Schema
        setDynamicStoryMeta(selectedStory);
        updateStorySeoAndJsonLd(selectedStory);

        // Sync URL to exact canonical story URL
        const targetUrl = `/story/${encodeURIComponent(selectedStory.id)}`;
        if (
          window.location.pathname !== targetUrl &&
          window.location.search !== `?view=blog&storyId=${encodeURIComponent(selectedStory.id)}`
        ) {
          window.history.replaceState({ viewMode: 'blog', storyId: selectedStory.id }, '', targetUrl);
        }

        // Configure per-post Affiliate Ad ONLY if BOTH valid link & image exist in database
        const adConfig = selectedStory.affiliateAd;
        const affiliateUrl = (
          adConfig?.affiliateUrl ||
          (adConfig as any)?.affiliateLink ||
          (adConfig as any)?.affiliateTargetUrl ||
          adConfig?.adLink ||
          (selectedStory as any).adLink ||
          (selectedStory as any).affiliateUrl ||
          (selectedStory as any).affiliateLink ||
          ''
        ).trim();

        const productImageUrl = (
          adConfig?.productImageUrl ||
          adConfig?.adImageUrl ||
          (adConfig as any)?.affiliateImageURL ||
          (adConfig as any)?.affiliateImageUrl ||
          (selectedStory as any).adImageUrl ||
          (selectedStory as any).affiliateImageURL ||
          (selectedStory as any).affiliateImageUrl ||
          ''
        ).trim();

        const adTriggerText = (
          adConfig?.adTriggerText ||
          (selectedStory as any).adTriggerText ||
          ''
        ).trim();

        const adTimerSeconds = Math.max(
          1,
          Number(adConfig?.adTimerSeconds) ||
            Number((selectedStory as any).adTimerSeconds) ||
            Number(adConfig?.countdownSeconds) ||
            5
        );

        const isExplicitlyDisabled = adConfig && adConfig.enabled === false;
        const hasValidAffiliateData = !isExplicitlyDisabled && Boolean(affiliateUrl && productImageUrl);

        if (hasValidAffiliateData && adConfig) {
          const resolvedAd: AffiliateProductAd = {
            enabled: true,
            productTitle: adConfig.productTitle?.trim() || '',
            productDescription: adConfig.productDescription?.trim() || '',
            productImageUrl,
            affiliateUrl,
            adImageUrl: productImageUrl,
            adLink: affiliateUrl,
            adTriggerText,
            adTimerSeconds,
            countdownSeconds: adTimerSeconds,
          };
          setActiveAd(resolvedAd);
          setIsAdOpen(false);
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

        setIsAdOpen(false);
        setActiveAd(null);
      }
    } catch (err) {
      console.warn('Story SEO synchronization error:', err);
    }
  }, [selectedStory]);

  // SMART AFFILIATE AD TRIGGER: Word-Specific IntersectionObserver & Fail-Safe 50% Scroll Fallback
  useEffect(() => {
    if (!selectedStory || !activeAd || !activeAd.enabled) return;
    if (adTriggeredForStoryRef.current[selectedStory.id]) return;

    // Small delay to ensure post DOM is fully rendered
    const timer = setTimeout(() => {
      const targetEl = document.getElementById('ad-trigger-word');
      const isElementInDom = Boolean(targetEl);

      // Log full debug diagnostic
      logAffiliateDebug('Single Story Post View', {
        storyOrDistrictId: selectedStory.id,
        triggerText: activeAd.adTriggerText,
        timerSeconds: activeAd.adTimerSeconds || activeAd.countdownSeconds,
        imageUrl: activeAd.productImageUrl || activeAd.adImageUrl,
        link: activeAd.affiliateUrl || activeAd.adLink,
        productTitle: activeAd.productTitle,
        elementFoundInDom: isElementInDom,
        reason: isElementInDom
          ? `Word element found in post DOM. IntersectionObserver active for keyword: "${activeAd.adTriggerText}".`
          : activeAd.adTriggerText
          ? `Keyword "${activeAd.adTriggerText}" was provided but not found in post text. FAIL-SAFE FALLBACK: 50% scroll depth is active.`
          : 'No keyword provided. FAIL-SAFE FALLBACK: 50% scroll depth is active.',
      });

      if (targetEl) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                if (!adTriggeredForStoryRef.current[selectedStory.id]) {
                  console.log(
                    '%c[Affiliate Ad Debug] 🚀 Post Trigger Word Intersected! Opening Ad Modal now.',
                    'color: #16a34a; font-weight: bold;'
                  );
                  adTriggeredForStoryRef.current[selectedStory.id] = true;
                  setIsAdOpen(true);
                }
                observer.disconnect();
              }
            });
          },
          {
            threshold: 0.1,
          }
        );

        observer.observe(targetEl);
      }
    }, 150);

    // Fail-Safe 50% Scroll Fallback
    const handleWindowScroll = () => {
      if (adTriggeredForStoryRef.current[selectedStory.id]) return;

      const articleEl = document.getElementById('single-story-article');
      if (articleEl) {
        const rect = articleEl.getBoundingClientRect();
        const articleHeight = articleEl.offsetHeight;
        if (articleHeight > 0) {
          // Calculate when user scrolled to 50% of the article body
          const scrolledPastTop = Math.max(0, -rect.top + window.innerHeight * 0.5);
          const scrollPct = (scrolledPastTop / articleHeight) * 100;
          if (scrollPct >= 50) {
            console.log(
              '%c[Affiliate Ad Debug] 📜 50% Article Scroll reached in Post View! Opening Ad Modal via Fail-safe Fallback.',
              'color: #2563eb; font-weight: bold;'
            );
            adTriggeredForStoryRef.current[selectedStory.id] = true;
            setIsAdOpen(true);
          }
        }
      } else {
        const scrollY = window.scrollY || window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          const scrollPct = (scrollY / docHeight) * 100;
          if (scrollPct >= 50) {
            console.log(
              '%c[Affiliate Ad Debug] 📜 50% Document Scroll reached in Post View! Opening Ad Modal via Fail-safe Fallback.',
              'color: #2563eb; font-weight: bold;'
            );
            adTriggeredForStoryRef.current[selectedStory.id] = true;
            setIsAdOpen(true);
          }
        }
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    // Check initial scroll position
    handleWindowScroll();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [selectedStory, activeAd]);

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

  const handleShareStory = async (e: React.MouseEvent, story: SpiritualStory) => {
    e.stopPropagation();
    try {
      const res = await shareStoryNative(story);
      if (res.success) {
        setCopiedStoryId(story.id);
        setTimeout(() => setCopiedStoryId(null), 2500);
      }
    } catch (err) {
      console.warn('Share story error:', err);
    }
  };

  // =========================================================================
  // SINGLE POST VIEW (When a story is selected)
  // =========================================================================
  if (selectedStory) {
    const badgeClass = getCategoryBadgeStyle(selectedStory.category);
    const relatedStories = stories.filter((s) => s.id !== selectedStory.id).slice(0, 4);

    return (
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 box-border" ref={articleContainerRef}>
        {/* Top Breadcrumb & Action Navigation */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-orange-100">
          <button
            onClick={() => {
              setSelectedStory(null);
              if (typeof window !== 'undefined') {
                window.history.pushState({ viewMode: 'blog' }, '', '/?view=blog');
              }
            }}
            className="px-3.5 py-2 bg-white hover:bg-orange-50 text-slate-800 font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer border border-orange-200 shadow-2xs group"
          >
            <ChevronLeft className="w-4 h-4 text-orange-600 group-hover:-translate-x-0.5 transition-transform" />
            <span>ସମସ୍ତ କାହାଣୀ (All Stories)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleShareStory(e, selectedStory)}
              className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition border border-orange-200"
              title="Share Story"
            >
              {copiedStoryId === selectedStory.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-orange-700" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={(e) => handleLike(e, selectedStory.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                likedStories[selectedStory.id]
                  ? 'bg-rose-500 text-white border-rose-600'
                  : 'bg-white text-slate-700 hover:bg-rose-50 border-orange-200'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${likedStories[selectedStory.id] ? 'fill-white' : 'text-rose-500'}`} />
              <span>{selectedStory.likesCount || 0}</span>
            </button>
          </div>
        </div>

        {/* Main Article Container */}
        <article
          id="single-story-article"
          className="bg-white rounded-3xl border border-orange-100/90 shadow-sm p-4 sm:p-8 space-y-6"
        >
          {/* Header Metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-3 py-1 rounded-md text-xs font-black tracking-wide border shadow-2xs ${badgeClass}`}>
                {selectedStory.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>{selectedStory.readTimeMinutes} ମିନିଟ୍ ପଠନ (min read)</span>
              </span>
              {selectedStory.publishedAt && (
                <span className="flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedStory.publishedAt}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
              {selectedStory.title}
            </h1>

            {/* Author Byline */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-xs shadow-xs">
                {selectedStory.author ? selectedStory.author.charAt(0) : 'ପ'}
              </div>
              <div>
                <p className="font-extrabold text-slate-900 flex items-center gap-1">
                  <span>{selectedStory.author || 'ପଣ୍ଡିତ ମହାଶୟ'}</span>
                  <span className="text-orange-600 text-[11px]">✓ Verified Author</span>
                </p>
                <p className="text-[11px] text-slate-400">ପ୍ରାମାଣିକ ଆଧ୍ୟାତ୍ମିକ ଲେଖକ ଓ ଗବେଷକ</p>
              </div>
            </div>
          </div>

          {/* Hero Banner Image */}
          {selectedStory.imageUrl && (
            <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden bg-slate-900 shadow-sm border border-slate-200/80 relative">
              <SmartImage
                src={selectedStory.imageUrl}
                alt={selectedStory.title}
                priority={true}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Story Summary Blockquote */}
          {selectedStory.summary && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-50/90 to-amber-50/70 border-l-4 border-orange-500 rounded-r-2xl italic text-xs sm:text-sm text-slate-800 font-medium leading-relaxed shadow-2xs">
              "{selectedStory.summary}"
            </div>
          )}

          {/* Formatted Content Body with Observable Smart Trigger */}
          <div className="prose prose-orange max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-4 font-normal">
            {(() => {
              let triggerRenderedInBody = false;
              const triggerWord = activeAd?.adTriggerText;

              const bodyText = selectedStory.content || selectedStory.summary || 'ପବିତ୍ର ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ...';
              return bodyText.split('\n\n').map((para, idx) => {
                const trimmed = para.trim();
                if (trimmed.startsWith('### ')) {
                  return (
                    <h3
                      key={idx}
                      className="text-base sm:text-xl font-black text-slate-900 pt-3 pb-1 border-b border-orange-200"
                    >
                      {trimmed.replace('### ', '')}
                    </h3>
                  );
                }
                if (trimmed.startsWith('> ')) {
                  return (
                    <blockquote
                      key={idx}
                      className="p-3.5 bg-orange-50/80 border-l-4 border-orange-600 rounded-r-xl italic font-bold text-orange-950 text-xs sm:text-sm"
                    >
                      {trimmed.replace('> ', '')}
                    </blockquote>
                  );
                }
                if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
                  return (
                    <div key={idx} className="pl-3 space-y-1.5 my-2">
                      {trimmed.split('\n').map((line, lIdx) => (
                        <div key={lIdx} className="flex items-start gap-2 text-slate-800">
                          <span className="text-orange-600 font-black">•</span>
                          <span>{line.replace(/^[•\-]\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  );
                }

                // Normal Paragraph: Match trigger word if present and not rendered yet
                if (triggerWord && !triggerRenderedInBody) {
                  const matchResult = findTriggerInText(para, triggerWord);
                  if (matchResult.found) {
                    triggerRenderedInBody = true;
                    return (
                      <p key={idx} className="leading-relaxed text-slate-800">
                        {matchResult.before}
                        <span
                          id="ad-trigger-word"
                          data-trigger-text={triggerWord.trim()}
                          className="relative inline font-bold text-orange-950 underline decoration-amber-400 decoration-2 underline-offset-2"
                        >
                          {matchResult.match}
                        </span>
                        {matchResult.after}
                      </p>
                    );
                  }
                }

                return (
                  <p key={idx} className="leading-relaxed text-slate-800">
                    {para}
                  </p>
                );
              });
            })()}
          </div>

          {/* ================================================================= */}
          {/* ================================================================= */}
          {/* HIGH-CONVERTING IN-ARTICLE & END-OF-POST SMART AFFILIATE AD CARD */}
          {/* STRICT ZERO-DEMO RULE: ONLY rendered if productImageUrl is present */}
          {/* ================================================================= */}
          {selectedStory.affiliateAd?.enabled &&
            Boolean(
              (selectedStory.affiliateAd.productImageUrl || (selectedStory.affiliateAd as any).affiliateImageURL) &&
                ((selectedStory.affiliateAd.productImageUrl || (selectedStory.affiliateAd as any).affiliateImageURL) || '').trim().length > 0 &&
                (selectedStory.affiliateAd.affiliateUrl || '').trim().length > 0
            ) && (
              <div className="mt-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-amber-100/60 border-2 border-amber-300 shadow-sm relative overflow-hidden">
                {/* Header Tag */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-amber-200 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      <span>ପ୍ରାୟୋଜିତ ବିଶେଷ ଅଫର (Amazon Special Offer)</span>
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-amber-900 font-bold bg-amber-200/80 px-2 py-0.5 rounded-full">
                    ⭐ Amazon Verified
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  {/* Product Image */}
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden bg-white border border-amber-200 shrink-0 shadow-xs flex items-center justify-center p-2">
                    <img
                      src={selectedStory.affiliateAd.productImageUrl || (selectedStory.affiliateAd as any).affiliateImageURL}
                      alt={selectedStory.affiliateAd.productTitle || 'Amazon Product'}
                      className="w-full h-full object-contain hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Product Details & Action */}
                  <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
                    <h4 className="text-sm sm:text-lg font-extrabold text-slate-900 leading-snug">
                      {selectedStory.affiliateAd.productTitle || 'ଶ୍ରୀ ଜଗନ୍ନାଥ ଆଧ୍ୟାତ୍ମିକ ସାମଗ୍ରୀ (Special Devotional Item)'}
                    </h4>

                    {selectedStory.affiliateAd.productDescription && (
                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                        {selectedStory.affiliateAd.productDescription}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        ✓ 100% Genuine & Fast Delivery
                      </span>
                      <span className="text-[11px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md">
                        ✓ Limited Time Offer
                      </span>
                    </div>

                    <div className="pt-2">
                      <a
                        href={selectedStory.affiliateAd.affiliateUrl || 'https://www.amazon.in'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 w-full sm:w-auto cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>ଆମାଜନରୁ ଅର୍ଡର କରନ୍ତୁ (Buy on Amazon)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Dedicated High-Visibility Social Share Box (WhatsApp & Facebook Real Preview) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-600 text-white rounded-lg">
                  <Share2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    ଏହି ପବିତ୍ର କଥା ସାଙ୍ଗସାଥୀଙ୍କ ସହ ଶେୟାର୍ କରନ୍ତୁ (Share this Story)
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    WhatsApp ଓ Facebook ରେ ପୋଷ୍ଟର ଅସଲ ଫଟୋ ଓ ଶୀର୍ଷକ ସହିତ ପଠାନ୍ତୁ
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* WhatsApp Direct Share Button */}
              <button
                type="button"
                onClick={() => {
                  const shareUrl = getStoryShareUrl(selectedStory);
                  const excerpt = selectedStory.summary || selectedStory.content ? `${(selectedStory.summary || selectedStory.content).slice(0, 120)}...` : '';
                  openWhatsAppDirectShare(`📖 *${selectedStory.title}*\n${excerpt}`, shareUrl);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>💬 WhatsApp ଶେୟାର୍</span>
              </button>

              {/* ShareChat Direct Share Button */}
              <button
                type="button"
                onClick={async () => {
                  const shareUrl = getStoryShareUrl(selectedStory);
                  const excerpt = selectedStory.summary || selectedStory.content ? `${(selectedStory.summary || selectedStory.content).slice(0, 120)}...` : '';
                  await openShareChatShare(excerpt, shareUrl, selectedStory.title);
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>✨ ShareChat ଶେୟାର୍</span>
              </button>

              {/* Facebook Direct Share Button */}
              <button
                type="button"
                onClick={() => {
                  const shareUrl = getStoryShareUrl(selectedStory);
                  openFacebookShare(shareUrl, selectedStory.title);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>📘 Facebook</span>
              </button>

              {/* Threads (by Instagram) Direct Share Button */}
              <button
                type="button"
                onClick={() => {
                  const shareUrl = getStoryShareUrl(selectedStory);
                  const excerpt = selectedStory.summary || selectedStory.content ? `${(selectedStory.summary || selectedStory.content).slice(0, 100)}...` : '';
                  openThreadsShare(excerpt, shareUrl, selectedStory.title);
                }}
                className="px-4 py-2 bg-black hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              >
                <span>🧵 Threads</span>
              </button>

              {/* Copy Link Button */}
              <button
                type="button"
                onClick={(e) => handleShareStory(e, selectedStory)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedStoryId === selectedStory.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>କପି ହୋଇଗଲା!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>ଲିଙ୍କ୍ କପି</span>
                  </>
                )}
              </button>

              {/* Facebook Cache Re-scrape / Debugger */}
              <button
                type="button"
                onClick={async () => {
                  const origin = 'https://www.bhaktianandaodiatvofficial.blog';
                  const shareUrl = `${origin}/story/${encodeURIComponent(selectedStory.id)}`;
                  await refreshFacebookOgCache(shareUrl);
                  openFacebookDebugger(shareUrl);
                }}
                className="px-3 py-2 bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold text-xs rounded-xl transition cursor-pointer ml-auto text-[11px] flex items-center gap-1"
                title="ଫେସବୁକ୍ ରେ ପୁରୁଣା ଡେମୋ ଫଟୋ ଦେଖାଗଲେ ଏଠାରେ କ୍ଲିକ୍ କରି ଫଟୋ ରିଫ୍ରେସ୍ କରନ୍ତୁ"
              >
                <span>🔄 ଫେସବୁକ୍ ଫଟୋ ରିଫ୍ରେସ୍</span>
              </button>
            </div>
          </div>

          {/* Social Share & Interaction Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleLike(e, selectedStory.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border transition cursor-pointer ${
                  likedStories[selectedStory.id]
                    ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-rose-50 border-slate-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${likedStories[selectedStory.id] ? 'fill-white' : 'text-rose-500'}`} />
                <span>{selectedStory.likesCount || 0} ଲାଇକ୍</span>
              </button>

              <button
                onClick={(e) => handleShareStory(e, selectedStory)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-200 flex items-center gap-2 transition cursor-pointer"
              >
                {copiedStoryId === selectedStory.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied Link</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-orange-700" />
                    <span>Share Post</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedStory(null);
                if (typeof window !== 'undefined') {
                  window.history.pushState({ viewMode: 'blog' }, '', '/?view=blog');
                }
              }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
            >
              ← ଅନ୍ୟ କାହାଣୀ ଦେଖନ୍ତୁ (All Stories)
            </button>
          </div>
        </article>

        {/* Recommended / Related Stories */}
        {relatedStories.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>🌟 ଆହୁରି ପଢ଼ନ୍ତୁ (Recommended Stories)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {relatedStories.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => setSelectedStory(rel)}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 hover:border-orange-300 hover:shadow-md transition cursor-pointer flex items-center gap-3 group"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <SmartImage
                      src={rel.imageUrl}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">
                      {rel.category}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-orange-600 line-clamp-2 leading-snug">
                      {rel.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SMART AFFILIATE PRODUCT POP-UP AD MODAL (Delay Trigger + Countdown + Auto-Dismiss) */}
        {activeAd && (
          <AffiliateAdModal
            ad={activeAd}
            isOpen={isAdOpen}
            onClose={handleCloseAd}
            lang="OD"
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // STORIES LIST / EXPLORE FEED VIEW
  // =========================================================================
  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 box-border">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white hover:bg-orange-50 text-slate-800 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-orange-200 shadow-2xs"
        >
          <span>←</span>
          <span>ମୁଖ୍ୟ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ (Back to Home)</span>
        </button>

        {onNavigateToPanchang && (
          <button
            onClick={onNavigateToPanchang}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <span>📅</span>
            <span>ଦୈନିକ ପଞ୍ଜିକା (Panchang)</span>
          </button>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-orange-600 via-amber-600 to-amber-700 text-white border border-amber-400/40 rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/20 border border-white/40 rounded-full text-xs text-white font-extrabold backdrop-blur-xs">
            <BookOpen className="w-3.5 h-3.5 text-white" />
            <span>ଦିବ୍ୟ ଆଧ୍ୟାତ୍ମିକ କଥା ଓ ବ୍ଲଗ୍ (Spiritual Stories & Devotional News)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            ପୁରାଣ, ଜଗନ୍ନାଥ ଲୀଳା ଓ ଭକ୍ତି ରସାମୃତ
          </h1>
          <p className="text-xs sm:text-sm text-amber-50 font-medium max-w-2xl leading-relaxed">
            ପ୍ରଭୁ ଶ୍ରୀ ଜଗନ୍ନାଥଙ୍କ ଅପାର ମହିମା, ଭକ୍ତଙ୍କ ଅଲୌକିକ ଅନୁଭୂତି ଏବଂ ଓଡ଼ିଶାର ଶାସ୍ତ୍ରୀୟ ପରମ୍ପରାର ପ୍ରେରଣାଦାୟୀ କାହାଣୀ ସମୂହ।
          </p>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-orange-600 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="କାହାଣୀ କିମ୍ବା ବିଷୟ ଖୋଜନ୍ତୁ (Search stories by title or keywords)..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-orange-400 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-200 shadow-2xs text-slate-800 placeholder:text-slate-400"
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
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs font-black'
                  : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200 hover:border-orange-200'
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
          className="bg-white rounded-3xl border border-orange-100 shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition group grid grid-cols-1 md:grid-cols-12"
        >
          <div className="md:col-span-5 h-56 md:h-full relative overflow-hidden bg-slate-900">
            <SmartImage
              src={featuredStory.imageUrl}
              alt={featuredStory.title}
              priority={true}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Color Coded Category Badge */}
            <span
              className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-black shadow-md border flex items-center gap-1 z-10 ${getCategoryBadgeStyle(
                featuredStory.category
              )}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{featuredStory.category}</span>
            </span>
          </div>

          <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 bg-orange-100 border border-orange-200 text-orange-900 text-xs font-black rounded-full inline-block">
                ⭐ Featured Story
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 group-hover:text-orange-600 transition-colors leading-snug">
                {featuredStory.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-3 leading-relaxed">
                {featuredStory.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  <span>{featuredStory.author}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  <span>{featuredStory.readTimeMinutes} ମିନିଟ୍</span>
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
                  <Heart className={`w-3.5 h-3.5 ${likedStories[featuredStory.id] ? 'fill-rose-600 text-rose-600' : ''}`} />
                  <span>{featuredStory.likesCount || 0}</span>
                </button>
                <button
                  onClick={(e) => handleShareStory(e, featuredStory)}
                  className="p-2 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-200 flex items-center gap-1 transition"
                  title="Share Story"
                >
                  <Share2 className="w-3.5 h-3.5 text-orange-700" />
                </button>
                <span className="px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-1">
                  <span>ପଢ଼ନ୍ତୁ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FRONT-END FEED (Classic List View) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <span>📚 ସମସ୍ତ ଆଧ୍ୟାତ୍ମିକ କଥା ଓ ପୋଷ୍ଟ ଫିଡ୍</span>
            <span className="text-xs text-orange-700 font-bold">({filteredStories.length} ଗୋଟି ଲେଖା)</span>
          </h3>
        </div>

        {filteredStories.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-2">
            <p className="text-sm font-bold text-slate-700">କୌଣସି କାହାଣୀ ମିଳିଲା ନାହିଁ (No stories found)</p>
            <p className="text-xs text-slate-500">ଦୟାକରି ଅନ୍ୟ କୌଣସି ଶବ୍ଦ କିମ୍ବା ବର୍ଗ ଚୟନ କରନ୍ତୁ।</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
            {filteredStories.map((story, storyIdx) => {
              const badgeClass = getCategoryBadgeStyle(story.category);

              return (
                <article
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="flex items-center gap-3 sm:gap-4.5 p-3.5 sm:p-4 hover:bg-orange-50/40 transition-colors cursor-pointer group select-none"
                >
                  {/* Left: Square Thumbnail with slight rounded corners */}
                  <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <SmartImage
                      src={story.imageUrl}
                      alt={story.title}
                      priority={storyIdx < 3}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {story.affiliateAd?.enabled &&
                      Boolean(
                        (story.affiliateAd.productTitle && story.affiliateAd.productTitle.trim()) ||
                          (story.affiliateAd.affiliateUrl && story.affiliateAd.affiliateUrl.trim())
                      ) && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black rounded text-[9px] shadow-xs flex items-center gap-0.5 z-10">
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>Offer</span>
                        </span>
                      )}
                  </div>

                  {/* Right: Content Details */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5 self-stretch">
                    <div className="space-y-1">
                      {/* Top: Small Color-Coded Category Badge + Author */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black tracking-wide border shadow-2xs ${badgeClass}`}
                        >
                          {story.category}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium hidden xs:inline">
                          • {story.author}
                        </span>
                      </div>

                      {/* Post Title: Bold, max 2 lines */}
                      <h4 className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 text-sm sm:text-base leading-snug">
                        {story.title}
                      </h4>

                      {/* Short 1-line Excerpt */}
                      <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-1">
                        {story.summary}
                      </p>
                    </div>

                    {/* Bottom Meta Bar */}
                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-medium pt-1.5 mt-auto">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-slate-500 font-semibold">
                          <Clock className="w-3 h-3 text-orange-600" />
                          <span>{story.readTimeMinutes} min</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                          <span>{story.likesCount || 0}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleShareStory(e, story)}
                          title="Share Story"
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                        <span className="hidden sm:inline-flex items-center gap-1 font-bold text-orange-600 text-[11px]">
                          <span>Read</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* SMART AFFILIATE PRODUCT POP-UP AD MODAL */}
      {activeAd && (
        <AffiliateAdModal
          ad={activeAd}
          isOpen={isAdOpen}
          onClose={handleCloseAd}
          lang="OD"
        />
      )}
    </div>
  );
};
