import { showCustomAlert } from '../lib/customAlert';
import React, { useState, useEffect } from 'react';
import { Pujari, PaymentRequest, QrConfig, PujaTemplate, PujaList, PasswordResetRequest } from '../types';
import {
  getPujaris,
  createPujariByAdmin,
  updatePujariStatus,
  blockPujari,
  getPayments,
  approvePayment,
  rejectPayment,
  unlockPayment,
  getQrConfig,
  updateQrConfig,
  getTemplates,
  createTemplate,
  deleteTemplate,
  subscribePayments,
  subscribePujaris,
  subscribeQrConfig,
  subscribePujaLists,
  getPujaLists,
  requestAdminNotificationPermission,
  getAdminNotificationStatus,
  subscribeSiteLock,
  setSiteLock,
  approveVisitingCard,
  rejectVisitingCard,
  subscribePasswordResetRequests,
  getPasswordResetRequests,
  approvePasswordResetRequest,
  rejectPasswordResetRequest,
} from '../lib/api';
import { UpiQrDisplay } from './UpiQrDisplay';
import { PujaListPDFView } from './PujaListPDFView';
import { AdminStoreManagement } from './AdminStoreManagement';
import { AdminTempleManagement } from './AdminTempleManagement';
import { AdminShortsManagement } from './AdminShortsManagement';
import { AdminContent } from './AdminContent';
import { AdminDistrictManagement } from './AdminDistrictManagement';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  QrCode,
  UserCheck,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Upload,
  Lock,
  Unlock,
  BookOpen,
  Check,
  Save,
  AlertCircle,
  Download,
  Ban,
  Clock,
  FileText,
  Eye,
  ShieldAlert,
  Bell,
  BellRing,
  BellOff,
  KeyRound,
} from 'lucide-react';

interface AdminPanelProps {
  onLogoutAdmin: () => void;
}

export function getDisplayUtr(pmt?: PaymentRequest | null, list?: PujaList | null): string | null {
  const candidates = [
    (pmt as any)?.utrNumber,
    pmt?.utrRef,
    (pmt as any)?.utr,
    (pmt as any)?.transactionId,
    (list as any)?.utrNumber,
    list?.utrRef,
    (list as any)?.utr,
    (list as any)?.transactionId,
  ];

  for (const raw of candidates) {
    if (!raw || typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (
      lower.includes('pending') ||
      lower === 'n/a' ||
      lower === 'undefined' ||
      lower === 'null' ||
      lower.includes('search re-download')
    ) {
      continue;
    }
    return trimmed;
  }
  return null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogoutAdmin }) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'lists' | 'pujaris' | 'resets' | 'qr' | 'templates' | 'store' | 'temple' | 'shorts' | 'content' | 'district'>('payments');

  // Data States
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [pujaris, setPujaris] = useState<Pujari[]>([]);
  const [allLists, setAllLists] = useState<PujaList[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>([]);
  const [qrConfig, setQrConfigState] = useState<QrConfig>({
    newCreationQrUrl: '',
    newCreationUpiId: 'pujasamagri@upi',
    newCreationAmount: 5,
    reDownloadQrUrl: '',
    reDownloadUpiId: 'pujasamagri@upi',
    reDownloadAmount: 2,
  });
  const [templates, setTemplates] = useState<PujaTemplate[]>([]);

  // Search & Filters
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [resetFilter, setResetFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [pujariSearch, setPujariSearch] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [resetSearch, setResetSearch] = useState('');

  // Mobile Search & Quick Action State
  const [lookupMobile, setLookupMobile] = useState('');
  const [lookupResult, setLookupResult] = useState<Pujari | null | 'not_found'>(null);

  const handleMobileSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = lookupMobile.trim().replace(/\D/g, '');
    if (!cleanPhone) {
      showCustomAlert('ଦୟାକରି ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ (Please enter mobile number)');
      return;
    }
    const match = pujaris.find(
      (p) => p.phone && p.phone.replace(/\D/g, '').includes(cleanPhone)
    );
    if (match) {
      setLookupResult(match);
    } else {
      setLookupResult('not_found');
    }
  };

  // Selected List for Admin PDF Override Download Modal
  const [adminPdfList, setAdminPdfList] = useState<PujaList | null>(null);

  // New Pujari Form State
  const [newPujariId, setNewPujariId] = useState('');
  const [newPujariName, setNewPujariName] = useState('');
  const [newPujariPhone, setNewPujariPhone] = useState('');
  const [newPujariAddress, setNewPujariAddress] = useState('');

  // Rejection Reason Modal
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // QR Settings Form State
  const [newQr5Upi, setNewQr5Upi] = useState('');
  const [newQr2Upi, setNewQr2Upi] = useState('');
  const [selectedFile5, setSelectedFile5] = useState<File | null>(null);
  const [selectedFile2, setSelectedFile2] = useState<File | null>(null);
  const [savingQr, setSavingQr] = useState(false);

  // New Template Form State
  const [newTmplName, setNewTmplName] = useState('');
  const [newTmplDesc, setNewTmplDesc] = useState('');
  const [newTmplItemsRaw, setNewTmplItemsRaw] = useState('ସିନ୍ଦୂର, 50, ଗ୍ରାମ୍\nହଳଦୀ ଗୁଣ୍ଡ, 50, ଗ୍ରାମ୍\nଶୁଦ୍ଧ ଗୋଘିଅ, 500, ଗ୍ରାମ୍');

  const [loading, setLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Global Site Lock State
  const [isSiteLocked, setIsSiteLockedState] = useState<boolean>(() => {
    return localStorage.getItem('puja_app_site_locked') === 'true';
  });
  const [togglingLock, setTogglingLock] = useState(false);

  // Web Push Notification States
  const [pushPermissionStatus, setPushPermissionStatus] = useState<NotificationPermission | 'unsupported' | 'loading'>('loading');
  const [fcmTokenSaved, setFcmTokenSaved] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);

  useEffect(() => {
    loadAllData();
    checkPushStatus();

    // Real-time Firestore Listeners
    const unsubPayments = subscribePayments((pmts) => {
      setPayments(pmts);
    });

    const unsubPujaris = subscribePujaris((pjs) => {
      setPujaris(pjs);
    });

    const unsubQr = subscribeQrConfig((qr) => {
      setQrConfigState(qr);
      setNewQr5Upi(qr.newCreationUpiId);
      setNewQr2Upi(qr.reDownloadUpiId);
    });

    const unsubLists = subscribePujaLists((lists) => {
      setAllLists(lists);
    });

    const unsubSiteLock = subscribeSiteLock((locked) => {
      setIsSiteLockedState(locked);
    });

    const unsubResets = subscribePasswordResetRequests((resets) => {
      setPasswordResetRequests(resets);
    });

    return () => {
      unsubPayments();
      unsubPujaris();
      unsubQr();
      unsubLists();
      unsubSiteLock();
      unsubResets();
    };
  }, []);

  const handleToggleSiteLock = async () => {
    try {
      setTogglingLock(true);
      const nextState = !isSiteLocked;
      const ok = await setSiteLock(nextState);
      if (ok) {
        setIsSiteLockedState(nextState);
        setActionSuccessMsg(
          nextState
            ? '🔐 ସମ୍ପୂର୍ଣ୍ଣ ସାଇଟ୍ ଲକ୍ କରାଗଲା (Emergency Lock Active)! ସାଧାରଣ ବ୍ୟବହାରକାରୀଙ୍କ ପାଇଁ ସାଇଟ୍ ବନ୍ଦ ରହିବ।'
            : '🔓 ସାଇଟ୍ ଅନଲକ୍ କରାଗଲା (Emergency Lock Removed)! ପୋର୍ଟାଲ୍ ବର୍ତ୍ତମାନ ସମସ୍ତଙ୍କ ପାଇଁ ଖୋଲା ଅଛି।'
        );
        setTimeout(() => setActionSuccessMsg(''), 6000);
      } else {
        showCustomAlert('ସାଇଟ୍ ଲକ୍ ପରିବର୍ତ୍ତନ କରିବାରେ ବିଫଳ ହେଲା।');
      }
    } catch (err) {
      console.error('Toggle Site Lock error:', err);
      showCustomAlert('ତ୍ରୁଟି: ସାଇଟ୍ ଲକ୍ ପରିବର୍ତ୍ତନ ହୋଇପାରିଲା ନାହିଁ।');
    } finally {
      setTogglingLock(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    const [pmts, pjs, qr, tmpls, lists, resets] = await Promise.all([
      getPayments(),
      getPujaris(),
      getQrConfig(),
      getTemplates(),
      getPujaLists(),
      getPasswordResetRequests(),
    ]);

    setPayments(pmts);
    setPujaris(pjs);
    setQrConfigState(qr);
    setNewQr5Upi(qr.newCreationUpiId);
    setNewQr2Upi(qr.reDownloadUpiId);
    setTemplates(tmpls);
    setAllLists(lists);
    setPasswordResetRequests(resets);
    setLoading(false);
  };

  const checkPushStatus = async () => {
    const status = await getAdminNotificationStatus();
    setPushPermissionStatus(status.permission);
    setFcmTokenSaved(status.isTokenSaved);
  };

  const handleEnablePushNotifications = async () => {
    try {
      setEnablingPush(true);
      const res = await requestAdminNotificationPermission();
      if (res.success) {
        setActionSuccessMsg('🔔 ପୁଶ୍ ନୋଟିଫିକେସନ୍ ସଫଳତାର ସହ ସକ୍ରିୟ ହେଲା! ଜଣେ ନୂଆ ପୂଜାରୀ ପଞ୍ଜୀକରଣ କଲେ ବ୍ୟାକଗ୍ରାଉଣ୍ଡରେ ସୂଚନା ମିଳିବ।');
        setTimeout(() => setActionSuccessMsg(''), 6000);
      } else {
        showCustomAlert(res.message || 'ନୋଟିଫିକେସନ୍ ଅନ୍ କରିବାରେ ବିଫଳ ହେଲା।');
      }
    } catch (err: any) {
      showCustomAlert('ତ୍ରୁଟି: ' + (err?.message || 'ନୋଟିଫିକେସନ୍ ଅନ୍ ହୋଇପାରିଲା ନାହିଁ।'));
    } finally {
      setEnablingPush(false);
      checkPushStatus();
    }
  };

  // 1. Payment Actions
  const handleApprove = async (id: string) => {
    const success = await approvePayment(id);
    if (success) {
      setActionSuccessMsg('✅ ପେମେଣ୍ଟ ଅନୁମୋଦିତ ହେଲା! ପୂଜାରୀଙ୍କ ୧-ପୃଷ୍ଠା PDF ଅନଲୋକ୍ ହୋଇଯାଇଛି।');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      loadAllData();
    } else {
      showCustomAlert('ପେମେଣ୍ଟ ଅନୁମୋଦନ କରିବାରେ ବିଫଳ ହେଲା।');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPaymentId) return;

    const success = await rejectPayment(rejectingPaymentId, rejectionReason);
    if (success) {
      setActionSuccessMsg('ପେମେଣ୍ଟ ଅନୁରୋଧ ଖାରଜ କରାଗଲା।');
      setTimeout(() => setActionSuccessMsg(''), 3000);
      setRejectingPaymentId(null);
      setRejectionReason('');
      loadAllData();
    }
  };

  const handleUnlockRequest = async (id: string) => {
    const success = await unlockPayment(id);
    if (success) {
      setActionSuccessMsg('🔓 ପେମେଣ୍ଟ ଅନୁରୋଧ ଅନଲକ୍ (Revert) କରାଗଲା! ଏହା ପୁନର୍ବାର "ଅପେକ୍ଷାରତ" (Pending) ତାଲିକାକୁ ଫେରିଆସିଲା।');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'pending', rejectionReason: undefined } : p))
      );
      setPaymentFilter('pending');
      loadAllData();
    } else {
      showCustomAlert('ଅନଲକ୍ କରିବାରେ ବିଫଳ ହେଲା।');
    }
  };

  // 2. Pujari Management Actions
  const handleRegisterPujari = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPujariId.trim() || !newPujariName.trim()) return;

    const res = await createPujariByAdmin({
      id: newPujariId.trim(),
      name: newPujariName.trim(),
      phone: newPujariPhone.trim(),
      address: newPujariAddress.trim(),
    });

    if (res.success) {
      setActionSuccessMsg(`✅ ନୂତନ ପୂଜାରୀ ID "${newPujariId.toUpperCase()}" ସଫଳତାର ସହ ପଞ୍ଜୀକୃତ ହେଲା!`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
      setNewPujariId('');
      setNewPujariName('');
      setNewPujariPhone('');
      setNewPujariAddress('');
      loadAllData();
    } else {
      showCustomAlert(res.message || 'ପୂଜାରୀ ପଞ୍ଜୀକରଣ କରିବାରେ ବିଫଳ ହେଲା।');
    }
  };

  const handleTogglePujariStatus = async (id: string, currentStatus: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const success = await updatePujariStatus(id, nextStatus);
    if (success) {
      setActionSuccessMsg(`ପୂଜାରୀ ସ୍ଥିତି ${nextStatus === 'active' ? 'ସକ୍ରିୟ (Active)' : 'ନିଷିଦ୍ଧ (Suspended)'} କରାଗଲା।`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
      loadAllData();
    }
  };

  const handleBlockPujari = async (pujariId: string, isCurrentlyBlocked: boolean) => {
    const shouldBlock = !isCurrentlyBlocked;
    let reason = '';
    if (shouldBlock) {
      const inputReason = prompt(`ପୂଜାରୀ ID "${pujariId}" ଙ୍କୁ ସସପେଣ୍ଡ/ବ୍ଲକ୍ କରିବାର କାରଣ ଦିଅନ୍ତୁ:`, 'ପେମେଣ୍ଟ ତଥ୍ୟ / UTR ନମ୍ବର ମେଳ ଖାଉନାହିଁ।');
      if (inputReason === null) return;
      reason = inputReason.trim() || 'ଆଡମିନ୍ଙ୍କ ଦ୍ୱାରା ଆକାଉଣ୍ଟ ସସପେଣ୍ଡ କରାଗଲା।';
    }

    const success = await blockPujari(pujariId, shouldBlock, reason);
    if (success) {
      setActionSuccessMsg(
        shouldBlock
          ? `🚫 ପୂଜାରୀ ${pujariId} ଙ୍କୁ ସଫଳତାର ସହ ବ୍ଲକ୍/ସସପେଣ୍ଡ କରାଗଲା। (Pujari Account Blocked)`
          : `🔓 ପୂଜାରୀ ${pujariId} ଙ୍କ ଆକାଉଣ୍ଟ ସଫଳତାର ସହ ଅନଲକ୍ କରାଗଲା! (Pujari Unblocked)`
      );
      setTimeout(() => setActionSuccessMsg(''), 4000);
      loadAllData();
    } else {
      showCustomAlert('ସସପେଣ୍ଡ/ବ୍ଲକ୍ ପ୍ରକ୍ରିୟାରେ ତ୍ରୁଟି ଘଟିଲା।');
    }
  };

  // 3. QR Code Upload & Config Actions
  const handleSaveSelectedQrFile = async (type: 'new' | 'redownload') => {
    const file = type === 'new' ? selectedFile5 : selectedFile2;
    if (!file) {
      showCustomAlert('ଦୟାକରି ପ୍ରଥମେ ଗୋଟିଏ QR କୋଡ୍ ଇମେଜ୍ ଫାଇଲ୍ ସିଲେକ୍ଟ କରନ୍ତୁ।');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (type === 'new') {
        const updated = await updateQrConfig({ newCreationQrUrl: dataUrl });
        setQrConfigState(updated);
        setSelectedFile5(null);
      } else {
        const updated = await updateQrConfig({ reDownloadQrUrl: dataUrl });
        setQrConfigState(updated);
        setSelectedFile2(null);
      }
      const successText = 'QR Code Successfully Saved! (QR କୋଡ୍ ସଫଳତାର ସହ ସେଭ୍ ହୋଇଛି!)';
      setActionSuccessMsg(`🎉 ${successText}`);
      showCustomAlert(successText);
      setTimeout(() => setActionSuccessMsg(''), 5000);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteQrImage = async (type: 'new' | 'redownload') => {
    if (type === 'new') {
      const updated = await updateQrConfig({ newCreationQrUrl: '' });
      setQrConfigState(updated);
      setSelectedFile5(null);
    } else {
      const updated = await updateQrConfig({ reDownloadQrUrl: '' });
      setQrConfigState(updated);
      setSelectedFile2(null);
    }
    setActionSuccessMsg('QR କୋଡ୍ ରିସେଟ୍ କରାଗଲା।');
    setTimeout(() => setActionSuccessMsg(''), 3000);
  };

  const handleSaveUpiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingQr(true);
      const updated = await updateQrConfig({
        newCreationUpiId: newQr5Upi.trim(),
        reDownloadUpiId: newQr2Upi.trim(),
      });
      setQrConfigState(updated);
      setActionSuccessMsg('🎉 ସଫଳତାର ସହ ସଂରକ୍ଷିତ ହେଲା! (UPI ID Settings Saved)');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err) {
      showCustomAlert('UPI ସେଟିଂସ ସଂରକ୍ଷଣ କରିବାରେ ବିଫଳ ହେଲା।');
    } finally {
      setSavingQr(false);
    }
  };

  // 4. Template Actions
  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTmplName.trim()) return;

    const parsedItems = newTmplItemsRaw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(',');
        return {
          name: parts[0]?.trim() || line,
          quantity: parts[1]?.trim() || '1',
          unit: parts[2]?.trim() || 'ପ୍ୟାକେଟ୍',
        };
      });

    const res = await createTemplate({
      name: newTmplName.trim(),
      description: newTmplDesc.trim(),
      items: parsedItems,
    });

    if (res) {
      setActionSuccessMsg('✅ ନୂତନ ପୂଜା ଟେମ୍ପଲେଟ୍ ସଫଳତାର ସହ ଯୋଡ଼ାଗଲା!');
      setTimeout(() => setActionSuccessMsg(''), 3000);
      setNewTmplName('');
      setNewTmplDesc('');
      setNewTmplItemsRaw('ସିନ୍ଦୂର, 50, ଗ୍ରାମ୍\nହଳଦୀ ଗୁଣ୍ଡ, 50, ଗ୍ରାମ୍\nଶୁଦ୍ଧ ଗୋଘିଅ, 500, ଗ୍ରାମ୍');
      loadAllData();
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('ଆପଣ ସତରେ ଏହି ଟେମ୍ପଲେଟ୍ ହଟାଇବାକୁ ଚାହାଁନ୍ତି କି?')) {
      await deleteTemplate(id);
      loadAllData();
    }
  };

  // 5. Password Reset Request Actions
  const handleApprovePasswordReset = async (requestId: string) => {
    try {
      const ok = await approvePasswordResetRequest(requestId);
      if (ok) {
        setActionSuccessMsg('✅ ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁରୋଧ ସଫଳତାର ସହ ଅନୁମୋଦିତ ହେଲା! ପୂଜାରୀଙ୍କ PIN ବଦଳାଗଲା।');
        setTimeout(() => setActionSuccessMsg(''), 5000);
        loadAllData();
      } else {
        showCustomAlert('ଅନୁମୋଦନ କରିବାରେ ବିଫଳ ହେଲା।');
      }
    } catch (err) {
      console.error('Approve Password Reset Error:', err);
      showCustomAlert('ତ୍ରୁଟି: ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁମୋଦିତ ହୋଇପାରିଲା ନାହିଁ।');
    }
  };

  const handleRejectPasswordReset = async (requestId: string) => {
    try {
      const inputReason = prompt('ନାକଚ କରିବାର କାରଣ ଲେଖନ୍ତୁ (Reason for Rejection):', 'Voter ID PIN ମେଳ ଖାଉନାହିଁ।');
      if (inputReason === null) return;

      const ok = await rejectPasswordResetRequest(requestId, inputReason.trim() || 'Voter ID PIN mismatch');
      if (ok) {
        setActionSuccessMsg('🚫 ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁରୋଧ ନାକଚ କରାଗଲା। (3 Strikes ରେ 24 ଘଣ୍ଟା ଲକ୍ ହେବ)');
        setTimeout(() => setActionSuccessMsg(''), 4000);
        loadAllData();
      } else {
        showCustomAlert('ନାକଚ କରିବାରେ ବିଫଳ ହେଲା।');
      }
    } catch (err) {
      console.error('Reject Password Reset Error:', err);
      showCustomAlert('ତ୍ରୁଟି: ନାକଚ ହୋଇପାରିଲା ନାହିଁ।');
    }
  };

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    if (paymentFilter === 'all') return true;
    return p.status === paymentFilter;
  });

  // Filtered Pujaris
  const filteredPujaris = pujaris.filter(
    (p) =>
      p.name.toLowerCase().includes(pujariSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(pujariSearch.toLowerCase()) ||
      p.phone.includes(pujariSearch)
  );

  const pendingPaymentsCount = payments.filter((p) => p.status === 'pending').length;

  // Filtered Password Reset Requests
  const filteredPasswordResetRequests = passwordResetRequests.filter((r) => {
    const matchesStatus = resetFilter === 'all' || r.status === resetFilter;
    const matchesSearch =
      !resetSearch ||
      r.pujariId.toLowerCase().includes(resetSearch.toLowerCase()) ||
      r.pujariName.toLowerCase().includes(resetSearch.toLowerCase()) ||
      r.pujariPhone.includes(resetSearch);
    return matchesStatus && matchesSearch;
  });

  const pendingResetRequestsCount = passwordResetRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 w-full max-w-full overflow-x-hidden box-border">
      {/* Top Header & Admin Master Badge */}
      <div className="bg-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4 border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold">ଅଫିସିଆଲ ଆଡମିନ୍ ଡ୍ୟାସବୋର୍ଡ</h2>
              <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-mono font-extrabold rounded-lg text-xs">
                MASTER ID: 543213
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              ପୂଜାରୀ ଆକାଉଣ୍ଟ ପରିଚାଳନା • ପେମେଣ୍ଟ ଯାଞ୍ଚ ଓ QR କୋଡ୍ ସେଟିଂସ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* FULL SITE LOCK TOGGLE BUTTON */}
          <button
            onClick={handleToggleSiteLock}
            disabled={togglingLock}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-md border ${
              isSiteLocked
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 animate-pulse'
                : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500/50'
            }`}
            title="ସମ୍ପୂର୍ଣ୍ଣ ସାଇଟ୍ ଲକ୍ / ଅନଲକ୍ କରନ୍ତୁ"
          >
            {isSiteLocked ? (
              <>
                <Unlock className="w-4 h-4 text-slate-950" />
                <span>🔓 ସାଇଟ୍ ଅନଲକ୍ କରନ୍ତୁ (LOCKED 🔐)</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-white" />
                <span>🔒 Full Site Lock 🔐</span>
              </>
            )}
          </button>

          <button
            onClick={loadAllData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
            title="ସମସ୍ତ ଡାଟା ରିଫ୍ରେଶ୍ କରନ୍ତୁ"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onLogoutAdmin}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold rounded-xl transition cursor-pointer border border-slate-700"
          >
            ଆଡମିନ୍‌ରୁ ବାହାରନ୍ତୁ
          </button>
        </div>
      </div>

      {/* Emergency Lock Active Banner */}
      {isSiteLocked && (
        <div className="p-4 bg-rose-950/90 border-2 border-rose-500 rounded-2xl text-rose-100 text-xs sm:text-sm font-extrabold flex flex-wrap items-center justify-between gap-3 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-800 rounded-xl text-rose-200 border border-rose-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-sm text-rose-300">
                🚨 ଇମରଜେନ୍ସି ସାଇଟ୍ ଲକ୍ ସକ୍ରିୟ ଅଛି (EMERGENCY FULL SITE LOCK ACTIVE)
              </p>
              <p className="text-xs font-medium text-rose-200">
                ସମସ୍ତ ସାଧାରଣ ବ୍ୟବହାରକାରୀଙ୍କ ପାଇଁ ସାଇଟ୍ ବନ୍ଦ ଅଛି। କେବଳ ଆଡମିନ୍ ପୋର୍ଟାଲ୍ ଖୋଲା ଅଛି।
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleSiteLock}
            disabled={togglingLock}
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-black shadow-md transition cursor-pointer"
          >
            🔓 ବର୍ତ୍ତମାନ ଅନଲକ୍ କରନ୍ତୁ
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-950 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* FCM Background Web Push Notification Status & Enable Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 text-white rounded-2xl p-4 sm:p-5 border border-amber-500/40 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl shrink-0">
            {pushPermissionStatus === 'granted' ? (
              <BellRing className="w-6 h-6 text-emerald-400 animate-pulse" />
            ) : pushPermissionStatus === 'denied' ? (
              <BellOff className="w-6 h-6 text-rose-400" />
            ) : (
              <Bell className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                ବ୍ୟାକଗ୍ରାଉଣ୍ଡ ନୋଟିଫିକେସନ୍ (FCM Background Web Push)
              </h3>
              {pushPermissionStatus === 'granted' ? (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-black uppercase">
                  ACTIVE / ସକ୍ରିୟ
                </span>
              ) : pushPermissionStatus === 'denied' ? (
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-[10px] font-black uppercase">
                  BLOCKED / ନିଷିଦ୍ଧ
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-black uppercase">
                  OFF / ବନ୍ଦ ଅଛି
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
              {pushPermissionStatus === 'granted'
                ? '✅ ଆପଣ ବ୍ୟାକଗ୍ରାଉଣ୍ଡ ନୋଟିଫିକେସନ୍ ଅନ୍ କରିଛନ୍ତି। ନୂଆ ପୂଜାରୀ ପଞ୍ଜୀକରଣ ହେଲେ ୱେବସାଇଟ୍ ବନ୍ଦ ଥିଲେ ବି ସୂଚନା ପାଇବେ।'
                : pushPermissionStatus === 'denied'
                ? '❌ ବ୍ରାଉଜର୍ ନୋଟିଫିକେସନ୍ ବ୍ଲକ୍ ଅଛି। ଦୟାକରି ବ୍ରାଉଜର୍ ସେଟିଂସରୁ ଅନୁମତି ଦିଅନ୍ତୁ।'
                : '🔔 ଜଣେ ନୂଆ ପୂଜାରୀ ପଞ୍ଜୀକରଣ କଲେ (ୱେବସାଇଟ୍ ବନ୍ଦ ଥିଲେ ବି) ତୁରନ୍ତ ମୋବାଇଲ୍/ଡେସ୍କଟପ୍‌ରେ ସୂଚନା ପାଇବା ପାଇଁ ନୋଟିଫିକେସନ୍ ଅନ୍ କରନ୍ତୁ।'}
            </p>
          </div>
        </div>

        {pushPermissionStatus !== 'granted' && pushPermissionStatus !== 'denied' && (
          <button
            onClick={handleEnablePushNotifications}
            disabled={enablingPush}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-md cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <BellRing className="w-4 h-4" />
            <span>{enablingPush ? 'ଅନ୍ ହେଉଛି...' : 'ଏବେ ପୁଶ୍ ନୋଟିଫିକେସନ୍ ଅନ୍ କରନ୍ତୁ'}</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs in Odia */}
      <div className="flex flex-wrap items-center bg-white p-2 rounded-2xl border border-amber-300 shadow-2xs gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'bg-amber-700 text-white font-extrabold shadow-xs'
              : 'text-slate-800 hover:bg-amber-50'
          }`}
        >
          <Lock className="w-4 h-4" />
          ପେମେଣ୍ଟ ଅନୁମୋଦନ (Payment Unlocks)
          {pendingPaymentsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-extrabold">
              {pendingPaymentsCount} PENDING
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('lists')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'lists'
              ? 'bg-amber-700 text-white font-extrabold shadow-xs'
              : 'text-slate-800 hover:bg-amber-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          ସୂଚୀ ଲଗ୍ ଓ PDF ଡାଉନଲୋଡ୍ ({allLists.length})
        </button>

        <button
          onClick={() => setActiveTab('pujaris')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'pujaris'
              ? 'bg-amber-700 text-white font-extrabold shadow-xs'
              : 'text-slate-800 hover:bg-amber-50'
          }`}
        >
          <UserCheck className="w-4 h-4" /> ପୂଜାରୀ ପରିଚାଳନା ({pujaris.length})
        </button>

        <button
          onClick={() => setActiveTab('resets')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'resets'
              ? 'bg-amber-700 text-white font-extrabold shadow-xs'
              : 'text-slate-800 hover:bg-amber-50'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          ପାସୱାର୍ଡ ରିସେଟ୍ (Password Resets)
          {pendingResetRequestsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-extrabold">
              {pendingResetRequestsCount} PENDING
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('qr')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'qr'
              ? 'bg-amber-700 text-white font-extrabold shadow-xs'
              : 'text-slate-800 hover:bg-amber-50'
          }`}
        >
          <QrCode className="w-4 h-4" /> QR କୋଡ୍ ଓ UPI ସେଟିଂସ
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'bg-amber-700 text-white font-extrabold shadow-xs'
              : 'text-slate-800 hover:bg-amber-50'
          }`}
        >
          <BookOpen className="w-4 h-4" /> ପୂଜା ଟେମ୍ପଲେଟ୍ ସମୂହ
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'store'
              ? 'bg-gradient-to-r from-amber-700 to-red-800 text-white font-extrabold shadow-xs border border-amber-400'
              : 'text-slate-800 hover:bg-amber-50'
          }`}
        >
          <span className="text-sm">🏪</span>
          <span>ଷ୍ଟୋର୍ ମ୍ୟାନେଜମେଣ୍ଟ (Store Admin)</span>
        </button>

        <button
          onClick={() => setActiveTab('temple')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'temple'
              ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-white font-extrabold shadow-xs border border-amber-400'
              : 'text-slate-800 hover:bg-amber-50'
          }`}
        >
          <span className="text-sm">🏛️</span>
          <span>ମନ୍ଦିର ବୁକିଂ ପରିଚାଳନା (Temple Admin)</span>
        </button>

        <button
          onClick={() => setActiveTab('shorts')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'shorts'
              ? 'bg-gradient-to-r from-rose-700 to-amber-900 text-white font-extrabold shadow-xs border border-amber-400'
              : 'text-slate-800 hover:bg-amber-50'
          }`}
        >
          <span className="text-sm">🎬</span>
          <span>ମନ୍ଦିର ଭିଡିଓ (Shorts Admin)</span>
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'content'
              ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-white font-extrabold shadow-xs border border-amber-400'
              : 'text-slate-800 hover:bg-amber-50'
          }`}
        >
          <span className="text-sm">📅</span>
          <span>ପଞ୍ଜିକା ଓ କଥା (Panchang & Stories)</span>
        </button>

        <button
          onClick={() => setActiveTab('district')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'district'
              ? 'bg-gradient-to-r from-[#701a1e] to-[#8B0000] text-amber-100 font-extrabold shadow-xs border border-amber-400'
              : 'text-slate-800 hover:bg-amber-50'
          }`}
        >
          <span className="text-sm">🗺️</span>
          <span>ଜିଲ୍ଲା ସୂଚନା (District Content)</span>
        </button>
      </div>

      {/* TAB: DISTRICT CONTENT MANAGER */}
      {activeTab === 'district' && <AdminDistrictManagement />}

      {/* TAB: DAILY PANCHANG & SPIRITUAL STORIES */}
      {activeTab === 'content' && <AdminContent />}

      {/* TAB: TEMPLE PUJA SHORTS MANAGEMENT */}
      {activeTab === 'shorts' && <AdminShortsManagement />}

      {/* TAB: TEMPLE PUJA MANAGEMENT */}
      {activeTab === 'temple' && <AdminTempleManagement />}

      {/* TAB: PUJA SAMAGRI STORE MANAGEMENT */}
      {activeTab === 'store' && <AdminStoreManagement />}

      {/* TAB 1: PAYMENT UNLOCK REQUESTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-300 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-700" />
              <span>ପେମେଣ୍ଟ ଯାଞ୍ଚ ଓ UTR ଅନୁମୋଦନ ଅନୁରୋଧ</span>
            </h3>

            <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-xl border border-amber-200 text-xs font-bold">
              {(['pending', 'all', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setPaymentFilter(st)}
                  className={`px-3 py-1 rounded-lg capitalize cursor-pointer transition ${
                    paymentFilter === st
                      ? 'bg-amber-700 text-white font-extrabold'
                      : 'text-amber-950 hover:bg-amber-100'
                  }`}
                >
                  {st === 'pending' ? 'ଅପେକ୍ଷାରତ (Pending)' : st === 'all' ? 'ସମସ୍ତ (All)' : st === 'approved' ? 'ଅନୁମୋଦିତ' : 'ଖାରଜ'}
                </button>
              ))}
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center bg-amber-50/40 rounded-2xl border border-dashed border-amber-300 text-xs text-slate-600 font-bold">
              କୌଣସି ପେମେଣ୍ଟ ଅନୁରୋଧ ମିଳିଲା ନାହିଁ।
            </div>
          ) : (
            <div className="overflow-x-auto border border-amber-300 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-100/80 text-amber-950 font-extrabold border-b border-amber-300">
                  <tr>
                    <th className="p-3">List ID / ପୂଜାରୀ ID</th>
                    <th className="p-3">ପେମେଣ୍ଟ ପ୍ରକାର</th>
                    <th className="p-3">ପରିମାଣ (Amount)</th>
                    <th className="p-3">UTR / Transaction Ref ID</th>
                    <th className="p-3">ତାରିଖ</th>
                    <th className="p-3">ସ୍ଥିତି (Status)</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {filteredPayments.map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-amber-50/50 font-bold">
                      <td className="p-3">
                        <div className="font-mono text-slate-900 font-extrabold">{pmt.listId}</div>
                        <div className="text-[11px] text-amber-900 font-bold">Pujari: {pmt.pujariId}</div>
                      </td>
                      <td className="p-3 text-slate-800 font-bold">
                        {pmt.type === 'new_creation'
                          ? 'ନୂତନ ସୂଚୀ ତିଆରି'
                          : pmt.type === 'edit_list'
                          ? 'ସୂଚୀ ସମ୍ପାଦନ/ଅପଡେଟ୍'
                          : pmt.type === 'visiting_card'
                          ? '🎴 Visiting Card Unlock'
                          : 'ସୂଚୀ ପୁନଃ-ଡାଉନଲୋଡ୍'}
                      </td>
                      <td className="p-3 text-amber-950 font-extrabold text-sm">₹{pmt.amount}</td>
                      <td className="p-3">
                        {(() => {
                          const targetList = allLists.find((l) => l.id === pmt.listId);
                          const utr = getDisplayUtr(pmt, targetList);
                          return utr ? (
                            <span className="font-mono font-black text-xs sm:text-sm bg-emerald-100 text-emerald-950 px-3 py-1.5 rounded-lg border-2 border-emerald-400 select-all shadow-2xs inline-flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span>{utr}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100/90 text-amber-950 border border-amber-300 inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Pending submission</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-3 text-slate-600 text-[11px]">
                        {new Date(pmt.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                            pmt.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : pmt.status === 'pending'
                              ? 'bg-amber-100 text-amber-950 border border-amber-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}
                        >
                          {pmt.status === 'approved' ? '✓ ଅନୁମୋଦିତ' : pmt.status === 'pending' ? '⏳ ଅପେକ୍ଷାରତ' : '✕ ଖାରଜ'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {pmt.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleApprove(pmt.id)}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-extrabold text-xs transition cursor-pointer shadow-2xs"
                            >
                              ✓ ଅନୁମୋଦନ
                            </button>
                            <button
                              onClick={() => setRejectingPaymentId(pmt.id)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-extrabold text-xs transition cursor-pointer shadow-2xs"
                            >
                              ✕ ଖାରଜ
                            </button>
                          </div>
                        ) : pmt.status === 'rejected' ? (
                          <button
                            onClick={() => handleUnlockRequest(pmt.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs mx-auto"
                            title="ଏହି ଖାରଜ ଅନୁରୋଧକୁ ଅନଲକ୍ (Revert) କରନ୍ତୁ"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>ଅନଲକ୍ (Unlock)</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-slate-400 font-semibold">ସମ୍ପୂର୍ଣ୍ଣ</span>
                            {allLists.find((l) => l.id === pmt.listId) && (
                              <button
                                onClick={() => {
                                  const target = allLists.find((l) => l.id === pmt.listId);
                                  if (target) setAdminPdfList(target);
                                }}
                                className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                              >
                                <Download className="w-3 h-3" /> PDF ଡାଉନଲୋଡ୍
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL PUJA LISTS & ANTI-FRAUD DOWNLOAD PROOF LOGS */}
      {activeTab === 'lists' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-300 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-700" />
                <span>ସମସ୍ତ ପୂଜା ସୂଚୀ, Anti-Fraud ଡାଉନଲୋଡ୍ ଲଗ୍ ଓ PDF ପ୍ରମାଣ</span>
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                ଏଠାରେ ସମସ୍ତ ପୂଜାରୀଙ୍କ ସୂଚୀ, ଡାଉନଲୋଡ୍ ସଂଖ୍ୟା (downloadCount) ଓ ଶେଷ ଡାଉନଲୋଡ୍ ସମୟ (lastDownloadedAt) ଦେଖନ୍ତୁ ଏବଂ WhatsApp ପାଇଁ PDF Download କରନ୍ତୁ।
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="ସୂଚୀ ID, ପୂଜାରୀ, ପୂଜା ନାମ କିମ୍ବା ଯଜମାନ..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-amber-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {allLists.filter((l) => {
            if (!listSearch.trim()) return true;
            const q = listSearch.toLowerCase().trim();
            return (
              l.id.toLowerCase().includes(q) ||
              l.pujariId.toLowerCase().includes(q) ||
              l.pujaName.toLowerCase().includes(q) ||
              l.yajamanaName.toLowerCase().includes(q) ||
              l.contact.includes(q)
            );
          }).length === 0 ? (
            <div className="p-12 text-center bg-amber-50/40 rounded-2xl border border-dashed border-amber-300 text-xs text-slate-600 font-bold">
              କୌଣସି ପୂଜା ସୂଚୀ ମିଳିଲା ନାହିଁ।
            </div>
          ) : (
            <div className="overflow-x-auto border border-amber-300 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-100/80 text-amber-950 font-extrabold border-b border-amber-300">
                  <tr>
                    <th className="p-3">List ID / ପୂଜାରୀ</th>
                    <th className="p-3">ପୂଜା ନାମ ଓ ଯଜମାନ</th>
                    <th className="p-3">ତାରିଖ ଓ ଠିକଣା</th>
                    <th className="p-3">Anti-Fraud ଡାଉନଲୋଡ୍ ଲଗ୍</th>
                    <th className="p-3">ଅନଲୋକ୍ 스୍ଥିତି</th>
                    <th className="p-3 text-center">Admin Override Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {allLists
                    .filter((l) => {
                      if (!listSearch.trim()) return true;
                      const q = listSearch.toLowerCase().trim();
                      return (
                        l.id.toLowerCase().includes(q) ||
                        l.pujariId.toLowerCase().includes(q) ||
                        l.pujaName.toLowerCase().includes(q) ||
                        l.yajamanaName.toLowerCase().includes(q) ||
                        l.contact.includes(q)
                      );
                    })
                    .map((lst) => (
                      <tr key={lst.id} className="hover:bg-amber-50/50 font-bold">
                        <td className="p-3">
                          <div className="font-mono text-slate-900 font-extrabold">{lst.id}</div>
                          <div className="text-[11px] text-amber-900 font-bold">Pujari ID: {lst.pujariId}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-slate-900 font-extrabold text-xs">{lst.pujaName}</div>
                          <div className="text-[11px] text-slate-600 font-bold">ଯଜମାନ: {lst.yajamanaName}</div>
                        </td>
                        <td className="p-3 text-slate-700 text-[11px]">
                          <div>📅 {lst.date} {lst.time && `(${lst.time})`}</div>
                          <div>📍 {lst.location || 'N/A'}</div>
                        </td>
                        <td className="p-3">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100/90 text-amber-950 rounded-lg font-mono font-extrabold border border-amber-300">
                            <Download className="w-3.5 h-3.5 text-amber-800" />
                            <span>ଡାଉନଲୋଡ୍: {lst.downloadCount || 0} ଥର</span>
                          </div>
                          <div className="text-[10px] text-slate-600 mt-1 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {lst.lastDownloadedAt
                                ? new Date(lst.lastDownloadedAt).toLocaleString()
                                : 'ଶେଷ ଡାଉନଲୋଡ୍: ନାହିଁ (0 times)'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                              lst.isUnlocked
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-amber-100 text-amber-950 border border-amber-300'
                            }`}
                          >
                            {lst.isUnlocked ? '✓ ଅନଲୋକ୍ ହୋଇଛି' : '🔒 ଲକ୍ (Pending)'}
                          </span>
                          {(() => {
                            const listUtr = getDisplayUtr(null, lst);
                            if (listUtr) {
                              return (
                                <div className="mt-1">
                                  <span className="font-mono text-[10px] font-black bg-emerald-100 text-emerald-950 border border-emerald-400 px-2 py-0.5 rounded-md inline-flex items-center gap-1 select-all">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                                    <span>UTR: {listUtr}</span>
                                  </span>
                                </div>
                              );
                            } else if (!lst.isUnlocked) {
                              return (
                                <div className="mt-1 text-[10px] font-bold text-amber-800 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                                  <span>Pending submission</span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setAdminPdfList(lst)}
                            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs mx-auto"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Copy (ପ୍ରମାଣ ପାଇଁ ଡାଉନଲୋଡ୍)</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PUJARI MANAGEMENT */}
      {activeTab === 'pujaris' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Register New Pujari Form */}
          <div className="bg-white rounded-3xl p-5 border border-amber-300 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-amber-200 pb-3">
              <UserCheck className="w-5 h-5 text-amber-700" />
              <span>ନୂତନ ପୂଜାରୀ ID ପଞ୍ଜୀକରଣ କରନ୍ତୁ</span>
            </h3>

            <form onSubmit={handleRegisterPujari} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ପୂଜାରୀ ID <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ଉଦାହରଣ: PJR-1003"
                  value={newPujariId}
                  onChange={(e) => setNewPujariId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold uppercase font-mono outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ପୂଜାରୀଙ୍କ ପୂରା ନାମ <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ଉଦାହରଣ: ପଣ୍ଡିତ ଅନନ୍ତ ଶର୍ମା"
                  value={newPujariName}
                  onChange={(e) => setNewPujariName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">ମୋବାଇଲ୍ ନମ୍ବର</label>
                <input
                  type="tel"
                  placeholder="ଉଦାହରଣ: 9876543210"
                  value={newPujariPhone}
                  onChange={(e) => setNewPujariPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">ଠିକଣା / ସହର</label>
                <input
                  type="text"
                  placeholder="ଉଦାହରଣ: କଟକ, ଓଡ଼ିଶା"
                  value={newPujariAddress}
                  onChange={(e) => setNewPujariAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> ପୂଜାରୀ ID ପଞ୍ଜୀକୃତ କରନ୍ତୁ
              </button>
            </form>
          </div>

          {/* Registered Pujaris List Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-amber-300 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-extrabold text-slate-900">
                ପଞ୍ଜୀକୃତ ପୂଜାରୀ ସମୂହ ({pujaris.length})
              </h3>

              <div className="relative">
                <input
                  type="text"
                  placeholder="ମୋବାଇଲ୍ ନମ୍ବର / ID / ନାମ ଦ୍ୱାରା ID ଖୋଜନ୍ତୁ..."
                  value={pujariSearch}
                  onChange={(e) => setPujariSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-amber-300 rounded-xl text-xs font-bold outline-none w-64 focus:ring-2 focus:ring-amber-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto border border-amber-300 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-100/80 text-amber-950 font-extrabold border-b border-amber-300">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">ନାମ (Name)</th>
                    <th className="p-3">ମୋବାଇଲ୍</th>
                    <th className="p-3">Secret Voter ID PIN</th>
                    <th className="p-3">୧ମ ମାଗଣା ସୂଚୀ</th>
                    <th className="p-3">🎴 Visiting Card</th>
                    <th className="p-3">ଆକାଉଣ୍ଟ ସ୍ଥିତି</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {filteredPujaris.map((p) => (
                    <tr key={p.id} className="hover:bg-amber-50/50 font-bold">
                      <td className="p-3 font-mono font-black text-amber-950 text-sm">{p.id}</td>
                      <td className="p-3 text-slate-900">{p.name}</td>
                      <td className="p-3 text-slate-900 font-mono font-extrabold">{p.phone || 'N/A'}</td>
                      <td className="p-3 font-mono font-black text-amber-900 tracking-widest bg-amber-50 rounded-lg border border-amber-200 px-2 py-1 inline-block my-2">
                        🔑 {p.voterIdPin || p.pin}
                      </td>
                      <td className="p-3">
                        {p.freeTierUsed ? (
                          <span className="text-amber-900">ବ୍ୟବହୃତ</span>
                        ) : (
                          <span className="text-emerald-700 font-extrabold">ଉପଲବ୍ଧ (FREE)</span>
                        )}
                      </td>
                      <td className="p-3">
                        {p.cardStatus === 'Unlocked' ? (
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 inline-block">
                              ✅ UNLOCKED
                            </span>
                            <button
                              onClick={async () => {
                                await rejectVisitingCard(p.id, undefined, 'Admin manually locked card');
                              }}
                              className="block text-[10px] text-rose-700 underline font-extrabold hover:text-rose-900 cursor-pointer"
                            >
                              Lock Card
                            </button>
                          </div>
                        ) : p.cardStatus === 'Pending' ? (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-400 inline-block animate-pulse">
                              ⏳ PENDING
                            </span>
                            {p.cardUtrRef && (
                              <div className="font-mono text-[10px] font-bold text-slate-800">
                                UTR: {p.cardUtrRef}
                              </div>
                            )}
                            <button
                              onClick={async () => {
                                await approveVisitingCard(p.id);
                              }}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-black hover:bg-emerald-700 cursor-pointer shadow-xs inline-block"
                            >
                              Approve Card (₹5)
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 inline-block">
                              🔒 LOCKED
                            </span>
                            <button
                              onClick={async () => {
                                await approveVisitingCard(p.id);
                              }}
                              className="block text-[10px] text-amber-800 underline font-extrabold hover:text-amber-950 cursor-pointer"
                            >
                              Unlock Directly
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                            p.isBlocked || p.status === 'suspended'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {p.isBlocked || p.status === 'suspended' ? '🚫 BLOCKED/SUSPENDED' : '✓ ସକ୍ରିୟ (Active)'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleBlockPujari(p.id, Boolean(p.isBlocked || p.status === 'suspended'))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs mx-auto ${
                            p.isBlocked || p.status === 'suspended'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500'
                              : 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-500'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>
                            {p.isBlocked || p.status === 'suspended'
                              ? 'ଅନବ୍ଲକ୍ କରନ୍ତୁ (Unblock)'
                              : 'Block/Suspend Pujari (ପୂଜାରୀଙ୍କୁ ବ୍ଲକ୍ କରନ୍ତୁ)'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PASSWORD RESET REQUESTS & APPROVALS */}
      {activeTab === 'resets' && (
        <div className="space-y-6">
          {/* 📱 Mobile Search & Quick Actions Card */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-5 border-2 border-amber-300 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-700" />
                  <span>ମୋବାଇଲ୍ ନମ୍ବର ଦ୍ୱାରା User ID ଖୋଜନ୍ତୁ (Mobile Number Quick Lookup)</span>
                </h4>
                <p className="text-[11px] font-bold text-slate-600 mt-0.5">
                  ମୋବାଇଲ୍ ନମ୍ବର ପ୍ରବେଶ କରି ପୂଜାରୀଙ୍କ ID ଏବଂ ଅପେକ୍ଷାରତ ରିସେଟ୍ ଅନୁରୋଧ ତୁରନ୍ତ ସନ୍ଧାନ କରନ୍ତୁ।
                </p>
              </div>
            </div>

            <form onSubmit={handleMobileSearchSubmit} className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="୧୦-ଅଙ୍କ ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ..."
                  value={lookupMobile}
                  onChange={(e) => setLookupMobile(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Search (ଖୋଜନ୍ତୁ)</span>
              </button>
            </form>

            {lookupResult === 'not_found' && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-800 font-extrabold animate-in fade-in">
                ⚠️ ଏହି ମୋବାଇଲ୍ ନମ୍ବରରେ କୌଣସି ପୂଜାରୀ ଆକାଉଣ୍ଟ ମିଳିଲା ନାହିଁ।
              </div>
            )}

            {lookupResult && lookupResult !== 'not_found' && (
              <div className="bg-white p-4 rounded-2xl border-2 border-amber-400 shadow-xs space-y-3 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">ପ୍ରାପ୍ତ User ID:</span>
                    <span className="text-base font-black font-mono text-amber-950 bg-amber-100 px-3 py-0.5 rounded-lg border border-amber-300">
                      {lookupResult.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">ପୂଜାରୀ ନାମ:</span>
                    <span className="text-xs font-black text-slate-900">{lookupResult.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">ମୋବାଇଲ୍:</span>
                    <span className="text-xs font-bold text-slate-700 font-mono">{lookupResult.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">DB Voter ID PIN:</span>
                    <span className="text-xs font-black text-amber-900 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      🔑 {lookupResult.voterIdPin || lookupResult.pin}
                    </span>
                  </div>
                </div>

                {/* Check for active pending request */}
                {(() => {
                  const pendingReq = passwordResetRequests.find(
                    (r) => r.pujariId === lookupResult.id && r.status === 'pending'
                  );
                  if (pendingReq) {
                    return (
                      <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-300 space-y-3">
                        <div className="text-xs font-extrabold text-amber-950 flex flex-wrap items-center justify-between gap-2">
                          <span>⏳ ଅପେକ୍ଷାରତ ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁରୋଧ ମିଳିଲା!</span>
                          <span className="text-[11px] font-bold text-slate-700">
                            Submitted PIN: <strong className="font-mono text-slate-900">{pendingReq.submittedPin}</strong> | New PIN: <strong className="font-mono text-indigo-900">{pendingReq.newPin || 'N/A'}</strong>
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleApprovePasswordReset(pendingReq.id)}
                            className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve (ଅନୁମୋଦନ)</span>
                          </button>
                          <button
                            onClick={() => handleRejectPasswordReset(pendingReq.id)}
                            className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <ShieldAlert className="w-4 h-4" />
                            <span>Reject (ନାକଚ)</span>
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-xs text-slate-500 font-bold italic">
                        ଏହି ବ୍ୟବହାରକାରୀଙ୍କର କୌଣସି ଅପେକ୍ଷାରତ ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁରୋଧ ନାହିଁ।
                      </div>
                    );
                  }
                })()}
              </div>
            )}
          </div>

          {/* Header & Filter Controls */}
          <div className="bg-white rounded-3xl p-5 border border-amber-300 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-700" />
                <span>ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁରୋଧ ସମୂହ (Password Reset Requests)</span>
              </h3>
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                ବ୍ୟବହାରକାରୀଙ୍କ ଦ୍ୱାରା ଦାଖଲ ହୋଇଥିବା ୪-ଅଙ୍କ Voter ID PIN ଯାଞ୍ଚ କରି ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁମୋଦନ କିମ୍ବା ନାକଚ କରନ୍ତୁ।
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setResetFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  resetFilter === 'pending'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ⏳ ଅପେକ୍ଷାରତ (Pending) ({passwordResetRequests.filter((r) => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setResetFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  resetFilter === 'approved'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ✅ ଅନୁମୋଦିତ (Approved)
              </button>
              <button
                onClick={() => setResetFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  resetFilter === 'rejected'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🚫 ନାକଚ (Rejected)
              </button>
              <button
                onClick={() => setResetFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  resetFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ସମସ୍ତ (All) ({passwordResetRequests.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-auto relative">
              <input
                type="text"
                placeholder="ID, ନାମ କିମ୍ବା ମୋବାଇଲ୍ ଦ୍ୱାରା ଖୋଜନ୍ତୁ..."
                value={resetSearch}
                onChange={(e) => setResetSearch(e.target.value)}
                className="w-full sm:w-64 pl-8 pr-3 py-2 border border-amber-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          {/* Reset Requests Grid */}
          {filteredPasswordResetRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-amber-300 text-slate-500 text-xs font-bold">
              କୌଣସି ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁରୋଧ ମିଳିଲା ନାହିଁ।
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPasswordResetRequests.map((req) => {
                const pujariObj = pujaris.find((p) => p.id === req.pujariId);
                const isPinMatching = pujariObj
                  ? (pujariObj.voterIdPin || pujariObj.pin) === req.submittedPin
                  : false;

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl p-5 border-2 border-amber-300 shadow-md space-y-4 relative"
                  >
                    {/* Top Status & Date */}
                    <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                      <div>
                        <span className="text-xs text-slate-500 font-bold block">
                          ଅନୁରୋଧ ତାରିଖ: {req.createdAt ? new Date(req.createdAt).toLocaleString('or-IN') : 'N/A'}
                        </span>
                        <div className="text-sm font-black text-slate-900 font-mono">
                          ID: {req.pujariId}
                        </div>
                      </div>
                      <div>
                        {req.status === 'pending' ? (
                          <span className="px-3 py-1 bg-amber-100 text-amber-950 border border-amber-400 rounded-full text-xs font-extrabold animate-pulse">
                            ⏳ ଅପେକ୍ଷାରତ (PENDING)
                          </span>
                        ) : req.status === 'approved' ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-950 border border-emerald-400 rounded-full text-xs font-extrabold">
                            ✅ ଅନୁମୋଦିତ (APPROVED)
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-rose-100 text-rose-950 border border-rose-400 rounded-full text-xs font-extrabold">
                            🚫 ନାକଚ (REJECTED)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pujari Details */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="font-extrabold text-slate-900">
                        ପୂଜାରୀ ନାମ: <span className="text-amber-900">{req.pujariName}</span>
                      </div>
                      <div className="font-bold text-slate-700">
                        ମୋବାଇଲ୍ ନମ୍ବର: <span className="font-mono">{req.pujariPhone}</span>
                      </div>
                    </div>

                    {/* STRICT REQUIREMENT: Side-by-Side Comparison Box */}
                    <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-300 space-y-2">
                      <div className="text-xs font-black text-amber-950 flex items-center justify-between">
                        <span>🔍 ୪-ଅଙ୍କ Voter ID PIN ତୁଳନା (PIN Match Check)</span>
                        {isPinMatching ? (
                          <span className="px-2 py-0.5 bg-emerald-200 text-emerald-950 rounded-md text-[10px] font-black">
                            MATCHED ✅
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-200 text-rose-950 rounded-md text-[10px] font-black">
                            MISMATCH ⚠️
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-center pt-1">
                        {/* Box 1: Registered DB PIN */}
                        <div className="bg-white p-3 rounded-xl border border-amber-300 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">
                            ଡାଟାବେସ୍ ଗୁପ୍ତ PIN (DB PIN)
                          </span>
                          <span className="text-xl font-black font-mono text-slate-900 tracking-widest">
                            {req.currentVoterIdPin || (pujariObj ? pujariObj.voterIdPin || pujariObj.pin : 'N/A')}
                          </span>
                        </div>

                        {/* Box 2: Submitted Recovery PIN */}
                        <div
                          className={`p-3 rounded-xl border shadow-2xs ${
                            isPinMatching
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                              : 'bg-rose-50 border-rose-300 text-rose-950'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-slate-600 block mb-1">
                            ଦାଖଲ ହୋଇଥିବା PIN (Submitted)
                          </span>
                          <span className="text-xl font-black font-mono tracking-widest">
                            {req.submittedPin}
                          </span>
                        </div>
                      </div>

                      {/* Requested New PIN Display */}
                      <div className="mt-3 text-xs font-black text-amber-950 flex items-center justify-between border-t border-amber-200/80 pt-2.5">
                        <span className="flex items-center gap-1.5">
                          <span>🔑</span>
                          <span>ନୂତନ ପ୍ରସ୍ତାବିତ PIN (Requested New PIN):</span>
                        </span>
                        <span className="text-sm font-black font-mono text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 tracking-widest">
                          {req.newPin || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons for Pending Requests */}
                    {req.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => handleApprovePasswordReset(req.id)}
                          className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          ଅନୁମୋଦନ କରନ୍ତୁ (Approve)
                        </button>
                        <button
                          onClick={() => handleRejectPasswordReset(req.id)}
                          className="py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition flex items-center justify-center gap-1"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          ନାକଚ କରନ୍ତୁ (Reject)
                        </button>
                      </div>
                    )}

                    {req.status !== 'pending' && req.rejectionReason && (
                      <div className="p-2.5 bg-slate-100 rounded-xl text-[11px] text-slate-700 font-bold">
                        ନାକଚ କାରଣ: {req.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QR CODE UPLOAD & UPI SETTINGS WITH CLEAR SUBMIT BUTTON & FEEDBACK (BUG FIX 2) */}
      {activeTab === 'qr' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-300 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-700" />
                <span>ପେମେଣ୍ଟ QR କୋଡ୍ ଇମେଜ୍ ଅପଲୋଡ୍ ଓ UPI ସେଟିଂସ</span>
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                ନୂତନ ଇମେଜ୍ ସିଲେକ୍ଟ କରିବା ପରେ <strong>"QR କୋଡ୍ ସଂରକ୍ଷଣ କରନ୍ତୁ"</strong> ବଟନ୍ କ୍ଲିକ୍ କରନ୍ତୁ।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ₹5 New List Creation QR Upload Box */}
              <div className="p-5 bg-amber-50/60 border border-amber-300 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-[#701a1e]">
                    ୧. ₹୫ ନୂତନ ପୂଜା ସୂଚୀ QR କୋଡ୍
                  </h4>
                  <span className="px-2.5 py-0.5 bg-amber-200 text-amber-950 rounded-full text-xs font-bold">
                    ₹୫ Creation Fee
                  </span>
                </div>

                <UpiQrDisplay
                  customQrUrl={qrConfig.newCreationQrUrl}
                  upiId={qrConfig.newCreationUpiId}
                  amount={5}
                  label="ନୂଆ ସୂଚୀ ଦେୟ"
                />

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      ନୂତନ QR କୋଡ୍ ଫୋଟୋ ସିଲେକ୍ଟ କରନ୍ତୁ:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile5(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-amber-700 file:text-white hover:file:bg-amber-800 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveSelectedQrFile('new')}
                      disabled={!selectedFile5}
                      className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Save className="w-4 h-4" /> QR କୋଡ୍ ସଂରକ୍ଷଣ କରନ୍ତୁ (Save QR)
                    </button>

                    {qrConfig.newCreationQrUrl && (
                      <button
                        type="button"
                        onClick={() => handleDeleteQrImage('new')}
                        className="py-2.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl text-xs font-bold border border-rose-300 transition cursor-pointer"
                      >
                        ରିସେଟ୍
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ₹2 Re-download List QR Upload Box */}
              <div className="p-5 bg-amber-50/60 border border-amber-300 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-[#701a1e]">
                    ୨. ₹୨ ପୁନଃ-ଡାଉନଲୋଡ୍ QR କୋଡ୍
                  </h4>
                  <span className="px-2.5 py-0.5 bg-amber-200 text-amber-950 rounded-full text-xs font-bold">
                    ₹୨ Re-download Fee
                  </span>
                </div>

                <UpiQrDisplay
                  customQrUrl={qrConfig.reDownloadQrUrl}
                  upiId={qrConfig.reDownloadUpiId}
                  amount={2}
                  label="ପୁନଃ-ଡାଉନଲୋଡ୍ ଦେୟ"
                />

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      ନୂତନ QR କୋଡ୍ ଫୋଟୋ ସିଲେକ୍ଟ କରନ୍ତୁ:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile2(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-amber-700 file:text-white hover:file:bg-amber-800 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveSelectedQrFile('redownload')}
                      disabled={!selectedFile2}
                      className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Save className="w-4 h-4" /> QR କୋଡ୍ ସଂରକ୍ଷଣ କରନ୍ତୁ (Save QR)
                    </button>

                    {qrConfig.reDownloadQrUrl && (
                      <button
                        type="button"
                        onClick={() => handleDeleteQrImage('redownload')}
                        className="py-2.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl text-xs font-bold border border-rose-300 transition cursor-pointer"
                      >
                        ରିସେଟ୍
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Manual UPI ID Settings Form */}
            <form onSubmit={handleSaveUpiSettings} className="p-5 bg-white border border-amber-300 rounded-3xl space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900">
                ମାନୁଆଲ୍ UPI ID ସେଟିଂସ (Text UPI ID Configuration)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    ₹୫ ନୂତନ ସୂଚୀ UPI ID
                  </label>
                  <input
                    type="text"
                    value={newQr5Upi}
                    onChange={(e) => setNewQr5Upi(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    ₹୨ ପୁନଃ-ଡାଉନଲୋଡ୍ UPI ID
                  </label>
                  <input
                    type="text"
                    value={newQr2Upi}
                    onChange={(e) => setNewQr2Upi(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingQr}
                className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl text-xs transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {savingQr ? 'ସଂରକ୍ଷିତ ହେଉଛି...' : 'UPI ID ସେଟିଂସ ସଂରକ୍ଷଣ କରନ୍ତୁ'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: PUJA TEMPLATES MANAGEMENT */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add New Template Form */}
          <div className="bg-white rounded-3xl p-5 border border-amber-300 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-amber-200 pb-3">
              <BookOpen className="w-5 h-5 text-amber-700" />
              <span>ନୂତନ ମାଷ୍ଟର ପୂଜା ଟେମ୍ପଲେଟ୍ ଯୋଡ଼ନ୍ତୁ</span>
            </h3>

            <form onSubmit={handleAddTemplate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ପୂଜା ଟେମ୍ପଲେଟ୍ ନାମ <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ଉଦାହରଣ: ଶ୍ରୀ ସତ୍ୟନାରାୟଣ ପୂଜା"
                  value={newTmplName}
                  onChange={(e) => setNewTmplName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">ବିବରଣୀ (Description)</label>
                <input
                  type="text"
                  placeholder="ଉଦାହରଣ: ସତ୍ୟନାରାୟଣ ପୂଜା ଓ କଥା ଆବଶ୍ୟକ ସାମଗ୍ରୀ"
                  value={newTmplDesc}
                  onChange={(e) => setNewTmplDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ସାମଗ୍ରୀ ସୂଚୀ (ପ୍ରତ୍ୟେକ ଧାଡ଼ିରେ: ସାମଗ୍ରୀ ନାମ, ପରିମାଣ, ଏକକ)
                </label>
                <textarea
                  rows={6}
                  value={newTmplItemsRaw}
                  onChange={(e) => setNewTmplItemsRaw(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> ଟେମ୍ପଲେଟ୍ ଯୋଡ଼ନ୍ତୁ
              </button>
            </form>
          </div>

          {/* Master Templates List */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-amber-300 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-amber-200 pb-3">
              ମାଷ୍ଟର ପୂଜା ଟେମ୍ପଲେଟ୍ ସମୂହ ({templates.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="p-4 bg-amber-50/50 border border-amber-300 rounded-2xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{tmpl.name}</h4>
                      <p className="text-xs text-slate-600 font-medium">{tmpl.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(tmpl.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-amber-950 font-extrabold bg-white p-2 rounded-xl border border-amber-200">
                    ସାମଗ୍ରୀ ସଂଖ୍ୟା: {tmpl.items.length} ଟି
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-300 space-y-4 my-auto max-h-[85vh] overflow-y-auto overscroll-contain">
            <h4 className="text-sm font-extrabold text-slate-900">ପେମେଣ୍ଟ ଖାରଜ କରିବାର କାରଣ</h4>
            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="ଯଥା: UTR ନମ୍ବର ମେଳ ଖାଉନାହିଁ"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingPaymentId(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  ବାତିଲ୍
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  ଖାରଜ କରନ୍ତୁ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Override PDF Download Modal */}
      {adminPdfList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-amber-50 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border-2 border-amber-400 relative my-auto max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-amber-300 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-amber-950 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-800" />
                  <span>ଆଡମିନ୍ ଡାଉନଲୋଡ୍ କପି (Admin Override PDF Generator)</span>
                </h3>
                <p className="text-xs text-slate-700 font-medium mt-0.5">
                  ପୂଜା: <strong>{adminPdfList.pujaName}</strong> | ଯଜମାନ: <strong>{adminPdfList.yajamanaName}</strong> | Pujari: <strong>{adminPdfList.pujariId}</strong>
                </p>
              </div>
              <button
                onClick={() => setAdminPdfList(null)}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-xl transition cursor-pointer font-extrabold text-xs"
              >
                ✕ ବନ୍ଦ କରନ୍ତୁ
              </button>
            </div>

            <PujaListPDFView
              list={{ ...adminPdfList, isUnlocked: true }}
              onBack={() => setAdminPdfList(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
