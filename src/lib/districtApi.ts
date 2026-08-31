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
} from 'firebase/firestore';

const COLLECTION_NAME = 'district_content';
const LOCAL_STORAGE_KEY = 'odisha_district_content';
const LOCAL_STORAGE_DELETED_KEY = 'odisha_district_deleted_ids';
const LOCAL_STORAGE_CLEARED_FLAG = 'odisha_district_cleared_flag';

function getDeletedIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDeletedId(id: string) {
  try {
    const current = getDeletedIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(updated));
    }
  } catch {}
}

function removeDeletedId(id: string) {
  try {
    const current = getDeletedIds();
    const updated = current.filter((x) => x !== id);
    localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(updated));
  } catch {}
}

function isClearedFlag(): boolean {
  try {
    return localStorage.getItem(LOCAL_STORAGE_CLEARED_FLAG) === 'true';
  } catch {
    return false;
  }
}

/**
 * Fetch all district items or items for a specific district
 */
export async function getDistrictItems(districtId?: string): Promise<DistrictItem[]> {
  const deletedIds = getDeletedIds();
  const cleared = isClearedFlag();

  try {
    const colRef = collection(db, COLLECTION_NAME);
    let q = query(colRef);
    if (districtId && districtId !== 'all') {
      q = query(colRef, where('districtId', '==', districtId));
    }

    const snap = await getDocs(q);
    if (!snap.empty) {
      const items = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        })) as DistrictItem[];
      const validItems = items.filter((i) => !deletedIds.includes(i.id));
      return validItems;
    }

    // If Firestore collection is empty
    if (cleared || deletedIds.length > 0) {
      const remainingDefaults = DEFAULT_DISTRICT_ITEMS.filter((i) => !deletedIds.includes(i.id));
      if (districtId && districtId !== 'all') {
        return remainingDefaults.filter((i) => i.districtId === districtId);
      }
      return remainingDefaults;
    }

    // Initial defaults
    if (districtId && districtId !== 'all') {
      return DEFAULT_DISTRICT_ITEMS.filter((i) => i.districtId === districtId);
    }
    return DEFAULT_DISTRICT_ITEMS;
  } catch (err) {
    console.warn('Firestore getDistrictItems error:', err);
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const allItems = (JSON.parse(cached) as DistrictItem[]).filter(
          (i) => !deletedIds.includes(i.id)
        );
        if (districtId && districtId !== 'all') {
          return allItems.filter((i) => i.districtId === districtId);
        }
        return allItems;
      }
    } catch {}

    if (cleared) return [];
    const remaining = DEFAULT_DISTRICT_ITEMS.filter((i) => !deletedIds.includes(i.id));
    if (districtId && districtId !== 'all') {
      return remaining.filter((i) => i.districtId === districtId);
    }
    return remaining;
  }
}

/**
 * Subscribe to real-time updates for district items
 */
export function subscribeDistrictItems(
  callback: (items: DistrictItem[]) => void,
  districtId?: string
): () => void {
  const deletedIds = getDeletedIds();
  const cleared = isClearedFlag();

  try {
    const colRef = collection(db, COLLECTION_NAME);
    let q = query(colRef);
    if (districtId && districtId !== 'all') {
      q = query(colRef, where('districtId', '==', districtId));
    }

    return onSnapshot(
      q,
      (snap) => {
        const currentDeleted = getDeletedIds();
        let items: DistrictItem[] = [];
        if (!snap.empty) {
          items = snap.docs
            .map((d) => ({
              id: d.id,
              ...d.data(),
            })) as DistrictItem[];
          items = items.filter((i) => !currentDeleted.includes(i.id));
        } else {
          if (isClearedFlag()) {
            items = [];
          } else {
            items = DEFAULT_DISTRICT_ITEMS.filter((i) => !currentDeleted.includes(i.id));
          }
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
        getDistrictItems(districtId)
          .then(callback)
          .catch(() => callback([]));
      }
    );
  } catch (err) {
    console.warn('subscribeDistrictItems setup error:', err);
    getDistrictItems(districtId)
      .then(callback)
      .catch(() => callback([]));
    return () => {};
  }
}

/**
 * Save or update a district item (Admin action)
 */
export async function saveDistrictItem(item: Partial<DistrictItem>): Promise<DistrictItem> {
  const now = new Date().toISOString();
  const id = item.id || 'dist-item-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

  // If re-saving an item that was previously deleted, un-delete it
  removeDeletedId(id);
  try {
    localStorage.removeItem(LOCAL_STORAGE_CLEARED_FLAG);
  } catch {}

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

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, sanitizeFirestoreData(fullItem), { merge: true });
  } catch (dbErr) {
    console.warn('Firestore setDoc warning:', dbErr);
  }

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
 * Delete a single district item (Admin action)
 */
export async function deleteDistrictItem(itemId: string): Promise<boolean> {
  try {
    // 1. Mark as deleted permanently
    addDeletedId(itemId);

    // 2. Delete from Firestore if exists
    try {
      const docRef = doc(db, COLLECTION_NAME, itemId);
      await deleteDoc(docRef);
    } catch (fsErr) {
      console.warn('Firestore deleteDoc warning:', fsErr);
    }

    // 3. Update local cache
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

/**
 * Clear all demo & existing district content (Admin action)
 */
export async function clearAllDistrictItems(): Promise<boolean> {
  try {
    // 1. Mark all default items as deleted
    DEFAULT_DISTRICT_ITEMS.forEach((i) => addDeletedId(i.id));
    localStorage.setItem(LOCAL_STORAGE_CLEARED_FLAG, 'true');
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));

    // 2. Delete from Firestore
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snap = await getDocs(colRef);
      const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (fsErr) {
      console.warn('Firestore batch delete warning:', fsErr);
    }

    // 3. Sync to server
    try {
      await fetch('/api/district-items/clear-all', { method: 'POST' });
    } catch {}

    return true;
  } catch (err) {
    console.error('clearAllDistrictItems error:', err);
    return false;
  }
}

/**
 * Restore default authentic district items (Admin action)
 */
export async function restoreDefaultDistrictItems(): Promise<DistrictItem[]> {
  try {
    // 1. Clear deleted list and cleared flag
    localStorage.removeItem(LOCAL_STORAGE_DELETED_KEY);
    localStorage.removeItem(LOCAL_STORAGE_CLEARED_FLAG);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DISTRICT_ITEMS));

    // 2. Seed to Firestore
    try {
      for (const item of DEFAULT_DISTRICT_ITEMS) {
        const docRef = doc(db, COLLECTION_NAME, item.id);
        await setDoc(docRef, sanitizeFirestoreData(item), { merge: true });
      }
    } catch (fsErr) {
      console.warn('Firestore restore defaults warning:', fsErr);
    }

    // 3. Sync to server
    try {
      await fetch('/api/district-items/restore-defaults', { method: 'POST' });
    } catch {}

    return DEFAULT_DISTRICT_ITEMS;
  } catch (err) {
    console.error('restoreDefaultDistrictItems error:', err);
    return DEFAULT_DISTRICT_ITEMS;
  }
}
