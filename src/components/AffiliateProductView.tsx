import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  ShieldCheck, 
  Truck, 
  Star, 
  Youtube, 
  Sparkles, 
  PackageCheck, 
  Loader2,
  Share2
} from 'lucide-react';
import { AffiliateProduct, fetchAffiliateProducts, fetchAffiliateProductById } from '../lib/affiliateApi';
import { ShareButton } from './ShareButton';
import { YoutubeEmbed } from './YoutubeEmbed';
import { handleDeepLink } from '../lib/deepLinkHelper';
import { updateAffiliateProductOgMeta, resetToGenericSiteOgMeta } from '../lib/ogMetaHelper';

interface AffiliateProductViewProps {
  productId: string;
  onBack: () => void;
}

export function AffiliateProductView({ productId, onBack }: AffiliateProductViewProps) {
  const [product, setProduct] = useState<AffiliateProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const cleanId = (productId || '').replace(/\.html?$/i, '').replace(/^(\/)?deal\//i, '').replace(/^(\/)?product\//i, '').trim();
      const idWithoutProd = cleanId.replace(/^prod_/, '');
      const idWithProd = cleanId.startsWith('prod_') ? cleanId : `prod_${cleanId}`;

      // 1. First check if window.__PRELOADED_STATE__ already has the deal (from SSR)
      if (typeof window !== 'undefined' && (window as any).__PRELOADED_STATE__?.deal) {
        const preloaded = (window as any).__PRELOADED_STATE__.deal;
        if (preloaded && (preloaded.id === cleanId || preloaded.id === idWithProd || preloaded.id === idWithoutProd)) {
          setProduct(preloaded);
          updateAffiliateProductOgMeta({
            id: preloaded.id,
            title: preloaded.title,
            description: preloaded.description,
            imageUrl: preloaded.imageUrl,
            platform: preloaded.platform,
          });
          setLoading(false);
          return;
        }
      }

      // 2. Fetch product by ID with retry & fallback across all sources
      let found: AffiliateProduct | null = null;
      try {
        found = await fetchAffiliateProductById(cleanId);
        if (!found && cleanId !== idWithProd) {
          found = await fetchAffiliateProductById(idWithProd);
        }
        if (!found) {
          const products = await fetchAffiliateProducts();
          found = products.find(p => p && (p.id === cleanId || p.id === idWithProd || p.id === idWithoutProd)) || null;
        }
      } catch (apiErr) {
        console.warn('Could not load deal product:', apiErr);
      }

      setProduct(found || null);
      if (found) {
        // Update dynamic Open Graph (OG) & Twitter meta tags immediately
        updateAffiliateProductOgMeta({
          id: found.id,
          title: found.title,
          description: found.description,
          imageUrl: found.imageUrl,
          platform: found.platform,
        });
      } else {
        // Reset to clean generic site branding if no product loaded
        resetToGenericSiteOgMeta();
      }
    } catch (err) {
      console.error('Error loading product details from AWS backend:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-amber-500 w-10 h-10 mb-3" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Loading Deal Details...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex flex-col justify-center items-center px-4 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4 text-slate-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Deal not found</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6">
          This product deal may have expired or was removed from the inventory.
        </p>
        <button 
          onClick={onBack} 
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
        >
          Return to Store Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 selection:bg-amber-500/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <button 
          onClick={onBack} 
          className="text-xs font-bold text-slate-500 hover:text-slate-950 mb-8 flex items-center gap-2 transition-colors cursor-pointer bg-white px-4 py-2 rounded-full border border-slate-200 shadow-2xs w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Deals
        </button>

        {/* Product Card Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left: Product Image Stage */}
          <div className="w-full lg:w-1/2 bg-slate-50/70 p-8 sm:p-12 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-200/80 relative">
            <div className="w-full max-w-md aspect-square flex items-center justify-center relative">
              <img 
                src={product.imageUrl} 
                alt={product.title} 
                className="max-w-full max-h-[440px] object-contain mix-blend-multiply"
              />
            </div>
            
            {/* Badges */}
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <span className="bg-slate-950 text-amber-300 text-xs font-black px-3 py-1 rounded-xl shadow-xs">
                {product.platform}
              </span>
              {product.isFeatured && (
                <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-xl shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Featured Deal
                </span>
              )}
            </div>
          </div>

          {/* Right: Product Details & Pure Affiliate CTA */}
          <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div>
              {/* Category */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider">
                  {product.category || 'Spiritual Collection'}
                </span>
                <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold">
                  <PackageCheck className="w-4 h-4" /> Authentic Item
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 leading-snug mb-4 tracking-tight">
                {product.title}
              </h1>
              
              {/* Rating / Verification */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-black">
                  <span>4.9</span>
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Verified Affiliate Seller • Official Store Link
                </span>
              </div>

              {/* STRICTLY NO PRICE / NO DISCOUNT DISPLAY */}

              {/* Product Description */}
              {product.description && (
                <div className="mb-8 text-slate-600 text-sm leading-relaxed space-y-3 font-medium">
                  <p>{product.description}</p>
                </div>
              )}

              {/* Optional YouTube Review Video */}
              {product.youtubeUrl && (
                <div className="mb-8">
                  <YoutubeEmbed url={product.youtubeUrl} />
                </div>
              )}
            </div>

            {/* Pure Call-to-Action Buttons */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <button 
                onClick={(e) => handleDeepLink(e, product.affiliateUrl, product.platform as any || 'amazon')}
                className="w-full bg-slate-950 hover:bg-slate-900 text-amber-400 hover:text-amber-300 font-black text-base py-4 rounded-2xl shadow-xl shadow-slate-950/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Buy Now</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <ShareButton 
                productId={product.id} 
                title={product.title} 
                description={product.description}
                imageUrl={product.imageUrl}
                variant="button" 
                className="w-full bg-white border border-slate-300 text-slate-800 font-bold text-sm py-3.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center gap-2" 
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 
                  <span>Direct Brand Checkout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-600" /> 
                  <span>Direct Delivery by {product.platform}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
