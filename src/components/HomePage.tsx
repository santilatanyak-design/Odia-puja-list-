import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowRight, ChevronRight, PackageOpen, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { AffiliateProduct, fetchAffiliateProducts } from '../lib/affiliateApi';
import { ShareButton } from './ShareButton';
import { handleDeepLink } from '../lib/deepLinkHelper';

const ITEMS_PER_PAGE = 12;

export function HomePage({ onNavigateToDeal, onNavigateToCategories }: any) {
  const [allProducts, setAllProducts] = useState<AffiliateProduct[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || isFetchingMore) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreProducts();
        }
      }, { rootMargin: '100px' });
      
      if (node) observer.current.observe(node);
    },
    [loading, isFetchingMore, hasMore]
  );

  useEffect(() => {
    loadInitialProducts();
  }, []);

  const loadInitialProducts = async () => {
    setLoading(true);
    const data = await fetchAffiliateProducts();
    setAllProducts(data);
    
    // Initial batch
    const initialBatch = data.slice(0, ITEMS_PER_PAGE);
    setVisibleProducts(initialBatch);
    setHasMore(data.length > ITEMS_PER_PAGE);
    setLoading(false);
  };

  const loadMoreProducts = () => {
    setIsFetchingMore(true);
    
    // Simulate a network delay for premium feel
    setTimeout(() => {
      const nextPageIndex = page + 1;
      const startIndex = page * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      
      const nextBatch = allProducts.slice(startIndex, endIndex);
      
      setVisibleProducts((prev) => [...prev, ...nextBatch]);
      setPage(nextPageIndex);
      setHasMore(endIndex < allProducts.length);
      setIsFetchingMore(false);
    }, 800); // 800ms sleek loading delay
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!allProducts || allProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-4 bg-slate-50">
        <PackageOpen className="w-24 h-24 text-slate-300 mb-8" strokeWidth={1} />
        <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Updating Inventory</h2>
        <p className="text-slate-500 text-center max-w-md text-lg">
          We are currently curating premium deals for you. Please check back later to discover our latest collections.
        </p>
      </div>
    );
  }

  // Derive categories dynamically from all products (so we show all categories even if products aren't visible yet)
  const categoryMap = new Map<string, string>();
  allProducts.forEach(p => {
    const catName = p.category && p.category.trim() !== '' ? p.category : (p.platform || 'General');
    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, p.imageUrl);
    }
  });
  
  const dynamicCategories = Array.from(categoryMap.entries()).map(([name, image]) => ({
    name,
    image
  }));

  const heroProduct = allProducts.find(p => p.isFeatured) || allProducts[0];
  const trendingProducts = visibleProducts.filter(p => p.id !== heroProduct.id);

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Hero Banner Section */}
      {heroProduct && (
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center py-16 px-4 sm:px-6 lg:px-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" /> Top Featured Deal
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                  {heroProduct.title}
                </h1>
                <p className="text-xl text-slate-500 max-w-lg line-clamp-3">
                  {heroProduct.description || "Discover premium quality and exceptional value with our exclusive selection."}
                </p>
                <div className="flex items-center gap-4 pt-4">
                  <button 
                    onClick={() => onNavigateToDeal(heroProduct.id)}
                    className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-800 transition-transform hover:-translate-y-1 shadow-lg shadow-slate-900/20"
                  >
                    Grab Deal
                  </button>
                  <ShareButton productId={heroProduct.id} title={heroProduct.title} variant="icon" className="p-4 w-14 h-14" />
                  
                </div>
              </div>
              <div className="relative aspect-square md:aspect-auto md:h-[500px] bg-slate-100 rounded-3xl overflow-hidden flex items-center justify-center p-8 group">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-white opacity-50"></div>
                <img 
                  src={heroProduct.imageUrl} 
                  alt={heroProduct.title} 
                  className="relative z-10 max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105" 
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Categories */}
      {dynamicCategories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {dynamicCategories.slice(0, 6).map((cat, idx) => (
              <div 
                key={idx}
                onClick={onNavigateToCategories}
                className="group cursor-pointer bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-300">
                  <img src={cat.image} alt={cat.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-slate-900 text-center">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending Deals Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Trending Now</h2>
        </div>
        
        {trendingProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingProducts.map((product, index) => {
              const isLastElement = index === trendingProducts.length - 1;
              return (
                <div 
                  key={product.id + '-' + index}
                  ref={isLastElement ? lastElementRef : null}
                  onClick={() => onNavigateToDeal(product.id)}
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  <div className="aspect-[4/3] bg-slate-50 p-6 flex items-center justify-center overflow-hidden relative">
                    <img 
                      src={product.imageUrl} 
                      alt={product.title} 
                      className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {product.category || product.platform || 'PREMIUM'}
                    </span>
                    <h3 className="font-bold text-slate-900 text-lg line-clamp-2 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                      {product.title}
                    </h3>
                    
                    <div className="mt-auto flex items-center justify-between">
                      
                      <div className="flex items-center gap-2">
                        <ShareButton productId={product.id} title={product.title} variant="icon" className="p-3 w-11 h-11 bg-transparent border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-800" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeepLink(e, product.affiliateUrl, product.platform as any || 'amazon');
                          }}
                          className="bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900 rounded-full p-3 transition-colors flex items-center justify-center"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Infinite Scroll States */}
        <div className="mt-12 mb-8 flex justify-center items-center">
          {isFetchingMore && (
            <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              <p className="text-slate-500 font-medium text-sm uppercase tracking-widest">Loading Premium Deals</p>
            </div>
          )}
          {!hasMore && trendingProducts.length > 0 && (
            <div className="bg-white px-8 py-4 rounded-full shadow-sm border border-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <p className="text-slate-600 font-semibold">You've seen all our premium deals!</p>
            </div>
          )}
        </div>
      </section>

      {/* Extra Padding */}
      <div className="h-12"></div>
    </div>
  );
}
