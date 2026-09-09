import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, ShieldCheck, Truck, Star } from 'lucide-react';
import { AffiliateProduct, fetchAffiliateProducts } from '../lib/affiliateApi';
import { ShareButton } from './ShareButton';
import { YoutubeEmbed } from './YoutubeEmbed';
import { handleDeepLink } from '../lib/deepLinkHelper';
import { Navbar } from './Navbar';

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
    const products = await fetchAffiliateProducts();
    const found = products.find(p => p.id === productId);
    setProduct(found || null);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Deal not found</h2>
        <button onClick={onBack} className="text-blue-600 font-semibold hover:underline">
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <button onClick={onBack} className="text-sm font-semibold text-slate-500 hover:text-slate-900 mb-8 flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Deals
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* Product Image Gallery */}
          <div className="w-full md:w-1/2 bg-slate-50 p-8 flex items-center justify-center min-h-[400px] border-b md:border-b-0 md:border-r border-slate-100">
            <img 
              src={product.imageUrl} 
              alt={product.title} 
              className="max-w-full max-h-[500px] object-contain mix-blend-multiply"
            />
          </div>

          {/* Product Details */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
            <div className="mb-2">
              <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                {product.category || product.platform || 'Premium Deal'}
              </span>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
              {product.title}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-sm font-bold">
                4.8 <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="text-sm text-slate-500 font-medium">Premium Verified</span>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-slate-900">
                  {product.discountPrice || product.price}
                </span>
                {product.discountPrice && (
                  <span className="text-lg text-slate-400 line-through font-medium">
                    {product.price}
                  </span>
                )}
              </div>
              <p className="text-sm text-green-600 font-bold mt-1">Special affiliate pricing applied</p>
            </div>

            {product.description && (
              <div className="mb-10 text-slate-600 leading-relaxed text-lg">
                <p>{product.description}</p>
              </div>
            )}

            {product.youtubeUrl && (
              <YoutubeEmbed url={product.youtubeUrl} />
            )}

            {/* Premium CTA */}
            <div className="mt-auto pt-8 border-t border-slate-100">
              <div className="flex flex-col gap-3">
              <button 
                onClick={(e) => handleDeepLink(e, product.affiliateUrl, product.platform as any || 'amazon')}
                className="w-full bg-slate-900 text-white font-bold text-lg py-5 rounded-2xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-transform hover:-translate-y-1 flex items-center justify-center gap-3"
              >
                Buy Now Securely <ExternalLink className="w-5 h-5" />
              </button>
              <ShareButton 
                productId={product.id} 
                title={product.title} 
                variant="button" 
                className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold text-lg py-4 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all" 
              />
            </div>
              
              <div className="flex justify-between mt-6 text-slate-500 text-sm font-medium">
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Secure Transaction</div>
                <div className="flex items-center gap-2"><Truck className="w-4 h-4" /> Authentic Sellers</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
