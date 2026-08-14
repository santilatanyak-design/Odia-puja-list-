import { Temple, TempleBooking, ReceiptHeaderConfig } from '../types';
import { db, sanitizeFirestoreData } from './firebase';
import { collection, doc, setDoc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';

export const DEFAULT_RECEIPT_HEADER_CONFIG: ReceiptHeaderConfig = {
  topBanner: '🕉️ ଓଡ଼ିଶା ଅଫିସିଆଲ ମନ୍ଦିର ପୂଜା ସେବା 🕉️',
  mainTitle: 'TEMPLE PUJA & JAL ABHISHEK RECEIPT',
  subTitle: '(ପୂଜା ଏବଂ ଜଳାଭିଷେକ ବୁକିଂ ସ୍ୱୀକୃତି ରସିଦ୍)',
  section1Heading: 'ମନ୍ଦିର ତଥ୍ୟ (Temple Details)',
  section2Heading: 'ନିର୍ଦ୍ଧାରିତ ପୂଜା / ଜଳାଭିଷେକ ସମୟ (Scheduled Date & Time)',
  footerText: 'ଦୟାକରି ଏହି ରସିଦ୍‌କୁ ମନ୍ଦିରରେ ଦର୍ଶାଇ ପୂଜା / ଜଳାଭିଷେକ ସମ୍ପନ୍ନ କରନ୍ତୁ । Generated on demand via Odisha Temple Puja Portal • All Rights Reserved',
};

const LOCAL_RECEIPT_HEADER_KEY = 'receipt_header_config';

export function getReceiptHeaderConfig(): ReceiptHeaderConfig {
  try {
    const raw = localStorage.getItem(LOCAL_RECEIPT_HEADER_KEY) || localStorage.getItem('temple_receipt_header_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const topBanner = typeof parsed.topBanner === 'string' ? parsed.topBanner.trim() : '';
        const mainTitle = typeof parsed.mainTitle === 'string' ? parsed.mainTitle.trim() : '';
        const subTitle = typeof parsed.subTitle === 'string' ? parsed.subTitle.trim() : '';
        const section1Heading = typeof parsed.section1Heading === 'string' ? parsed.section1Heading.trim() : '';
        const section2Heading = typeof parsed.section2Heading === 'string' ? parsed.section2Heading.trim() : '';
        const footerText = typeof parsed.footerText === 'string' ? parsed.footerText.trim() : '';

        return {
          topBanner: topBanner || DEFAULT_RECEIPT_HEADER_CONFIG.topBanner,
          mainTitle: mainTitle || DEFAULT_RECEIPT_HEADER_CONFIG.mainTitle,
          subTitle: subTitle || DEFAULT_RECEIPT_HEADER_CONFIG.subTitle,
          section1Heading: section1Heading || DEFAULT_RECEIPT_HEADER_CONFIG.section1Heading,
          section2Heading: section2Heading || DEFAULT_RECEIPT_HEADER_CONFIG.section2Heading,
          footerText: footerText || DEFAULT_RECEIPT_HEADER_CONFIG.footerText,
        };
      }
    }
  } catch (err) {
    console.warn('Error reading local receipt header config:', err);
  }
  return DEFAULT_RECEIPT_HEADER_CONFIG;
}

export async function saveReceiptHeaderConfig(config: Partial<ReceiptHeaderConfig>): Promise<boolean> {
  try {
    const cleaned: ReceiptHeaderConfig = {
      topBanner: (config.topBanner || '').trim() || DEFAULT_RECEIPT_HEADER_CONFIG.topBanner,
      mainTitle: (config.mainTitle || '').trim() || DEFAULT_RECEIPT_HEADER_CONFIG.mainTitle,
      subTitle: (config.subTitle || '').trim() || DEFAULT_RECEIPT_HEADER_CONFIG.subTitle,
      section1Heading: (config.section1Heading || '').trim() || (DEFAULT_RECEIPT_HEADER_CONFIG.section1Heading as string),
      section2Heading: (config.section2Heading || '').trim() || (DEFAULT_RECEIPT_HEADER_CONFIG.section2Heading as string),
      footerText: (config.footerText || '').trim() || (DEFAULT_RECEIPT_HEADER_CONFIG.footerText as string),
    };
    const jsonStr = JSON.stringify(cleaned);
    localStorage.setItem(LOCAL_RECEIPT_HEADER_KEY, jsonStr);
    localStorage.setItem('temple_receipt_header_config', jsonStr);
    window.dispatchEvent(new Event('receipt_header_updated'));

    try {
      const configRef = doc(db, 'config', 'receipt_header_data');
      await setDoc(configRef, sanitizeFirestoreData({ ...cleaned, updatedAt: new Date().toISOString() }));
    } catch (fsErr) {
      console.warn('Firestore receipt header save fallback to local:', fsErr);
    }
    return true;
  } catch (err) {
    console.error('Error saving receipt header config:', err);
    return false;
  }
}

export function subscribeReceiptHeaderConfig(callback: (config: ReceiptHeaderConfig) => void): () => void {
  callback(getReceiptHeaderConfig());

  const handleLocalUpdate = () => {
    callback(getReceiptHeaderConfig());
  };
  window.addEventListener('receipt_header_updated', handleLocalUpdate);
  window.addEventListener('storage', handleLocalUpdate);

  let unsubFs: (() => void) | null = null;
  try {
    const configRef = doc(db, 'config', 'receipt_header_data');
    unsubFs = onSnapshot(
      configRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data) {
            const topBanner = typeof data.topBanner === 'string' ? data.topBanner.trim() : '';
            const mainTitle = typeof data.mainTitle === 'string' ? data.mainTitle.trim() : '';
            const subTitle = typeof data.subTitle === 'string' ? data.subTitle.trim() : '';
            const section1Heading = typeof data.section1Heading === 'string' ? data.section1Heading.trim() : '';
            const section2Heading = typeof data.section2Heading === 'string' ? data.section2Heading.trim() : '';
            const footerText = typeof data.footerText === 'string' ? data.footerText.trim() : '';

            const cfg: ReceiptHeaderConfig = {
              topBanner: topBanner || DEFAULT_RECEIPT_HEADER_CONFIG.topBanner,
              mainTitle: mainTitle || DEFAULT_RECEIPT_HEADER_CONFIG.mainTitle,
              subTitle: subTitle || DEFAULT_RECEIPT_HEADER_CONFIG.subTitle,
              section1Heading: section1Heading || DEFAULT_RECEIPT_HEADER_CONFIG.section1Heading,
              section2Heading: section2Heading || DEFAULT_RECEIPT_HEADER_CONFIG.section2Heading,
              footerText: footerText || DEFAULT_RECEIPT_HEADER_CONFIG.footerText,
            };
            localStorage.setItem(LOCAL_RECEIPT_HEADER_KEY, JSON.stringify(cfg));
            callback(cfg);
          }
        }
      },
      (err) => {
        console.warn('Firestore receipt header snapshot fallback:', err);
      }
    );
  } catch (err) {
    console.warn('Error subscribing to firestore receipt header:', err);
  }

  return () => {
    window.removeEventListener('receipt_header_updated', handleLocalUpdate);
    window.removeEventListener('storage', handleLocalUpdate);
    if (unsubFs) unsubFs();
  };
}

export const DEFAULT_TEMPLES: Temple[] = [
  {
    id: 'lingaraj',
    name: 'ଶ୍ରୀ ଲିଙ୍ଗରାଜ ମନ୍ଦିର (Shree Lingaraj Temple)',
    location: 'ଏକାମ୍ର କ୍ଷେତ୍ର, ଭୁବନେଶ୍ୱର (Bhubaneswar, Odisha)',
    pujariPhone: '9861054321',
    imageUrl: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?q=80&w=1000&auto=format&fit=crop',
    qrCodeUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=400&auto=format&fit=crop',
    description: 'ପବିତ୍ର ଜଳାଭିଷେକ ଓ ସ୍ୱତନ୍ତ୍ର ପୂଜା ସେବା। Ekamra Kshetra Sacred Shiva Shrine.',
    history: 'ଶ୍ରୀ ଲିଙ୍ଗରାଜ ମନ୍ଦିର ଏକାମ୍ର କ୍ଷେତ୍ର ଭୁବନେଶ୍ୱରର ସବୁଠାରୁ ପ୍ରାଚୀନ ଏବଂ ପ୍ରସିଦ୍ଧ ଶିବ ମନ୍ଦିର। ଏହା ଏକାଦଶ ଶତାବ୍ଦୀରେ ସୋମବଂଶୀ ରାଜା ଲଲାଟେନ୍ଦୁ କେଶରୀଙ୍କ ଦ୍ୱାରା ନିର୍ମିତ ହୋଇଥିଲା। ଏହି ମନ୍ଦିରର ଉଚ୍ଚତା ୫୫ ମିଟର। ଏଠାରେ ହରିହର (ଶିବ ଓ ବିଷ୍ଣୁ)ଙ୍କୁ ଏକତ୍ର ପୂଜା କରାଯାଏ।',
    isJalAbhishekAvailable: true,
  },
  {
    id: 'jagannath',
    name: 'ଶ୍ରୀ ଜଗନ୍ନାଥ ମନ୍ଦିର (Shree Jagannath Temple)',
    location: 'ଶ୍ରୀକ୍ଷେତ୍ର ଧାମ, ପୁରୀ (Puri, Odisha)',
    pujariPhone: '9437012345',
    imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1000&auto=format&fit=crop',
    qrCodeUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=400&auto=format&fit=crop',
    description: 'ଶ୍ରୀ ଜଗନ୍ନାଥ ମନ୍ଦିର ସ୍ୱତନ୍ତ୍ର ନୀତିକାନ୍ତି ଓ ମହାପ୍ରସାଦ ପୂଜା ବୁକିଂ।',
    history: 'ଶ୍ରୀ ଜଗନ୍ନାଥ ମନ୍ଦିର ଚାରି ଧାମ ମଧ୍ୟରୁ ଅନ୍ୟତମ ପବିତ୍ର ପୁରୀ ଶ୍ରୀକ୍ଷେତ୍ରରେ ଅବସ୍ଥିତ। ଏହି ପ୍ରସିଦ୍ଧ ଦେବାଳୟ ଦ୍ୱାଦଶ ଶତାବ୍ଦୀରେ ଗଙ୍ଗବଂଶର ରାଜା ଅନନ୍ତବର୍ମନ ଚୋଡ଼ଗଙ୍ଗ ଦେବଙ୍କ ଦ୍ୱାରା ପ୍ରତିଷ୍ଠିତ ହୋଇଥିଲା। ଏଠାରେ ଚତୁର୍ଦ୍ଧା ମୂର୍ତ୍ତିଙ୍କ ବିଶ୍ୱପ୍ରସିଦ୍ଧ ରଥଯାତ୍ରା ଅନୁଷ୍ଠିତ ହୁଏ।',
    isJalAbhishekAvailable: false,
  },
  {
    id: 'samaleswari',
    name: 'ଶ୍ରୀ ମା\' ସମଲେଶ୍ୱରୀ ମନ୍ଦିର (Shree Samaleswari Temple)',
    location: 'ସମ୍ବଲପୁର, ଓଡ଼ିଶା (Sambalpur, Odisha)',
    pujariPhone: '9124098765',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1000&auto=format&fit=crop',
    qrCodeUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=400&auto=format&fit=crop',
    description: 'ମା\' ସମଲେଶ୍ୱରୀଙ୍କ ପୀଠରେ ଜଳାଭିଷେକ, ଭୋଗ ଓ ମାନସିକ ପୂଜା ସେବା।',
    history: 'ମା\' ସମଲେଶ୍ୱରୀ ମନ୍ଦିର ସମ୍ବଲପୁରର ଅଧିଷ୍ଠାତ୍ରୀ ଦେବୀଙ୍କ ପ୍ରସିଦ୍ଧ ପୀଠ। ଏହା ଷୋଡ଼ଶ ଶତାବ୍ଦୀରେ ଚୌହାନ ରାଜା ବଳରାମ ଦେବଙ୍କ ଦ୍ୱାରା ସ୍ଥାପିତ ହୋଇଥିଲା। ମା\' ସମଲେଶ୍ୱରୀ ପଶ୍ଚିମ ଓଡ଼ିଶାର ଜନସାଧାରଣଙ୍କ ମୁଖ୍ୟ ଆରାଧ୍ୟା ଦେବୀ।',
    isJalAbhishekAvailable: true,
  },
];

const LOCAL_TEMPLES_KEY = 'temple_system_temples_json';
const LOCAL_BOOKINGS_KEY = 'temple_system_bookings_json';
const LOCAL_PUJA_TYPES_KEY = 'temple_system_puja_types_json';

export const DEFAULT_PUJA_TYPES: string[] = [
  'Jal Abhishek (ଜଳାଭିଷେକ)',
  'Rudrabhishek (ରୁଦ୍ରାଭିଷେକ)',
  'Mangala Arati (ମଙ୍ଗଳ ଆରତୀ)',
  'Special Puja & Bhog (ସ୍ୱତନ୍ତ୍ର ପୂଜା ଓ ଭୋଗ)',
  'Mahaniti & Arpan (ମହାନୀତି ଓ ଅର୍ପଣ)',
];

// --- PUJA TYPE MANAGEMENT ---

export function getPujaTypesFromLocal(): string[] {
  try {
    const raw = localStorage.getItem('savedPujaTypes') || localStorage.getItem(LOCAL_PUJA_TYPES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading local puja types:', err);
  }
  return DEFAULT_PUJA_TYPES;
}

export async function savePujaTypes(pujaTypes: string[]): Promise<boolean> {
  try {
    const jsonStr = JSON.stringify(pujaTypes);
    localStorage.setItem('savedPujaTypes', jsonStr);
    localStorage.setItem(LOCAL_PUJA_TYPES_KEY, jsonStr);
    window.dispatchEvent(new Event('puja_types_updated'));

    try {
      const configRef = doc(db, 'config', 'puja_types_data');
      await setDoc(configRef, sanitizeFirestoreData({ pujaTypes, updatedAt: new Date().toISOString() }));
    } catch (fsErr) {
      console.warn('Firestore puja types save fallback to local:', fsErr);
    }
    return true;
  } catch (err) {
    console.error('Error saving puja types:', err);
    return false;
  }
}

export function subscribePujaTypes(callback: (types: string[]) => void): () => void {
  callback(getPujaTypesFromLocal());

  const handleLocalUpdate = () => {
    callback(getPujaTypesFromLocal());
  };
  window.addEventListener('puja_types_updated', handleLocalUpdate);
  window.addEventListener('storage', handleLocalUpdate);

  let unsubFs: (() => void) | null = null;
  try {
    const configRef = doc(db, 'config', 'puja_types_data');
    unsubFs = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.pujaTypes) && data.pujaTypes.length > 0) {
          localStorage.setItem(LOCAL_PUJA_TYPES_KEY, JSON.stringify(data.pujaTypes));
          callback(data.pujaTypes);
        }
      }
    });
  } catch (err) {
    console.warn('Firestore puja types subscription fallback:', err);
  }

  return () => {
    window.removeEventListener('puja_types_updated', handleLocalUpdate);
    window.removeEventListener('storage', handleLocalUpdate);
    if (unsubFs) unsubFs();
  };
}

// --- TEMPLE MANAGEMENT ---

export function getTemplesFromLocal(): Temple[] {
  try {
    const raw = localStorage.getItem(LOCAL_TEMPLES_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading local temples:', err);
  }

  // Only load default temples the very first time the app is opened (when localStorage is completely null)
  try {
    localStorage.setItem(LOCAL_TEMPLES_KEY, JSON.stringify(DEFAULT_TEMPLES));
  } catch (err) {
    console.warn('Error setting default temples:', err);
  }
  return DEFAULT_TEMPLES;
}

export async function saveTemples(temples: Temple[]): Promise<boolean> {
  try {
    localStorage.setItem(LOCAL_TEMPLES_KEY, JSON.stringify(temples));
    window.dispatchEvent(new Event('temple_data_updated'));

    // Mirror to Firestore if available
    try {
      const configRef = doc(db, 'config', 'temple_data');
      await setDoc(configRef, sanitizeFirestoreData({ temples, updatedAt: new Date().toISOString() }));
    } catch (fsErr) {
      console.warn('Firestore temple config save fallback to local:', fsErr);
    }
    return true;
  } catch (err) {
    console.error('Error saving temples:', err);
    return false;
  }
}

export function subscribeTemples(callback: (temples: Temple[]) => void): () => void {
  // Initial local delivery
  callback(getTemplesFromLocal());

  const handleLocalUpdate = () => {
    callback(getTemplesFromLocal());
  };
  window.addEventListener('temple_data_updated', handleLocalUpdate);
  window.addEventListener('storage', handleLocalUpdate);

  // Firestore Subscription
  let unsubFs: (() => void) | null = null;
  try {
    const configRef = doc(db, 'config', 'temple_data');
    unsubFs = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.temples)) {
          localStorage.setItem(LOCAL_TEMPLES_KEY, JSON.stringify(data.temples));
          callback(data.temples);
        }
      }
    });
  } catch (err) {
    console.warn('Firestore temple subscription fallback:', err);
  }

  return () => {
    window.removeEventListener('temple_data_updated', handleLocalUpdate);
    window.removeEventListener('storage', handleLocalUpdate);
    if (unsubFs) unsubFs();
  };
}

// --- BOOKINGS MANAGEMENT ---

export function getBookingsFromLocal(): TempleBooking[] {
  try {
    const raw = localStorage.getItem(LOCAL_BOOKINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading local bookings:', err);
  }
  return [];
}

export async function submitTempleBooking(
  bookingData: Omit<TempleBooking, 'id' | 'createdAt' | 'status' | 'platformFeeAmount'>
): Promise<{ success: boolean; bookingId: string }> {
  try {
    // Generate random alphanumeric unique ID e.g., BKG-98472 or BKG-7X9K2
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const bookingId = `BKG-${randomNum}`;
    const newBooking: TempleBooking = {
      ...bookingData,
      id: bookingId,
      platformFeeAmount: 5,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const existing = getBookingsFromLocal();
    const updated = [newBooking, ...existing];
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('temple_bookings_updated'));

    // Sync to Firestore
    try {
      const bookingRef = doc(db, 'temple_bookings', bookingId);
      await setDoc(bookingRef, sanitizeFirestoreData(newBooking));
    } catch (fsErr) {
      console.warn('Firestore booking save fallback to local:', fsErr);
    }

    return { success: true, bookingId };
  } catch (err) {
    console.error('Submit booking error:', err);
    return { success: false, bookingId: '' };
  }
}

// User-side: Request date change / reschedule
export async function requestBookingReschedule(bookingId: string, newRequestedDate: string): Promise<boolean> {
  try {
    const existing = getBookingsFromLocal();
    const updated = existing.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          isRescheduleRequested: true,
          requestedRescheduleDate: newRequestedDate,
          updatedAt: new Date().toISOString(),
        };
      }
      return b;
    });

    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('temple_bookings_updated'));

    try {
      const bookingRef = doc(db, 'temple_bookings', bookingId);
      await updateDoc(bookingRef, sanitizeFirestoreData({
        isRescheduleRequested: true,
        requestedRescheduleDate: newRequestedDate,
        updatedAt: new Date().toISOString(),
      }));
    } catch (fsErr) {
      console.warn('Firestore request reschedule fallback:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Request reschedule error:', err);
    return false;
  }
}

// User-side: Cancel booking
export async function cancelUserBooking(bookingId: string, userReason = 'User requested cancellation'): Promise<boolean> {
  try {
    const existing = getBookingsFromLocal();
    let cancelledBooking: TempleBooking | null = null;

    const updated = existing.map((b) => {
      if (b.id === bookingId) {
        cancelledBooking = {
          ...b,
          status: 'cancelled' as const,
          userCancelReason: userReason,
          adminReason: `Cancelled by User: ${userReason}`,
          updatedAt: new Date().toISOString(),
        };
        return cancelledBooking;
      }
      return b;
    });

    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('temple_bookings_updated'));

    try {
      const bookingRef = doc(db, 'temple_bookings', bookingId);
      await updateDoc(bookingRef, sanitizeFirestoreData({
        status: 'cancelled',
        userCancelReason: userReason,
        adminReason: `Cancelled by User: ${userReason}`,
        updatedAt: new Date().toISOString(),
      }));
    } catch (fsErr) {
      console.warn('Firestore user cancel fallback:', fsErr);
    }

    if (cancelledBooking) {
      triggerStatusChangeNotification(cancelledBooking, 'cancelled', `User cancelled: ${userReason}`);
    }

    return true;
  } catch (err) {
    console.error('User cancel error:', err);
    return false;
  }
}

// Admin-side: Advanced Status Update with Mandatory Reason
export async function updateBookingStatusByAdmin(
  bookingId: string,
  newStatus: TempleBooking['status'],
  adminReason: string,
  newPujaDateTime?: string
): Promise<boolean> {
  try {
    const existing = getBookingsFromLocal();
    let updatedTarget: TempleBooking | null = null;

    const updated = existing.map((b) => {
      if (b.id === bookingId) {
        updatedTarget = {
          ...b,
          status: newStatus,
          adminReason,
          rejectionReason: newStatus === 'rejected' ? adminReason : b.rejectionReason,
          pujaDateTime: newPujaDateTime ? newPujaDateTime : b.pujaDateTime,
          isRescheduleRequested: false, // cleared on admin action
          approvedAt: newStatus === 'approved' ? (b.approvedAt || new Date().toISOString()) : b.approvedAt,
          updatedAt: new Date().toISOString(),
        };
        return updatedTarget;
      }
      return b;
    });

    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('temple_bookings_updated'));

    try {
      const bookingRef = doc(db, 'temple_bookings', bookingId);
      const fsData: any = {
        status: newStatus,
        adminReason,
        isRescheduleRequested: false,
        updatedAt: new Date().toISOString(),
      };
      if (newStatus === 'rejected') fsData.rejectionReason = adminReason;
      if (newPujaDateTime) fsData.pujaDateTime = newPujaDateTime;
      if (newStatus === 'approved') fsData.approvedAt = new Date().toISOString();

      await updateDoc(bookingRef, sanitizeFirestoreData(fsData));
    } catch (fsErr) {
      console.warn('Firestore update booking status fallback:', fsErr);
    }

    if (updatedTarget) {
      triggerStatusChangeNotification(updatedTarget, newStatus, adminReason);
    }

    return true;
  } catch (err) {
    console.error('Update booking status error:', err);
    return false;
  }
}

export async function approveTempleBooking(bookingId: string, pujaDateTime: string, adminReason = 'Booking verified and approved'): Promise<boolean> {
  return updateBookingStatusByAdmin(bookingId, 'approved', adminReason, pujaDateTime);
}

export async function rejectTempleBooking(bookingId: string, reason: string): Promise<boolean> {
  return updateBookingStatusByAdmin(bookingId, 'rejected', reason);
}

export function subscribeBookings(callback: (bookings: TempleBooking[]) => void): () => void {
  callback(getBookingsFromLocal());

  const handleLocalUpdate = () => {
    callback(getBookingsFromLocal());
  };
  window.addEventListener('temple_bookings_updated', handleLocalUpdate);
  window.addEventListener('storage', handleLocalUpdate);

  // Firestore Realtime Subscription
  let unsubFs: (() => void) | null = null;
  try {
    const bookingsCol = collection(db, 'temple_bookings');
    unsubFs = onSnapshot(bookingsCol, (snapshot) => {
      const fsBookings: TempleBooking[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          fsBookings.push(docSnap.data() as TempleBooking);
        }
      });
      if (fsBookings.length > 0) {
        // Sort descending by creation
        fsBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(fsBookings));
        callback(fsBookings);
      }
    });
  } catch (err) {
    console.warn('Firestore bookings subscription fallback:', err);
  }

  return () => {
    window.removeEventListener('temple_bookings_updated', handleLocalUpdate);
    window.removeEventListener('storage', handleLocalUpdate);
    if (unsubFs) unsubFs();
  };
}

// Browser Push Notification Helper
export function triggerStatusChangeNotification(booking: TempleBooking, status: TempleBooking['status'], adminReason: string): void {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      let title = '🚩 ମନ୍ଦିର ବୁକିଂ ଅପଡେଟ୍ (Temple Booking Update)';
      if (status === 'approved') title = '🚩 ମନ୍ଦିର ବୁକିଂ ସ୍ୱୀକୃତ! (Booking Approved)';
      else if (status === 'waiting_list') title = '⏳ ବୁକିଂ ୱେଟିଂ ଲିଷ୍ଟ୍‌ରେ ରଖାଗଲା (Placed on Waiting List)';
      else if (status === 'rescheduled') title = '📅 ପୂଜା ସମୟ ପରିବର୍ତ୍ତନ ହେଲା (Booking Rescheduled)';
      else if (status === 'cancelled') title = '🚫 ବୁକିଂ ବାତିଲ୍ ହେଲା (Booking Cancelled)';
      else if (status === 'rejected') title = '✕ ବୁକିଂ ନାକଚ ହେଲା (Booking Rejected)';

      const timeInfo = booking.pujaDateTime ? `\nପୂଜା ସମୟ: ${booking.pujaDateTime}` : '';
      const body = `ଜୟ ଜଗନ୍ନାଥ! ${booking.userName} - ଆପଣଙ୍କର ${booking.templeName} ବୁକିଂ ID: ${booking.id} ର ସ୍ଥିତି: ${status.toUpperCase()}।\nକାରଣ (Reason): ${adminReason}${timeInfo}`;

      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
          }
        });
      }
    }
  } catch (err) {
    console.warn('Browser notification trigger failed:', err);
  }
}

export function triggerBookingApprovedNotification(booking: TempleBooking): void {
  triggerStatusChangeNotification(booking, 'approved', booking.adminReason || 'Booking approved');
}
