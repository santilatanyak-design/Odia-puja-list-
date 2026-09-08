import { Temple, TempleBooking, ReceiptHeaderConfig } from '../types';

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

  return () => {
    window.removeEventListener('receipt_header_updated', handleLocalUpdate);
    window.removeEventListener('storage', handleLocalUpdate);
  };
}

export const DEFAULT_TEMPLES: Temple[] = [];

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

  return () => {
    window.removeEventListener('puja_types_updated', handleLocalUpdate);
    window.removeEventListener('storage', handleLocalUpdate);
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

  return () => {
    window.removeEventListener('temple_data_updated', handleLocalUpdate);
    window.removeEventListener('storage', handleLocalUpdate);
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

  return () => {
    window.removeEventListener('temple_bookings_updated', handleLocalUpdate);
    window.removeEventListener('storage', handleLocalUpdate);
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
