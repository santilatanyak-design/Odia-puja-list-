import { DistrictItem, DistrictCategory } from '../types';
import { db, sanitizeFirestoreData } from './firebase';
import { DEFAULT_DISTRICT_ITEMS } from '../data/defaultDistrictItems';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  onSnapshot,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

const COLLECTION_NAME = 'district_content';
const LOCAL_STORAGE_KEY = 'odisha_district_content';

/**
 * Fetch all district items or items for a specific district
 */
export async function getDistrictItems(districtId?: string): Promise<DistrictItem[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    let q = query(colRef);
    if (districtId && districtId !== 'all') {
      q = query(colRef, where('districtId', '==', districtId));
    }

    const snap = await getDocs(q);
    if (!snap.empty) {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as DistrictItem[];
      return items;
    }
    // If empty, return defaults
    if (districtId && districtId !== 'all') {
      return DEFAULT_DISTRICT_ITEMS.filter((i) => i.districtId === districtId);
    }
    return DEFAULT_DISTRICT_ITEMS;
  } catch (err) {
    console.warn('Firestore getDistrictItems error:', err);
    // Fallback to local cache if offline
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const allItems = JSON.parse(cached) as DistrictItem[];
        if (districtId && districtId !== 'all') {
          return allItems.filter((i) => i.districtId === districtId);
        }
        return allItems;
      }
    } catch {}
    if (districtId && districtId !== 'all') {
      return DEFAULT_DISTRICT_ITEMS.filter((i) => i.districtId === districtId);
    }
    return DEFAULT_DISTRICT_ITEMS;
  }
}

/**
 * Subscribe to real-time updates for district items
 */
export function subscribeDistrictItems(
  callback: (items: DistrictItem[]) => void,
  districtId?: string
): () => void {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    let q = query(colRef);
    if (districtId && districtId !== 'all') {
      q = query(colRef, where('districtId', '==', districtId));
    }

    return onSnapshot(
      q,
      (snap) => {
        let items: DistrictItem[] = [];
        if (!snap.empty) {
          items = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as DistrictItem[];
        } else {
          items = DEFAULT_DISTRICT_ITEMS;
        }
        
        // Cache locally for offline resiliency
        if (!districtId || districtId === 'all') {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
            fetch('/api/district-items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items }),
            }).catch(() => {});
          } catch {}
        }
        callback(items);
      },
      (err) => {
        console.warn('subscribeDistrictItems warning:', err);
        // Fallback to initial get
        getDistrictItems(districtId).then(callback).catch(() => callback(DEFAULT_DISTRICT_ITEMS));
      }
    );
  } catch (err) {
    console.warn('subscribeDistrictItems setup error:', err);
    getDistrictItems(districtId).then(callback).catch(() => callback(DEFAULT_DISTRICT_ITEMS));
    return () => {};
  }
}

/**
 * Save or update a district item (Admin action)
 */
export async function saveDistrictItem(item: Partial<DistrictItem>): Promise<DistrictItem> {
  const now = new Date().toISOString();
  const id = item.id || 'dist-item-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

  const affiliateProductTitle =
    item.adTitle?.trim() ||
    item.affiliateProductTitle?.trim() ||
    item.affiliateAd?.productTitle?.trim() ||
    '';
  const affiliateProductImageUrl =
    item.adImageUrl?.trim() ||
    item.affiliateProductImageUrl?.trim() ||
    item.affiliateAd?.productImageUrl?.trim() ||
    item.affiliateAd?.adImageUrl?.trim() ||
    (item as any).affiliateImageURL?.trim() ||
    '';
  const affiliateTargetUrl =
    item.adLink?.trim() ||
    item.affiliateTargetUrl?.trim() ||
    item.affiliateAd?.affiliateUrl?.trim() ||
    item.affiliateAd?.adLink?.trim() ||
    (item as any).affiliateLink?.trim() ||
    '';
  const adTriggerText =
    item.adTriggerText?.trim() ||
    item.affiliateAd?.adTriggerText?.trim() ||
    '';
  const adTimerSeconds = Math.max(
    1,
    Number(item.adTimerSeconds) ||
      Number(item.affiliateAd?.adTimerSeconds) ||
      Number(item.affiliateAd?.countdownSeconds) ||
      5
  );

  const affiliateAd =
    affiliateProductTitle || affiliateTargetUrl || affiliateProductImageUrl || item.affiliateAd
      ? {
          enabled: item.affiliateAd?.enabled ?? Boolean(affiliateProductTitle || affiliateTargetUrl),
          productTitle: affiliateProductTitle,
          productImageUrl: affiliateProductImageUrl,
          affiliateUrl: affiliateTargetUrl,
          adImageUrl: affiliateProductImageUrl,
          adLink: affiliateTargetUrl,
          adTriggerText,
          adTimerSeconds,
          productDescription: item.adDescription || item.affiliateAd?.productDescription || '',
          triggerDelaySeconds: item.affiliateAd?.triggerDelaySeconds || 4,
          countdownSeconds: adTimerSeconds,
        }
      : undefined;

  const fullItem: DistrictItem = {
    id,
    districtId: item.districtId || 'puri',
    districtNameOdia: item.districtNameOdia || 'ପୁରୀ',
    districtNameEng: item.districtNameEng || 'Puri',
    category: (item.category as DistrictCategory) || 'temple',
    title: item.title?.trim() || 'Untitled',
    description: item.description?.trim() || '',
    imageUrl: item.imageUrl?.trim() || '',
    location: item.location?.trim() || '',
    significance: item.significance?.trim() || '',
    famousFestivals: item.famousFestivals?.trim() || '',
    bestTimeToVisit: item.bestTimeToVisit?.trim() || '',
    externalLink: item.externalLink?.trim() || '',
    createdAt: item.createdAt || now,
    updatedAt: now,
    affiliateProductTitle,
    affiliateProductImageUrl,
    affiliateTargetUrl,
    adTriggerText,
    adTimerSeconds,
    adImageUrl: affiliateProductImageUrl,
    adLink: affiliateTargetUrl,
    adTitle: affiliateProductTitle,
    adDescription: item.adDescription || item.affiliateAd?.productDescription || '',
    affiliateAd,
  };

  const docRef = doc(db, COLLECTION_NAME, id);
  await setDoc(docRef, sanitizeFirestoreData(fullItem), { merge: true });

  // Update local cache
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing: DistrictItem[] = cached ? JSON.parse(cached) : [];
    const updated = [fullItem, ...existing.filter((i) => i.id !== id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    fetch('/api/district-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: fullItem }),
    }).catch(() => {});
  } catch {}

  return fullItem;
}

/**
 * Delete a district item (Admin action)
 */
export async function deleteDistrictItem(itemId: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, itemId);
    await deleteDoc(docRef);

    // Update local cache
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const existing: DistrictItem[] = JSON.parse(cached);
        const filtered = existing.filter((i) => i.id !== itemId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      }
      fetch(`/api/district-items/${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
      }).catch(() => {});
    } catch {}

    return true;
  } catch (err) {
    console.error('deleteDistrictItem error:', err);
    return false;
  }
}
