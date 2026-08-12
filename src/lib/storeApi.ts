import { StoreProduct, StoreOrder, StoreConfig } from '../types';
import { db } from './firebase';
import { sendOrderApprovedPushNotification } from './pushNotifications';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

const STORAGE_KEYS = {
  PRODUCTS: 'puja_store_products',
  ORDERS: 'puja_store_orders',
  CONFIG: 'puja_store_config',
  SUSPENDED: 'puja_store_suspended_mobiles',
};

const COLLECTIONS = {
  PRODUCTS: 'store_products',
  ORDERS: 'store_orders',
  CONFIG: 'store_config',
};

export const DEFAULT_BANNER_IMAGE = 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1200&auto=format&fit=crop';

export const ODISHA_DISTRICTS = [
  'Angul',
  'Balangir',
  'Balasore',
  'Bargarh',
  'Bhadrak',
  'Boudh',
  'Cuttack',
  'Deogarh',
  'Dhenkanal',
  'Gajapati',
  'Ganjam',
  'Jagatsinghpur',
  'Jajpur',
  'Jharsuguda',
  'Kalahandi',
  'Kandhamal',
  'Kendrapara',
  'Kendujhar',
  'Khordha',
  'Koraput',
  'Malkangiri',
  'Mayurbhanj',
  'Nabarangpur',
  'Nayagarh',
  'Nuapada',
  'Puri',
  'Rayagada',
  'Sambalpur',
  'Sonepur',
  'Sundargarh',
];

export const INITIAL_STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 'PROD-101',
    name: 'ଶୁଦ୍ଧ ଗାଈ ଘିଅ (Pure Cow Ghee 500g)',
    price: 380,
    category: 'ଘିଅ ଓ ଦୀପ (Ghee & Lamps)',
    imageUrl: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?q=80&w=600&auto=format&fit=crop',
    description: 'ପୂଜା ଓ ହବନ ପାଇଁ ୧୦୦% ଶୁଦ୍ଧ ଗାଈ ଘିଅ।',
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PROD-102',
    name: 'ଶୁଦ୍ଧ ପବିତ୍ର ଗଙ୍ଗା ଜଳ (Pure Ganga Jal 500ml)',
    price: 120,
    category: 'ପବିତ୍ର ଜଳ (Sacred Waters)',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?q=80&w=600&auto=format&fit=crop',
    description: 'ଗଙ୍ଗୋତ୍ରୀ ରୁ ଆନୀତ ପବିତ୍ର ଶୁଦ୍ଧ ଗଙ୍ଗା ଜଳ।',
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PROD-103',
    name: 'ପୂଜା ପଞ୍ଚାମୃତ କିଟ୍ (Complete Panchamruta Kit)',
    price: 250,
    category: 'ପୂଜା ସାମଗ୍ରୀ କିଟ୍ (Puja Kits)',
    imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=600&auto=format&fit=crop',
    description: 'କ୍ଷୀର, ଦହି, ଘିଅ, ମହୁ ଓ ସରକାର ସହ ସମ୍ପୂର୍ଣ୍ଣ ପଞ୍ଚାମୃତ କିଟ୍।',
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PROD-104',
    name: 'ଶୁଦ୍ଧ ରକ୍ତ ଚନ୍ଦନ ଓ ଶ୍ୱେତ ଚନ୍ଦନ ପ୍ୟାକ୍ (Sandalwood Paste)',
    price: 150,
    category: 'ଚନ୍ଦନ ଓ ସିନ୍ଦୂର (Chandan & Kumkum)',
    imageUrl: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=600&auto=format&fit=crop',
    description: 'ଦେବ ପୂଜା ଓ ତିଳକ ପାଇଁ ପ୍ରାକୃତିକ ଚନ୍ଦନ।',
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PROD-105',
    name: 'ଭୀମସେନୀ କର୍ପୂର (Bhimseni Camphor 100g)',
    price: 180,
    category: 'ଧୂପ ଓ କର୍ପୂର (Incense & Camphor)',
    imageUrl: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?q=80&w=600&auto=format&fit=crop',
    description: 'ଆରତୀ ଓ ଯଜ୍ଞ ପାଇଁ ୧୦୦% ପ୍ରାକୃତିକ କର୍ପୂର।',
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PROD-106',
    name: 'ପ୍ରାକୃତିକ ଧୂପକାଠି ଓ ସୁଗନ୍ଧିତ ଧୂପ (Incense Sticks Set)',
    price: 99,
    category: 'ଧୂପ ଓ କର୍ପୂର (Incense & Camphor)',
    imageUrl: 'https://images.unsplash.com/photo-1514782831304-632d84503f6f?q=80&w=600&auto=format&fit=crop',
    description: 'ମୁଗ୍ରା, ଚନ୍ଦନ ଓ ଗୋଲାପ ସୁବାସିତ ଧୂପ।',
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PROD-107',
    name: 'ପିତ୍ତଳ ପୂଜା ଥାଳି ସେଟ୍ (Brass Puja Thali Set)',
    price: 750,
    category: 'ପୂଜା ବାସନ (Puja Utensils)',
    imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=600&auto=format&fit=crop',
    description: 'ଥାଳି, ଦୀପ, ଘଣ୍ଟି, ଓ ଆଚମନୀ ସହ ଭାରୀ ପିତ୍ତଳ ପୂଜା ସେଟ୍।',
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PROD-108',
    name: 'ଅକ୍ଷତ, ଗୁଆ, ଜନେଉ ଓ ନାଗପାଶ ସେଟ୍',
    price: 110,
    category: 'ପୂଜା ସାମଗ୍ରୀ (General Samagri)',
    imageUrl: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=600&auto=format&fit=crop',
    description: 'ପୂଜାରେ ଲାଗୁଥିବା ଶୁଦ୍ଧ ସମ୍ପୂର୍ଣ୍ଣ ଆନୁଷଙ୍ଗିକ ସାମଗ୍ରୀ।',
    inStock: true,
    createdAt: new Date().toISOString(),
  },
];

// ----------------------------------------------------------------------
// HELPER: LOCAL STORAGE PERSISTENCE + FIRESTORE FALLBACK
// ----------------------------------------------------------------------

function loadLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
  }
  return defaultValue;
}

function saveLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error writing localStorage key "${key}":`, err);
  }
}

// ----------------------------------------------------------------------
// 1. STORE PRODUCTS API
// ----------------------------------------------------------------------

export async function getStoreProducts(): Promise<StoreProduct[]> {
  // Load local first for zero latency
  let localProducts = loadLocal<StoreProduct[]>(STORAGE_KEYS.PRODUCTS, []);
  if (!localProducts || localProducts.length === 0) {
    localProducts = INITIAL_STORE_PRODUCTS;
    saveLocal(STORAGE_KEYS.PRODUCTS, localProducts);
  }

  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    if (!snap.empty) {
      const fsProducts = snap.docs.map((d) => d.data() as StoreProduct);
      saveLocal(STORAGE_KEYS.PRODUCTS, fsProducts);
      return fsProducts;
    } else {
      // Seed initial products to Firestore
      for (const p of INITIAL_STORE_PRODUCTS) {
        await setDoc(doc(db, COLLECTIONS.PRODUCTS, p.id), p);
      }
    }
  } catch (err) {
    console.warn('Firestore getStoreProducts fallback to localStorage:', err);
  }

  return localProducts;
}

export function subscribeStoreProducts(callback: (products: StoreProduct[]) => void): Unsubscribe {
  // Emit local products immediately
  const initial = loadLocal<StoreProduct[]>(STORAGE_KEYS.PRODUCTS, INITIAL_STORE_PRODUCTS);
  callback(initial);

  return onSnapshot(
    collection(db, COLLECTIONS.PRODUCTS),
    (snap) => {
      if (!snap.empty) {
        const products = snap.docs.map((d) => d.data() as StoreProduct);
        saveLocal(STORAGE_KEYS.PRODUCTS, products);
        callback(products);
      }
    },
    (err) => console.warn('subscribeStoreProducts error:', err)
  );
}

export async function saveStoreProduct(product: Partial<StoreProduct>): Promise<StoreProduct> {
  const existing = loadLocal<StoreProduct[]>(STORAGE_KEYS.PRODUCTS, INITIAL_STORE_PRODUCTS);
  let updatedProduct: StoreProduct;

  if (product.id) {
    const idx = existing.findIndex((p) => p.id === product.id);
    if (idx !== -1) {
      updatedProduct = { ...existing[idx], ...product };
      existing[idx] = updatedProduct;
    } else {
      updatedProduct = {
        id: product.id,
        name: product.name || 'New Item',
        price: product.price || 100,
        category: product.category || 'General',
        imageUrl: product.imageUrl || '',
        description: product.description || '',
        inStock: product.inStock ?? true,
        createdAt: new Date().toISOString(),
      };
      existing.push(updatedProduct);
    }
  } else {
    const newId = 'PROD-' + Math.floor(100 + Math.random() * 900);
    updatedProduct = {
      id: newId,
      name: product.name || 'New Item',
      price: product.price || 100,
      category: product.category || 'General',
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      inStock: product.inStock ?? true,
      createdAt: new Date().toISOString(),
    };
    existing.push(updatedProduct);
  }

  saveLocal(STORAGE_KEYS.PRODUCTS, existing);

  try {
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, updatedProduct.id), updatedProduct);
  } catch (err) {
    console.warn('Error saving store product to Firestore:', err);
  }

  return updatedProduct;
}

export async function toggleProductStock(productId: string, inStock: boolean): Promise<boolean> {
  const existing = loadLocal<StoreProduct[]>(STORAGE_KEYS.PRODUCTS, []);
  const idx = existing.findIndex((p) => p.id === productId);
  if (idx !== -1) {
    existing[idx].inStock = inStock;
    saveLocal(STORAGE_KEYS.PRODUCTS, existing);
  }

  try {
    await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), { inStock });
  } catch (err) {
    console.warn('Error updating product stock in Firestore:', err);
  }

  return true;
}

export async function deleteStoreProduct(productId: string): Promise<boolean> {
  const existing = loadLocal<StoreProduct[]>(STORAGE_KEYS.PRODUCTS, []);
  const filtered = existing.filter((p) => p.id !== productId);
  saveLocal(STORAGE_KEYS.PRODUCTS, filtered);

  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
  } catch (err) {
    console.warn('Error deleting store product in Firestore:', err);
  }

  return true;
}

// ----------------------------------------------------------------------
// 2. STORE ORDERS API
// ----------------------------------------------------------------------

export async function getStoreOrders(): Promise<StoreOrder[]> {
  const localOrders = loadLocal<StoreOrder[]>(STORAGE_KEYS.ORDERS, []);

  try {
    const snap = await getDocs(collection(db, COLLECTIONS.ORDERS));
    if (!snap.empty) {
      const fsOrders = snap.docs.map((d) => d.data() as StoreOrder);
      fsOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveLocal(STORAGE_KEYS.ORDERS, fsOrders);
      return fsOrders;
    }
  } catch (err) {
    console.warn('Firestore getStoreOrders fallback to localStorage:', err);
  }

  localOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return localOrders;
}

export function subscribeStoreOrders(callback: (orders: StoreOrder[]) => void): Unsubscribe {
  const initial = loadLocal<StoreOrder[]>(STORAGE_KEYS.ORDERS, []);
  initial.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  callback(initial);

  return onSnapshot(
    collection(db, COLLECTIONS.ORDERS),
    (snap) => {
      const orders = snap.docs.map((d) => d.data() as StoreOrder);
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveLocal(STORAGE_KEYS.ORDERS, orders);
      callback(orders);
    },
    (err) => console.warn('subscribeStoreOrders error:', err)
  );
}

export async function createStoreOrder(payload: {
  customerName: string;
  customerMobile: string;
  deliveryAddress: string;
  items: StoreOrder['items'];
  totalAmount: number;
  fcmToken?: string;
}): Promise<{ success: boolean; message?: string; order?: StoreOrder }> {
  const cleanMobile = payload.customerMobile.trim().replace(/\D/g, '');

  // Check if mobile number is suspended/blacklisted
  const config = await getStoreConfig();
  if (config.suspendedMobiles && config.suspendedMobiles.includes(cleanMobile)) {
    return {
      success: false,
      message: 'Your mobile number has been suspended. / ଆପଣଙ୍କ ମୋବାଇଲ୍ ନମ୍ବର ନିଲମ୍ବିତ (Suspended) କରାଯାଇଛି।',
    };
  }

  const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  const now = new Date().toISOString();
  const savedFcmToken = payload.fcmToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('puja_fcm_token') || undefined : undefined);

  const newOrder: StoreOrder = {
    id: orderId,
    customerName: payload.customerName.trim(),
    customerMobile: cleanMobile,
    deliveryAddress: payload.deliveryAddress.trim(),
    items: payload.items,
    totalAmount: payload.totalAmount,
    paymentMethod: 'COD',
    status: 'pending',
    fcmToken: savedFcmToken,
    createdAt: now,
  };

  // Save to LocalStorage immediately
  const existing = loadLocal<StoreOrder[]>(STORAGE_KEYS.ORDERS, []);
  existing.unshift(newOrder);
  saveLocal(STORAGE_KEYS.ORDERS, existing);

  // Save to Firestore
  try {
    await setDoc(doc(db, COLLECTIONS.ORDERS, orderId), newOrder);
  } catch (err) {
    console.warn('Error saving order to Firestore:', err);
  }

  return { success: true, order: newOrder };
}

export async function updateOrderStatus(
  orderId: string,
  status: StoreOrder['status'],
  deliveryDate?: string
): Promise<boolean> {
  const existing = loadLocal<StoreOrder[]>(STORAGE_KEYS.ORDERS, []);
  const idx = existing.findIndex((o) => o.id === orderId);
  let updatedOrder: StoreOrder | null = null;

  if (idx !== -1) {
    existing[idx].status = status;
    if (deliveryDate !== undefined) {
      existing[idx].deliveryDate = deliveryDate;
    }
    updatedOrder = existing[idx];
    saveLocal(STORAGE_KEYS.ORDERS, existing);
  }

  try {
    const updates: Partial<StoreOrder> = { status };
    if (deliveryDate !== undefined) updates.deliveryDate = deliveryDate;
    await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), updates);
  } catch (err) {
    console.warn('Error updating order status in Firestore:', err);
  }

  // Admin Trigger: Send Push Notification when order is approved
  if (status === 'approved' && updatedOrder) {
    sendOrderApprovedPushNotification(updatedOrder);
  }

  return true;
}

export async function cancelStoreOrder(
  orderId: string,
  reason: string
): Promise<{ success: boolean; message?: string }> {
  const existing = loadLocal<StoreOrder[]>(STORAGE_KEYS.ORDERS, []);
  const idx = existing.findIndex((o) => o.id === orderId);

  if (idx === -1) {
    return { success: false, message: 'Order not found / ଅର୍ଡର୍ ମିଳିଲା ନାହିଁ।' };
  }

  const order = existing[idx];
  const orderTime = new Date(order.createdAt).getTime();
  const nowTime = Date.now();
  const diffHours = (nowTime - orderTime) / (1000 * 60 * 60);

  if (diffHours > 24) {
    return {
      success: false,
      message: '୨୪ ଘଣ୍ଟା ପରବର୍ତ୍ତୀ ଅର୍ଡର୍ ବାତିଲ୍ କରାଯାଇପାରିବ ନାହିଁ (Cancellation only allowed within 24 hours).',
    };
  }

  const cancelledAt = new Date().toISOString();
  existing[idx].status = 'cancelled';
  existing[idx].cancellationReason = reason.trim() || 'User requested cancellation';
  existing[idx].cancelledAt = cancelledAt;
  saveLocal(STORAGE_KEYS.ORDERS, existing);

  try {
    await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
      status: 'cancelled',
      cancellationReason: reason.trim() || 'User requested cancellation',
      cancelledAt,
    });
  } catch (err) {
    console.warn('Error cancelling order in Firestore:', err);
  }

  return { success: true };
}

// ----------------------------------------------------------------------
// 3. STORE CONFIG & SUSPENSION API
// ----------------------------------------------------------------------

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  bannerImageUrl: DEFAULT_BANNER_IMAGE,
  suspendedMobiles: [],
  districtCodStatus: {},

  // Global Settings & Feature Toggles
  enableFestivalBanner: true,
  enableDeliveryCharge: false,
  enableCod: true,
  showNoticeBar: true,

  primaryColor: '#78350f',
  backgroundColor: '#fffbeb',
  templateStyle: 'grid',

  noticeBarText: '⚡ ପବିତ୍ର ପୂଜା ସାମଗ୍ରୀ ନଗଦ ଦେୟ (Cash on Delivery) ସହ ସମଗ୍ର ଓଡ଼ିଶାରେ ଉପଲବ୍ଧ!',
  festivalBannerUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1200&auto=format&fit=crop',
  deliveryChargeAmount: 40,
  freeDeliveryThreshold: 500,
  customToggles: {},
};

export async function getStoreConfig(): Promise<StoreConfig> {
  const localConfig = loadLocal<StoreConfig>(STORAGE_KEYS.CONFIG, DEFAULT_STORE_CONFIG);
  const mergedLocal = { ...DEFAULT_STORE_CONFIG, ...localConfig };

  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'storeBannerAndSecurity');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const fsConfig = snap.data() as StoreConfig;
      const merged = { ...DEFAULT_STORE_CONFIG, ...fsConfig };
      saveLocal(STORAGE_KEYS.CONFIG, merged);
      return merged;
    } else {
      await setDoc(docRef, mergedLocal);
    }
  } catch (err) {
    console.warn('Firestore getStoreConfig fallback to localStorage:', err);
  }

  return mergedLocal;
}

export function subscribeStoreConfig(callback: (config: StoreConfig) => void): Unsubscribe {
  const initial = loadLocal<StoreConfig>(STORAGE_KEYS.CONFIG, DEFAULT_STORE_CONFIG);
  const mergedInitial = { ...DEFAULT_STORE_CONFIG, ...initial };
  callback(mergedInitial);

  return onSnapshot(
    doc(db, COLLECTIONS.CONFIG, 'storeBannerAndSecurity'),
    (snap) => {
      if (snap.exists()) {
        const config = snap.data() as StoreConfig;
        const merged = { ...DEFAULT_STORE_CONFIG, ...config };
        saveLocal(STORAGE_KEYS.CONFIG, merged);
        callback(merged);
      }
    },
    (err) => console.warn('subscribeStoreConfig error:', err)
  );
}

export async function updateStoreConfig(config: Partial<StoreConfig>): Promise<StoreConfig> {
  const current = await getStoreConfig();
  const updated: StoreConfig = {
    ...current,
    ...config,
  };

  saveLocal(STORAGE_KEYS.CONFIG, updated);

  try {
    await setDoc(doc(db, COLLECTIONS.CONFIG, 'storeBannerAndSecurity'), updated);
  } catch (err) {
    console.warn('Error saving store config to Firestore:', err);
  }

  return updated;
}

export async function suspendMobileNumber(mobile: string): Promise<boolean> {
  const clean = mobile.trim().replace(/\D/g, '');
  if (!clean) return false;

  const current = await getStoreConfig();
  const suspended = current.suspendedMobiles || [];
  if (!suspended.includes(clean)) {
    suspended.push(clean);
  }

  await updateStoreConfig({ suspendedMobiles: suspended });
  return true;
}

export async function unsuspendMobileNumber(mobile: string): Promise<boolean> {
  const clean = mobile.trim().replace(/\D/g, '');
  const current = await getStoreConfig();
  const suspended = (current.suspendedMobiles || []).filter((m) => m !== clean);

  await updateStoreConfig({ suspendedMobiles: suspended });
  return true;
}

export async function toggleDistrictCod(district: string, active: boolean): Promise<boolean> {
  const current = await getStoreConfig();
  const districtCodStatus = { ...(current.districtCodStatus || {}) };
  districtCodStatus[district] = active;

  await updateStoreConfig({ districtCodStatus });
  return true;
}

export async function setAllDistrictsCodStatus(active: boolean): Promise<boolean> {
  const current = await getStoreConfig();
  const districtCodStatus: Record<string, boolean> = {};
  ODISHA_DISTRICTS.forEach((d) => {
    districtCodStatus[d] = active;
  });

  await updateStoreConfig({ districtCodStatus });
  return true;
}

// ----------------------------------------------------------------------
// 4. JPG BILL GENERATION (CANVAS BASED)
// ----------------------------------------------------------------------

export function generateJpgBill(order: StoreOrder): void {
  const itemsCount = order.items.length;
  const calculatedHeight = Math.max(900, 520 + itemsCount * 42 + 220);

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = calculatedHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background - Clean Ivory/White
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Border
  ctx.strokeStyle = '#8B0000';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

  // Top Header Area
  ctx.fillStyle = '#701a1e';
  ctx.fillRect(24, 24, canvas.width - 48, 120);

  // Title Text
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🕉️ ପୂଜା ସାମଗ୍ରୀ ଷ୍ଟୋର୍ (PUJA SAMAGRI STORE)', canvas.width / 2, 68);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px sans-serif';
  ctx.fillText('CASH ON DELIVERY (COD) OFFICIAL RECEIPT / SHOPKEEPER BILL', canvas.width / 2, 102);

  // Order Details Box
  ctx.fillStyle = '#FAF5E6';
  ctx.fillRect(40, 160, canvas.width - 80, 145);
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 160, canvas.width - 80, 145);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#451a03';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`ORDER ID: #${order.id}`, 60, 195);

  ctx.font = '15px sans-serif';
  ctx.fillText(`Date: ${new Date(order.createdAt).toLocaleString('en-IN')}`, 460, 195);
  ctx.fillText(`Customer Name: ${order.customerName}`, 60, 228);
  ctx.fillText(`Mobile No: +91 ${order.customerMobile}`, 460, 228);

  // Address line wrapping
  ctx.fillText(`Delivery Address: ${order.deliveryAddress.slice(0, 50)}`, 60, 260);
  if (order.deliveryAddress.length > 50) {
    ctx.fillText(`                  ${order.deliveryAddress.slice(50, 110)}`, 60, 282);
  }

  // Items Table Header
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(40, 325, canvas.width - 80, 40);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('SL', 60, 350);
  ctx.fillText('ITEM DESCRIPTION', 110, 350);
  ctx.fillText('QTY', 520, 350);
  ctx.fillText('PRICE', 600, 350);
  ctx.fillText('TOTAL', 690, 350);

  // Items List Rows
  let y = 395;
  ctx.font = '14px sans-serif';
  let subtotal = 0;

  order.items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    ctx.fillStyle = index % 2 === 0 ? '#FFFFFF' : '#FFFBEB';
    ctx.fillRect(40, y - 25, canvas.width - 80, 36);

    ctx.fillStyle = '#111827';
    ctx.fillText(`${index + 1}.`, 60, y);
    ctx.fillText(item.productName.slice(0, 42), 110, y);
    ctx.fillText(`${item.quantity}`, 525, y);
    ctx.fillText(`₹${item.price}`, 600, y);
    ctx.fillText(`₹${itemTotal}`, 690, y);

    y += 40;
  });

  // Table Divider Line
  ctx.strokeStyle = '#9CA3AF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, y + 5);
  ctx.lineTo(canvas.width - 40, y + 5);
  ctx.stroke();

  // Summary Box
  y += 25;
  ctx.fillStyle = '#FEF3C7';
  ctx.fillRect(420, y, 340, 135);
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(420, y, 340, 135);

  ctx.fillStyle = '#78350F';
  ctx.font = '15px sans-serif';
  ctx.fillText(`Subtotal: ₹${subtotal}`, 440, y + 30);
  ctx.fillText(`Delivery Fee: FREE (₹0.00)`, 440, y + 58);
  ctx.fillText(`Payment Mode: CASH ON DELIVERY`, 440, y + 86);

  ctx.fillStyle = '#8B0000';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`Grand Total: ₹${order.totalAmount}`, 440, y + 118);

  // Footer Note
  const footerY = canvas.height - 75;
  ctx.fillStyle = '#4B5563';
  ctx.font = 'italic 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Thank you for shopping with Puja Samagri Portal! 🙏', canvas.width / 2, footerY);
  ctx.fillText('Shopkeeper Copy | Official Customer Invoice', canvas.width / 2, footerY + 22);

  // Trigger Download as JPG image
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `Bill_${order.id}_${order.customerName.replace(/\s+/g, '_')}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
