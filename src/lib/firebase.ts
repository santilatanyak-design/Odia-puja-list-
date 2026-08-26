import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfigFile from '../../firebase-applet-config.json';
import { Pujari, PujaList, PaymentRequest, QrConfig, PujaTemplate, PasswordResetRequest, HomeSliderConfig, SliderImage, PuriStoreConfig, PuriStoreProduct, AnalyticsInstall } from '../types';
import { DEFAULT_PUJA_TEMPLATES } from '../data/defaultTemplates';
import { isOfficeOpen } from './officeHours';

// Load default config from provisioned JSON or window override
let firebaseConfig: Record<string, any> = {
  ...firebaseConfigFile,
};

if (typeof window !== 'undefined' && (window as any).firebaseConfig) {
  firebaseConfig = { ...firebaseConfig, ...(window as any).firebaseConfig };
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (supporting custom databaseId if configured)
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Collection References
const COLLECTIONS = {
  PUJARIS: 'pujaris',
  LISTS: 'pujari_lists',
  PAYMENTS: 'payments',
  CONFIG: 'config',
  TEMPLATES: 'templates',
  PASSWORD_RESETS: 'password_resets',
};

/**
 * Recursively removes all keys with `undefined` values from an object or array,
 * preventing Firestore SDK from throwing "Unsupported field value: undefined" errors.
 */
export function sanitizeFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as Record<string, any>)[key];
      if (val !== undefined) {
        sanitized[key] = sanitizeFirestoreData(val);
      }
    }
    return sanitized as T;
  }
  return obj;
}

// Safe wrapper functions for setDoc and updateDoc
async function safeSetDoc(docRef: any, data: any, options?: any) {
  const clean = sanitizeFirestoreData(data);
  return options ? setDoc(docRef, clean, options) : setDoc(docRef, clean);
}

async function safeUpdateDoc(docRef: any, data: any) {
  const clean = sanitizeFirestoreData(data);
  return updateDoc(docRef, clean);
}

const DEFAULT_QR_CONFIG: QrConfig = {
  newCreationQrUrl: '',
  newCreationUpiId: 'pujasamagri@upi',
  newCreationAmount: 5,
  reDownloadQrUrl: '',
  reDownloadUpiId: 'pujasamagri@upi',
  reDownloadAmount: 2,
};

const INITIAL_PUJARIS: Pujari[] = [
  {
    id: 'PJR-1001',
    name: 'Pandit Ramesh Sharma',
    phone: '9876543210',
    address: 'Varanasi, UP',
    pin: '1234',
    status: 'active',
    freeTierUsed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PJR-1002',
    name: 'Pandit Suresh Shastri',
    phone: '9812345678',
    address: 'Haridwar, UK',
    pin: '1234',
    status: 'active',
    freeTierUsed: true,
    createdAt: new Date().toISOString(),
  },
];

// Helper: Seed Initial Data if Collections are Empty
export async function seedInitialFirestoreData() {
  try {
    // 1. Seed QR Config if not present
    const qrDocRef = doc(db, COLLECTIONS.CONFIG, 'qrConfig');
    const qrSnap = await getDoc(qrDocRef);
    if (!qrSnap.exists()) {
      await setDoc(qrDocRef, DEFAULT_QR_CONFIG);
    }

    // 2. Seed Initial Pujaris if empty
    const pujarisSnap = await getDocs(collection(db, COLLECTIONS.PUJARIS));
    if (pujarisSnap.empty) {
      for (const p of INITIAL_PUJARIS) {
        await setDoc(doc(db, COLLECTIONS.PUJARIS, p.id), p);
      }
    }

    // 3. Seed Templates if empty
    const tmplSnap = await getDocs(collection(db, COLLECTIONS.TEMPLATES));
    if (tmplSnap.empty) {
      for (const tmpl of DEFAULT_PUJA_TEMPLATES) {
        await setDoc(doc(db, COLLECTIONS.TEMPLATES, tmpl.id), tmpl);
      }
    }
  } catch (err) {
    console.error('Error seeding initial Firestore data:', err);
  }
}

// ----------------------------------------------------------------------
// REAL-TIME FIRESTORE SERVICES
// ----------------------------------------------------------------------

// 1. PUJARI MANAGEMENT
export async function fsLoginPujari(payload: {
  pujariId?: string;
  pujariIdOrPhone?: string;
  pin?: string;
  name?: string;
  phone?: string;
  address?: string;
  isRegistering?: boolean;
  skipPinCheck?: boolean;
}): Promise<{ success: boolean; message?: string; pujari?: Pujari }> {
  try {
    const queryStr = (payload.pujariIdOrPhone || payload.pujariId || '').trim();
    const cleanUpper = queryStr.toUpperCase();
    const cleanPin = (payload.pin || '').trim();

    if (!queryStr && !payload.skipPinCheck) {
      return { success: false, message: 'ଭୁଲ୍ ପିନ୍ କିମ୍ବା ID! ଦୟାକରି ସଠିକ୍ ତଥ୍ୟ ଦିଅନ୍ତୁ।' };
    }

    // 1. Search existing Pujari document by doc ID or phone number
    let matchedPujariDoc: Pujari | null = null;
    let docRef = doc(db, COLLECTIONS.PUJARIS, cleanUpper);

    if (cleanUpper) {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        matchedPujariDoc = snap.data() as Pujari;
      }
    }

    // If not found by doc ID, search by phone number or scan all pujaris
    if (!matchedPujariDoc && queryStr) {
      const allPujarisSnap = await getDocs(collection(db, COLLECTIONS.PUJARIS));
      const allPujaris = allPujarisSnap.docs.map((d) => d.data() as Pujari);

      const found = allPujaris.find(
        (p) =>
          p.id.toUpperCase() === cleanUpper ||
          (p.phone && p.phone.trim() === queryStr) ||
          (p.phone &&
            p.phone.replace(/\D/g, '') === queryStr.replace(/\D/g, '') &&
            queryStr.replace(/\D/g, '').length >= 10)
      );

      if (found) {
        matchedPujariDoc = found;
        docRef = doc(db, COLLECTIONS.PUJARIS, found.id);
      }
    }

    // Scenario A: Existing Pujari document found
    if (matchedPujariDoc) {
      if (matchedPujariDoc.status === 'suspended' || matchedPujariDoc.isBlocked) {
        return {
          success: false,
          message: 'ଆପଣଙ୍କ ଆକାଉଣ୍ଟକୁ ସସପେଣ୍ଡ କରାଯାଇଛି। ଦୟାକରି ଆଡମିନ୍ଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।',
          pujari: { ...matchedPujariDoc, status: 'suspended', isBlocked: true },
        };
      }

      // Check 4-Digit PIN unless restoring stored session
      if (!payload.skipPinCheck) {
        if (matchedPujariDoc.pin) {
          if (matchedPujariDoc.pin.trim() !== cleanPin) {
            return {
              success: false,
              message: 'ଭୁଲ୍ ପିନ୍ କିମ୍ବା ID! ଦୟାକରି ସଠିକ୍ ତଥ୍ୟ ଦିଅନ୍ତୁ।',
            };
          }
        } else {
          // If legacy doc had no PIN set, attach provided PIN or default '1234'
          const assignedPin = cleanPin || '1234';
          matchedPujariDoc.pin = assignedPin;
          await updateDoc(docRef, { pin: assignedPin });
        }
      }

      // Optional profile update if extra details supplied
      if (payload.name || payload.phone || payload.address) {
        const updated: Partial<Pujari> = {};
        if (payload.name) updated.name = payload.name;
        if (payload.phone) updated.phone = payload.phone;
        if (payload.address) updated.address = payload.address;
        await updateDoc(docRef, updated);
        return { success: true, pujari: { ...matchedPujariDoc, ...updated } };
      }

      return { success: true, pujari: matchedPujariDoc };
    }

    // Scenario B: Pujari registration or document creation
    if (payload.isRegistering || (payload.name && (payload.phone || queryStr))) {
      // Query all existing Pujaris to calculate the next sequential ID (PJR-1001, PJR-1002, etc.)
      const allPujarisSnap = await getDocs(collection(db, COLLECTIONS.PUJARIS));
      const allPujaris = allPujarisSnap.docs.map((d) => d.data() as Pujari);

      // Check if phone number is already registered
      if (payload.phone) {
        const cleanPhone = payload.phone.trim();
        const existingByPhone = allPujaris.find(
          (p) => p.phone && p.phone.trim() === cleanPhone
        );
        if (existingByPhone) {
          return {
            success: false,
            message: `ଏହି ମୋବାଇଲ୍ ନମ୍ବର (${cleanPhone}) ପୂର୍ବରୁ ପଞ୍ଜୀକୃତ ଅଛି (ପୂଜାରୀ ID: ${existingByPhone.id})। ଦୟାକରି ଲଗଇନ୍ କରନ୍ତୁ।`,
          };
        }
      }

      // Calculate highest numeric suffix among existing IDs starting with 'PJR-'
      let maxNum = 1000;
      allPujaris.forEach((p) => {
        if (p.id) {
          const match = p.id.match(/^PJR-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      });

      const nextNum = maxNum + 1;
      const autoGeneratedId = `PJR-${nextNum}`;

      const newDocRef = doc(db, COLLECTIONS.PUJARIS, autoGeneratedId);
      const voterPin = (payload as any).voterIdPin || cleanPin || '1234';
      const newPujari: Pujari = {
        id: autoGeneratedId,
        name: payload.name || `Pandit (${autoGeneratedId})`,
        phone: payload.phone || queryStr || '',
        address: payload.address || '',
        pin: cleanPin || '1234',
        voterIdPin: voterPin,
        status: 'active',
        freeTierUsed: false,
        createdAt: new Date().toISOString(),
      };

      await setDoc(newDocRef, newPujari);

      // Trigger Web Push Notification to Admin on New Pujari Registration
      triggerAdminNewPujariPush({
        id: autoGeneratedId,
        name: newPujari.name,
        phone: newPujari.phone,
      }).catch((err) => console.warn('Push trigger background error:', err));

      return {
        success: true,
        message: `ପଞ୍ଜୀକରଣ ସଫଳ ହୋଇଛି! ଆପଣଙ୍କର ପୂଜାରୀ ID ହେଉଛି ${autoGeneratedId}। ଦୟାକରି ଏହାକୁ ମନେ ରଖନ୍ତୁ।`,
        pujari: newPujari,
      };
    } else {
      return {
        success: false,
        message: 'ଭୁଲ୍ ପିନ୍ କିମ୍ବା ID! ଦୟାକରି ସଠିକ୍ ତଥ୍ୟ ଦିଅନ୍ତୁ।',
      };
    }
  } catch (err: any) {
    console.error('fsLoginPujari Error:', err);
    return { success: false, message: err?.message || 'Firestore connection error' };
  }
}

export async function fsFindPujariByPhone(phone: string): Promise<{
  found: boolean;
  message?: string;
  pujari?: Pujari;
}> {
  try {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return { found: false, message: 'ଦୟାକରି ସଠିକ୍ ୧୦-ଅଙ୍କ ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ।' };
    }

    const snap = await getDocs(collection(db, COLLECTIONS.PUJARIS));
    const allPujaris = snap.docs.map((d) => d.data() as Pujari);

    const matched = allPujaris.find((p) => {
      if (!p.phone) return false;
      const pDigits = p.phone.trim().replace(/\D/g, '');
      return pDigits === cleanPhone || (pDigits.length >= 10 && cleanPhone.length >= 10 && pDigits.slice(-10) === cleanPhone.slice(-10));
    });

    if (matched) {
      return { found: true, pujari: matched };
    } else {
      return { found: false, message: 'ଏହି ମୋବାଇଲ୍ ନମ୍ବର ପଞ୍ଜୀକୃତ ହୋଇନାହିଁ।' };
    }
  } catch (err: any) {
    console.error('fsFindPujariByPhone error:', err);
    return { found: false, message: 'ଖୋଜିବାରେ ତ୍ରୁଟି ଘଟିଲା। ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।' };
  }
}

export async function fsResetPujariPin(pujariId: string, newPin: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const cleanId = pujariId.trim().toUpperCase();
    const cleanPin = newPin.trim();

    if (!cleanPin || cleanPin.length !== 4) {
      return { success: false, message: 'ଦୟାକରି ୪-ଅଙ୍କ ବିଶିଷ୍ଟ ଗୁପ୍ତ ପିନ୍ ଦିଅନ୍ତୁ।' };
    }

    const docRef = doc(db, COLLECTIONS.PUJARIS, cleanId);
    await updateDoc(docRef, { pin: cleanPin, voterIdPin: cleanPin });

    return {
      success: true,
      message: 'ଆପଣଙ୍କର PIN ସଫଳତାର ସହ ବଦଳାଯାଇଛି! ବର୍ତ୍ତମାନ ଲଗଇନ୍ କରନ୍ତୁ।',
    };
  } catch (err: any) {
    console.error('fsResetPujariPin error:', err);
    return { success: false, message: 'PIN ବଦଳାଇବାରେ ତ୍ରୁଟି। ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।' };
  }
}

export async function fsGetPujaris(): Promise<Pujari[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PUJARIS));
    return snap.docs.map((d) => d.data() as Pujari);
  } catch (err) {
    console.error('fsGetPujaris Error:', err);
    return [];
  }
}

export function fsSubscribePujaris(callback: (pujaris: Pujari[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.PUJARIS),
    (snap) => {
      const pujaris = snap.docs.map((d) => d.data() as Pujari);
      callback(pujaris);
    },
    (err) => console.error('fsSubscribePujaris Error:', err)
  );
}

export async function fsCreatePujariByAdmin(payload: {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}): Promise<{ success: boolean; message?: string; pujari?: Pujari }> {
  try {
    const cleanId = payload.id.trim().toUpperCase();
    const docRef = doc(db, COLLECTIONS.PUJARIS, cleanId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { success: false, message: 'Pujari ID already exists' };
    }

    const newPujari: Pujari = {
      id: cleanId,
      name: payload.name,
      phone: payload.phone || '',
      address: payload.address || '',
      status: 'active',
      freeTierUsed: false,
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, newPujari);
    return { success: true, pujari: newPujari };
  } catch (err: any) {
    console.error('fsCreatePujariByAdmin Error:', err);
    return { success: false, message: err?.message || 'Error creating Pujari profile' };
  }
}

export async function fsUpdatePujariStatus(id: string, status: 'active' | 'suspended', reason?: string): Promise<boolean> {
  try {
    const cleanId = id.trim().toUpperCase();
    const docRef = doc(db, COLLECTIONS.PUJARIS, cleanId);
    if (status === 'suspended') {
      const rejectionReason = reason || 'ଆପଣଙ୍କ ପୂଜାରୀ ଆକାଉଣ୍ଟ ବ୍ଲକ୍/ସସପେଣ୍ଡ କରାଯାଇଛି।';
      await updateDoc(docRef, {
        status: 'suspended',
        isBlocked: true,
        rejectionReason,
        hasUnreadNotification: true,
        systemMessage: '',
      });
    } else {
      const unlockMsg = 'ଖୁସି ଖବର! ଆପଣଙ୍କ ଆକାଉଣ୍ଟ/ପେମେଣ୍ଟ ସଫଳତାର ସହ ଅନଲକ୍ କରାଯାଇଛି।';
      await updateDoc(docRef, {
        status: 'active',
        isBlocked: false,
        rejectionReason: '',
        systemMessage: unlockMsg,
        hasUnreadNotification: true,
      });
    }
    return true;
  } catch (err) {
    console.error('fsUpdatePujariStatus Error:', err);
    return false;
  }
}

export async function fsBlockPujari(id: string, isBlocked: boolean, reason?: string): Promise<boolean> {
  return fsUpdatePujariStatus(id, isBlocked ? 'suspended' : 'active', reason);
}

export async function fsDismissNotification(pujariId: string): Promise<boolean> {
  try {
    const cleanId = pujariId.trim().toUpperCase();
    const docRef = doc(db, COLLECTIONS.PUJARIS, cleanId);
    await updateDoc(docRef, {
      hasUnreadNotification: false,
      systemMessage: '',
      rejectionReason: '',
    });
    return true;
  } catch (err) {
    console.error('fsDismissNotification Error:', err);
    return false;
  }
}

export async function fsAcceptTerms(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.PUJARIS, id.trim().toUpperCase());
    await updateDoc(docRef, {
      hasAcceptedTerms: true,
    });
    return true;
  } catch (err) {
    console.error('fsAcceptTerms Error:', err);
    return false;
  }
}

export async function fsRecordDownload(listId: string): Promise<void> {
  try {
    const listRef = doc(db, COLLECTIONS.LISTS, listId);
    const snap = await getDoc(listRef);
    if (snap.exists()) {
      const data = snap.data() as PujaList;
      const currentCount = data.downloadCount || 0;
      await updateDoc(listRef, {
        downloadCount: currentCount + 1,
        lastDownloadedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('fsRecordDownload Error:', err);
  }
}

// 2. PUJA LIST MANAGEMENT & REALTIME SYNC
export function fsSubscribeLists(
  callback: (lists: PujaList[]) => void,
  pujariId?: string
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.LISTS);
  return onSnapshot(
    colRef,
    (snap) => {
      let lists = snap.docs.map((d) => d.data() as PujaList);
      if (pujariId) {
        const cleanId = pujariId.trim().toUpperCase();
        lists = lists.filter((l) => l.pujariId === cleanId);
      }
      // Sort newest first
      lists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(lists);
    },
    (err) => console.error('fsSubscribeLists Error:', err)
  );
}

export async function fsGetLists(pujariId?: string): Promise<PujaList[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.LISTS));
    let lists = snap.docs.map((d) => d.data() as PujaList);
    if (pujariId) {
      const cleanId = pujariId.trim().toUpperCase();
      lists = lists.filter((l) => l.pujariId === cleanId);
    }
    lists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return lists;
  } catch (err) {
    console.error('fsGetLists Error:', err);
    return [];
  }
}

export async function fsCreatePujaList(payload: {
  pujariId: string;
  pujaName: string;
  yajamanaName: string;
  date: string;
  time: string;
  contact: string;
  location: string;
  notes: string;
  items: PujaList['items'];
  yajnaDetails?: PujaList['yajnaDetails'];
  utrRef?: string;
}): Promise<{ success: boolean; message?: string; list?: PujaList; freeTierUsedNow?: boolean }> {
  try {
    const cleanPujariId = payload.pujariId.trim().toUpperCase();
    const pujariRef = doc(db, COLLECTIONS.PUJARIS, cleanPujariId);
    const pujariSnap = await getDoc(pujariRef);

    if (!pujariSnap.exists()) {
      return { success: false, message: 'Pujari profile not found' };
    }

    const pujari = pujariSnap.data() as Pujari;
    if (pujari.status === 'suspended') {
      return { success: false, message: 'Suspended Pujari cannot create lists' };
    }

    // Fetch current QR Config for creation amount
    const qrSnap = await getDoc(doc(db, COLLECTIONS.CONFIG, 'qrConfig'));
    const qrConfig = qrSnap.exists() ? (qrSnap.data() as QrConfig) : DEFAULT_QR_CONFIG;
    const paymentAmount = qrConfig.newCreationAmount || 5;

    const listId = 'LIST-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date().toISOString();

    let isUnlocked = false;
    let paymentStatus: PujaList['paymentStatus'] = 'pending';
    let paymentType: PujaList['paymentType'] = 'new_creation';
    let isFreeTierNow = false;

    // Check if this physical device has already claimed a free list in Firestore
    let isDeviceAlreadyClaimed = false;
    if (typeof window !== 'undefined') {
      try {
        const { getDeviceFingerprint } = await import('./deviceFingerprint');
        const devHash = getDeviceFingerprint();
        if (devHash) {
          const devSnap = await getDoc(doc(db, 'free_claims_devices', devHash));
          if (devSnap.exists()) {
            isDeviceAlreadyClaimed = true;
          }
        }
      } catch (err) {
        console.warn('Device fingerprint check in fsCreatePujaList:', err);
      }
    }

    if (!pujari.freeTierUsed && !isDeviceAlreadyClaimed && isOfficeOpen()) {
      // First Time Creation: 100% FREE!
      isUnlocked = true;
      paymentStatus = 'free';
      paymentType = 'free_first_time';
      isFreeTierNow = true;

      // Update Pujari profile free tier flag permanently in Firestore
      await updateDoc(pujariRef, { freeTierUsed: true });
    }

    const systemMsg = !isOfficeOpen() ? 'Pending (ଅଫିସ୍ ସମୟକୁ ଅପେକ୍ଷା)' : '';

    const newList: PujaList = {
      id: listId,
      pujariId: cleanPujariId,
      pujariName: pujari.name,
      pujaName: payload.pujaName,
      yajamanaName: payload.yajamanaName,
      date: payload.date || new Date().toISOString().split('T')[0],
      time: payload.time || '09:00 AM',
      contact: payload.contact || pujari.phone || '',
      location: payload.location || '',
      notes: payload.notes || '',
      items: payload.items || [],
      createdAt: now,
      updatedAt: now,
      isUnlocked,
      paymentStatus,
      paymentType,
      paymentAmount: isFreeTierNow ? 0 : paymentAmount,
      utrRef: payload.utrRef || '',
      systemMessage: systemMsg,
      ...(payload.yajnaDetails ? { yajnaDetails: payload.yajnaDetails } : {}),
    };

    // Save list doc permanently to Firestore
    await safeSetDoc(doc(db, COLLECTIONS.LISTS, listId), newList);

    // If payment required, create pending payment request doc in Firestore
    if (!isUnlocked) {
      const payId = 'PAY-' + Math.floor(100000 + Math.random() * 900000);
      const paymentReq: PaymentRequest = {
        id: payId,
        pujariId: cleanPujariId,
        pujariName: pujari.name,
        listId,
        pujaName: payload.pujaName,
        yajamanaName: payload.yajamanaName,
        type: 'new_creation',
        amount: paymentAmount,
        utrRef: payload.utrRef || 'Pending submission',
        status: 'pending',
        createdAt: now,
      };
      await safeSetDoc(doc(db, COLLECTIONS.PAYMENTS, payId), paymentReq);
    }

    return { success: true, list: newList, freeTierUsedNow: isFreeTierNow };
  } catch (err: any) {
    console.error('fsCreatePujaList Error:', err);
    return { success: false, message: err?.message || 'Error saving Puja List to Firebase' };
  }
}

export async function fsUpdatePujaList(payload: {
  listId: string;
  pujariId: string;
  pujaName: string;
  yajamanaName: string;
  date: string;
  time: string;
  contact: string;
  location: string;
  notes: string;
  items: PujaList['items'];
  yajnaDetails?: PujaList['yajnaDetails'];
}): Promise<{ success: boolean; message?: string; list?: PujaList }> {
  try {
    const listRef = doc(db, COLLECTIONS.LISTS, payload.listId);
    const listSnap = await getDoc(listRef);

    if (!listSnap.exists()) {
      return { success: false, message: 'Puja List not found' };
    }

    const currentList = listSnap.data() as PujaList;
    const qrSnap = await getDoc(doc(db, COLLECTIONS.CONFIG, 'qrConfig'));
    const qrConfig = qrSnap.exists() ? (qrSnap.data() as QrConfig) : DEFAULT_QR_CONFIG;
    const reDownloadAmount = qrConfig.reDownloadAmount || 2;
    const now = new Date().toISOString();

    const updatedList: PujaList = {
      ...currentList,
      pujaName: payload.pujaName,
      yajamanaName: payload.yajamanaName,
      date: payload.date || currentList.date,
      time: payload.time || currentList.time,
      contact: payload.contact || currentList.contact,
      location: payload.location || currentList.location,
      notes: payload.notes || currentList.notes,
      items: payload.items || currentList.items,
      updatedAt: now,
      isUnlocked: false, // Lock after editing until Admin approval
      paymentStatus: 'pending',
      paymentType: 'edit_list',
      paymentAmount: reDownloadAmount,
      utrRef: 'Pending UTR submission',
    };

    if (payload.yajnaDetails !== undefined) {
      if (payload.yajnaDetails) {
        updatedList.yajnaDetails = payload.yajnaDetails;
      } else {
        delete updatedList.yajnaDetails;
      }
    }

    await safeSetDoc(listRef, updatedList);

    // Create a pending Payment Request for Admin review
    const payId = 'PAY-' + Math.floor(100000 + Math.random() * 900000);
    const paymentReq: PaymentRequest = {
      id: payId,
      pujariId: (payload.pujariId || currentList.pujariId).trim().toUpperCase(),
      pujariName: currentList.pujariName,
      listId: currentList.id,
      pujaName: payload.pujaName,
      yajamanaName: payload.yajamanaName,
      type: 'edit_list',
      amount: reDownloadAmount,
      utrRef: 'Pending UTR submission',
      status: 'pending',
      createdAt: now,
    };
    await safeSetDoc(doc(db, COLLECTIONS.PAYMENTS, payId), paymentReq);

    return { success: true, list: updatedList };
  } catch (err: any) {
    console.error('fsUpdatePujaList Error:', err);
    return { success: false, message: err?.message || 'Error updating Puja List in Firebase' };
  }
}

export async function fsSubmitPaymentUtr(
  listId: string,
  utrRef: string,
  pujariId: string
): Promise<{ success: boolean; message?: string; list?: PujaList }> {
  try {
    const listRef = doc(db, COLLECTIONS.LISTS, listId);
    const listSnap = await getDoc(listRef);
    if (!listSnap.exists()) {
      return { success: false, message: 'Puja List not found' };
    }

    const list = listSnap.data() as PujaList;
    const cleanUtr = (utrRef || '').trim();

    await updateDoc(listRef, {
      utrRef: cleanUtr || list.utrRef || 'Pending submission',
      utrNumber: cleanUtr || (list as any).utrNumber || list.utrRef || '',
      paymentStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    // Find pending or non-approved payment requests or create a new one
    const pmtSnap = await getDocs(collection(db, COLLECTIONS.PAYMENTS));
    const matchingPmts = pmtSnap.docs.filter(
      (d) => d.data().listId === listId && d.data().status !== 'approved'
    );

    if (matchingPmts.length > 0) {
      for (const pmtDoc of matchingPmts) {
        await updateDoc(doc(db, COLLECTIONS.PAYMENTS, pmtDoc.id), {
          utrRef: cleanUtr,
          utrNumber: cleanUtr,
          status: 'pending',
        });
      }
    } else {
      const payId = 'PAY-' + Math.floor(100000 + Math.random() * 900000);
      const newPmt: PaymentRequest = {
        id: payId,
        pujariId: list.pujariId,
        pujariName: list.pujariName,
        listId: list.id,
        pujaName: list.pujaName,
        yajamanaName: list.yajamanaName,
        type: (list.paymentType as any) || 'new_creation',
        amount: list.paymentAmount || 5,
        utrRef: cleanUtr,
        utrNumber: cleanUtr,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await safeSetDoc(doc(db, COLLECTIONS.PAYMENTS, payId), newPmt);
    }

    const updatedSnap = await getDoc(listRef);
    const updatedData = updatedSnap.data() as PujaList;

    // Trigger automated Admin Telegram Notification (and WhatsApp backup)
    const docType = updatedData.yajnaDetails ? 'Nama Yajna Card' : 'Puja List';
    const alertPayload = {
      pujariId: updatedData.pujariId,
      pujariName: updatedData.pujariName,
      documentType: docType,
      utrRef: cleanUtr || updatedData.utrRef || 'N/A',
      listId: updatedData.id,
      timestamp: new Date().toISOString(),
    };

    triggerAdminTelegramNotification(alertPayload).catch((e) => console.warn('Telegram trigger error:', e));
    triggerAdminWhatsappNotification(alertPayload).catch((e) => console.warn('WhatsApp trigger error:', e));

    return { success: true, list: updatedData };
  } catch (err: any) {
    console.error('fsSubmitPaymentUtr Error:', err);
    return { success: false, message: err?.message || 'Failed to submit UTR to Firebase' };
  }
}

export async function fsRequestRedownloadUnlock(
  listId: string,
  pujariId: string,
  utrRef: string
): Promise<{ success: boolean; message?: string; list?: PujaList }> {
  try {
    const listRef = doc(db, COLLECTIONS.LISTS, listId);
    const listSnap = await getDoc(listRef);
    if (!listSnap.exists()) {
      return { success: false, message: 'Puja List not found' };
    }

    const list = listSnap.data() as PujaList;
    const qrSnap = await getDoc(doc(db, COLLECTIONS.CONFIG, 'qrConfig'));
    const qrConfig = qrSnap.exists() ? (qrSnap.data() as QrConfig) : DEFAULT_QR_CONFIG;
    const reDownloadAmount = qrConfig.reDownloadAmount || 2;
    const now = new Date().toISOString();
    const cleanUtr = (utrRef || '').trim();

    const payId = 'PAY-' + Math.floor(100000 + Math.random() * 900000);
    const paymentReq: PaymentRequest = {
      id: payId,
      pujariId: (pujariId || list.pujariId).trim().toUpperCase(),
      pujariName: list.pujariName,
      listId: list.id,
      pujaName: list.pujaName,
      yajamanaName: list.yajamanaName,
      type: 'search_redownload',
      amount: reDownloadAmount,
      utrRef: cleanUtr || 'Pending submission',
      utrNumber: cleanUtr || '',
      status: 'pending',
      createdAt: now,
    };

    await safeSetDoc(doc(db, COLLECTIONS.PAYMENTS, payId), paymentReq);

    await updateDoc(listRef, {
      paymentStatus: 'pending',
      paymentType: 'search_redownload',
      paymentAmount: reDownloadAmount,
      utrRef: cleanUtr || list.utrRef || 'Pending submission',
      utrNumber: cleanUtr || (list as any).utrNumber || list.utrRef || '',
      updatedAt: now,
    });

    const updatedSnap = await getDoc(listRef);
    return { success: true, list: updatedSnap.data() as PujaList };
  } catch (err: any) {
    console.error('fsRequestRedownloadUnlock Error:', err);
    return { success: false, message: err?.message || 'Failed to request unlock' };
  }
}

// 3. PAYMENT MANAGEMENT & REAL-TIME UNLOCK
export function fsSubscribePayments(callback: (payments: PaymentRequest[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.PAYMENTS),
    (snap) => {
      const payments = snap.docs.map((d) => d.data() as PaymentRequest);
      payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(payments);
    },
    (err) => console.error('fsSubscribePayments Error:', err)
  );
}

export async function fsGetPayments(): Promise<PaymentRequest[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PAYMENTS));
    const payments = snap.docs.map((d) => d.data() as PaymentRequest);
    payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return payments;
  } catch (err) {
    console.error('fsGetPayments Error:', err);
    return [];
  }
}

export async function fsApprovePayment(paymentId: string): Promise<boolean> {
  try {
    const pmtRef = doc(db, COLLECTIONS.PAYMENTS, paymentId);
    const pmtSnap = await getDoc(pmtRef);
    if (!pmtSnap.exists()) return false;

    const payment = pmtSnap.data() as PaymentRequest;
    await updateDoc(pmtRef, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
    });

    // Handle Visiting Card payment approval
    if (payment.type === 'visiting_card' || (payment.listId && payment.listId.startsWith('CARD-'))) {
      if (payment.pujariId) {
        const pujariRef = doc(db, COLLECTIONS.PUJARIS, payment.pujariId.trim().toUpperCase());
        const pujariSnap = await getDoc(pujariRef);
        if (pujariSnap.exists()) {
          await updateDoc(pujariRef, {
            cardStatus: 'Unlocked',
            hasUnreadNotification: true,
            systemMessage: '🎉 ଆପଣଙ୍କ Digital Visiting Card ସଫଳତାର ସହ ଅନଲକ୍ ହୋଇଛି!',
          });
        }
      }
    } else {
      // Unlock corresponding Puja List permanently in Firestore
      const listRef = doc(db, COLLECTIONS.LISTS, payment.listId);
      const listSnap = await getDoc(listRef);
      if (listSnap.exists()) {
        await updateDoc(listRef, {
          isUnlocked: true,
          paymentStatus: 'approved',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return true;
  } catch (err) {
    console.error('fsApprovePayment Error:', err);
    return false;
  }
}

export async function fsRejectPayment(paymentId: string, reason?: string): Promise<boolean> {
  try {
    const pmtRef = doc(db, COLLECTIONS.PAYMENTS, paymentId);
    const pmtSnap = await getDoc(pmtRef);
    if (!pmtSnap.exists()) return false;

    const payment = pmtSnap.data() as PaymentRequest;
    const rejectionReason = reason || 'ପେମେଣ୍ଟ ତଥ୍ୟ/UTR ମେଳ ଖାଉନାହିଁ।';

    await updateDoc(pmtRef, {
      status: 'rejected',
      rejectionReason,
      hasUnreadNotification: true,
      systemMessage: '',
    });

    // Handle Visiting Card payment rejection
    if (payment.type === 'visiting_card' || (payment.listId && payment.listId.startsWith('CARD-'))) {
      if (payment.pujariId) {
        const pujariRef = doc(db, COLLECTIONS.PUJARIS, payment.pujariId.trim().toUpperCase());
        const pujariSnap = await getDoc(pujariRef);
        if (pujariSnap.exists()) {
          await updateDoc(pujariRef, {
            cardStatus: 'Locked',
            rejectionReason,
            hasUnreadNotification: true,
          });
        }
      }
    } else {
      const listRef = doc(db, COLLECTIONS.LISTS, payment.listId);
      const listSnap = await getDoc(listRef);
      if (listSnap.exists()) {
        await updateDoc(listRef, {
          paymentStatus: 'rejected',
          rejectionReason,
          hasUnreadNotification: true,
          systemMessage: '',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    if (payment.pujariId) {
      const pujariRef = doc(db, COLLECTIONS.PUJARIS, payment.pujariId.trim().toUpperCase());
      const pujariSnap = await getDoc(pujariRef);
      if (pujariSnap.exists()) {
        await updateDoc(pujariRef, {
          rejectionReason,
          hasUnreadNotification: true,
          systemMessage: '',
        });
      }
    }

    return true;
  } catch (err) {
    console.error('fsRejectPayment Error:', err);
    return false;
  }
}

export async function fsSubmitVisitingCardPayment(
  pujariId: string,
  utrRef: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const cleanId = (pujariId || '').trim().toUpperCase();
    const cleanUtr = (utrRef || '').trim();
    if (!cleanId) return { success: false, message: 'Pujari ID missing' };

    const pujariRef = doc(db, COLLECTIONS.PUJARIS, cleanId);
    const pujariSnap = await getDoc(pujariRef);
    if (!pujariSnap.exists()) {
      return { success: false, message: 'Pujari document not found' };
    }

    const pujari = pujariSnap.data() as Pujari;
    const now = new Date().toISOString();

    await updateDoc(pujariRef, {
      cardStatus: 'Pending',
      cardUtrRef: cleanUtr,
      cardRequestDate: now,
    });

    const pmtSnap = await getDocs(collection(db, COLLECTIONS.PAYMENTS));
    const existingPmt = pmtSnap.docs.find(
      (d) =>
        d.data().pujariId === cleanId &&
        d.data().type === 'visiting_card' &&
        d.data().status !== 'approved'
    );

    if (existingPmt) {
      await updateDoc(doc(db, COLLECTIONS.PAYMENTS, existingPmt.id), {
        utrRef: cleanUtr,
        utrNumber: cleanUtr,
        status: 'pending',
        createdAt: now,
      });
    } else {
      const payId = 'PAY-CARD-' + Math.floor(100000 + Math.random() * 900000);
      const newPmt: PaymentRequest = {
        id: payId,
        pujariId: cleanId,
        pujariName: pujari.name,
        listId: `CARD-${cleanId}`,
        pujaName: 'Digital Visiting Card Unlock',
        yajamanaName: pujari.name,
        type: 'visiting_card',
        amount: 5,
        utrRef: cleanUtr,
        utrNumber: cleanUtr,
        status: 'pending',
        createdAt: now,
      };
      await safeSetDoc(doc(db, COLLECTIONS.PAYMENTS, payId), newPmt);
    }

    return { success: true };
  } catch (err: any) {
    console.error('fsSubmitVisitingCardPayment Error:', err);
    return { success: false, message: err?.message || 'Failed to submit UTR' };
  }
}

export async function fsApproveVisitingCard(pujariId: string, paymentId?: string): Promise<boolean> {
  try {
    const cleanId = (pujariId || '').trim().toUpperCase();
    const pujariRef = doc(db, COLLECTIONS.PUJARIS, cleanId);
    const pujariSnap = await getDoc(pujariRef);
    if (pujariSnap.exists()) {
      await updateDoc(pujariRef, {
        cardStatus: 'Unlocked',
        hasUnreadNotification: true,
        systemMessage: '🎉 ଆପଣଙ୍କ Digital Visiting Card ସଫଳତାର ସହ ଅନଲକ୍ ହୋଇଛି!',
      });
    }

    if (paymentId) {
      const pmtRef = doc(db, COLLECTIONS.PAYMENTS, paymentId);
      const pmtSnap = await getDoc(pmtRef);
      if (pmtSnap.exists()) {
        await updateDoc(pmtRef, {
          status: 'approved',
          approvedAt: new Date().toISOString(),
        });
      }
    } else {
      const pmtSnap = await getDocs(collection(db, COLLECTIONS.PAYMENTS));
      const match = pmtSnap.docs.find(
        (d) => d.data().pujariId === cleanId && d.data().type === 'visiting_card'
      );
      if (match) {
        await updateDoc(doc(db, COLLECTIONS.PAYMENTS, match.id), {
          status: 'approved',
          approvedAt: new Date().toISOString(),
        });
      }
    }

    return true;
  } catch (err) {
    console.error('fsApproveVisitingCard Error:', err);
    return false;
  }
}

export async function fsRejectVisitingCard(
  pujariId: string,
  paymentId?: string,
  reason?: string
): Promise<boolean> {
  try {
    const cleanId = (pujariId || '').trim().toUpperCase();
    const rejectionReason = reason || 'ପେମେଣ୍ଟ UTR ମେଳ ଖାଉନାହିଁ।';

    const pujariRef = doc(db, COLLECTIONS.PUJARIS, cleanId);
    const pujariSnap = await getDoc(pujariRef);
    if (pujariSnap.exists()) {
      await updateDoc(pujariRef, {
        cardStatus: 'Locked',
        rejectionReason,
        hasUnreadNotification: true,
        systemMessage: '',
      });
    }

    if (paymentId) {
      const pmtRef = doc(db, COLLECTIONS.PAYMENTS, paymentId);
      const pmtSnap = await getDoc(pmtRef);
      if (pmtSnap.exists()) {
        await updateDoc(pmtRef, {
          status: 'rejected',
          rejectionReason,
        });
      }
    } else {
      const pmtSnap = await getDocs(collection(db, COLLECTIONS.PAYMENTS));
      const match = pmtSnap.docs.find(
        (d) => d.data().pujariId === cleanId && d.data().type === 'visiting_card'
      );
      if (match) {
        await updateDoc(doc(db, COLLECTIONS.PAYMENTS, match.id), {
          status: 'rejected',
          rejectionReason,
        });
      }
    }

    return true;
  } catch (err) {
    console.error('fsRejectVisitingCard Error:', err);
    return false;
  }
}

export async function fsUpdatePujariCardProfile(
  pujariId: string,
  profileData: Partial<Pujari>
): Promise<boolean> {
  try {
    const cleanId = (pujariId || '').trim().toUpperCase();
    const pujariRef = doc(db, COLLECTIONS.PUJARIS, cleanId);
    const pujariSnap = await getDoc(pujariRef);
    if (!pujariSnap.exists()) return false;

    const updates: Partial<Pujari> = {};
    if (profileData.title !== undefined) updates.title = profileData.title;
    if (profileData.specializations !== undefined) updates.specializations = profileData.specializations;
    if (profileData.profilePhotoUrl !== undefined) updates.profilePhotoUrl = profileData.profilePhotoUrl;

    await updateDoc(pujariRef, updates);
    return true;
  } catch (err) {
    console.error('fsUpdatePujariCardProfile Error:', err);
    return false;
  }
}

export async function fsUnlockPayment(paymentId: string): Promise<boolean> {
  try {
    const pmtRef = doc(db, COLLECTIONS.PAYMENTS, paymentId);
    const pmtSnap = await getDoc(pmtRef);
    if (!pmtSnap.exists()) return false;

    const payment = pmtSnap.data() as PaymentRequest;
    const unlockMsg = 'ଖୁସି ଖବର! ଆପଣଙ୍କ ଆକାଉଣ୍ଟ/ପେମେଣ୍ଟ ସଫଳତାର ସହ ଅନଲକ୍ କରାଯାଇଛି।';

    await updateDoc(pmtRef, {
      status: 'pending',
      rejectionReason: '',
      systemMessage: unlockMsg,
      hasUnreadNotification: true,
    });

    const listRef = doc(db, COLLECTIONS.LISTS, payment.listId);
    const listSnap = await getDoc(listRef);
    if (listSnap.exists()) {
      await updateDoc(listRef, {
        paymentStatus: 'pending',
        rejectionReason: '',
        systemMessage: unlockMsg,
        hasUnreadNotification: true,
        updatedAt: new Date().toISOString(),
      });
    }

    if (payment.pujariId) {
      const pujariRef = doc(db, COLLECTIONS.PUJARIS, payment.pujariId.trim().toUpperCase());
      const pujariSnap = await getDoc(pujariRef);
      if (pujariSnap.exists()) {
        await updateDoc(pujariRef, {
          rejectionReason: '',
          systemMessage: unlockMsg,
          hasUnreadNotification: true,
        });
      }
    }

    return true;
  } catch (err) {
    console.error('fsUnlockPayment Error:', err);
    return false;
  }
}

// 4. QR CONFIGURATION & REALTIME LISTENERS
export function fsSubscribeQrConfig(callback: (config: QrConfig) => void): Unsubscribe {
  const docRef = doc(db, COLLECTIONS.CONFIG, 'qrConfig');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as QrConfig);
      } else {
        callback(DEFAULT_QR_CONFIG);
      }
    },
    (err) => console.error('fsSubscribeQrConfig Error:', err)
  );
}

export async function fsGetQrConfig(): Promise<QrConfig> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'qrConfig');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_QR_CONFIG, ...(snap.data() as QrConfig) };
    }
    await setDoc(docRef, DEFAULT_QR_CONFIG);
    return DEFAULT_QR_CONFIG;
  } catch (err) {
    console.error('fsGetQrConfig Error:', err);
    return DEFAULT_QR_CONFIG;
  }
}

export async function fsUpdateQrConfig(config: Partial<QrConfig>): Promise<QrConfig> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'qrConfig');
    const snap = await getDoc(docRef);
    const current = snap.exists() ? (snap.data() as QrConfig) : DEFAULT_QR_CONFIG;

    const updated: QrConfig = {
      ...current,
      ...config,
    };

    await setDoc(docRef, updated);
    return updated;
  } catch (err) {
    console.error('fsUpdateQrConfig Error:', err);
    throw err;
  }
}

// 4B. HOME SLIDER BANNER CONFIGURATION
export const DEFAULT_HOME_SLIDER_CONFIG: HomeSliderConfig = {
  autoSlideIntervalSeconds: 5,
  images: [],
};

export function fsSubscribeHomeSliderConfig(callback: (config: HomeSliderConfig) => void): Unsubscribe {
  const docRef = doc(db, COLLECTIONS.CONFIG, 'homeSlider');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as HomeSliderConfig;
        callback({
          autoSlideIntervalSeconds: data.autoSlideIntervalSeconds || 5,
          images: Array.isArray(data.images) ? data.images : [],
        });
      } else {
        callback(DEFAULT_HOME_SLIDER_CONFIG);
      }
    },
    (err) => console.error('fsSubscribeHomeSliderConfig Error:', err)
  );
}

export async function fsGetHomeSliderConfig(): Promise<HomeSliderConfig> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'homeSlider');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as HomeSliderConfig;
      return {
        autoSlideIntervalSeconds: data.autoSlideIntervalSeconds || 5,
        images: Array.isArray(data.images) ? data.images : [],
      };
    }
    return DEFAULT_HOME_SLIDER_CONFIG;
  } catch (err) {
    console.error('fsGetHomeSliderConfig Error:', err);
    return DEFAULT_HOME_SLIDER_CONFIG;
  }
}

export async function fsUpdateHomeSliderConfig(config: Partial<HomeSliderConfig>): Promise<HomeSliderConfig> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'homeSlider');
    const snap = await getDoc(docRef);
    const current = snap.exists() ? (snap.data() as HomeSliderConfig) : DEFAULT_HOME_SLIDER_CONFIG;

    const updated: HomeSliderConfig = {
      autoSlideIntervalSeconds: config.autoSlideIntervalSeconds ?? current.autoSlideIntervalSeconds ?? 5,
      images: Array.isArray(config.images) ? config.images : [],
    };

    await safeSetDoc(docRef, updated);
    return updated;
  } catch (err) {
    console.error('fsUpdateHomeSliderConfig Error:', err);
    throw err;
  }
}

// 4C. PURI ONLINE STORE CONFIGURATION (WHITE-LABEL PRODUCTS)
export const DEFAULT_PURI_STORE_CONFIG: PuriStoreConfig = {
  enabled: true,
  title: 'ଶ୍ରୀକ୍ଷେତ୍ର ପୁରୀ ଅନଲାଇନ୍ ଷ୍ଟୋର୍ (Online Store)',
  subtitle: 'ପ୍ରଭୁ ଶ୍ରୀ ଜଗନ୍ନାଥଙ୍କ ପବିତ୍ର ପୂଜା ସାମଗ୍ରୀ ଓ ଆଧ୍ୟାତ୍ମିକ ଉପହାର',
  products: [],
};

export function fsSubscribePuriStoreConfig(callback: (config: PuriStoreConfig) => void): Unsubscribe {
  const docRef = doc(db, COLLECTIONS.CONFIG, 'puriStore');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as PuriStoreConfig;
        callback({
          enabled: data.enabled ?? true,
          title: data.title || DEFAULT_PURI_STORE_CONFIG.title,
          subtitle: data.subtitle || DEFAULT_PURI_STORE_CONFIG.subtitle,
          products: Array.isArray(data.products) ? data.products : [],
        });
      } else {
        callback(DEFAULT_PURI_STORE_CONFIG);
      }
    },
    (err) => console.error('fsSubscribePuriStoreConfig Error:', err)
  );
}

export async function fsGetPuriStoreConfig(): Promise<PuriStoreConfig> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'puriStore');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as PuriStoreConfig;
      return {
        enabled: data.enabled ?? true,
        title: data.title || DEFAULT_PURI_STORE_CONFIG.title,
        subtitle: data.subtitle || DEFAULT_PURI_STORE_CONFIG.subtitle,
        products: Array.isArray(data.products) ? data.products : [],
      };
    }
    return DEFAULT_PURI_STORE_CONFIG;
  } catch (err) {
    console.error('fsGetPuriStoreConfig Error:', err);
    return DEFAULT_PURI_STORE_CONFIG;
  }
}

export async function fsUpdatePuriStoreConfig(config: Partial<PuriStoreConfig>): Promise<PuriStoreConfig> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'puriStore');
    const snap = await getDoc(docRef);
    const current = snap.exists() ? (snap.data() as PuriStoreConfig) : DEFAULT_PURI_STORE_CONFIG;

    const updated: PuriStoreConfig = {
      enabled: config.enabled ?? current.enabled ?? true,
      title: config.title ?? current.title ?? DEFAULT_PURI_STORE_CONFIG.title,
      subtitle: config.subtitle ?? current.subtitle ?? DEFAULT_PURI_STORE_CONFIG.subtitle,
      products: config.products ? config.products : current.products,
    };

    await safeSetDoc(docRef, updated);
    return updated;
  } catch (err) {
    console.error('fsUpdatePuriStoreConfig Error:', err);
    throw err;
  }
}

// 5. PUJA TEMPLATES
export async function fsGetTemplates(): Promise<PujaTemplate[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.TEMPLATES));
    if (snap.empty) {
      for (const tmpl of DEFAULT_PUJA_TEMPLATES) {
        await setDoc(doc(db, COLLECTIONS.TEMPLATES, tmpl.id), tmpl);
      }
      return DEFAULT_PUJA_TEMPLATES;
    }
    return snap.docs.map((d) => d.data() as PujaTemplate);
  } catch (err) {
    console.error('fsGetTemplates Error:', err);
    return DEFAULT_PUJA_TEMPLATES;
  }
}

export async function fsCreateTemplate(template: Omit<PujaTemplate, 'id'>): Promise<PujaTemplate | null> {
  try {
    const id = 'tmpl-' + Date.now();
    const newTmpl: PujaTemplate = {
      id,
      name: template.name,
      description: template.description || '',
      items: template.items,
    };
    await setDoc(doc(db, COLLECTIONS.TEMPLATES, id), newTmpl);
    return newTmpl;
  } catch (err) {
    console.error('fsCreateTemplate Error:', err);
    return null;
  }
}

export async function fsDeleteTemplate(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.TEMPLATES, id));
    return true;
  } catch (err) {
    console.error('fsDeleteTemplate Error:', err);
    return false;
  }
}

// ----------------------------------------------------------------------
// FIREBASE CLOUD MESSAGING (FCM) PUSH NOTIFICATIONS
// ----------------------------------------------------------------------

export async function requestAdminNotificationPermission(): Promise<{
  success: boolean;
  token?: string;
  message?: string;
}> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return {
        success: false,
        message: 'ଏହି ବ୍ରାଉଜର୍‌ରେ ପୁଶ୍ ନୋଟିଫିକେସନ୍ ସପୋର୍ଟ ନାହିଁ। (Notifications not supported)',
      };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        message: 'ନୋଟିଫିକେସନ୍ ଅନୁମତି ପ୍ରତ୍ୟାଖ୍ୟାନ କରାଯାଇଛି। (Notification permission denied)',
      };
    }

    // Register Background Service Worker
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[FCM] Service Worker registered for FCM:', swRegistration);
      } catch (swErr) {
        console.warn('[FCM] SW Registration warning:', swErr);
      }
    }

    const messagingSupported = await isSupported().catch(() => false);
    let token = '';

    if (messagingSupported) {
      try {
        const messaging = getMessaging(app);
        token = await getToken(messaging, {
          serviceWorkerRegistration: swRegistration,
        });

        // Listen to active foreground notifications
        onMessage(messaging, (payload) => {
          console.log('[FCM Foreground] Message received:', payload);
          const title = payload.notification?.title || payload.data?.title || '🚨 ନୂଆ ପୂଜାରୀ ପଞ୍ଜୀକରଣ';
          const body = payload.notification?.body || payload.data?.body || 'ଜଣେ ନୂଆ ପୂଜାରୀ ଆପ୍‌ରେ ପଞ୍ଜୀକୃତ ହୋଇଛନ୍ତି।';
          new Notification(title, {
            body: body,
            icon: '/pwa-icon.svg',
          });
        });
      } catch (tokenErr) {
        console.warn('[FCM Token] Token retrieval warning:', tokenErr);
      }
    }

    // Save Admin FCM push token & preference in Firestore
    const adminPushRef = doc(db, COLLECTIONS.CONFIG, 'admin_push');
    await setDoc(
      adminPushRef,
      {
        fcmToken: token || 'web-push-enabled',
        permissionStatus: 'granted',
        enabledAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
      { merge: true }
    );

    return {
      success: true,
      token: token || 'web-push-enabled',
      message: 'ପୁଶ୍ ନୋଟିଫିକେସନ୍ ସଫଳତାର ସହ ସକ୍ରିୟ ହେଲା! (Push Notifications Active)',
    };
  } catch (err: any) {
    console.error('requestAdminNotificationPermission error:', err);
    return {
      success: false,
      message: err?.message || 'ନୋଟିଫିକେସନ୍ ସେଟ୍ଅପ୍‌ରେ ତ୍ରୁଟି।',
    };
  }
}

export async function getAdminNotificationStatus(): Promise<{
  permission: NotificationPermission | 'unsupported';
  isTokenSaved: boolean;
  fcmToken?: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { permission: 'unsupported', isTokenSaved: false };
  }

  const permission = Notification.permission;
  try {
    const adminPushSnap = await getDoc(doc(db, COLLECTIONS.CONFIG, 'admin_push'));
    if (adminPushSnap.exists()) {
      const data = adminPushSnap.data();
      return {
        permission,
        isTokenSaved: !!data.fcmToken,
        fcmToken: data.fcmToken,
      };
    }
  } catch (err) {
    console.error('getAdminNotificationStatus error:', err);
  }

  return { permission, isTokenSaved: false };
}

export async function triggerAdminNewPujariPush(pujari: {
  id: string;
  name: string;
  phone: string;
}): Promise<void> {
  try {
    // 1. Retrieve stored Admin FCM Push Token from Firestore
    const adminPushSnap = await getDoc(doc(db, COLLECTIONS.CONFIG, 'admin_push'));
    let fcmToken = '';
    if (adminPushSnap.exists()) {
      fcmToken = adminPushSnap.data().fcmToken || '';
    }

    // 2. Trigger native Web Notification if permission granted on open browser session
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 ନୂଆ ପୂଜାରୀ ପଞ୍ଜୀକରଣ (New Pujari Registered)', {
        body: `ପୂଜାରୀ ${pujari.name} (${pujari.id}) ଆପ୍‌ରେ ସଫଳତାର ସହ ପଞ୍ଜୀକୃତ ହୋଇଛନ୍ତି। ମୋବାଇଲ୍: ${pujari.phone}`,
        icon: '/pwa-icon.svg',
        tag: `pujari-reg-${pujari.id}`,
      });
    }

    // 3. Post notification payload to server API endpoint /api/notify-admin
    await fetch('/api/notify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pujariId: pujari.id,
        name: pujari.name,
        phone: pujari.phone,
        fcmToken,
      }),
    }).catch((e) => console.warn('API notify-admin fetch warning:', e));

    console.log(`[FCM Push] Registration notification dispatched for ${pujari.id} to token: ${fcmToken || 'Local/Broadcast'}`);
  } catch (err) {
    console.error('triggerAdminNewPujariPush error:', err);
  }
}

export async function triggerAdminTelegramNotification(payload: {
  pujariId: string;
  pujariName: string;
  documentType: string;
  utrRef: string;
  listId?: string;
  timestamp?: string;
}): Promise<void> {
  try {
    await fetch('/api/notify-admin-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((e) => console.warn('API notify-admin-telegram fetch warning:', e));
  } catch (err) {
    console.error('triggerAdminTelegramNotification error:', err);
  }
}

export async function triggerAdminWhatsappNotification(payload: {
  pujariId: string;
  pujariName: string;
  documentType: string;
  utrRef: string;
  listId?: string;
  timestamp?: string;
}): Promise<void> {
  try {
    await fetch('/api/notify-admin-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((e) => console.warn('API notify-admin-whatsapp fetch warning:', e));
  } catch (err) {
    console.error('triggerAdminWhatsappNotification error:', err);
  }
}

export async function fsSetListOfficePendingStatus(listId: string): Promise<boolean> {
  try {
    const listRef = doc(db, COLLECTIONS.LISTS, listId);
    await updateDoc(listRef, {
      isUnlocked: false,
      paymentStatus: 'pending',
      systemMessage: 'Pending (ଅଫିସ୍ ସମୟକୁ ଅପେକ୍ଷା)',
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.warn('fsSetListOfficePendingStatus error:', err);
    return false;
  }
}

export async function fsSetSiteLock(isLocked: boolean): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'site_lock');
    await safeSetDoc(docRef, {
      isLocked,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.warn('fsSetSiteLock error:', err);
    return false;
  }
}

export function fsSubscribeSiteLock(callback: (isLocked: boolean) => void): () => void {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'site_lock');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          callback(Boolean(data?.isLocked));
        } else {
          callback(false);
        }
      },
      (err) => {
        console.warn('fsSubscribeSiteLock listener warning:', err);
        const local = localStorage.getItem('puja_app_site_locked') === 'true';
        callback(local);
      }
    );
  } catch (err) {
    console.warn('fsSubscribeSiteLock error:', err);
    return () => {};
  }
}

// ----------------------------------------------------------------------
// PASSWORD RESET REQUESTS & 3-STRIKE LOCKOUT SYSTEM
// ----------------------------------------------------------------------

export async function fsRequestPasswordReset(payload: {
  pujariId: string;
  submittedPin: string;
  newPin?: string;
}): Promise<{
  success: boolean;
  message?: string;
  isLocked?: boolean;
  remainingHours?: number;
}> {
  try {
    const cleanId = (payload.pujariId || '').trim().toUpperCase();
    const cleanSubmittedPin = (payload.submittedPin || '').trim();
    const cleanNewPin = (payload.newPin || '').trim();

    if (!cleanId) {
      return { success: false, message: 'ଦୟାକରି ଆପଣଙ୍କ User ID ଦିଅନ୍ତୁ।' };
    }
    if (!cleanSubmittedPin || cleanSubmittedPin.length !== 4) {
      return { success: false, message: 'ଦୟାକରି ୪-ଅଙ୍କ ବିଶିଷ୍ଟ ଗୁପ୍ତ Voter ID PIN ଦିଅନ୍ତୁ।' };
    }
    if (!cleanNewPin || cleanNewPin.length !== 4) {
      return { success: false, message: 'ଦୟାକରି ୪-ଅଙ୍କ ବିଶିଷ୍ଟ ନୂତନ ପୂଜାରୀ PIN ଦିଅନ୍ତୁ।' };
    }

    const pujariRef = doc(db, COLLECTIONS.PUJARIS, cleanId);
    const pujariSnap = await getDoc(pujariRef);

    if (!pujariSnap.exists()) {
      return {
        success: false,
        message: 'ଏହି User ID ମିଳିଲା ନାହିଁ! ଦୟାକରି ସଠିକ୍ User ID ଦିଅନ୍ତୁ କିମ୍ବା ଆଡମିନ୍ଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।',
      };
    }

    const pujari = pujariSnap.data() as Pujari;

    // Check 24-Hour Lockout Status
    if (pujari.recoveryLockedUntil) {
      const lockTime = new Date(pujari.recoveryLockedUntil).getTime();
      const now = Date.now();
      if (now < lockTime) {
        const remainingMs = lockTime - now;
        const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
        return {
          success: false,
          isLocked: true,
          remainingHours,
          message: 'Please mail Admin (୨୪ ଘଣ୍ଟା ପାଇଁ ପାସୱାର୍ଡ ରିକଭରୀ ଲକ୍ ଅଛି। ଦୟାକରି ଆଡମିନ୍ଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ - Please mail Admin)',
        };
      } else {
        // Automatically unlock after 24 hours
        await updateDoc(pujariRef, {
          recoveryLockedUntil: '',
          recoveryFailedCount: 0,
        });
      }
    }

    // Check if a pending reset request already exists
    const resetsSnap = await getDocs(collection(db, COLLECTIONS.PASSWORD_RESETS));
    const allResets = resetsSnap.docs.map((d) => d.data() as PasswordResetRequest);
    const existingPending = allResets.find(
      (r) => r.pujariId === cleanId && r.status === 'pending'
    );

    if (existingPending) {
      return {
        success: false,
        message: 'ଆପଣଙ୍କର ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁରୋଧ ପୂର୍ବରୁ ଆଡମିନ୍ ପ୍ୟାନେଲରେ ଯାଞ୍ଚ ଅପେକ୍ଷାରେ ଅଛି। ଦୟାକରି ଅପେକ୍ଷା କରନ୍ତୁ।',
      };
    }

    const registeredPin = pujari.voterIdPin || pujari.pin || '1234';
    const resetId = 'RST-' + Math.floor(100000 + Math.random() * 900000);
    const nowIso = new Date().toISOString();

    const newRequest: PasswordResetRequest = {
      id: resetId,
      pujariId: cleanId,
      pujariName: pujari.name || 'Pujari',
      pujariPhone: pujari.phone || '',
      registeredPin: registeredPin,
      submittedPin: cleanSubmittedPin,
      newPin: cleanNewPin,
      status: 'pending',
      createdAt: nowIso,
    };

    await safeSetDoc(doc(db, COLLECTIONS.PASSWORD_RESETS, resetId), newRequest);

    await updateDoc(pujariRef, {
      pendingResetRequestId: resetId,
      passwordResetStatus: 'pending',
    });

    return {
      success: true,
      message: 'ଆପଣଙ୍କ ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁରୋଧ ଆଡମିନ୍ ପ୍ୟାନେଲକୁ ପଠାଯାଇଛି! ଆଡମିନ୍ ଯାଞ୍ଚ ପରେ ଅନୁମୋଦନ କରିବେ।',
    };
  } catch (err: any) {
    console.error('fsRequestPasswordReset error:', err);
    return {
      success: false,
      message: err?.message || 'ଅନୁରୋଧ ପଠାଇବାରେ ତ୍ରୁଟି। ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।',
    };
  }
}

export function fsSubscribePasswordResetRequests(
  callback: (requests: PasswordResetRequest[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.PASSWORD_RESETS),
    (snap) => {
      const requests = snap.docs.map((d) => d.data() as PasswordResetRequest);
      requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(requests);
    },
    (err) => console.error('fsSubscribePasswordResetRequests Error:', err)
  );
}

export async function fsGetPasswordResetRequests(): Promise<PasswordResetRequest[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PASSWORD_RESETS));
    const requests = snap.docs.map((d) => d.data() as PasswordResetRequest);
    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return requests;
  } catch (err) {
    console.error('fsGetPasswordResetRequests Error:', err);
    return [];
  }
}

export async function fsApprovePasswordResetRequest(requestId: string): Promise<boolean> {
  try {
    const resetRef = doc(db, COLLECTIONS.PASSWORD_RESETS, requestId);
    const resetSnap = await getDoc(resetRef);
    if (!resetSnap.exists()) return false;

    const reqData = resetSnap.data() as PasswordResetRequest;
    const nowIso = new Date().toISOString();

    await updateDoc(resetRef, {
      status: 'approved',
      approvedAt: nowIso,
    });

    const newPinToSet = reqData.newPin || reqData.submittedPin;

    const pujariRef = doc(db, COLLECTIONS.PUJARIS, reqData.pujariId);
    const pujariSnap = await getDoc(pujariRef);

    if (pujariSnap.exists()) {
      await updateDoc(pujariRef, {
        pin: newPinToSet,
        recoveryFailedCount: 0,
        recoveryLockedUntil: '',
        passwordResetStatus: 'approved',
        hasUnreadNotification: true,
        systemMessage: `🎉 ଆପଣଙ୍କ ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁମୋଦିତ ହୋଇଛି! ଆପଣଙ୍କର ନୂଆ PIN ହେଉଛି: ${newPinToSet}`,
      });
    }

    return true;
  } catch (err) {
    console.error('fsApprovePasswordResetRequest Error:', err);
    return false;
  }
}

export async function fsRejectPasswordResetRequest(
  requestId: string,
  reason?: string
): Promise<{ success: boolean; isNowLocked?: boolean }> {
  try {
    const resetRef = doc(db, COLLECTIONS.PASSWORD_RESETS, requestId);
    const resetSnap = await getDoc(resetRef);
    if (!resetSnap.exists()) return { success: false };

    const reqData = resetSnap.data() as PasswordResetRequest;
    const nowIso = new Date().toISOString();
    const rejectionReason = reason || 'ଆଡମିନ୍ ଦ୍ୱାରା PIN ଯାଞ୍ଚ ଅସଫଳ ହୋଇଛି (PIN Mismatch)';

    await updateDoc(resetRef, {
      status: 'rejected',
      rejectedAt: nowIso,
      rejectionReason,
    });

    let isNowLocked = false;
    const pujariRef = doc(db, COLLECTIONS.PUJARIS, reqData.pujariId);
    const pujariSnap = await getDoc(pujariRef);

    if (pujariSnap.exists()) {
      const pujari = pujariSnap.data() as Pujari;
      const currentFailures = (pujari.recoveryFailedCount || 0) + 1;
      const updates: Partial<Pujari> = {
        recoveryFailedCount: currentFailures,
        passwordResetStatus: 'rejected',
        hasUnreadNotification: true,
        rejectionReason,
        systemMessage: `ଆପଣଙ୍କ ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁରୋଧ ଅଗ୍ରାହ୍ୟ କରାଗଲା। (${currentFailures}/3 strictly allowed attempts)`,
      };

      if (currentFailures >= 3) {
        const lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        updates.recoveryLockedUntil = lockUntil;
        updates.systemMessage = '3 ଥର ଭୁଲ୍ ଚେଷ୍ଟା କାରଣରୁ ଆପଣଙ୍କ ପାସୱାର୍ଡ ରିକଭରୀ ୨୪ ଘଣ୍ଟା ପାଇଁ ଲକ୍ କରାଗଲା। (Please mail Admin)';
        isNowLocked = true;
      }

      await updateDoc(pujariRef, updates);
    }

    return { success: true, isNowLocked };
  } catch (err) {
    console.error('fsRejectPasswordResetRequest Error:', err);
    return { success: false };
  }
}

// ----------------------------------------------------------------------
// 8. REAL-TIME PWA INSTALL ANALYTICS TRACKING
// ----------------------------------------------------------------------
export async function fsLogPwaInstall(extra?: {
  platform?: string;
  userAgent?: string;
  referrer?: string;
}): Promise<boolean> {
  try {
    const installId = 'INST-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const docRef = doc(db, 'analytics_installs', installId);
    
    let resolvedPlatform = extra?.platform || '';
    if (!resolvedPlatform && typeof navigator !== 'undefined') {
      resolvedPlatform = (navigator as any).userAgentData?.platform || navigator.platform || 'Unknown';
    }

    const installData: AnalyticsInstall = {
      id: installId,
      timestamp: new Date().toISOString(),
      platform: resolvedPlatform || 'Web',
      userAgent: extra?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'),
      referrer: extra?.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
    };

    await safeSetDoc(docRef, installData);
    return true;
  } catch (err) {
    console.error('fsLogPwaInstall Error:', err);
    return false;
  }
}

export async function fsGetPwaInstalls(): Promise<AnalyticsInstall[]> {
  try {
    const snap = await getDocs(collection(db, 'analytics_installs'));
    const installs = snap.docs.map((d) => d.data() as AnalyticsInstall);
    installs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return installs;
  } catch (err) {
    console.error('fsGetPwaInstalls Error:', err);
    return [];
  }
}

export function fsSubscribePwaInstalls(
  callback: (installs: AnalyticsInstall[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'analytics_installs'),
    (snap) => {
      const installs = snap.docs.map((d) => d.data() as AnalyticsInstall);
      installs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(installs);
    },
    (err) => console.error('fsSubscribePwaInstalls Error:', err)
  );
}

