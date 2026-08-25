import React, { useState, useEffect } from 'react';
import { StoreProduct, StoreOrder, StoreConfig } from '../types';
import { requestNotificationPermissionAndGetToken } from '../lib/pushNotifications';
import {
  getStoreProducts,
  subscribeStoreProducts,
  getStoreConfig,
  subscribeStoreConfig,
  getStoreOrders,
  subscribeStoreOrders,
  createStoreOrder,
  cancelStoreOrder,
  DEFAULT_BANNER_IMAGE,
  ODISHA_DISTRICTS,
} from '../lib/storeApi';
import {
  ShoppingBag,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Search,
  Truck,
  Plus,
  Minus,
  AlertCircle,
  X,
  Phone,
  MapPin,
  User,
  Calendar,
  Sparkles,
  Trash2,
  Bell,
  Share2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { SmartImage } from './SmartImage';

interface StoreViewProps {
  userPhone?: string;
}

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

export const StoreView: React.FC<StoreViewProps> = ({ userPhone }) => {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [config, setConfig] = useState<StoreConfig>({
    bannerImageUrl: DEFAULT_BANNER_IMAGE,
    suspendedMobiles: [],
  });
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'my_orders'>('browse');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('puja_store_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState(userPhone || '');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Ganjam');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<StoreOrder | null>(null);

  // Cancellation Modal State
  const [cancellingOrder, setCancellingOrder] = useState<StoreOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Push Notification Prompt State
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);

  // Share & Deep Linking State
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

  // Dynamic Store Banner Background Image URL State
  const [storeBannerUrl, setStoreBannerUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('storeBannerUrl');
      if (saved) return saved;
    }
    return '';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('storeBannerUrl');
      if (saved) setStoreBannerUrl(saved);
    }
    if (config.bannerImageUrl) {
      setStoreBannerUrl(config.bannerImageUrl);
    }
  }, [config.bannerImageUrl]);

  // Dynamic Open Graph Meta Tags Updater for Social Media Previews
  const updateOgMetaTags = (product: StoreProduct) => {
    if (typeof document === 'undefined') return;
    document.title = `${product.name} - ₹${product.price} | Puja Samagri Store`;

    const setMeta = (attr: 'property' | 'name', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('property', 'og:title', `${product.name} - ₹${product.price}`);
    setMeta('property', 'og:description', product.description || `Buy ${product.name} on Puja Samagri Store with Cash on Delivery.`);
    setMeta('property', 'og:image', product.imageUrl || 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=600&auto=format&fit=crop');
    setMeta('property', 'og:url', window.location.href);
    setMeta('name', 'twitter:title', `${product.name} - ₹${product.price}`);
    setMeta('name', 'twitter:image', product.imageUrl || 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=600&auto=format&fit=crop');
  };

  // Deep Link Routing: Detect product_id in URL and scroll to / highlight product
  useEffect(() => {
    if (products.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('product_id') || urlParams.get('product');

    if (targetId) {
      const matched = products.find((p) => p.id === targetId);
      if (matched) {
        setActiveTab('browse');
        setSelectedCategory('all');
        setSearchQuery('');
        setHighlightedProductId(matched.id);
        updateOgMetaTags(matched);

        setTimeout(() => {
          const el = document.getElementById(`product-${matched.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 350);

        const timer = setTimeout(() => {
          setHighlightedProductId(null);
        }, 4500);

        return () => clearTimeout(timer);
      }
    }
  }, [products]);

  // Web Share API Handler
  const handleShareProduct = async (product: StoreProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?product_id=${product.id}`;
    const shareData = {
      title: `${product.name} - ₹${product.price}`,
      text: `Buy ${product.name} for ₹${product.price} at Puja Samagri Store (Cash on Delivery available)!`,
      url: shareUrl,
    };

    updateOgMetaTags(product);

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        // If user cancelled or dismissed native share dialog, do not attempt copy fallback
        if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
          return;
        }
        console.log('Share prompt dismissed or unsupported, falling back to copy:', err);
      }
    }

    // Fallback 1: Clipboard API with focus check
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        if (document.hasFocus && !document.hasFocus()) {
          window.focus();
        }
        await navigator.clipboard.writeText(shareUrl);
        setCopiedProductId(product.id);
        setTimeout(() => setCopiedProductId(null), 3000);
        return;
      }
    } catch (err) {
      console.warn('navigator.clipboard failed, attempting legacy execCommand fallback:', err);
    }

    // Fallback 2: Legacy document.execCommand('copy')
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopiedProductId(product.id);
        setTimeout(() => setCopiedProductId(null), 3000);
      }
    } catch (fallbackErr) {
      console.warn('ExecCommand copy fallback failed:', fallbackErr);
    }
  };

  useEffect(() => {
    // Check Notification status and register SW
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowNotificationBanner(true);
      } else if (Notification.permission === 'granted') {
        requestNotificationPermissionAndGetToken().then((token) => {
          if (token) setFcmToken(token);
        });
      }
    }

    // Subscribe real-time updates
    const unsubProducts = subscribeStoreProducts((data) => setProducts(data));
    const unsubConfig = subscribeStoreConfig((cfg) => setConfig(cfg));
    const unsubOrders = subscribeStoreOrders((data) => setOrders(data));

    const handleSettingsUpdate = () => {
      try {
        const savedGlobal = localStorage.getItem('global_settings');
        if (savedGlobal) {
          const parsed = JSON.parse(savedGlobal);
          setConfig((prev) => ({ ...prev, ...parsed }));
        }
      } catch (err) {
        console.warn('Error reading global settings event:', err);
      }
    };
    window.addEventListener('global_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);

    return () => {
      unsubProducts();
      unsubConfig();
      unsubOrders();
      window.removeEventListener('global_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  const handleEnableNotifications = async () => {
    const token = await requestNotificationPermissionAndGetToken();
    if (token) {
      setFcmToken(token);
    }
    setShowNotificationBanner(false);
  };

  // Save Cart to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem('puja_store_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      (p.category && p.category.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter orders related to current mobile or all local orders
  const myOrders = orders.filter((o) => {
    if (!customerMobile) return true;
    const cleanUser = customerMobile.replace(/\D/g, '');
    return o.customerMobile === cleanUser || !cleanUser;
  });

  // Cart Handlers
  const handleAddToCart = (product: StoreProduct) => {
    if (!product.inStock) return;
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem('puja_store_cart');
  };

  // Total Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = config.enableDeliveryCharge !== false
    ? (subtotal >= (config.freeDeliveryThreshold ?? 500) ? 0 : (config.deliveryChargeAmount ?? 40))
    : 0;
  const grandTotal = subtotal + deliveryCharge;
  const totalCartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Quick Buy Now (Adds to cart and opens checkout)
  const handleQuickBuy = (product: StoreProduct) => {
    if (!product.inStock) return;
    handleAddToCart(product);
    setIsCartOpen(true);
    setCheckoutError(null);
  };

  // Place Order Handler for Multi-Select Cart
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setCheckoutError('ଆପଣଙ୍କ କାର୍ଟ ଖାଲି ଅଛି। ଦୟାକରି କିଛି ସାମଗ୍ରୀ ଯୋଡ଼ନ୍ତୁ। (Your cart is empty)');
      return;
    }

    if (config.enableCod === false) {
      setCheckoutError('❌ ନଗଦ ଦେୟ (Cash on Delivery) ସୁବିଧା ବର୍ତ୍ତମାନ ଆଡମିନ୍‌ଙ୍କ ଦ୍ୱାରା ବନ୍ଦ କରାଯାଇଛି। (COD temporarily disabled)');
      return;
    }

    const isCodActive = config.districtCodStatus?.[selectedDistrict] !== false;
    if (!isCodActive) {
      setCheckoutError('COD Not Available for this location');
      return;
    }

    const cleanMobile = customerMobile.replace(/\D/g, '');
    if (!customerName.trim()) {
      setCheckoutError('ଦୟାକରି ଆପଣଙ୍କ ନାମ ଦିଅନ୍ତୁ (Please enter your name)');
      return;
    }
    if (cleanMobile.length < 10) {
      setCheckoutError('ଦୟାକରି ସଠିକ୍ ୧୦-ଅଙ୍କ ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ (Enter valid 10-digit mobile number)');
      return;
    }
    if (!deliveryAddress.trim()) {
      setCheckoutError('ଦୟାକରି ପୂର୍ଣ୍ଣ ବିତରଣ ଠିକଣା ଦିଅନ୍ତୁ (Please enter delivery address)');
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
    }));

    const res = await createStoreOrder({
      customerName: customerName.trim(),
      customerMobile: cleanMobile,
      deliveryAddress: deliveryAddress.trim(),
      items: orderItems,
      totalAmount: grandTotal,
      fcmToken: fcmToken || undefined,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setCheckoutError(res.message || 'ଅର୍ଡର୍ କରିବାରେ ତ୍ରୁଟି ଘଟିଲା।');
      return;
    }

    if (res.order) {
      setOrderSuccess(res.order);
      handleClearCart();
      setIsCartOpen(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    if (!cancelReason.trim()) {
      setCancelError('ଦୟାକରି ବାତିଲ୍ କରିବାର କାରଣ ଲେଖନ୍ତୁ (Please provide a reason)');
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    const res = await cancelStoreOrder(cancellingOrder.id, cancelReason);
    setIsCancelling(false);

    if (!res.success) {
      setCancelError(res.message || 'ଅର୍ଡର୍ ବାତିଲ୍ କରିବାରେ ତ୍ରୁଟି।');
      return;
    }

    setCancellingOrder(null);
    setCancelReason('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 font-sans pb-28">
      {/* Background Web Push Notification Permission Prompt Banner */}
      {showNotificationBanner && (
        <div className="bg-amber-900 text-amber-50 p-4 rounded-2xl shadow-xl border-2 border-amber-400 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 text-amber-950 rounded-xl flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-200">
                ନୋଟିଫିକେସନ୍ ଅନୁମତି ଦିଅନ୍ତୁ (Allow Order Push Notifications)
              </h4>
              <p className="text-xs text-amber-100/90 mt-0.5">
                ଆପଣଙ୍କ ଅର୍ଡର୍ ଗୃହୀତ (Approved) ହେବା କ୍ଷଣି ତୁରନ୍ତ ଆପଣଙ୍କ ମୋବାଇଲ୍/ଡିଭାଇସ୍‌ରେ ନୋଟିଫିକେସନ୍ ପାଇବା ପାଇଁ ଅନୁମତି ଦିଅନ୍ତୁ।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setShowNotificationBanner(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-200 hover:text-white transition cursor-pointer"
            >
              ପରେ (Later)
            </button>
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Allow Notifications</span>
            </button>
          </div>
        </div>
      )}

      {/* YouTube Style Store Banner Header */}
      <div className="relative w-full h-44 sm:h-64 rounded-3xl overflow-hidden shadow-2xl mb-8 border-2 border-amber-300/80 group">
        <img
          src={
            storeBannerUrl ||
            (typeof window !== 'undefined' ? localStorage.getItem('storeBannerUrl') || undefined : undefined) ||
            config.bannerImageUrl ||
            DEFAULT_BANNER_IMAGE
          }
          alt="Puja Samagri Store Banner"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-700"
          onError={(e) => {
            (e.target as HTMLElement).setAttribute('src', DEFAULT_BANNER_IMAGE);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-8">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>ପବିତ୍ର ଓ ଶୁଦ୍ଧ ସାମଗ୍ରୀ (100% Pure Sacred Store)</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-white drop-shadow-md flex items-center gap-2">
            🛍️ ପୂଜା ସାମଗ୍ରୀ ଷ୍ଟୋର୍ (Puja Samagri Store)
          </h2>
          <p className="text-amber-100/90 text-xs sm:text-sm font-medium mt-1">
            ନଗଦ ଦେୟ ବ୍ୟବସ୍ଥା (Cash on Delivery) | ଘରେ ବସି ସିଧାସଳଖ ପୂଜା ସାମଗ୍ରୀ ମଗାନ୍ତୁ
          </p>
        </div>
      </div>

      {/* Dynamic Running Notice Bar Ticker */}
      {config.showNoticeBar !== false && (
        <div className="bg-amber-900 text-amber-100 text-xs py-2.5 px-4 rounded-2xl mb-6 shadow-md flex items-center justify-between border border-amber-700 animate-pulse">
          <span className="font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{config.noticeBarText || '⚡ ପବିତ୍ର ପୂଜା ସାମଗ୍ରୀ ନଗଦ ଦେୟ (Cash on Delivery) ସହ ସମଗ୍ର ଓଡ଼ିଶାରେ ଉପଲବ୍ଧ!'}</span>
          </span>
        </div>
      )}

      {/* Dynamic Festival Offer Banner */}
      {config.enableFestivalBanner !== false && (
        <div className="w-full h-36 sm:h-48 rounded-2xl overflow-hidden shadow-lg mb-6 border border-amber-300/80 relative group">
          <SmartImage
            src={config.festivalBannerUrl || 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1200&auto=format&fit=crop'}
            alt="Festival Special Offer Banner"
            priority={true}
            containerClassName="w-full h-full"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            fallbackSrc={DEFAULT_BANNER_IMAGE}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent p-4 sm:p-6 flex flex-col justify-center text-white pointer-events-none">
            <span className="bg-amber-500 text-amber-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full w-fit mb-1.5 shadow-sm">
              🎉 ବିଶେଷ ସ୍ୱତନ୍ତ୍ର ଅଫର୍ (Festival Offer)
            </span>
            <h3 className="text-lg sm:text-2xl font-black drop-shadow text-amber-100">
              ପବିତ୍ର ପୂଜା ସାମଗ୍ରୀ ସ୍ୱତନ୍ତ୍ର ରିହାତି ଅଫର୍
            </h3>
            <p className="text-xs sm:text-sm text-amber-200 mt-1 font-medium">
              ସମସ୍ତ ପୂଜା ସାମଗ୍ରୀ ଉପରେ ସ୍ୱତନ୍ତ୍ର ରିହାତି ଓ ନଗଦ ଦେୟ (Cash on Delivery) ସୁବିଧା।
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs + Shopping Cart Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-amber-200/80 mb-6 pb-3 gap-3">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'browse'
                ? 'bg-amber-900 text-amber-100 shadow-md'
                : 'bg-amber-100/60 text-amber-900 hover:bg-amber-200/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ସମସ୍ତ ସାମଗ୍ରୀ (Browse Store)</span>
          </button>
          <button
            onClick={() => setActiveTab('my_orders')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer relative ${
              activeTab === 'my_orders'
                ? 'bg-amber-900 text-amber-100 shadow-md'
                : 'bg-amber-100/60 text-amber-900 hover:bg-amber-200/60'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>ମୋର ଅର୍ଡର୍‌ (My Orders)</span>
            {myOrders.length > 0 && (
              <span className="bg-amber-500 text-amber-950 font-black text-[10px] px-1.5 py-0.5 rounded-full">
                {myOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Top Cart Button */}
        <button
          type="button"
          onClick={() => {
            setIsCartOpen(true);
            setCheckoutError(null);
          }}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2 border border-emerald-500"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>କାର୍ଟ (Cart)</span>
          {totalCartItemsCount > 0 ? (
            <span className="bg-amber-300 text-amber-950 font-black text-xs px-2 py-0.5 rounded-full">
              {totalCartItemsCount} • ₹{subtotal}
            </span>
          ) : (
            <span className="text-emerald-200 text-xs">(0)</span>
          )}
        </button>
      </div>

      {/* BROWSE PRODUCTS TAB */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-amber-50/80 p-3 sm:p-4 rounded-2xl border border-amber-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ସାମଗ୍ରୀ ଖୋଜନ୍ତୁ (Search items...)"
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-amber-300 bg-white text-xs text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-700 hover:text-amber-950 p-0.5 rounded-full transition cursor-pointer font-bold text-xs"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    if (cat === 'all') {
                      setSearchQuery('');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat && !searchQuery
                      ? 'bg-amber-800 text-white font-bold shadow-xs'
                      : selectedCategory === cat
                      ? 'bg-amber-700 text-white font-bold'
                      : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {cat === 'all' ? 'ସମସ୍ତ (All Categories)' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-amber-200 p-8">
              <ShoppingBag className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-amber-950">କୌଣସି ସାମଗ୍ରୀ ମିଳିଲା ନାହିଁ।</h3>
              <p className="text-xs text-gray-500 mt-1">
                ଅନ୍ୟ କିଛି ନାମ ଖୋଜି ଚେଷ୍ଟା କରନ୍ତୁ କିମ୍ବା କାଟେଗୋରୀ ବଦଳାନ୍ତୁ।
              </p>
            </div>
          ) : (
            <div
              className={
                config.templateStyle === 'list'
                  ? 'flex flex-col space-y-3'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'
              }
            >
              {filteredProducts.map((product, productIdx) => {
                const cartItem = cart.find((ci) => ci.product.id === product.id);
                const itemQty = cartItem ? cartItem.quantity : 0;

                return (
                  <div
                    key={product.id}
                    id={`product-${product.id}`}
                    className={`bg-white rounded-2xl border shadow-sm hover:shadow-xl transition flex overflow-hidden relative group ${
                      config.templateStyle === 'list' ? 'flex-col sm:flex-row' : 'flex-col'
                    } ${
                      highlightedProductId === product.id
                        ? 'border-2 border-amber-500 ring-4 ring-amber-400/60 scale-[1.02] shadow-2xl transition-all duration-500'
                        : 'border-amber-200'
                    }`}
                  >
                    {/* Share Button (Web Share API) */}
                    <button
                      type="button"
                      onClick={(e) => handleShareProduct(product, e)}
                      className="absolute top-3 left-3 z-20 px-2.5 py-1.5 bg-white/95 hover:bg-white text-amber-950 rounded-full shadow-md border border-amber-300 transition cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1 text-[11px] font-bold"
                      title="Share Product Link"
                    >
                      {copiedProductId === product.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                          <span className="text-emerald-700 font-extrabold text-[10px]">କପି ହେଲା</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-amber-800" />
                          <span className="text-amber-900 font-bold text-[10px]">ଶେୟାର୍</span>
                        </>
                      )}
                    </button>

                    {/* Stock Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      {product.inStock ? (
                        <span className="bg-emerald-600/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> ଷ୍ଟକ୍‌ରେ ଅଛି
                        </span>
                      ) : (
                        <span className="bg-rose-600/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                          <Ban className="w-3 h-3" /> ଷ୍ଟକ୍ ଶେଷ
                        </span>
                      )}
                    </div>

                    {/* Product Image */}
                    <div
                      className={
                        config.templateStyle === 'list'
                          ? 'w-full sm:w-48 h-44 sm:h-auto bg-amber-50 overflow-hidden relative shrink-0'
                          : 'w-full h-44 bg-amber-50 overflow-hidden relative'
                      }
                    >
                      <SmartImage
                        src={
                          product.imageUrl ||
                          'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=600&auto=format&fit=crop'
                        }
                        alt={product.name}
                        priority={productIdx < 4}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        fallbackSrc="https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=600&auto=format&fit=crop"
                      />
                    </div>

                    {/* Product Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                          {product.category}
                        </span>
                        <h3 className="font-bold text-sm text-amber-950 mt-1.5 leading-snug">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-amber-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-gray-500 block leading-none">
                              ମୂଲ୍ୟ (Price)
                            </span>
                            <span className="text-base font-black text-amber-900">
                              ₹{product.price}
                            </span>
                          </div>

                          {/* Item Quantity Counter if in Cart */}
                          {itemQty > 0 && (
                            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 rounded-xl p-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQuantity(product.id, -1)}
                                className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-black flex items-center justify-center cursor-pointer text-xs"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-black text-xs text-emerald-950 px-1.5">
                                {itemQty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQuantity(product.id, 1)}
                                className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-black flex items-center justify-center cursor-pointer text-xs"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Add to Cart & Buy Now Action Buttons */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            disabled={!product.inStock}
                            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              product.inStock
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{itemQty > 0 ? `କାର୍ଟ (${itemQty})` : 'କାର୍ଟରେ ଯୋଡ଼ନ୍ତୁ'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickBuy(product)}
                            disabled={!product.inStock}
                            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              product.inStock
                                ? 'bg-amber-900 hover:bg-amber-950 text-white shadow-md active:scale-95'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>ଅର୍ଡର୍ କରନ୍ତୁ</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MY ORDERS TAB */}
      {activeTab === 'my_orders' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="bg-amber-100/60 border border-amber-300 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-900" />
              <div>
                <h3 className="font-bold text-sm text-amber-950">ମୋର ସମସ୍ତ ଅର୍ଡର୍ (My Placed Orders)</h3>
                <p className="text-xs text-amber-800">ନଗଦ ଦେୟ (Cash on Delivery) ସ୍ଥିତି</p>
              </div>
            </div>
          </div>

          {myOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-amber-200 p-8">
              <ShoppingBag className="w-12 h-12 text-amber-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-amber-950">ଆପଣ କୌଣସି ଅର୍ଡର୍ କରିନାହାନ୍ତି।</p>
              <button
                onClick={() => setActiveTab('browse')}
                className="mt-4 px-4 py-2 bg-amber-900 text-white font-bold text-xs rounded-xl hover:bg-amber-950 transition cursor-pointer"
              >
                ସାମଗ୍ରୀ ବ୍ରାଉଜ୍ କରନ୍ତୁ (Browse Store)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order) => {
                const createdTime = new Date(order.createdAt).getTime();
                const nowTime = Date.now();
                const hoursPassed = (nowTime - createdTime) / (1000 * 60 * 60);
                const canCancel = hoursPassed <= 24 && order.status !== 'cancelled' && order.status !== 'delivered';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
                      <div>
                        <div className="text-xs font-mono font-bold text-amber-900">#{order.id}</div>
                        <div className="text-[11px] text-gray-500">
                          {new Date(order.createdAt).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div>
                        {order.status === 'pending' && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> ଅପେକ୍ଷାରେ ଅଛି (Pending)
                          </span>
                        )}
                        {order.status === 'approved' && (
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> ଗୃହୀତ ହୋଇଛି (Approved)
                          </span>
                        )}
                        {order.status === 'delivered' && (
                          <span className="bg-blue-100 text-blue-900 border border-blue-300 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Truck className="w-3 h-3 text-blue-600" /> ହସ୍ତାନ୍ତର ହୋଇଛି (Delivered)
                          </span>
                        )}
                        {order.status === 'cancelled' && (
                          <span className="bg-rose-100 text-rose-900 border border-rose-300 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" /> ବାତିଲ୍ ହୋଇଛି (Cancelled)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Estimated Delivery Date if set */}
                    {order.deliveryDate && order.status === 'approved' && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold p-2.5 rounded-xl flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>ଆନୁମାନିକ ପହଞ୍ଚିବା ତାରିଖ (Est. Delivery): {order.deliveryDate}</span>
                      </div>
                    )}

                    {/* Order Details */}
                    <div className="space-y-2 text-xs text-gray-700">
                      <div>
                        <span className="font-bold text-gray-900">ଗ୍ରାହକ: </span>
                        {order.customerName} ({order.customerMobile})
                      </div>
                      <div>
                        <span className="font-bold text-gray-900">ଠିକଣା: </span>
                        {order.deliveryAddress}
                      </div>

                      <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 mt-2">
                        <span className="font-bold text-amber-950 block mb-1">ସାମଗ୍ରୀ ତାଲିକା (Items):</span>
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs py-0.5">
                            <span>
                              {it.productName} × {it.quantity}
                            </span>
                            <span className="font-bold">₹{it.price * it.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t border-amber-200 mt-2 pt-1 flex justify-between font-black text-amber-950 text-sm">
                          <span>ମୋଟ ଦେୟ (COD Total):</span>
                          <span>₹{order.totalAmount}</span>
                        </div>
                      </div>

                      {/* Cancellation Reason if cancelled */}
                      {order.status === 'cancelled' && order.cancellationReason && (
                        <div className="bg-rose-50 text-rose-900 p-2.5 rounded-xl border border-rose-200 text-xs mt-2">
                          <span className="font-bold">ବାତିଲ୍ କରିବାର କାରଣ: </span>
                          {order.cancellationReason}
                        </div>
                      )}
                    </div>

                    {/* 24-Hour Cancellation Action */}
                    {canCancel && (
                      <div className="pt-2 border-t border-amber-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setCancellingOrder(order);
                            setCancelReason('');
                            setCancelError(null);
                          }}
                          className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs rounded-xl border border-rose-300 transition cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>ଅର୍ଡର୍ ବାତିଲ୍ କରନ୍ତୁ (Cancel Order - 24h)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FLOATING BOTTOM CART SUMMARY BAR */}
      {cart.length > 0 && activeTab === 'browse' && !isCartOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9990] w-11/12 max-w-xl bg-amber-950 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center justify-between gap-3 animate-bounce-short">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-amber-500 text-amber-950 rounded-xl flex items-center justify-center font-black text-sm shadow">
              {totalCartItemsCount}
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200">ସାମଗ୍ରୀ କାର୍ଟରେ ଅଛି</div>
              <div className="text-sm font-black text-amber-400">₹{subtotal} (COD)</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsCartOpen(true);
              setCheckoutError(null);
            }}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>କାର୍ଟ ଦେଖନ୍ତୁ ଓ ଅର୍ଡର୍ କରନ୍ତୁ</span>
          </button>
        </div>
      )}

      {/* MULTI-SELECT CART & COD CHECKOUT MODAL */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="bg-white border-2 border-amber-600 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-left text-gray-800 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-900" />
                <h3 className="text-base font-bold text-amber-950">
                  ଖରିଦ କାର୍ଟ ଓ ନଗଦ ଦେୟ (Multi-Item COD Cart)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {checkoutError && (
              <div className="bg-rose-50 border border-rose-300 text-rose-900 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{checkoutError}</div>
              </div>
            )}

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="text-center py-8 bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-2">
                <ShoppingBag className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-xs font-bold text-amber-950">ଆପଣଙ୍କ କାର୍ଟ ଖାଲି ଅଛି।</p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-3 py-1.5 bg-amber-900 text-white font-bold text-xs rounded-xl"
                >
                  ସାମଗ୍ରୀ ପସନ୍ଦ କରନ୍ତୁ
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 border-b border-amber-100 pb-1">
                  <span>ଚୟନିତ ସାମଗ୍ରୀ ତାଲିକା ({cart.length})</span>
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold underline cursor-pointer"
                  >
                    ସବୁ ଖାଲି କରନ୍ତୁ (Clear All)
                  </button>
                </div>

                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-amber-50/80 p-2.5 rounded-2xl border border-amber-200 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={
                          item.product.imageUrl ||
                          'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=600&auto=format&fit=crop'
                        }
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded-xl border border-amber-300 shrink-0"
                      />
                      <div className="truncate">
                        <h4 className="font-bold text-xs text-amber-950 truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-[11px] text-amber-800">
                          ₹{item.product.price} × {item.quantity} ={' '}
                          <span className="font-black text-amber-950">
                            ₹{item.product.price * item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Quantity Adjusters */}
                      <div className="flex items-center gap-1 bg-white border border-amber-300 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(item.product.id, -1)}
                          className="w-5 h-5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-950 font-black flex items-center justify-center cursor-pointer text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-black text-xs text-amber-950 px-1">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(item.product.id, 1)}
                          className="w-5 h-5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-950 font-black flex items-center justify-center cursor-pointer text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove Item */}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl transition cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total Calculation Breakdown */}
            <div className="bg-amber-100/80 p-3.5 rounded-2xl border border-amber-300 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-700">
                <span>ସବ୍-ଟୋଟାଲ୍ (Subtotal):</span>
                <span className="font-bold text-amber-950">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>ଡେଲିଭରୀ ଚାର୍ଜ (Delivery Charge):</span>
                <span className="font-bold">FREE (₹0.00)</span>
              </div>
              <div className="border-t border-amber-300 pt-1.5 flex justify-between font-black text-amber-950 text-sm">
                <span>ମୋଟ ଦେୟ (Grand Total - COD):</span>
                <span className="text-amber-900 text-base">₹{grandTotal}</span>
              </div>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handlePlaceOrder} className="space-y-3 text-xs">
              {/* Customer Name */}
              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  ଗ୍ରାହକଙ୍କ ନାମ (Customer Name) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="ଆପଣଙ୍କ ନାମ ଲେଖନ୍ତୁ"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  ମୋବାଇଲ୍ ନମ୍ବର (Mobile Number) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="୧୦-ଅଙ୍କ ମୋବାଇଲ୍ ନମ୍ବର"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* District Selection (Odisha 30 Districts) */}
              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  ଜିଲ୍ଲା ଚୟନ କରନ୍ତୁ (Select District) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      setCheckoutError(null);
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    {ODISHA_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* District COD Availability Status Message */}
              {(() => {
                const isCodActive = config.districtCodStatus?.[selectedDistrict] !== false;
                return isCodActive ? (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>COD Available for {selectedDistrict}</span>
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-rose-300 text-rose-900 p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>COD Not Available for this location</span>
                  </div>
                );
              })()}

              {/* Delivery Address */}
              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  ପୂର୍ଣ୍ଣ ବିତରଣ ଠିକଣା (Delivery Address) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-amber-600 absolute left-3 top-3" />
                  <textarea
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="ଗ୍ରାମ / ସହର, ପିନ୍ କୋଡ୍, ଲ୍ୟାଣ୍ଡମାର୍କ..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Return & Refund Policy Warning Notice */}
              <div className="bg-amber-50/90 border-2 border-amber-400/80 p-3 rounded-2xl text-amber-950 text-[11px] leading-relaxed shadow-sm flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-amber-900 block mb-0.5">⚠️ ରିଟର୍ଣ୍ଣ ଓ ରିଫଣ୍ଡ୍ ନିୟମାବଳୀ (Return Policy):</span>
                  <p className="font-medium text-amber-950">
                    ସୂଚନା: କୌଣସି ସାମଗ୍ରୀ ଫେରାଇବା ପାଇଁ, ପାର୍ସଲ୍ ଖୋଲିବା ସମୟର ଭିଡିଓ (Unboxing Video) ଦେବା ବାଧ୍ୟତାମୂଳକ। ବିନା ଭିଡିଓରେ କୌଣସି ରିଟର୍ଣ୍ଣ ଗ୍ରହଣ କରାଯିବ ନାହିଁ ଏବଂ ଅଭିଯୋଗ ୨୪ ଘଣ୍ଟା ମଧ୍ୟରେ କରିବାକୁ ହେବ।
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition cursor-pointer"
                >
                  ରଦ୍ଦ କରନ୍ତୁ
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    cart.length === 0 ||
                    config.districtCodStatus?.[selectedDistrict] === false
                  }
                  className={`w-2/3 py-2.5 rounded-xl text-white font-bold transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 ${
                    config.districtCodStatus?.[selectedDistrict] === false || cart.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-amber-900 hover:bg-amber-950'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'ଅର୍ଡର୍ ହେଉଛି...' : `ଅର୍ଡର୍ କନଫର୍ମ (₹${grandTotal})`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER SUCCESS POPUP */}
      {orderSuccess && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          onClick={() => setOrderSuccess(null)}
        >
          <div
            className="bg-white border-2 border-emerald-600 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-amber-950">
              ଅର୍ଡର୍ ସଫଳ ହୋଇଛି! (Order Placed Successfully)
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              ଆପଣଙ୍କର Cash on Delivery ଅର୍ଡର୍ ସଫଳତାର ସହ ଗୃହୀତ ହୋଇଛି। ଆମ ଟିମ୍ ଶୀଘ୍ର ଆପଣଙ୍କ ସହ ଯୋଗାଯୋଗ କରିବେ।
            </p>
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs font-mono font-bold text-amber-900">
              ORDER ID: #{orderSuccess.id}
            </div>
            <button
              type="button"
              onClick={() => {
                setOrderSuccess(null);
                setActiveTab('my_orders');
              }}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              ମୋର ଅର୍ଡର୍ ଦେଖନ୍ତୁ (View My Order)
            </button>
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {cancellingOrder && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          onClick={() => setCancellingOrder(null)}
        >
          <div
            className="bg-white border-2 border-rose-600 rounded-3xl max-w-md w-full p-6 shadow-2xl text-left space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-rose-200 pb-3">
              <h3 className="text-base font-bold text-rose-950 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>ଅର୍ଡର୍ ବାତିଲ୍ କରନ୍ତୁ (Cancel Order)</span>
              </h3>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {cancelError && (
              <div className="bg-rose-50 border border-rose-300 text-rose-900 p-3 rounded-xl text-xs font-semibold">
                {cancelError}
              </div>
            )}

            <div className="text-xs text-gray-600">
              ORDER ID: <span className="font-mono font-bold text-amber-900">#{cancellingOrder.id}</span>
            </div>

            <div>
              <label className="font-bold text-xs text-gray-800 block mb-1">
                ବାତିଲ୍ କରିବାର କାରଣ ଦିଅନ୍ତୁ (Reason for Cancellation) *
              </label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="ବାତିଲ୍ କରିବାର କାରଣ ଲେଖନ୍ତୁ..."
                className="w-full p-3 rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="w-1/2 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition cursor-pointer"
              >
                ଫେରିଯାଅ
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="w-1/2 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition cursor-pointer"
              >
                {isCancelling ? 'ବାତିଲ୍ ହେଉଛି...' : 'ବାତିଲ୍ କନଫର୍ମ କରନ୍ତୁ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
