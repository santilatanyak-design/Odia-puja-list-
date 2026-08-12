import React, { useState, useEffect } from 'react';
import { StoreProduct, StoreOrder, StoreConfig } from '../types';
import {
  getStoreProducts,
  subscribeStoreProducts,
  saveStoreProduct,
  toggleProductStock,
  deleteStoreProduct,
  getStoreOrders,
  subscribeStoreOrders,
  updateOrderStatus,
  getStoreConfig,
  subscribeStoreConfig,
  updateStoreConfig,
  suspendMobileNumber,
  unsuspendMobileNumber,
  toggleDistrictCod,
  setAllDistrictsCodStatus,
  generateJpgBill,
  DEFAULT_BANNER_IMAGE,
  ODISHA_DISTRICTS,
} from '../lib/storeApi';
import {
  ShoppingBag,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Ban,
  Plus,
  Trash2,
  Edit,
  Download,
  Image,
  ShieldAlert,
  Search,
  Check,
  Calendar,
  Phone,
  User,
  MapPin,
  Save,
  RefreshCw,
} from 'lucide-react';

export const AdminStoreManagement: React.FC = () => {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [config, setConfig] = useState<StoreConfig>({
    bannerImageUrl: DEFAULT_BANNER_IMAGE,
    suspendedMobiles: [],
  });

  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'products' | 'districts' | 'banner_security'>('orders');
  const [districtSearch, setDistrictSearch] = useState('');

  // Banner State
  const [bannerInputUrl, setBannerInputUrl] = useState('');
  const [bannerSaveStatus, setBannerSaveStatus] = useState<string | null>(null);

  // Security / Blacklist State
  const [newSuspendMobile, setNewSuspendMobile] = useState('');
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);

  // Orders Filter & Delivery Date state
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [editingDeliveryDate, setEditingDeliveryDate] = useState<{ id: string; date: string } | null>(null);

  // Product Form State (Add / Edit)
  const [editingProduct, setEditingProduct] = useState<Partial<StoreProduct> | null>(null);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  useEffect(() => {
    const unsubP = subscribeStoreProducts((data) => setProducts(data));
    const unsubO = subscribeStoreOrders((data) => setOrders(data));
    const unsubC = subscribeStoreConfig((cfg) => {
      setConfig(cfg);
      setBannerInputUrl(cfg.bannerImageUrl || DEFAULT_BANNER_IMAGE);
    });

    return () => {
      unsubP();
      unsubO();
      unsubC();
    };
  }, []);

  // Save Banner URL
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = bannerInputUrl.trim() || DEFAULT_BANNER_IMAGE;
    await updateStoreConfig({ bannerImageUrl: cleanUrl });
    setBannerSaveStatus('ବ୍ୟାନର୍ ଚବି URL ସଫଳତାର ସହ ଅପଡେଟ୍ ହେଲା! (Banner updated successfully)');
    setTimeout(() => setBannerSaveStatus(null), 4000);
  };

  // Add/Suspend Mobile Number
  const handleAddSuspendMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSuspendMobile.trim().replace(/\D/g, '');
    if (clean.length < 10) {
      setSecurityMessage('ଦୟାକରି ସଠିକ୍ ୧୦-ଅଙ୍କ ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ।');
      return;
    }

    await suspendMobileNumber(clean);
    setNewSuspendMobile('');
    setSecurityMessage(`ମୋବାଇଲ୍ ନମ୍ବର (${clean}) ନିଲମ୍ବିତ / ସସପେଣ୍ଡ (Blacklisted) କରାଗଲା।`);
    setTimeout(() => setSecurityMessage(null), 4000);
  };

  // Unsuspend Mobile
  const handleUnsuspendMobile = async (mobile: string) => {
    await unsuspendMobileNumber(mobile);
    setSecurityMessage(`ମୋବାଇଲ୍ ନମ୍ବର (${mobile}) ଅନଲକ୍ / ସସପେଣ୍ଡ ମୁକ୍ତ କରାଗଲା।`);
    setTimeout(() => setSecurityMessage(null), 4000);
  };

  // Save Product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name?.trim()) {
      setProductFormError('ଦୟାକରି ସାମଗ୍ରୀର ନାମ ଦିଅନ୍ତୁ');
      return;
    }

    const saved = await saveStoreProduct({
      id: editingProduct.id,
      name: editingProduct.name.trim(),
      price: Number(editingProduct.price) || 0,
      category: editingProduct.category?.trim() || 'General',
      imageUrl: editingProduct.imageUrl?.trim() || '',
      description: editingProduct.description?.trim() || '',
      inStock: editingProduct.inStock ?? true,
    });

    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });

    setEditingProduct(null);
    setProductFormError(null);
  };

  // Toggle Stock Status
  const handleToggleStock = async (productId: string, currentStock: boolean) => {
    const nextStock = !currentStock;
    await toggleProductStock(productId, nextStock);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, inStock: nextStock } : p))
    );
  };

  // Delete Product with Confirmation
  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('ଆପଣ ସତରେ ଏହି ସାମଗ୍ରୀଟିକୁ ତାଲିକାରୁ କାଢ଼ିବାକୁ (Delete) ଚାହୁଁଛନ୍ତି କି?')) {
      await deleteStoreProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  const handleApproveOrder = async (orderId: string, deliveryDateStr: string) => {
    await updateOrderStatus(orderId, 'approved', deliveryDateStr || '3-5 କାର୍ଯ୍ୟ ଦିବସ ମଧ୍ୟରେ');
    setEditingDeliveryDate(null);
  };

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Sub Header Navigation */}
      <div className="bg-amber-900 text-amber-100 p-4 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-amber-400" />
          <h2 className="text-lg font-black tracking-wide">
            🏪 ପୂଜା ସାମଗ୍ରୀ ଷ୍ଟୋର୍ ଆଡମିନ୍ ପ୍ୟାନେଲ୍ (Store Management)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'orders'
                ? 'bg-amber-400 text-amber-950 font-black shadow-md'
                : 'bg-amber-950/60 text-amber-200 hover:bg-amber-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>ଅର୍ଡର୍ ମ୍ୟାନେଜମେଣ୍ଟ ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'products'
                ? 'bg-amber-400 text-amber-950 font-black shadow-md'
                : 'bg-amber-950/60 text-amber-200 hover:bg-amber-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>ସାମଗ୍ରୀ ଓ ଷ୍ଟୋକ୍ କଣ୍ଟ୍ରୋଲ୍ ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('districts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'districts'
                ? 'bg-amber-400 text-amber-950 font-black shadow-md'
                : 'bg-amber-950/60 text-amber-200 hover:bg-amber-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>ଜିଲ୍ଲା COD ମ୍ୟାନେଜମେଣ୍ଟ (30 Districts)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('banner_security')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'banner_security'
                ? 'bg-amber-400 text-amber-950 font-black shadow-md'
                : 'bg-amber-950/60 text-amber-200 hover:bg-amber-800'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>ବ୍ୟାନର୍ ଓ ନିଲମ୍ବନ (Banner & Blacklist)</span>
          </button>
        </div>
      </div>

      {/* 1. ORDERS MANAGEMENT TAB */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          {/* Status Filter Bar */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-amber-200 shadow-sm flex-wrap gap-2">
            <div className="flex items-center gap-2 overflow-x-auto">
              {['all', 'pending', 'approved', 'delivered', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                    orderStatusFilter === st
                      ? 'bg-amber-900 text-white shadow-md'
                      : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {st === 'all' && `ସମସ୍ତ (${orders.length})`}
                  {st === 'pending' && `ଅପେକ୍ଷାରେ (${orders.filter((o) => o.status === 'pending').length})`}
                  {st === 'approved' && `ଗୃହୀତ (${orders.filter((o) => o.status === 'approved').length})`}
                  {st === 'delivered' && `ହସ୍ତାନ୍ତର (${orders.filter((o) => o.status === 'delivered').length})`}
                  {st === 'cancelled' && `ବାତିଲ୍ (${orders.filter((o) => o.status === 'cancelled').length})`}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-amber-200 p-8">
              <Truck className="w-12 h-12 text-amber-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-amber-950">କୌଣସି ଅର୍ଡର୍ ମିଳିଲା ନାହିଁ।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-amber-300 p-5 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-amber-900 text-sm">#{order.id}</span>
                        <span className="text-[11px] text-gray-500">
                          {new Date(order.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Status Tag */}
                      <div>
                        {order.status === 'pending' && (
                          <span className="bg-amber-100 text-amber-900 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-amber-300">
                            ⏳ Pending COD
                          </span>
                        )}
                        {order.status === 'approved' && (
                          <span className="bg-emerald-100 text-emerald-900 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-300">
                            ✅ Approved
                          </span>
                        )}
                        {order.status === 'delivered' && (
                          <span className="bg-blue-100 text-blue-900 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-blue-300">
                            🚚 Delivered
                          </span>
                        )}
                        {order.status === 'cancelled' && (
                          <span className="bg-rose-100 text-rose-900 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-rose-300">
                            ❌ Cancelled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                      <div className="font-bold text-amber-950 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-700" />
                        <span>ଗ୍ରାହକ: {order.customerName}</span>
                      </div>
                      <div className="font-mono text-gray-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-700" />
                        <span>+91 {order.customerMobile}</span>
                        {config.suspendedMobiles?.includes(order.customerMobile) && (
                          <span className="bg-rose-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded ml-2">
                            SUSPENDED / BLACKLISTED
                          </span>
                        )}
                      </div>
                      <div className="text-gray-700 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span>ଠିକଣା: {order.deliveryAddress}</span>
                      </div>
                    </div>

                    {/* Ordered Items */}
                    <div className="text-xs space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-900 block border-b pb-1 mb-1">
                        ଅର୍ଡର୍ ସାମଗ୍ରୀ (Items):
                      </span>
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span>
                            {it.productName} × {it.quantity}
                          </span>
                          <span className="font-bold text-gray-800">₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-300 pt-1 flex justify-between font-black text-amber-950 text-sm">
                        <span>ମୋଟ COD ମୂଲ୍ୟ:</span>
                        <span>₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Delivery Date if Approved */}
                    {order.deliveryDate && (
                      <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        <span>ପହଞ୍ଚିବା ତାରିଖ (Est. Delivery): {order.deliveryDate}</span>
                      </div>
                    )}

                    {/* Cancellation Details if Cancelled */}
                    {order.status === 'cancelled' && (
                      <div className="text-xs bg-rose-50 text-rose-900 p-2.5 rounded-xl border border-rose-200 space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>ଗ୍ରାହକଙ୍କ ବାତିଲ୍ କରିବାର କାରଣ:</span>
                        </div>
                        <p className="italic bg-white p-2 rounded border border-rose-200">
                          "{order.cancellationReason || 'କୌଣସି କାରଣ ଦର୍ଶାଯାଇନାହିଁ'}"
                        </p>
                        {order.cancelledAt && (
                          <div className="text-[10px] text-rose-700">
                            ବାତିଲ୍ ସମୟ: {new Date(order.cancelledAt).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-amber-100 flex flex-wrap items-center justify-between gap-2">
                    {/* Download JPG Bill Button */}
                    <button
                      type="button"
                      onClick={() => generateJpgBill(order)}
                      className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JPG Bill</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Approve Order with Delivery Date */}
                      {order.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditingDeliveryDate({
                              id: order.id,
                              date: '3-5 କାର୍ଯ୍ୟ ଦିବସ ମଧ୍ୟରେ',
                            })
                          }
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {/* Mark Delivered */}
                      {order.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Mark Delivered</span>
                        </button>
                      )}

                      {/* Cancel Order */}
                      {order.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 border border-rose-300"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}

                      {/* Quick Suspend Mobile */}
                      {!config.suspendedMobiles?.includes(order.customerMobile) ? (
                        <button
                          type="button"
                          onClick={() => suspendMobileNumber(order.customerMobile)}
                          title="Suspend this mobile number"
                          className="p-1.5 bg-gray-100 hover:bg-rose-100 text-gray-600 hover:text-rose-700 rounded-xl transition cursor-pointer"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => unsuspendMobileNumber(order.customerMobile)}
                          title="Unsuspend this mobile number"
                          className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl transition cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Delivery Date Input Popover */}
                  {editingDeliveryDate?.id === order.id && (
                    <div className="bg-amber-100/90 p-3 rounded-xl border border-amber-300 space-y-2 mt-2">
                      <label className="font-bold text-xs text-amber-950 block">
                        ଆନୁମାନିକ ପହଞ୍ଚିବା ତାରିଖ (Est. Delivery Date) ଦିଅନ୍ତୁ:
                      </label>
                      <input
                        type="text"
                        value={editingDeliveryDate.date}
                        onChange={(e) =>
                          setEditingDeliveryDate({ id: order.id, date: e.target.value })
                        }
                        placeholder="ଉଦାହରଣ: 15 Aug 2026 କିମ୍ବା 3 ଦିନ ମଧ୍ୟରେ"
                        className="w-full p-2 bg-white rounded-lg border border-amber-400 text-xs focus:outline-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingDeliveryDate(null)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            handleApproveOrder(order.id, editingDeliveryDate.date)
                          }
                          className="px-3 py-1 bg-emerald-700 text-white text-xs font-bold rounded-lg"
                        >
                          Confirm Approval
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. PRODUCTS & STOCK CONTROL TAB */}
      {activeSubTab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-amber-200">
            <div>
              <h3 className="font-bold text-sm text-amber-950">
                ସାମଗ୍ରୀ ଷ୍ଟୋକ୍ କଣ୍ଟ୍ରୋଲ୍ (Store Products & Stock Toggle)
              </h3>
              <p className="text-xs text-gray-500">
                ଷ୍ଟୋକ୍ "Out of Stock" କଲେ ୱେବସାଇଟ୍‌ରେ କିଣିବା ବଟନ୍ ନିଷ୍କ୍ରିୟ (Disable) ହୋଇଯିବ।
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setEditingProduct({
                  name: '',
                  price: 100,
                  category: 'ପୂଜା ସାମଗ୍ରୀ',
                  imageUrl: '',
                  description: '',
                  inStock: true,
                })
              }
              className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>ନୂତନ ସାମଗ୍ରୀ ଯୋଡ଼ନ୍ତୁ</span>
            </button>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="flex gap-3">
                  <img
                    src={
                      p.imageUrl ||
                      'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=600&auto=format&fit=crop'
                    }
                    alt={p.name}
                    className="w-20 h-20 object-cover rounded-xl border border-amber-200 shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {p.category}
                    </span>
                    <h4 className="font-bold text-xs text-amber-950 leading-snug">{p.name}</h4>
                    <div className="text-sm font-black text-amber-900">₹{p.price}</div>
                  </div>
                </div>

                {/* Stock Control Toggle */}
                <div className="pt-2 border-t border-amber-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleStock(p.id, p.inStock)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                      p.inStock
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-900 border border-rose-300 hover:bg-rose-200'
                    }`}
                  >
                    {p.inStock ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>In Stock (ଷ୍ଟକ୍‌ରେ ଅଛି)</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5 text-rose-700" />
                        <span>Out of Stock (ଷ୍ଟକ୍ ଶେଷ)</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(p)}
                      title="Edit Product (ସମ୍ପାଦନା କରନ୍ତୁ)"
                      className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
                      title="Delete Product (କାଢ଼ନ୍ତୁ)"
                      className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. DISTRICT-WISE COD MANAGEMENT TAB */}
      {activeSubTab === 'districts' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-amber-300 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-800" />
                <span>Odisha District-wise COD Management (ଓଡ଼ିଶା ୩୦ଟି ଜିଲ୍ଲା COD ନିୟନ୍ତ୍ରଣ)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                ଜିଲ୍ଲା ପାଇଁ "Active" କିମ୍ବା "Deactivated" ମୋଡ୍ ସେଟ୍ କରନ୍ତୁ। Deactivated କଲେ ଗ୍ରାହକ ଅର୍ଡର୍ କରିପାରିବେ ନାହିଁ।
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setAllDistrictsCodStatus(true)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Activate All (ସମସ୍ତ Active)</span>
              </button>
              <button
                type="button"
                onClick={() => setAllDistrictsCodStatus(false)}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Deactivate All (ସମସ୍ତ Deactivate)</span>
              </button>
            </div>
          </div>

          {/* Search Box for Districts */}
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 text-amber-700 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
              placeholder="ଜିଲ୍ଲା ଖୋଜନ୍ତୁ (Search District)..."
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-amber-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Districts List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ODISHA_DISTRICTS.filter((d) =>
              d.toLowerCase().includes(districtSearch.toLowerCase().trim())
            ).map((districtName) => {
              const isActive = config.districtCodStatus?.[districtName] !== false; // default true if undefined
              return (
                <div
                  key={districtName}
                  className={`p-3.5 rounded-2xl border transition shadow-sm flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50/70 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs flex items-center gap-1.5">
                      <MapPin className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-rose-700'}`} />
                      <span>{districtName}</span>
                    </h4>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : 'bg-rose-200/80 text-rose-900'
                      }`}
                    >
                      {isActive ? 'COD Active (ସକ୍ରିୟ)' : 'COD Deactivated (ନିଷ୍କ୍ରିୟ)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleDistrictCod(districtName, !isActive)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1 shrink-0 ${
                      isActive
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-rose-700 hover:bg-rose-800 text-white'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>Deactivated</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. BANNER & BLACKLIST SECURITY TAB */}
      {activeSubTab === 'banner_security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* YouTube Banner URL Update */}
          <div className="bg-white p-5 rounded-2xl border border-amber-300 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-amber-200 pb-3">
              <Image className="w-5 h-5 text-amber-800" />
              <h3 className="font-bold text-sm text-amber-950">
                YouTube-style Top Banner Image URL
              </h3>
            </div>

            {bannerSaveStatus && (
              <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 p-3 rounded-xl text-xs font-semibold">
                {bannerSaveStatus}
              </div>
            )}

            <form onSubmit={handleSaveBanner} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  Store Banner Image URL:
                </label>
                <input
                  type="url"
                  required
                  value={bannerInputUrl}
                  onChange={(e) => setBannerInputUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-2.5 rounded-xl border border-amber-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Banner Live Preview */}
              <div>
                <span className="font-bold text-gray-700 block mb-1">Live Preview:</span>
                <div className="w-full h-32 rounded-xl overflow-hidden border border-amber-200 bg-gray-100">
                  <img
                    src={bannerInputUrl || DEFAULT_BANNER_IMAGE}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', DEFAULT_BANNER_IMAGE);
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Update Banner</span>
              </button>
            </form>
          </div>

          {/* Suspended / Blacklisted Mobiles */}
          <div className="bg-white p-5 rounded-2xl border border-rose-300 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-200 pb-3">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-sm text-rose-950">
                ସସପେଣ୍ଡ ମୋବାଇଲ୍ ସିଷ୍ଟମ୍ (Suspension / Blacklist)
              </h3>
            </div>

            {securityMessage && (
              <div className="bg-rose-50 text-rose-900 border border-rose-300 p-3 rounded-xl text-xs font-semibold">
                {securityMessage}
              </div>
            )}

            <form onSubmit={handleAddSuspendMobile} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  ସସପେଣ୍ଡ କରିବାକୁ ୧୦-ଅଙ୍କ ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ:
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newSuspendMobile}
                    onChange={(e) => setNewSuspendMobile(e.target.value)}
                    placeholder="୯୮୭୬୫୪୩୨୧୦"
                    className="flex-1 p-2.5 rounded-xl border border-rose-300 text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Suspend</span>
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-2 pt-2 border-t border-rose-100">
              <h4 className="font-bold text-xs text-gray-800">
                ସସପେଣ୍ଡ / ବ୍ଲକିଙ୍ଗ୍ ତାଲିକା ({config.suspendedMobiles?.length || 0}):
              </h4>
              {(!config.suspendedMobiles || config.suspendedMobiles.length === 0) ? (
                <p className="text-xs text-gray-500 italic">କୌଣସି ମୋବାଇଲ୍ ନମ୍ବର ସସପେଣ୍ଡ ହୋଇନାହିଁ।</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {config.suspendedMobiles.map((m) => (
                    <div
                      key={m}
                      className="flex items-center justify-between bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-xs"
                    >
                      <span className="font-mono font-bold text-rose-900">+91 {m}</span>
                      <button
                        type="button"
                        onClick={() => handleUnsuspendMobile(m)}
                        className="px-2.5 py-1 bg-emerald-700 text-white font-bold text-[10px] rounded-lg hover:bg-emerald-800 transition cursor-pointer"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT/ADD PRODUCT MODAL */}
      {editingProduct && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          onClick={() => setEditingProduct(null)}
        >
          <div
            className="bg-white border-2 border-amber-600 rounded-3xl max-w-md w-full p-6 shadow-2xl text-left space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <h3 className="font-bold text-sm text-amber-950">
                {editingProduct.id ? 'ସାମଗ୍ରୀ ସମ୍ପାଦନା କରନ୍ତୁ (Edit Product)' : 'ନୂତନ ସାମଗ୍ରୀ ଯୋଡ଼ନ୍ତୁ (Add Product)'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>

            {productFormError && (
              <div className="bg-rose-50 border border-rose-300 text-rose-900 p-2.5 rounded-xl text-xs">
                {productFormError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-800 block mb-1">ସାମଗ୍ରୀ ନାମ (Item Name) *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="ଉଦାହରଣ: ଶୁଦ୍ଧ ଗାଈ ଘିଅ (Pure Cow Ghee)"
                  className="w-full p-2.5 rounded-xl border border-amber-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-800 block mb-1">ମୂଲ୍ୟ (Price in ₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    placeholder="380"
                    className="w-full p-2.5 rounded-xl border border-amber-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1">କାଟେଗୋରୀ (Category)</label>
                  <input
                    type="text"
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    placeholder="ଘିଅ, ଧୂପ, ପବିତ୍ର ଜଳ..."
                    className="w-full p-2.5 rounded-xl border border-amber-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-800 block mb-1">ଛବି URL (Image URL)</label>
                <input
                  type="url"
                  value={editingProduct.imageUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-2.5 rounded-xl border border-amber-300 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-gray-800 block mb-1">ବିବରଣୀ (Description)</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="ସାମଗ୍ରୀ ବିଷୟରେ ବର୍ଣ୍ଣନା..."
                  className="w-full p-2.5 rounded-xl border border-amber-300 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={editingProduct.inStock ?? true}
                  onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                  className="w-4 h-4 text-amber-800 rounded"
                />
                <label htmlFor="inStockCheck" className="font-bold text-amber-950 text-xs">
                  ଷ୍ଟକ୍‌ରେ ଅଛି (In Stock)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-900 text-white font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
