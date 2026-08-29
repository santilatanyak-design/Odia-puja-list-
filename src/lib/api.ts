import { Pujari, PujaList, PaymentRequest, QrConfig, PujaTemplate, PasswordResetRequest, HomeSliderConfig, SliderImage, PuriStoreConfig, PuriStoreProduct } from '../types';
import {
  seedInitialFirestoreData,
  fsLoginPujari,
  fsFindPujariByPhone,
  fsResetPujariPin,
  fsGetPujaris,
  fsSubscribePujaris,
  fsCreatePujariByAdmin,
  fsUpdatePujariStatus,
  fsBlockPujari,
  fsDismissNotification,
  fsAcceptTerms,
  fsRecordDownload,
  fsGetLists,
  fsSubscribeLists,
  fsCreatePujaList,
  fsUpdatePujaList,
  fsSubmitPaymentUtr,
  fsRequestRedownloadUnlock,
  fsSetListOfficePendingStatus,
  fsSetSiteLock,
  fsSubscribeSiteLock,
  fsGetPayments,
  fsSubscribePayments,
  fsApprovePayment,
  fsRejectPayment,
  fsUnlockPayment,
  fsGetQrConfig,
  fsSubscribeQrConfig,
  fsUpdateQrConfig,
  fsGetHomeSliderConfig,
  fsSubscribeHomeSliderConfig,
  fsUpdateHomeSliderConfig,
  DEFAULT_HOME_SLIDER_CONFIG,
  fsGetPuriStoreConfig,
  fsSubscribePuriStoreConfig,
  fsUpdatePuriStoreConfig,
  DEFAULT_PURI_STORE_CONFIG,
  fsGetTemplates,
  fsCreateTemplate,
  fsDeleteTemplate,
  fsSubmitVisitingCardPayment,
  fsApproveVisitingCard,
  fsRejectVisitingCard,
  fsUpdatePujariCardProfile,
  fsRequestPasswordReset,
  fsSubscribePasswordResetRequests,
  fsGetPasswordResetRequests,
  fsApprovePasswordResetRequest,
  fsRejectPasswordResetRequest,
  requestAdminNotificationPermission,
  getAdminNotificationStatus,
  triggerAdminNewPujariPush,
  fsLogPwaInstall,
  fsGetPwaInstalls,
  fsSubscribePwaInstalls,
} from './firebase';

// Automatically seed initial defaults into Firestore in background when idle/online
if (typeof window !== 'undefined') {
  setTimeout(() => {
    seedInitialFirestoreData().catch(() => {});
  }, 1000);
}

const API_BASE = '/api';

async function fetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    console.warn(`Non-JSON response from ${url} (${res.status}):`, text.slice(0, 150));
    throw new Error(`Server returned non-JSON response (${res.status})`);
  }
  return await res.json();
}

export async function verifyAdminMasterId(masterId: string): Promise<boolean> {
  try {
    const data = await fetchJson<{ success: boolean }>(`${API_BASE}/admin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masterId: masterId.trim() }),
    });
    return data.success === true;
  } catch (err) {
    console.error('Error verifying admin master ID:', err);
    return masterId.trim() === 'nayakjitu@986933';
  }
}

// ----------------------------------------------------------------------
// PUJARI AUTH & PROFILES (FIRESTORE)
// ----------------------------------------------------------------------

export async function loginPujari(payload: {
  pujariId?: string;
  pujariIdOrPhone?: string;
  pin?: string;
  voterIdPin?: string;
  name?: string;
  phone?: string;
  address?: string;
  isRegistering?: boolean;
  skipPinCheck?: boolean;
}): Promise<{ success: boolean; message?: string; pujari?: Pujari }> {
  return fsLoginPujari(payload);
}

export async function findPujariByPhone(phone: string) {
  return fsFindPujariByPhone(phone);
}

export async function resetPujariPin(pujariId: string, newPin: string) {
  return fsResetPujariPin(pujariId, newPin);
}

export async function getPujaris(): Promise<Pujari[]> {
  return fsGetPujaris();
}

export { fsSubscribePujaris as subscribePujaris };

export async function createPujariByAdmin(payload: {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}): Promise<{ success: boolean; message?: string; pujari?: Pujari }> {
  return fsCreatePujariByAdmin(payload);
}

export async function updatePujariStatus(id: string, status: 'active' | 'suspended'): Promise<boolean> {
  return fsUpdatePujariStatus(id, status);
}

export async function blockPujari(id: string, isBlocked: boolean, reason?: string): Promise<boolean> {
  return fsBlockPujari(id, isBlocked, reason);
}

export async function dismissNotification(pujariId: string): Promise<boolean> {
  return fsDismissNotification(pujariId);
}

export async function acceptTerms(id: string): Promise<boolean> {
  return fsAcceptTerms(id);
}

export async function recordDownload(listId: string): Promise<void> {
  return fsRecordDownload(listId);
}

// ----------------------------------------------------------------------
// PUJA LISTS (FIRESTORE REAL-TIME)
// ----------------------------------------------------------------------

export async function getPujaLists(pujariId?: string): Promise<PujaList[]> {
  return fsGetLists(pujariId);
}

export { fsSubscribeLists as subscribePujaLists };

export async function searchPujaLists(query: string, pujariId?: string): Promise<PujaList[]> {
  const allLists = await fsGetLists(pujariId);
  if (!query) return allLists;
  const q = query.toLowerCase().trim();
  return allLists.filter(
    (l) =>
      l.pujaName.toLowerCase().includes(q) ||
      l.yajamanaName.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q) ||
      l.contact.includes(q) ||
      l.date.includes(q)
  );
}

export async function createPujaList(payload: {
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
  return fsCreatePujaList(payload);
}

export async function updatePujaList(payload: {
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
  return fsUpdatePujaList(payload);
}

export async function requestRedownloadUnlock(
  listId: string,
  pujariId: string,
  utrRef: string
): Promise<{ success: boolean; message?: string; list?: PujaList }> {
  return fsRequestRedownloadUnlock(listId, pujariId, utrRef);
}

export async function submitPaymentUtr(
  listId: string,
  utrRef: string,
  pujariId: string
): Promise<{ success: boolean; message?: string; list?: PujaList }> {
  return fsSubmitPaymentUtr(listId, utrRef, pujariId);
}

export async function setListOfficePendingStatus(listId: string): Promise<boolean> {
  return fsSetListOfficePendingStatus(listId);
}

// ----------------------------------------------------------------------
// PAYMENTS (FIRESTORE REAL-TIME)
// ----------------------------------------------------------------------

export async function getPayments(): Promise<PaymentRequest[]> {
  return fsGetPayments();
}

export { fsSubscribePayments as subscribePayments };

export async function approvePayment(paymentId: string): Promise<boolean> {
  return fsApprovePayment(paymentId);
}

export async function rejectPayment(paymentId: string, reason?: string): Promise<boolean> {
  return fsRejectPayment(paymentId, reason);
}

export async function unlockPayment(paymentId: string): Promise<boolean> {
  return fsUnlockPayment(paymentId);
}

// ----------------------------------------------------------------------
// QR CONFIG (FIRESTORE REAL-TIME)
// ----------------------------------------------------------------------

export async function getQrConfig(): Promise<QrConfig> {
  return fsGetQrConfig();
}

export { fsSubscribeQrConfig as subscribeQrConfig };

export async function updateQrConfig(config: Partial<QrConfig>): Promise<QrConfig> {
  return fsUpdateQrConfig(config);
}

// ----------------------------------------------------------------------
// HOME SLIDER BANNER CONFIG (FIRESTORE REAL-TIME)
// ----------------------------------------------------------------------

export async function getHomeSliderConfig(): Promise<HomeSliderConfig> {
  return fsGetHomeSliderConfig();
}

export { fsSubscribeHomeSliderConfig as subscribeHomeSliderConfig, DEFAULT_HOME_SLIDER_CONFIG };

export async function updateHomeSliderConfig(config: Partial<HomeSliderConfig>): Promise<HomeSliderConfig> {
  return fsUpdateHomeSliderConfig(config);
}

// ----------------------------------------------------------------------
// PURI STORE CONFIG (FIRESTORE REAL-TIME WHITE-LABEL)
// ----------------------------------------------------------------------

export async function getPuriStoreConfig(): Promise<PuriStoreConfig> {
  return fsGetPuriStoreConfig();
}

export { fsSubscribePuriStoreConfig as subscribePuriStoreConfig, DEFAULT_PURI_STORE_CONFIG };

export async function updatePuriStoreConfig(config: Partial<PuriStoreConfig>): Promise<PuriStoreConfig> {
  return fsUpdatePuriStoreConfig(config);
}

// ----------------------------------------------------------------------
// TEMPLATES (FIRESTORE)
// ----------------------------------------------------------------------

export async function getTemplates(): Promise<PujaTemplate[]> {
  return fsGetTemplates();
}

export async function createTemplate(template: Omit<PujaTemplate, 'id'>): Promise<PujaTemplate | null> {
  return fsCreateTemplate(template);
}

export async function deleteTemplate(id: string): Promise<boolean> {
  return fsDeleteTemplate(id);
}

// ----------------------------------------------------------------------
// FCM PUSH NOTIFICATIONS
// ----------------------------------------------------------------------
export {
  requestAdminNotificationPermission,
  getAdminNotificationStatus,
  triggerAdminNewPujariPush,
};

// ----------------------------------------------------------------------
// SITE MAINTENANCE LOCK
// ----------------------------------------------------------------------
export async function setSiteLock(isLocked: boolean): Promise<boolean> {
  localStorage.setItem('puja_app_site_locked', isLocked ? 'true' : 'false');
  return fsSetSiteLock(isLocked);
}

export function subscribeSiteLock(callback: (isLocked: boolean) => void): () => void {
  return fsSubscribeSiteLock((isLocked) => {
    localStorage.setItem('puja_app_site_locked', isLocked ? 'true' : 'false');
    callback(isLocked);
  });
}

// ----------------------------------------------------------------------
// VISITING CARD (FIRESTORE)
// ----------------------------------------------------------------------
export async function submitVisitingCardPayment(pujariId: string, utrRef: string) {
  return fsSubmitVisitingCardPayment(pujariId, utrRef);
}

export async function approveVisitingCard(pujariId: string, paymentId?: string) {
  return fsApproveVisitingCard(pujariId, paymentId);
}

export async function rejectVisitingCard(pujariId: string, paymentId?: string, reason?: string) {
  return fsRejectVisitingCard(pujariId, paymentId, reason);
}

export async function updatePujariCardProfile(pujariId: string, data: Partial<Pujari>) {
  return fsUpdatePujariCardProfile(pujariId, data);
}

// ----------------------------------------------------------------------
// PASSWORD RESET REQUESTS & APPROVALS (FIRESTORE)
// ----------------------------------------------------------------------
export async function requestPasswordReset(payload: { pujariId: string; submittedPin: string; newPin?: string }) {
  return fsRequestPasswordReset(payload);
}

export { fsSubscribePasswordResetRequests as subscribePasswordResetRequests };

export async function getPasswordResetRequests(): Promise<PasswordResetRequest[]> {
  return fsGetPasswordResetRequests();
}

export async function approvePasswordResetRequest(requestId: string): Promise<boolean> {
  return fsApprovePasswordResetRequest(requestId);
}

export async function rejectPasswordResetRequest(requestId: string, reason?: string) {
  return fsRejectPasswordResetRequest(requestId, reason);
}

// ----------------------------------------------------------------------
// PWA INSTALL ANALYTICS & ADMIN REPORTING
// ----------------------------------------------------------------------
export async function logPwaInstall(extra?: { platform?: string; userAgent?: string; referrer?: string }) {
  return fsLogPwaInstall(extra);
}

export async function getPwaInstalls() {
  return fsGetPwaInstalls();
}

export { fsSubscribePwaInstalls as subscribePwaInstalls };

