import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  PackageOpen, 
  ExternalLink, 
  Sparkles, 
  Loader2, 
  Youtube, 
  ArrowRight,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Tag,
  Search,
  X
} from 'lucide-react';
import { AffiliateProduct, fetchAffiliateProducts } from '../lib/affiliateApi';
import { ShareButton } from './ShareButton';
import { handleDeepLink } from '../lib/deepLinkHelper';

const ITEMS_PER_PAGE = 8;

interface HomePageProps {
  onNavigateToDeal: (id: string) => void;
  onNavigateToCategories: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function HomePage({ onNavigateToDeal, onNavigateToCategories, searchQuery = '', onClearSearch }: HomePageProps) {
  const [allProducts, setAllProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const observer = useRef<IntersectionObserver | null>(null);

  const [banners, setBanners] = useState<any[]>([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  useEffect(() => {
    loadProductsFromAws();
    loadBannersFromAws();
  }, []);

  const loadBannersFromAws = async () => {
    try {
      const res = await fetch(`/api/banners?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.config && Array.isArray(json.config.images) && json.config.images.length > 0) {
          setBanners(json.config.images);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const loadProductsFromAws = async () => {
    setLoading(true);
    try {
      const data = await fetchAffiliateProducts();
      setAllProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Live real-time AWS products filtering based on searchQuery and category
  const filteredProducts = React.useMemo(() => {
    let list = Array.isArray(allProducts) ? allProducts : [];
    
    // Dynamic real-time search across title, name, description, category, platform
    const trimmedSearch = (searchQuery || '').trim().toLowerCase();
    if (trimmedSearch) {
      list = list.filter(p => {
        const title = (p.title || (p as any).name || '').toLowerCase();
        const name = ((p as any).name || '').toLowerCase();
        const description = (p.description || '').toLowerCase();
        const platform = (p.platform || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        return (
          title.includes(trimmedSearch) ||
          name.includes(trimmedSearch) ||
          description.includes(trimmedSearch) ||
          platform.includes(trimmedSearch) ||
          category.includes(trimmedSearch)
        );
      });
    }

    // Category filter (if selected and not 'All')
    if (selectedCategory && selectedCategory !== 'All') {
      list = list.filter(p => {
        const cat = (p.category || '').toLowerCase();
        const plat = (p.platform || '').toLowerCase();
        return cat === selectedCategory.toLowerCase() || plat === selectedCategory.toLowerCase();
      });
    }

    return list;
  }, [allProducts, searchQuery, selectedCategory]);

  // Reset page when search query or category changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory]);

  // Paginated visible items for smooth infinite scrolling
  const visibleProducts = React.useMemo(() => {
    const count = page * ITEMS_PER_PAGE;
    return filteredProducts.slice(0, count);
  }, [filteredProducts, page]);

  const hasMore = visibleProducts.length < filteredProducts.length;

  const loadMoreProducts = () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    setTimeout(() => {
      setPage(prev => prev + 1);
      setIsFetchingMore(false);
    }, 250);
  };

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || isFetchingMore) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreProducts();
        }
      }, { rootMargin: '200px' });
      
      if (node) observer.current.observe(node);
    },
    [loading, isFetchingMore, hasMore]
  );

  // Derive unique categories dynamically from live AWS products ONLY
  const dynamicCategories = React.useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach(p => {
      const cat = p.category?.trim();
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [allProducts]);

  // Featured Deal spotlight from live AWS data
  const featuredProduct = allProducts.find(p => p.isFeatured) || allProducts[0];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin text-amber-500 w-10 h-10 mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Connecting to AWS S3 Inventory...
        </p>
      </div>
    );
  }

  // Pure AWS state: If database is empty, strictly display the requested "Updating Inventory" empty state
  if (!allProducts || allProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-16 bg-slate-50 text-center">
        <div className="w-24 h-24 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center mb-6 text-slate-400">
          <PackageOpen className="w-12 h-12" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Updating Inventory</h2>
        <p className="text-slate-500 max-w-md text-base leading-relaxed mb-6">
          We are currently curating premium deals for you. Please check back later to discover our latest collections.
        </p>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-4 py-2 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Real-time AWS inventory sync active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-amber-500/20">
      
      {/* Live AWS 16:9 Hero Banners */}
      {banners.length > 0 && !searchQuery && selectedCategory === 'All' && (
        <section className="bg-slate-950 border-b border-slate-800 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 group">
              {banners.map((b, idx) => (
                <div
                  key={b.id || idx}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    idx === activeBannerIdx ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={b.url}
                    alt={b.title || 'Promotional Banner'}
                    className="w-full h-full object-cover"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                  {(b.title || b.subtitle || b.linkUrl) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-10">
                      {b.platform && (
                        <span className="self-start text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-3 py-1 rounded-md mb-2">
                          {b.platform}
                        </span>
                      )}
                      {b.title && (
                        <h2 className="text-xl sm:text-3xl font-black text-white line-clamp-2 max-w-2xl drop-shadow-md">
                          {b.title}
                        </h2>
                      )}
                      {b.subtitle && (
                        <p className="text-sm sm:text-base text-slate-200 line-clamp-1 max-w-xl mt-1 drop-shadow">
                          {b.subtitle}
                        </p>
                      )}
                      {b.linkUrl && (
                        <div className="mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeepLink(e, b.linkUrl, (b.platform as any) || 'amazon');
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                          >
                            <span>Explore Deal</span>
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Slider Dots Navigation */}
              {banners.length > 1 && (
                <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveBannerIdx(i)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        i === activeBannerIdx ? 'w-6 bg-amber-400' : 'w-2 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured Spotlight Hero (Derived strictly from live AWS data) */}
      {featuredProduct && !searchQuery && selectedCategory === 'All' && (
        <section className="bg-white border-b border-slate-200/80 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
            <div className="grid md:grid-cols-12 gap-8 items-center">
              
              <div className="md:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>Featured Deal of the Day</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 leading-[1.15] tracking-tight">
                  {featuredProduct.title}
                </h1>

                {featuredProduct.description && (
                  <p className="text-slate-600 text-base sm:text-lg max-w-xl line-clamp-3 leading-relaxed">
                    {featuredProduct.description}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
                    Platform: <strong className="text-slate-900">{featuredProduct.platform}</strong>
                  </span>
                  {featuredProduct.youtubeUrl && (
                    <span className="text-xs font-bold bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5 text-red-600" /> Video Review Included
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeepLink(e, featuredProduct.affiliateUrl, featuredProduct.platform as any || 'amazon');
                    }}
                    className="bg-slate-950 hover:bg-slate-900 text-amber-400 hover:text-amber-300 font-black px-8 py-4 rounded-2xl text-base transition-all transform hover:-translate-y-0.5 shadow-xl shadow-slate-950/20 flex items-center gap-2.5 cursor-pointer"
                  >
                    <span>Grab Deal</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onNavigateToDeal(featuredProduct.id)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-4 rounded-2xl text-base transition cursor-pointer"
                  >
                    View Details
                  </button>

                  <ShareButton 
                    productId={featuredProduct.id} 
                    title={featuredProduct.title} 
                    variant="icon" 
                    className="p-4 w-14 h-14 bg-white border border-slate-200 shadow-xs" 
                  />
                </div>
              </div>

              <div className="md:col-span-5 flex justify-center">
                <div 
                  onClick={() => onNavigateToDeal(featuredProduct.id)}
                  className="w-full max-w-md aspect-square bg-gradient-to-tr from-slate-100 to-amber-50/40 rounded-3xl p-8 flex items-center justify-center border border-slate-200/80 shadow-lg cursor-pointer group relative overflow-hidden"
                >
                  <img
                    src={featuredProduct.imageUrl}
                    alt={featuredProduct.title}
                    className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-slate-700 shadow-sm border border-slate-200 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Main Deals Catalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        
        {/* Category Filters Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Verified Deals Catalog</span>
              <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                {visibleProducts.length} Deals
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Curated spiritual puja samagri, brass idols, and devotions from verified sellers
            </p>
          </div>

          {/* Dynamic Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Categories
            </button>
            {dynamicCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Active Search Results Indicator */}
        {searchQuery.trim() && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl px-5 py-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-200/80 flex items-center justify-center text-amber-950">
                <Search className="w-4 h-4" />
              </div>
              <div className="text-sm text-slate-800">
                <span>Search results for </span>
                <span className="font-bold text-slate-950">"{searchQuery.trim()}"</span>
                <span className="text-xs bg-amber-200 text-amber-950 font-bold px-2.5 py-0.5 rounded-full ml-2">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                </span>
              </div>
            </div>
            {onClearSearch && (
              <button
                type="button"
                id="search-indicator-clear-btn"
                onClick={() => onClearSearch()}
                className="text-xs font-bold text-amber-950 hover:text-amber-800 flex items-center gap-1.5 cursor-pointer bg-white px-3.5 py-1.5 rounded-xl border border-amber-300 shadow-2xs hover:bg-amber-100/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Search</span>
              </button>
            )}
          </div>
        )}

        {/* Product Grid or Exact 'No Results' State */}
        {visibleProducts.length === 0 ? (
          <div 
            id="search-empty-state-card"
            className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200 max-w-lg mx-auto my-12 shadow-sm"
          >
            {allProducts.length === 0 ? (
              <>
                <div className="w-16 h-16 bg-amber-50 border border-amber-200/70 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-2xs">
                  <PackageOpen className="w-8 h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                  Updating Inventory. Please check back later.
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                  We are currently synchronizing our catalog with verified spiritual essentials directly from our AWS inventory.
                </p>
              </>
            ) : searchQuery.trim() ? (
              <>
                <div className="w-16 h-16 bg-amber-50 border border-amber-200/70 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-2xs">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">
                  No products found for '{searchQuery.trim()}'. Try a different keyword.
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
                  We couldn't find any products matching your search term. Check for typos or search for items like idol, puja thali, or incense.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  {onClearSearch && (
                    <button
                      type="button"
                      id="clear-search-action-btn"
                      onClick={() => {
                        onClearSearch();
                        setSelectedCategory('All');
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center justify-center gap-2"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Clear Search</span>
                    </button>
                  )}
                  {selectedCategory !== 'All' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('All')}
                      className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-colors cursor-pointer"
                    >
                      Search All Categories
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-amber-50 border border-amber-200/70 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-2xs">
                  <PackageOpen className="w-8 h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">
                  No products found in this category
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
                  There are currently no products listed under this filter. Try selecting another category.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  View All Categories
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleProducts.map((product, index) => {
              const isLast = index === visibleProducts.length - 1;
              const isSixth = (index + 1) % 6 === 0;
              const bannerIndex = Math.floor(index / 6) % (banners.length || 1);
              const inlineBanner = isSixth && banners.length > 0 ? banners[bannerIndex] : null;

              return (
                <React.Fragment key={product.id + '-' + index}>
                  <div
                    ref={isLast && !inlineBanner ? lastElementRef : null}
                    onClick={() => onNavigateToDeal(product.id)}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-amber-400/80 transition-all duration-300 flex flex-col cursor-pointer group"
                  >
                    {/* Image Stage */}
                    <div className="relative aspect-[4/3] bg-slate-50/80 p-6 flex items-center justify-center overflow-hidden border-b border-slate-100">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-500"
                        loading="lazy"
                      />
                      
                      {/* Platform Tag */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="bg-slate-950/90 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-lg backdrop-blur-xs shadow-xs">
                          {product.platform}
                        </span>
                        {product.isFeatured && (
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-1 rounded-lg shadow-xs flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Featured
                          </span>
                        )}
                      </div>

                      {/* YouTube Review Indicator */}
                      {product.youtubeUrl && (
                        <div className="absolute top-3 right-3 bg-red-600/95 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 backdrop-blur-xs">
                          <Youtube className="w-3 h-3" /> Review
                        </div>
                      )}
                    </div>

                    {/* Body & Pure Affiliate Flow (NO PRICE DISPLAY) */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>{product.category || product.platform}</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base line-clamp-2 mb-2 leading-snug group-hover:text-amber-600 transition-colors">
                        {product.title}
                      </h3>

                      {product.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-normal">
                          {product.description}
                        </p>
                      )}

                      {/* Pure Call-To-Action (Buy Now / Grab Deal ONLY, NO PRICE) */}
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeepLink(e, product.affiliateUrl, product.platform as any || 'amazon');
                          }}
                          className="flex-1 bg-slate-950 hover:bg-slate-900 text-amber-400 hover:text-amber-300 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-slate-950/10 cursor-pointer group-hover:scale-102"
                        >
                          <span>Buy Now</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <ShareButton
                          productId={product.id}
                          title={product.title}
                          variant="icon"
                          className="p-3 w-11 h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inline Ad Banner dynamically injected every 6th item without overlapping */}
                  {inlineBanner && (
                    <div
                      ref={isLast ? lastElementRef : null}
                      className="col-span-full my-4 bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-xl"
                    >
                      <div className="relative w-full aspect-video sm:aspect-[21/9] md:aspect-[3/1] max-h-[360px] overflow-hidden group">
                        <img
                          src={inlineBanner.url}
                          alt={inlineBanner.title || 'Promotional Deal'}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950/95 via-slate-950/65 to-transparent flex flex-col justify-end md:justify-center p-6 sm:p-8 md:p-10 max-w-2xl">
                          {inlineBanner.platform && (
                            <span className="self-start text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-1 rounded-md mb-2">
                              Sponsored • {inlineBanner.platform}
                            </span>
                          )}
                          {inlineBanner.title && (
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight mb-2 drop-shadow-md">
                              {inlineBanner.title}
                            </h3>
                          )}
                          {inlineBanner.subtitle && (
                            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 mb-4 drop-shadow">
                              {inlineBanner.subtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeepLink(e, inlineBanner.linkUrl || '#', (inlineBanner.platform as any) || 'amazon');
                              }}
                              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105 cursor-pointer"
                            >
                              <span>Grab Deal</span>
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Infinite Scrolling Loading State */}
        <div className="mt-14 mb-6 flex justify-center items-center">
          {isFetchingMore && (
            <div className="flex flex-col items-center justify-center gap-2.5 animate-pulse">
              <Loader2 className="w-7 h-7 text-amber-600 animate-spin" />
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                Fetching More Deals...
              </p>
            </div>
          )}

          {!hasMore && visibleProducts.length > 0 && (
            <div className="bg-white px-6 py-3 rounded-full shadow-2xs border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>You have explored all available deals</span>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
